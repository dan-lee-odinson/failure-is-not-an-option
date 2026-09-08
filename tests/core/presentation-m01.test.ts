/**
 * FNO-M01 presentation contract (docs/m01-inputs/28-Prologue-and-Resolution-Treatment.md; the M01 handoff):
 *  - the prologue after NEW CAMPAIGN: the content's plates then the scenario card; a background under one moving
 *    layer placed in design pixels at its `from` composition, with the motion as data for the app; the heading and
 *    the caption as live text; CONTINUE and SKIP PROLOGUE; the crossfade markup; reduced motion static;
 *  - the scenario card: facility, date, mission — scenario, the context line;
 *  - the resolution cards: the outcome's tier, plate, title and result line on every route; the relationship row
 *    from the net trust change at completion (neutral for up, concerned for down, zero absent, fixed order);
 *    card 2 skipped when nobody changed; FAILURE / LOSS never rendered; read-only;
 *  - participants at both accountability nodes as portrait + label with no line;
 *  - the History note once a run exists; the debrief's REVIEW THE RESULT key; the room dissolve markup;
 *  - the hint text on every decision in the strip when idle;
 *  - screen ids for the cue maps.
 */
import { describe, expect, it } from 'vitest';
import { indexContent, type ContentBundle, type Run as RunType } from '../../core';
import { assetEntry } from '../../app/assets';
import { esc, render } from '../../app/render';
import { describeResolution, trustAtCompletion, type RunLike } from '../../app/resolution';
import { defaultUi, screenId, type Store, type UiState } from '../../app/ui-state';
import { ORACLE, PREP_SETS, content, newRun, play, prepKey, script, type Prep, type Route, type Stance } from './helpers';

function store(run: RunType | null, u: Partial<UiState> = {}): Store {
  return { content: content(), run, ui: defaultUi({ screen: run ? 'console' : 'opening', ...u }) };
}

function upTo(node: string, s: { prep?: Prep[]; route?: Route; stance?: Stance } = {}): RunType {
  const inputs = script({ prep: s.prep ?? ['recovery'], route: s.route ?? 'earlier', stance: s.stance ?? 'ground' });
  const cut = inputs.findIndex((i) => 'node' in i && i.node === node);
  expect(cut).toBeGreaterThanOrEqual(0);
  return play(newRun(), inputs.slice(0, cut));
}

const filename = (id: string | null): string => assetEntry(id)?.filename ?? `no asset ${id}`;
const prologue = () => content().mission.prologue!;
const TIER = { 2: 'SUCCESS', 1: 'MIXED', 0: 'COSTLY' } as const;

