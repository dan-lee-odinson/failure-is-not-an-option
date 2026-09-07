/**
 * Music and soundscape maps (FNO-M00b parts 5 and 6):
 *  - every cue's asset is a manifest sound; music files are present; start,
 *    end and loop points lie inside the track; every trigger and stop_on
 *    names a real screen, node, option or app input id; no loop on a screen
 *    where the player reads and decides;
 *  - the soundscape's beds, regions, phases, events and crisis cards resolve;
 *  - the Quindar tones regenerate byte-for-byte;
 *  - the replay is byte-identical with audio on and off: the director never
 *    sees the run and no audio event enters the log.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AudioDirector, type MusicMap, type SoundscapeMap } from '../../app/audio';
import { STAGES, screenId, type Screen, type Stage } from '../../app/ui-state';
import musicMap from '../../app/music-map.json';
import soundscapeMap from '../../app/soundscape-map.json';
import { QUINDAR_FILES, quindarWav } from '../../scripts/lib/quindar';
import { readWavInfo } from '../../scripts/lib/validator';
import { ROOT, content, newRun, play, script } from './helpers';

const manifest = JSON.parse(readFileSync(resolve(ROOT, 'assets', 'manifest.json'), 'utf8')) as { assets: { id: string; filename: string; kind?: string; duration_s?: number; credit?: string; license?: string }[] };
const audio = new Map(manifest.assets.filter((a) => a.kind === 'audio').map((a) => [a.id, a]));
const music = musicMap as MusicMap;
const sfx = soundscapeMap as SoundscapeMap & { crisis_cards: string[]; generated: { quindar: Parameters<typeof quindarWav>[1] } };

/** Every id a cue may trigger on or stop on. */
function knownSignals(): Set<string> {
  const out = new Set<string>(['start-new', 'start-load', 'skip-to-menu']);
  for (const screen of ['console', 'debrief', 'planning'] as Screen[]) out.add(screenId({ screen, stage: 'start' }));
  for (const stage of STAGES) out.add(screenId({ screen: 'opening', stage: stage as Stage }));
  for (const id of content().nodes.keys()) out.add(`node:${id}`);
  for (const id of content().options.keys()) out.add(`choose:${id}`);
  return out;
}

/** Every UI event the app emits (app/main.ts) that a one-shot may bind to. */
const UI_EVENTS = new Set(['ui:begin', 'ui:continue', 'ui:choose', 'ui:commit', 'ui:menu-select', 'ui:settings-change', 'ui:volume-change', 'ui:pin', 'ui:unpin', 'ui:binder-open', 'ui:binder-close', 'ui:history-open', 'ui:history-close', 'ui:loop-panel-toggle', 'ui:crisis-card-render', 'ui:capcom-line-start', 'ui:capcom-line-end']);

describe('music map', () => {
  it('every cue names a manifest track that is present, with points inside the track', () => {
    for (const cue of music.cues) {
      const a = audio.get(cue.asset);
      expect(a, `cue ${cue.id} asset ${cue.asset}`).toBeDefined();
      expect(existsSync(resolve(ROOT, 'public', 'audio', a!.filename)), `track file for ${cue.id}`).toBe(true);
      const dur = a!.duration_s!;
      expect(cue.start).toBeGreaterThanOrEqual(0);
      expect(cue.start).toBeLessThan(dur);
      if (cue.end !== null) { expect(cue.end).toBeGreaterThan(cue.start); expect(cue.end).toBeLessThanOrEqual(dur); }
      if (cue.loop) { expect(cue.loop.from).toBeGreaterThanOrEqual(cue.start); expect(cue.loop.to).toBeGreaterThan(cue.loop.from + cue.loop.crossfade); expect(cue.loop.to).toBeLessThanOrEqual(dur); }
      if (cue.extend_to_seam_if_still_reading !== undefined) { expect(cue.extend_to_seam_if_still_reading).toBeGreaterThan(cue.end ?? 0); expect(cue.extend_to_seam_if_still_reading).toBeLessThanOrEqual(dur); }
      expect(cue.fade_in).toBeGreaterThanOrEqual(0);
      expect(cue.fade_out).toBeGreaterThanOrEqual(0);
    }
    for (const r of music.reserved ?? []) expect(audio.has(r.asset), `reserved ${r.asset}`).toBe(true);
  });

  it('every trigger and stop_on names a real screen, node, option or app input id', () => {
    const known = knownSignals();
    for (const s of AudioDirector.signalsOf(music)) expect(known.has(s), `signal ${s}`).toBe(true);
  });

  it('no loop on any screen where the player reads and decides', () => {
    for (const cue of music.cues) if (cue.loop) expect(cue.trigger, `loop cue ${cue.id}`).toBe('screen:menu');
  });

  it("Dan's rulings are in the map", () => {
    const menu = music.cues.find((c) => c.id === 'menu-loop')!;
    expect(menu.loop).toEqual({ from: 60.5, to: 111.7, crossfade: 0.2 });
    const post = music.cues.find((c) => c.id === 'postflight')!;
    expect(post.start).toBe(90);
    expect(post.fade_in).toBe(1);
    expect(post.trigger).toBe('node:g8-accountability-brief');
    const crisis = music.cues.find((c) => c.id === 'crisis')!;
    expect(crisis.provisional).toBe(true);
    // Playtest 2, note 9: the drum background at 25 % lower; Mission in Danger stays in the manifest and the OST, uncued.
    expect(crisis.asset).toBe('audio-mission-in-danger-drum-background');
    expect(crisis.gain).toBe(0.75);
    expect(audio.get('audio-mission-in-danger-drum-background')!.duration_s).toBeCloseTo(126.85, 1);
    expect(existsSync(resolve(ROOT, 'public', 'audio', audio.get('audio-mission-in-danger-drum-background')!.filename))).toBe(true);
    expect(music.cues.some((c) => c.asset === 'audio-mission-in-danger')).toBe(false);
    expect((music.reserved ?? []).some((r) => r.asset === 'audio-mission-in-danger')).toBe(true);
    for (const c of music.cues) if (c.gain !== undefined) { expect(c.gain).toBeGreaterThan(0); expect(c.gain).toBeLessThanOrEqual(1); }
    expect(crisis.stop_on).toEqual(expect.arrayContaining(['choose:g8-return-earlier', 'choose:g8-return-later']));
    const opening = music.cues.find((c) => c.id === 'opening')!;
    expect(opening.end).toBe(42);
    expect(opening.extend_to_seam_if_still_reading).toBe(124);
  });
});

