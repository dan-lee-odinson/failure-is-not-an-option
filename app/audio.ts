/**
 * Audio director: music cues, the room beds, and the one-shot effects.
 *
 * Presentation only. The director never sees the run: it receives signals
 * (screen entered, node entered, input given, UI event) and plays sounds
 * through Web Audio. Nothing here writes to the ledger, the log or a save,
 * and no audio event is ever recorded, so the replay is identical with audio
 * on or off. Off by default: silent until the player turns the master on.
 *
 * One AudioContext is created on the first player interaction (Begin, Skip,
 * or the sound control). Every sound is a manifest asset resolved through
 * app/assets.ts; a missing file decodes to nothing and plays silence.
 *
 * Music: sample-accurate start/end/fades on gain nodes; a loop is two
 * overlapping buffer sources scheduled ahead of time with a short crossfade
 * at the seam. No loop runs on a screen where the player reads and decides.
 */
import type { AudioPrefs } from './ui-state';

export interface MusicCue {
  id: string;
  asset: string;
  trigger: string;
  start: number;
  end: number | null;
  fade_in: number;
  fade_out: number;
  loop: { from: number; to: number; crossfade: number } | null;
  extend_to_seam_if_still_reading?: number;
  stop_on: string[];
  provisional?: boolean;
  note?: string;
}

export interface MusicMap {
  version: number;
  defaults: { music_gain: number };
  cues: MusicCue[];
  reserved?: { asset: string; note: string }[];
}

export interface Bed {
  id: string;
  asset: string;
  gain_ref: 'room_bed_gain' | 'walla_gain';
  screens: 'all-console' | string[];
  phases?: string[];
  loop: { from: number | null; to: number | null; crossfade: number };
}

export interface OneShot {
  id: string;
  asset: string;
  region: { start: number; end: number | null } | null;
  events: string[];
  gain?: number;
}

export interface SoundscapeMap {
  version: number;
  gains: { room_bed_gain: number; walla_gain: number; effects_gain: number };
  beds: Bed[];
  one_shots: OneShot[];
  crisis_cards?: string[];
}

type Resolve = (assetId: string) => string | null;

interface Playing {
  cue: MusicCue;
  gain: GainNode;
  sources: AudioBufferSourceNode[];
  startedAt: number;
  /** Absolute context time the next loop segment starts (loops only). */
  nextSegmentAt: number;
  /** Absolute context time the cue's gain reaches zero (non-loop with an end). */
  plannedEnd: number | null;
  extended: boolean;
  stopped: boolean;
}

interface BedPlaying {
  bed: Bed;
  gain: GainNode;
  sources: AudioBufferSourceNode[];
  nextSegmentAt: number;
  from: number;
  to: number;
}

const LOOKAHEAD = 1.0;
const TICK_MS = 100;

export class AudioDirector {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private effects: GainNode | null = null;
  private beds: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer | null>();
  private pending = new Map<string, Promise<AudioBuffer | null>>();
  private playing = new Map<string, Playing>();
  private bedPlaying = new Map<string, BedPlaying>();
  private prefs: AudioPrefs = { enabled: false, master: 0.8, music: 1, effects: 1, beds: 1 };
  private timer: ReturnType<typeof setInterval> | null = null;
  private roomActive = false;
  private wallaActive = false;
  /** Asked by the opening cue at its planned end: is the player still reading the prose chapters? */
  stillReading: () => boolean = () => false;

  constructor(readonly map: MusicMap, readonly soundscape: SoundscapeMap, private readonly resolve: Resolve) {}

  /** Whether Web Audio exists here (it does not under Node, where the director is inert). */
  static supported(): boolean {
    return typeof globalThis !== 'undefined' && typeof (globalThis as { AudioContext?: unknown }).AudioContext === 'function';
  }

  get enabled(): boolean {
    return this.prefs.enabled;
  }

  /** An AudioContext exists (created only inside a player interaction). */
  get unlocked(): boolean {
    return this.ctx !== null;
  }