describe('prologue', () => {
  it('renders the content plates in order and the scenario card last, each with its background, one moving layer at the from composition, the heading and the caption', () => {
    const p = prologue();
    expect(p.plates.map((x) => x.id)).toEqual(['g8-prologue-program', 'g8-prologue-crew', 'g8-prologue-launch', 'g8-prologue-docking', 'g8-prologue-inflection']);
    p.plates.forEach((plate, i) => {
      const html = render(store(null, { screen: 'prologue', prologue: { index: i, prev: null, prevProgress: 0 } }));
      expect(html).toContain(`data-testid="screen-prologue" data-plate="${plate.id}" data-index="${i}" data-count="6"`);
      expect(html).toContain(`<h1 class="pl-heading" data-testid="plate-heading">${esc(plate.title)}</h1>`);
      expect(html).toContain(`<p class="pl-caption" data-testid="plate-caption">${esc(plate.caption)}</p>`);
      expect(html).toMatch(new RegExp(`<img class="pl-bg" src="[^"]*${filename(plate.background)}" alt="" data-backdrop data-testid="prologue-plate" />`));
      const m = plate.moving_element;
      const layer = new RegExp(`<img class="pl-layer" src="[^"]*${filename(m.asset)}" alt="" aria-hidden="true" data-backdrop data-layer="${m.asset}" data-testid="prologue-layer" data-dx="${m.motion.to.x - m.motion.from.x}" data-dy="${m.motion.to.y - m.motion.from.y}" data-seconds="${m.motion.seconds}" style="([^"]*)" />`).exec(html);
      expect(layer, `layer on ${plate.id}`).not.toBeNull();
      const style = layer![1]!;
      const pct = (v: number, of: number) => `${Math.round((v / of) * 100000) / 1000}%`;
      expect(style).toContain(`left:${pct(m.placement.x + m.motion.from.x, 1920)}`);
      expect(style).toContain(`top:${pct(m.placement.y + m.motion.from.y, 1080)}`);
      expect(style).toContain(`width:${pct(m.placement.width, 1920)}`);
      expect(style).toContain(`height:${pct(m.placement.height, 1080)}`);
      expect(style).toContain(`opacity:${m.placement.opacity}`);
      expect(style).not.toContain('transform'); // the app animates the current layer; the from composition is the static picture
      expect(html.match(/class="pl-layer"/g)).toHaveLength(1); // exactly one moving layer per plate
      expect(html).toMatch(/data-testid="prologue-next" data-focus-default>CONTINUE</);
      expect(html).toMatch(/data-testid="prologue-skip">SKIP PROLOGUE</);
      expect(html).not.toContain('data-testid="prologue-enter"');
      expect(html).toContain('data-testid="sound-prologue"');
      expect(html).not.toContain('class="room-layer"'); // a full-screen plate, not the room
    });
    // The docking beat's craft layer: design pixels as percentages of the frame.
    const docking = render(store(null, { screen: 'prologue', prologue: { index: 3, prev: null, prevProgress: 0 } }));
    expect(docking).toContain('left:23.958%;top:8.333%;width:71.875%;height:71.852%;opacity:1');
    expect(docking).toContain('data-dx="20" data-dy="0" data-seconds="20"');
    // The launch beat's haze rises from y 380 at 0.25.
    const launch = render(store(null, { screen: 'prologue', prologue: { index: 2, prev: null, prevProgress: 0 } }));
    expect(launch).toContain('left:0%;top:35.185%;width:100%;height:100%;opacity:0.25');
    expect(launch).toContain('data-dx="0" data-dy="-48" data-seconds="20"');
  });

  it('the scenario card composes facility, date, mission — scenario and the context line, and its Continue enters the console', () => {
    const c = prologue().scenario_card;
    const html = render(store(null, { screen: 'prologue', prologue: { index: 5, prev: null, prevProgress: 0 } }));
    expect(html).toContain(`data-plate="${c.id}" data-index="5" data-count="6" data-card="scenario"`);
    expect(html).toContain(`<div class="pl-facility" data-testid="scenario-facility">${esc(c.facility)}</div>`);
    expect(c.facility).toBe('Manned Spacecraft Center, Houston');
    expect(html).toContain(`<div class="pl-date" data-testid="scenario-date">${esc(c.date)}</div>`);
    expect(html).toContain(`<span class="pl-mission-name">${esc(c.mission)}</span> — <span class="pl-scenario-name">${esc(c.scenario)}</span>`);
    expect(html).toContain(`<p class="pl-context" data-testid="scenario-context">${esc(c.context)}</p>`);
    expect(html).toMatch(new RegExp(`data-testid="prologue-plate"`));
    expect(html).toContain(filename(c.background));
    expect(html).toMatch(/data-testid="prologue-enter" data-focus-default>CONTINUE</);
    expect(html).not.toContain('data-testid="prologue-skip"');
    // An index past the end clamps to the card; a negative one to the first plate.
    expect(render(store(null, { screen: 'prologue', prologue: { index: 99, prev: null, prevProgress: 0 } }))).toContain(`data-plate="${c.id}"`);
    expect(render(store(null, { screen: 'prologue', prologue: { index: -3, prev: null, prevProgress: 0 } }))).toContain('data-plate="g8-prologue-program"');
  });

  it('a crossfade keeps the previous plate beneath, its layer held where it was, and the new plate and caption fade in; reduced motion cuts', () => {
    const html = render(store(null, { screen: 'prologue', prologue: { index: 1, prev: 0, prevProgress: 0.5 } }));
    const prev = /<div class="pl-scene pl-prev" data-testid="prologue-prev-scene">([\s\S]*?)<\/div>/.exec(html);
    expect(prev).not.toBeNull();
    expect(prev![1]).toContain(filename('g8-prologue-program'));
    expect(prev![1]).toContain('transform:translate(calc(18 * var(--unit)), calc(0 * var(--unit)))'); // half of the program beat's +36 px drift
    expect(html.indexOf('pl-prev')).toBeLessThan(html.indexOf('pl-current'));
    expect(html).toContain('class="pl-scene pl-current pl-fade-in"');
    expect(html).toContain('class="pl-text pl-fade-in"');
    expect(html).toContain(filename('g8-prologue-crew'));
    const cut = render(store(null, { screen: 'prologue', reducedMotion: true, prologue: { index: 1, prev: 0, prevProgress: 0.5 } }));
    expect(cut).not.toContain('pl-prev');
    expect(cut).not.toContain('pl-fade-in');
    expect(render(store(null, { screen: 'prologue', prologue: { index: 1, prev: null, prevProgress: 0 } }))).not.toContain('pl-fade-in');
  });

  it('the prologue and the resolution have screen ids for the cue maps; the prologue Continue takes the idle highlight like any continuation', () => {
    expect(screenId({ screen: 'prologue', stage: 'menu' })).toBe('screen:prologue');
    expect(screenId({ screen: 'resolution', stage: 'menu' })).toBe('screen:resolution');
    expect(render(store(null, { screen: 'prologue', idle: true }))).toMatch(/class="k k-key idle-hint" data-action="prologue-next"/);
    expect(render(store(null, { screen: 'prologue', idle: true, hints: false }))).not.toContain('idle-hint');
  });
});