describe('soundscape map', () => {
  it('beds, one-shots, phases, events and crisis cards resolve; the room bed defaults to 0.3', () => {
    expect(sfx.gains.room_bed_gain).toBe(0.3);
    expect(sfx.gains.walla_gain).toBeLessThan(sfx.gains.room_bed_gain);
    const phases = new Set(content().mission.phases.map((p) => p.id));
    for (const bed of sfx.beds) {
      const a = audio.get(bed.asset);
      expect(a, `bed ${bed.id}`).toBeDefined();
      if (bed.loop.from !== null && bed.loop.to !== null) { expect(bed.loop.from).toBeLessThan(bed.loop.to); expect(bed.loop.to).toBeLessThanOrEqual(a!.duration_s!); }
      for (const p of bed.phases ?? []) expect(phases.has(p), `bed ${bed.id} phase ${p}`).toBe(true);
      if (bed.gain_ref === 'walla_gain') expect(bed.phases?.length).toBeGreaterThan(0);
    }
    for (const shot of sfx.one_shots) {
      const a = audio.get(shot.asset);
      expect(a, `one-shot ${shot.id}`).toBeDefined();
      if (shot.region) { expect(shot.region.start).toBeGreaterThanOrEqual(0); if (shot.region.end !== null) { expect(shot.region.end).toBeGreaterThan(shot.region.start); expect(shot.region.end).toBeLessThanOrEqual(a!.duration_s!); } }
      for (const e of shot.events) expect(UI_EVENTS.has(e), `event ${e}`).toBe(true);
      expect(shot.events.some((e) => !e.startsWith('ui:')), 'one-shots bind to UI events only').toBe(false);
    }
    for (const id of sfx.crisis_cards) expect(content().evidence.has(id), `crisis card ${id}`).toBe(true);
    // The alert plays one beep: a region well under the file's 0.288 s beat, never the loop.
    const alert = sfx.one_shots.find((s) => s.id === 'alert')!;
    expect(alert.region!.end! - alert.region!.start).toBeLessThan(0.4);
  });

  it('the CC BY credit line is exact in the manifest', () => {
    expect(audio.get('sfx-alert')!.credit).toBe('Beep 8 count (loopable) by JonNicholas, freesound.org, CC BY 3.0');
    expect(audio.get('sfx-alert')!.license).toBe('CC BY 3.0');
    expect(existsSync(resolve(ROOT, 'LICENSES', 'CC-BY-3.0.txt'))).toBe(true);
  });

  it('the Quindar tones regenerate byte-for-byte and match the manifest', () => {
    for (const [file, hz] of QUINDAR_FILES(sfx.generated.quindar)) {
      const bytes = quindarWav(hz, sfx.generated.quindar);
      const committed = readFileSync(resolve(ROOT, 'public', 'audio', 'generated', file));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(createHash('sha256').update(committed).digest('hex'));
      const info = readWavInfo(bytes)!;
      expect(info.sampleRate).toBe(44100);
      expect(info.channels).toBe(1);
      expect(info.bits).toBe(16);
      expect(info.duration).toBeCloseTo(0.25, 3);
      // Peak at −12 dBFS: the loudest sample is 0.2512 of full scale.
      let peak = 0;
      for (let i = 44; i + 1 < bytes.length; i += 2) peak = Math.max(peak, Math.abs(bytes.readInt16LE(i)));
      expect(peak / 32767).toBeCloseTo(Math.pow(10, -12 / 20), 2);
    }
  });
});

describe('audio never touches the simulation', () => {
  it('the replay is byte-identical with the director signalled and without it', () => {
    const inputs = script({ prep: ['contact', 'recovery'], route: 'earlier', questions: true, plan: 'g9-plan-recovery-contact' });
    const silent = play(newRun(), inputs);
    const director = new AudioDirector(music, sfx, () => null);
    expect(AudioDirector.supported()).toBe(false); // no Web Audio under Node: the director is inert but every signal path runs
    director.setPrefs({ enabled: true, master: 1, music: 1, effects: 1, beds: 1 });
    const loud = newRun();
    director.signal('screen:menu');
    director.signal('start-new');
    for (const inp of inputs) {
      const before = loud.currentNode()?.node.id ?? null;
      play(loud, [inp]);
      const after = loud.currentNode()?.node.id ?? null;
      if (inp.kind === 'option') { director.event('ui:choose'); director.signal(`choose:${inp.option}`); }
      if (inp.kind === 'continue') director.event('ui:continue');
      if (after && after !== before) director.signal(`node:${after}`);
      director.setRoom(true, loud.currentNode()?.phase.id ?? null);
      director.event('ui:capcom-line-start');
    }
    expect(loud.canonicalLog()).toBe(silent.canonicalLog());
    expect(loud.canonicalState()).toBe(silent.canonicalState());
    const log = JSON.stringify(loud.log);
    expect(log).not.toMatch(/audio|music|sound|cue/i);
  });
});