  /** Create the context inside a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (this.ctx || !AudioDirector.supported()) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.music = ctx.createGain();
    this.effects = ctx.createGain();
    this.beds = ctx.createGain();
    this.music.connect(this.master);
    this.effects.connect(this.master);
    this.beds.connect(this.master);
    this.master.connect(ctx.destination);
    this.applyGains(true);
    this.timer = setInterval(() => this.tick(), TICK_MS);
    // Decode everything the maps name so the first cue starts on time.
    const ids = new Set<string>([...this.map.cues.map((c) => c.asset), ...this.soundscape.beds.map((b) => b.asset), ...this.soundscape.one_shots.map((o) => o.asset)]);
    for (const id of ids) void this.buffer(id);
  }

  setPrefs(prefs: AudioPrefs): void {
    const wasEnabled = this.prefs.enabled;
    this.prefs = { ...prefs };
    if (prefs.enabled) this.unlock();
    if (this.ctx?.state === 'suspended' && prefs.enabled) void this.ctx.resume();
    this.applyGains(false);
    if (!wasEnabled && prefs.enabled) this.refreshBeds();
  }

  private applyGains(immediate: boolean): void {
    if (!this.ctx || !this.master || !this.music || !this.effects || !this.beds) return;
    const t = this.ctx.currentTime;
    const ramp = (g: GainNode, v: number): void => {
      g.gain.cancelScheduledValues(t);
      if (immediate) g.gain.setValueAtTime(v, t);
      else { g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(v, t + 0.05); }
    };
    ramp(this.master, this.prefs.enabled ? this.prefs.master : 0);
    ramp(this.music, this.prefs.music * this.map.defaults.music_gain);
    ramp(this.effects, this.prefs.effects * this.soundscape.gains.effects_gain);
    ramp(this.beds, this.prefs.beds);
  }

  private async buffer(assetId: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(assetId)) return this.buffers.get(assetId)!;
    const inflight = this.pending.get(assetId);
    if (inflight) return inflight;
    const p = (async (): Promise<AudioBuffer | null> => {
      const url = this.resolve(assetId);
      if (!url || !this.ctx) return null;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.arrayBuffer();
        return await this.ctx.decodeAudioData(data);
      } catch {
        return null; // a missing or undecodable file plays silence
      }
    })();
    this.pending.set(assetId, p);
    const b = await p;
    this.buffers.set(assetId, b);
    this.pending.delete(assetId);
    return b;
  }

  // -------------------------------------------------------------------------
  // Signals
  // -------------------------------------------------------------------------

  /** A screen id (`screen:menu`), a node id (`node:g8-crisis-report`), or an input id (`start-new`, `choose:g8-return-earlier`). */
  signal(id: string): void {
    for (const p of this.playing.values()) if (!p.stopped && p.cue.stop_on.includes(id)) this.stopCue(p, p.cue.fade_out);
    for (const cue of this.map.cues) if (cue.trigger === id) void this.startCue(cue);
  }

  /** Which beds should run now: the room bed on console-class screens, walla on the listed phases. Idempotent. */
  setRoom(consoleScreen: boolean, phaseId: string | null): void {
    this.roomActive = consoleScreen;
    this.wallaActive = consoleScreen && phaseId !== null && this.soundscape.beds.some((b) => b.gain_ref === 'walla_gain' && (b.phases ?? []).includes(phaseId));
    this.refreshBeds();
  }

  /** A UI event (`ui:choose`, `ui:pin`, …) plays the one-shots bound to it. Never bound to a domain event. */
  event(uiEvent: string): void {
    if (!this.prefs.enabled) return;
    for (const shot of this.soundscape.one_shots) if (shot.events.includes(uiEvent)) void this.playShot(shot);
  }

  // -------------------------------------------------------------------------
  // Music
  // -------------------------------------------------------------------------