describe('resolution view', () => {
  it('reads the tier, plate, title and result line of every outcome on every route, and the changed relationships with the right face and label', () => {
    const m = content().mission;
    const labels = m.resolution_presentation!;
    let seen = 0;
    for (const prep of PREP_SETS) for (const route of ['earlier', 'later'] as const) for (const stance of ['blame', 'ground'] as const) {
      const run = play(newRun(), script({ prep, route, stance }));
      const v = describeResolution(content(), run)!;
      expect(v).not.toBeNull();
      const grade = ORACLE[prepKey(prep)]![route];
      expect(v.outcome.id).toBe(`g8-out-${route}-${grade}`);
      expect(v.tier).toBe(TIER[grade as 0 | 1 | 2]);
      expect(v.plate).toBe(`g8-resolution-${v.tier.toLowerCase()}`);
      const o = m.outcomes.find((x) => x.id === v.outcome.id)!;
      expect(v.outcome.title).toBe(o.title);
      expect(v.result_line).toBe(o.result_line);
      expect(v.heading).toBe(labels.heading);
      expect(v.relationships_heading).toBe(labels.relationships_heading);
      // The row: exactly the people whose trust moved, in the layout's order, with the delta from the initial ledger.
      const order = [...m.debrief_layout.controllers, ...m.debrief_layout.astronauts];
      const expected = order.filter((id) => (run.state.ledger.people[id]?.trust ?? 0) !== (run.identity.initial_ledger.people[id]?.trust ?? 0));
      expect(v.people.map((p) => p.id)).toEqual(expected);
      for (const p of v.people) {
        const c = content().characters.get(p.id)!;
        expect(p.delta).toBe(run.state.ledger.people[p.id]!.trust - (run.identity.initial_ledger.people[p.id]?.trust ?? 0));
        expect(p.delta).not.toBe(0);
        expect(p.expression).toBe(p.delta > 0 ? 'neutral' : 'concerned');
        expect(p.portrait).toBe(c.portraits![p.expression]);
        expect(p.label).toBe(p.delta > 0 ? labels.trust_up : labels.trust_down);
        expect(p.name).toBe(c.name);
      }
      if (stance === 'blame') {
        expect(v.people.filter((p) => ['armstrong', 'scott'].includes(p.id)).map((p) => p.expression)).toEqual(['concerned', 'concerned']);
        expect(v.people.filter((p) => ['cunningham', 'stafford'].includes(p.id)).map((p) => p.label)).toEqual([labels.trust_up, labels.trust_up]);
      } else {
        expect(v.people.some((p) => p.id === 'cunningham' || p.id === 'stafford')).toBe(false);
        expect(v.people.filter((p) => ['armstrong', 'scott'].includes(p.id)).map((p) => p.expression)).toEqual(['neutral', 'neutral']);
      }
      // A zero adjustment is not a change: the coordinated earlier pickup leaves Reed where he was; the prompt later response leaves Voss.
      if (route === 'earlier' && grade === 2) expect(v.people.some((p) => p.id === 'g8-recovery')).toBe(false);
      if (route === 'later' && grade === 2) expect(v.people.some((p) => p.id === 'g8-systems')).toBe(false);
      seen++;
    }
    expect(seen).toBe(28);
  });

  it('is null before completion or without the presentation block; the delta is taken at completion, not after planning', () => {
    expect(describeResolution(content(), upTo('g8-return-brief'))).toBeNull();
    const bundle = structuredClone(content().bundle) as ContentBundle;
    delete bundle.mission.resolution_presentation;
    const without = indexContent(bundle);
    const run = play(newRun(), script({ prep: ['recovery'], route: 'earlier', plan: 'g9-plan-recovery-contact' }));
    expect(describeResolution(without, { state: run.state, identity: run.identity, log: run.log })).toBeNull();
    // An adjustment appended after the finalize entry (no plan does this today) would not move the row.
    const finalize = run.log.find((e) => e.type === 'finalize')!;
    const late: RunLike = {
      state: run.state, identity: run.identity,
      log: [...run.log, { seq: run.log.length + 1, type: 'effect', effect: 'adjust', path: 'people.g8-systems.trust', by: -5, before: 1, after: -4, cause: 'test', refs: {}, player_visible: true }],
    };
    expect(finalize.seq).toBeLessThan(run.log.length + 1);
    expect(trustAtCompletion(late, 'g8-systems')).toEqual({ before: 0, after: 1 });
    expect(describeResolution(content(), late)!.people.find((p) => p.id === 'g8-systems')!.delta).toBe(1);
  });

  it('when nobody changed, the relationships card is omitted: the renderer shows the result card and no skip key', () => {
    const run = play(newRun(), script({ prep: ['recovery'], route: 'earlier' }));
    const still: RunLike & { content: typeof run.content } = { content: run.content, state: run.state, identity: run.identity, log: run.log.filter((e) => !(e.type === 'effect' && e.effect === 'adjust')) };
    const v = describeResolution(content(), still)!;
    expect(v.people).toEqual([]);
    const s: Store = { content: content(), run: still as unknown as RunType, ui: defaultUi({ screen: 'resolution', resolution: 'relationships' }) };
    const html = render(s);
    expect(html).toContain('data-card="result"');
    expect(html).not.toContain('data-testid="resolution-skip"');
    expect(html).not.toContain('data-testid="resolution-people"');
  });

  it('only SUCCESS, MIXED and COSTLY are used; FAILURE and LOSS stay reserved and never render', () => {
    const tiers = new Set(content().mission.outcomes.map((o) => o.tier));
    expect([...tiers].sort()).toEqual(['COSTLY', 'MIXED', 'SUCCESS']);
    for (const o of content().mission.outcomes) expect(o.kind).toBe('abort-safe');
    for (const prep of [[], ['contact'], ['contact', 'recovery']] as Prep[][]) for (const route of ['earlier', 'later'] as const) {
      const html = render(store(play(newRun(), script({ prep, route })), { screen: 'resolution' }));
      const tier = /data-testid="resolution-tier"[^>]*>([A-Z]+)</.exec(html)![1];
      expect(['SUCCESS', 'MIXED', 'COSTLY']).toContain(tier);
      expect(html).not.toMatch(/resolution-tier"[^>]*>(FAILURE|LOSS)</);
    }
  });
});

describe('resolution cards', () => {
  it('card 1: the plate under the overlay, the heading, the tier in the hero face, the title and the result line; the lamp keeps its state; nothing touches the run', () => {
    const run = play(newRun(), script({ prep: ['contact', 'recovery'], route: 'earlier', stance: 'blame' }));
    const logBefore = run.canonicalLog();
    const html = render(store(run, { screen: 'resolution', resolution: 'result' }));
    expect(html).toContain('data-testid="screen-resolution" data-card="result" data-tier="SUCCESS" data-outcome="g8-out-earlier-2"');
    expect(html).toMatch(new RegExp(`<img class="pl-bg" src="[^"]*${filename('g8-resolution-success')}" alt="" data-backdrop data-testid="resolution-plate" />`));
    expect(html).toContain('<div class="res-overlay" data-testid="resolution-overlay">');
    expect(html).toContain('<div class="res-heading" data-testid="resolution-heading">RECOVERY RESULT</div>');
    expect(html).toMatch(/<div class="res-tier" data-testid="resolution-tier"[^>]*>SUCCESS<\/div>/); // M02 adds the tier's meaning as a title
    const o = content().mission.outcomes.find((x) => x.id === 'g8-out-earlier-2')!;
    expect(html).toContain(`<div class="res-title" data-testid="resolution-title">${esc(o.title)}</div>`);
    expect(html).toContain(`<p class="res-line" data-testid="resolution-line">${esc(o.result_line!)}</p>`);
    expect(html).toContain('data-testid="badge-alt-history"'); // the earlier route lit ALTERNATE HISTORY; the card keeps it
    expect(html).toMatch(/data-testid="resolution-next" data-focus-default>CONTINUE</);
    expect(html).toMatch(/data-testid="resolution-skip">SKIP TO DEBRIEF</);
    expect(html).not.toContain('data-testid="resolution-people"');
    expect(html).not.toContain('class="room-layer"');
    const later = render(store(play(newRun(), script({ prep: ['contact'], route: 'later' })), { screen: 'resolution' }));
    expect(later).not.toContain('data-testid="badge-alt-history"');
    expect(later).toContain('data-tier="MIXED" data-outcome="g8-out-later-1"');
    expect(later).toContain(filename('g8-resolution-mixed'));
    expect(render(store(play(newRun(), script({ prep: [], route: 'later' })), { screen: 'resolution' }))).toContain('data-tier="COSTLY" data-outcome="g8-out-later-0"');
    // Rendering both cards, twice, is read-only.
    render(store(run, { screen: 'resolution', resolution: 'relationships' }));
    render(store(run, { screen: 'resolution', resolution: 'result' }));
    expect(run.canonicalLog()).toBe(logBefore);
  });

  it('card 2: the stronger overlay, the relationships heading, and one figure per changed person with the expression portrait, the name and the change in words', () => {
    const run = play(newRun(), script({ prep: ['recovery'], route: 'earlier', stance: 'blame' }));
    const v = describeResolution(content(), run)!;
    expect(v.people.map((p) => p.id)).toEqual(['g8-systems', 'g8-recovery', 'armstrong', 'scott', 'cunningham', 'stafford']); // six: the difficult pickup moved Reed too
    const html = render(store(run, { screen: 'resolution', resolution: 'relationships' }));
    expect(html).toContain('data-card="relationships" data-tier="MIXED"');
    expect(html).toContain('<div class="res-overlay strong" data-testid="resolution-overlay">');
    expect(html).toContain('<div class="res-heading" data-testid="resolution-heading">THE ROOM REMEMBERS</div>');
    expect(html.match(/class="res-person"/g)).toHaveLength(6);
    const people = /<ul class="res-people" data-testid="resolution-people">([\s\S]*?)<\/ul>/.exec(html)![1]!;
    let last = -1;
    for (const p of v.people) {
      const at = people.indexOf(`data-testid="res-person-${p.id}"`);
      expect(at).toBeGreaterThan(last); // the fixed order
      last = at;
      const c = content().characters.get(p.id)!;
      expect(people).toContain(`data-testid="res-person-${p.id}" data-delta="${p.delta > 0 ? '+' : ''}${p.delta}" data-expression="${p.expression}"`);
      expect(people).toMatch(new RegExp(`<img src="[^"]*${filename(c.portraits![p.expression])}" alt="Portrait: ${esc(c.name)}" />`));
      expect(people).toContain(`<div class="res-name">${esc(c.name)}</div>`);
      expect(people).toContain(`<div class="res-change ${p.delta > 0 ? 'up' : 'down'}">${esc(p.label)}</div>`);
    }
    expect(people).toContain('fno_gemini_portrait_armstrong_concerned_v001.png');
    expect(people).toContain('fno_gemini_portrait_cunningham_neutral_v001.png');
    expect(people).toContain('fno_gemini_portrait_systems_neutral_v001.png');
    expect(people).toContain('fno_gemini_portrait_recovery_concerned_v001.png');
    expect(html).not.toContain('data-testid="resolution-skip"'); // Continue is the way to the debrief here
    // Ground accountability: the critics are unchanged and absent; the crew are up.
    const ground = render(store(play(newRun(), script({ prep: ['recovery'], route: 'earlier', stance: 'ground' })), { screen: 'resolution', resolution: 'relationships' }));
    expect(ground).not.toContain('res-person-cunningham');
    expect(ground).not.toContain('res-person-stafford');
    expect(ground).toContain('data-testid="res-person-armstrong" data-delta="+1" data-expression="neutral"');
    // A character without an expression pair falls back to the name and the change, and never blocks the card.
    const bundle = structuredClone(content().bundle) as ContentBundle;
    delete bundle.characters.find((c) => c.id === 'scott')!.portraits;
    const trimmed = indexContent(bundle);
    const s: Store = { content: trimmed, run: { content: trimmed, state: run.state, identity: run.identity, log: run.log } as unknown as RunType, ui: defaultUi({ screen: 'resolution', resolution: 'relationships' }) };
    const fallback = /<li class="res-person" data-testid="res-person-scott"[\s\S]*?<\/li>/.exec(render(s))![0];
    expect(fallback).toContain('class="portrait empty"');
    expect(fallback).toContain('<div class="res-name">David Scott</div>');
    expect(fallback).toContain('Trust down');
    expect(fallback).not.toContain('<img');
  });

  it('the debrief offers REVIEW THE RESULT, and the console carries the dissolve overlay only while the card dissolves', () => {
    const run = play(newRun(), script({ prep: ['recovery'], route: 'earlier' }));
    expect(render(store(run, { screen: 'debrief' }))).toMatch(/data-testid="to-resolution">REVIEW THE RESULT</);
    const brief = newRun();
    const dissolving = render(store(brief, { dissolve: true }));
    expect(dissolving).toMatch(new RegExp(`<div class="room-dissolve" data-testid="room-dissolve" aria-hidden="true"><img src="[^"]*${filename('g8-prologue-facility')}" alt="" /></div>`));
    expect(render(store(brief))).not.toContain('room-dissolve');
  });
});

describe('historical participants', () => {
  it('both accountability nodes show the four astronauts as portrait and label, in the conversation panel, with no line under them', () => {
    const labels = ['NEIL ARMSTRONG — COMMAND PILOT', 'DAVID SCOTT — PILOT', 'WALT CUNNINGHAM — ASTRONAUT OFFICE', 'TOM STAFFORD — ASTRONAUT OFFICE'];
    for (const node of ['g8-accountability-brief', 'g8-accountability-decision']) {
      const run = upTo(node);
      expect(run.currentNode()!.node.id).toBe(node);
      const html = render(store(run));
      const block = /<div class="participants" data-testid="participants" role="group" aria-label="Present at this discussion">([\s\S]*?)<\/div>/.exec(html);
      expect(block, node).not.toBeNull();
      const inner = block![1]!;
      expect(inner.match(/<figure class="participant"/g)).toHaveLength(4);
      let last = -1;
      for (const [i, id] of ['armstrong', 'scott', 'cunningham', 'stafford'].entries()) {
        const at = inner.indexOf(`data-testid="participant-${id}" data-character="${id}"`);
        expect(at).toBeGreaterThan(last);
        last = at;
        const c = content().characters.get(id)!;
        expect(inner).toMatch(new RegExp(`<img class="portrait" src="[^"]*${filename(c.portrait)}" alt="Portrait: ${esc(c.name)}" />`));
        expect(inner).toContain(`<figcaption class="who">${esc(labels[i]!)}</figcaption>`);
        expect(c.portrait).toBe(c.portraits!.neutral);
      }
      expect(inner).not.toContain('class="what"');
      expect(inner).not.toContain('“');
      // Inside the conversation panel's body, after the narration; nothing renders a historical person as a speaker.
      const panel = html.slice(html.indexOf('data-testid="conversation"'), html.indexOf('<aside class="evidence'));
      expect(panel).toContain('data-testid="participants"');
      expect(panel.indexOf('data-testid="narration"') === -1 || panel.indexOf('data-testid="narration"') < panel.indexOf('data-testid="participants"')).toBe(true);
      expect(html).not.toMatch(/class="line "[^>]*data-role="(Command Pilot|Pilot|Astronaut Office)"/i);
      expect(html).not.toContain('data-testid="active-portrait"');
    }
    // Nowhere else.
    expect(render(store(upTo('g8-return-brief')))).not.toContain('data-testid="participants"');
    expect(render(store(newRun()))).not.toContain('data-testid="participants"');
  });

  it('controllers keep their console portraits; the expression pairs are used on the resolution card only', () => {
    const run = upTo('g8-relationship-response'); // the controllers' lines after the pickup
    expect(run.currentNode()!.node.id).toBe('g8-relationship-response');
    const html = render(store(run));
    expect(html).toContain('data-role="SYSTEMS"');
    const voss = content().characters.get('g8-systems')!;
    expect(html).toContain(filename(voss.portrait)); // fno_gemini_portrait_mara-voss_neutral_v001.png
    expect(html).not.toContain(filename(voss.portraits!.neutral));
    expect(html).not.toContain(filename(voss.portraits!.concerned));
    const reed = content().characters.get('g8-recovery')!;
    expect(html).toContain(filename(reed.portrait));
    expect(html).not.toContain(filename(reed.portraits!.concerned));
  });
});

describe('History note and About sources', () => {
  it('the facility note appears in History once a run exists, with its sources; About lists H9 and H10', () => {
    const p = prologue();
    const withRun = render(store(newRun(), { overlay: 'history' }));
    expect(withRun).toContain(`<p class="history-note" data-testid="history-note">${esc(p.history_note)} <span class="muted">Sources: H10.</span></p>`);
    expect(p.history_note).toContain('1973');
    expect(render(store(null, { stage: 'menu', overlay: 'history' }))).not.toContain('data-testid="history-note"');
    const about = render(store(null, { stage: 'menu', overlay: 'about' }));
    for (const id of ['H9', 'H10']) {
      const s = content().bundle.registry.sources.find((x) => x.id === id)!;
      expect(about).toContain(`<b>${id}</b> — <a href="${esc(s.url)}"`);
      expect(about).toContain(esc(s.title));
    }
    expect(content().bundle.registry.fiction.some((f) => f.id === 'F11')).toBe(true);
    expect(withRun).not.toContain('F11'); // History never shows the fiction register (M00c)
  });
});

describe('hints (content 0.5.2)', () => {
  it('every decision carries a procedural hint that renders in the strip after idling, above the cards, and never otherwise', () => {
    const decisions = content().mission.phases.flatMap((ph) => ph.nodes).filter((n) => n.type === 'decision');
    expect(decisions.map((n) => n.id)).toEqual(['g8-rule-decision', 'g8-return-brief', 'g8-lesson-decision', 'g8-accountability-decision']);
    for (const d of decisions) {
      if (d.type !== 'decision') continue;
      expect(d.hint, d.id).toBeTruthy();
      expect(d.hint).not.toMatch(/earlier|later|blame|ground|provenance|cross-check/i); // procedural, never a recommendation
      const run = upTo(d.id);
      const idle = render(store(run, { idle: true }));
      expect(idle).toContain(`<div class="hint-strip paper" role="status" data-testid="hint-strip">${esc(d.hint!)}</div>`);
      expect(idle.indexOf('data-testid="hint-strip"')).toBeLessThan(idle.indexOf('<div class="cards"'));
      expect(idle).not.toContain('idle-hint');
      expect(render(store(run))).not.toContain('data-testid="hint-strip"');
      expect(render(store(run, { idle: true, hints: false }))).not.toContain('data-testid="hint-strip"');
      expect(render(store(run, { idle: true, reducedMotion: true }))).not.toContain('data-testid="hint-strip"');
    }
  });
});