  private async startCue(cue: MusicCue): Promise<void> {
    if (!this.ctx || !this.music) return;
    const existing = this.playing.get(cue.id);
    if (existing && !existing.stopped) return;
    const token: Playing = { cue, gain: this.ctx.createGain(), sources: [], startedAt: 0, nextSegmentAt: 0, plannedEnd: null, extended: false, stopped: false };
    this.playing.set(cue.id, token);
    const buf = await this.buffer(cue.asset);
    if (!buf || token.stopped || !this.ctx || this.playing.get(cue.id) !== token) return;
    const t0 = this.ctx.currentTime + 0.03;
    token.gain.connect(this.music);
    token.gain.gain.setValueAtTime(cue.fade_in > 0 ? 0 : 1, t0);
    if (cue.fade_in > 0) token.gain.gain.linearRampToValueAtTime(1, t0 + cue.fade_in);
    token.startedAt = t0;
    if (cue.loop) {
      // First pass: from `start` to the loop's end plus the crossfade; then segments from loop.from.
      const firstLen = cue.loop.to - cue.start + cue.loop.crossfade;
      this.segment(token, buf, t0, cue.start, firstLen, 0, cue.loop.crossfade);
      token.nextSegmentAt = t0 + (cue.loop.to - cue.start) - cue.loop.crossfade;
    } else {
      const end = cue.end ?? buf.duration;
      const cap = Math.max(end, cue.extend_to_seam_if_still_reading ?? 0);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(token.gain);
      src.start(t0, cue.start, Math.max(0, Math.min(buf.duration, cap) - cue.start));
      token.sources.push(src);
      token.plannedEnd = cue.end === null ? null : t0 + (cue.end - cue.start);
      if (token.plannedEnd !== null && cue.extend_to_seam_if_still_reading === undefined) this.scheduleEnd(token);
    }
  }

  /** Schedule one buffer segment with linear crossfade ramps at both ends (0 = no ramp). */
  private segment(token: Playing | BedPlaying, buf: AudioBuffer, at: number, offset: number, length: number, fadeIn: number, fadeOut: number): void {
    if (!this.ctx) return;
    const g = this.ctx.createGain();
    g.connect(token.gain);
    g.gain.setValueAtTime(fadeIn > 0 ? 0 : 1, at);
    if (fadeIn > 0) g.gain.linearRampToValueAtTime(1, at + fadeIn);
    if (fadeOut > 0) { g.gain.setValueAtTime(1, at + length - fadeOut); g.gain.linearRampToValueAtTime(0, at + length); }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(g);
    src.start(at, offset, length);
    src.onended = () => { try { g.disconnect(); } catch { /* already gone */ } };
    token.sources.push(src);
    const keep = token.sources;
    src.addEventListener('ended', () => { const i = keep.indexOf(src); if (i >= 0) keep.splice(i, 1); });
  }

  private scheduleEnd(token: Playing): void {
    if (!token.plannedEnd || !this.ctx) return;
    const fade = token.cue.fade_out;
    const end = token.plannedEnd;
    token.gain.gain.setValueAtTime(1, Math.max(this.ctx.currentTime, end - fade));
    token.gain.gain.linearRampToValueAtTime(0, end);
    for (const s of token.sources) { try { s.stop(end + 0.01); } catch { /* not started */ } }
    token.stopped = true;
  }

  private stopCue(token: Playing, fade: number): void {
    if (!this.ctx || token.stopped) { token.stopped = true; return; }
    token.stopped = true;
    const t = this.ctx.currentTime;
    token.gain.gain.cancelScheduledValues(t);
    token.gain.gain.setValueAtTime(token.gain.gain.value, t);
    token.gain.gain.linearRampToValueAtTime(0, t + Math.max(0.02, fade));
    for (const s of token.sources) { try { s.stop(t + Math.max(0.02, fade) + 0.02); } catch { /* not started */ } }
  }

  private tick(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const token of this.playing.values()) {
      if (token.stopped) continue;
      const cue = token.cue;
      if (cue.loop) {
        const buf = this.buffers.get(cue.asset);
        if (!buf) continue;
        while (token.nextSegmentAt < now + LOOKAHEAD) {
          const len = cue.loop.to - cue.loop.from + cue.loop.crossfade;
          this.segment(token, buf, token.nextSegmentAt, cue.loop.from, len, cue.loop.crossfade, cue.loop.crossfade);
          token.nextSegmentAt += cue.loop.to - cue.loop.from;
        }
      } else if (token.plannedEnd !== null && cue.extend_to_seam_if_still_reading !== undefined) {
        // Decide at the last moment whether to cut at `end` or extend to the seam.
        const decideAt = token.plannedEnd - cue.fade_out - LOOKAHEAD;
        if (now >= decideAt) {
          if (!token.extended && this.stillReading()) {
            token.extended = true;
            token.plannedEnd = token.startedAt + (cue.extend_to_seam_if_still_reading - cue.start);
          } else {
            this.scheduleEnd(token);
          }
        }
      }
    }
    for (const bp of this.bedPlaying.values()) {
      const buf = this.buffers.get(bp.bed.asset);
      if (!buf) continue;
      while (bp.nextSegmentAt < now + LOOKAHEAD) {
        const cf = bp.bed.loop.crossfade;
        this.segment(bp, buf, bp.nextSegmentAt, bp.from, bp.to - bp.from + cf, cf, cf);
        bp.nextSegmentAt += bp.to - bp.from;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Beds
  // -------------------------------------------------------------------------

  private refreshBeds(): void {
    if (!this.ctx || !this.prefs.enabled) return;
    for (const bed of this.soundscape.beds) {
      const want = bed.gain_ref === 'walla_gain' ? this.wallaActive : this.roomActive;
      const have = this.bedPlaying.get(bed.id);
      if (want && !have) void this.startBed(bed);
      else if (!want && have) this.stopBed(bed.id);
    }
  }

  private async startBed(bed: Bed): Promise<void> {
    if (!this.ctx || !this.beds) return;
    const token: BedPlaying = { bed, gain: this.ctx.createGain(), sources: [], nextSegmentAt: 0, from: 0, to: 0 };
    this.bedPlaying.set(bed.id, token);
    const buf = await this.buffer(bed.asset);
    if (!buf || !this.ctx || this.bedPlaying.get(bed.id) !== token) return;
    token.from = bed.loop.from ?? 0;
    token.to = bed.loop.to ?? buf.duration;
    const level = this.soundscape.gains[bed.gain_ref];
    const t0 = this.ctx.currentTime + 0.03;
    token.gain.connect(this.beds);
    token.gain.gain.setValueAtTime(0, t0);
    token.gain.gain.linearRampToValueAtTime(level, t0 + 1.0);
    token.nextSegmentAt = t0;
  }

  private stopBed(id: string): void {
    const token = this.bedPlaying.get(id);
    if (!token || !this.ctx) return;
    this.bedPlaying.delete(id);
    const t = this.ctx.currentTime;
    token.gain.gain.cancelScheduledValues(t);
    token.gain.gain.setValueAtTime(token.gain.gain.value, t);
    token.gain.gain.linearRampToValueAtTime(0, t + 0.6);
    for (const s of token.sources) { try { s.stop(t + 0.65); } catch { /* not started */ } }
  }

  // -------------------------------------------------------------------------
  // One-shots
  // -------------------------------------------------------------------------

  private async playShot(shot: OneShot): Promise<void> {
    if (!this.ctx || !this.effects) return;
    const buf = await this.buffer(shot.asset);
    if (!buf || !this.ctx) return;
    const start = shot.region?.start ?? 0;
    const end = shot.region?.end ?? buf.duration;
    const g = this.ctx.createGain();
    g.gain.value = shot.gain ?? 1;
    g.connect(this.effects);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(g);
    src.start(this.ctx.currentTime, start, Math.max(0.01, end - start));
    src.onended = () => { try { g.disconnect(); } catch { /* gone */ } };
  }

  /** Everything the maps can trigger on or stop on, for validation. */
  static signalsOf(map: MusicMap): string[] {
    const out = new Set<string>();
    for (const c of map.cues) { out.add(c.trigger); for (const s of c.stop_on) out.add(s); }
    return [...out];
  }
}
