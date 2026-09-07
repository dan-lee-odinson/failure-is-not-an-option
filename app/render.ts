/**
 * Renderer: (store) -> HTML string. Every interactive element is a real
 * <button>, <a>, <input>, or <summary>, reachable by keyboard in DOM order.
 * Actions are declared with data-action="name" or "name:arg".
 *
 * Two vocabularies (doc 19 §2, Dan's ruling): hardware for controls — native
 * buttons over the Apollo kit's label-free faces with live text — and paper
 * for content — option cards, evidence, the binder, the debrief.
 *
 * No fiction call-outs and no source provenance in play text (17 §1): the
 * only in-play history signals are the two mode lamps, the History panel and
 * the debrief's "Departures from the record". Everything the player reads is
 * captured by the dialogue sheet exactly as rendered here.
 */
import {
  alternateHistoryActive, describeCommittedDecision, describeDebrief, describeEvidence, describeFollowOnForRun, describeNode,
  type EvidenceView, type LineView, type NodeView, type Option, type OptionView,
} from '../core';
import { assetEntry, assetUrl } from './assets';
import { MODERN_UI_AVAILABLE } from './theme';
import type { Store } from './ui-state';
import musicMap from './music-map.json';
import soundscapeMap from './soundscape-map.json';
import titleLayout from './title-layout.json';

export const PIN_HINT = 'Pin to keep this report in view. Pinning changes nothing in the mission.';

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/** Provenance for the History panel: note, then only the fields that are present, no trailing separators. */
export function provenanceLine(p: { note: string; sources: string[]; fiction: string[] } | undefined): string {
  if (!p) return '';
  const parts: string[] = [];
  if (p.note.trim()) parts.push(p.note.trim());
  if (p.sources.length) parts.push(`Sources: ${p.sources.join(', ')}.`);
  if (p.fiction.length) parts.push(`Fiction register: ${p.fiction.join(', ')}.`);
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Kit controls (hardware vocabulary)
// ---------------------------------------------------------------------------

type Family = 'key' | 'action' | 'selector' | 'arrow' | 'title' | 'choose';

interface KeyOpts {
  family: Family;
  action: string;
  label: string;
  focus?: string;
  testid?: string;
  disabled?: boolean;
  pressed?: boolean;
  expanded?: boolean;
  describedBy?: string;
  ariaLabel?: string;
  title?: string;
  focusDefault?: boolean;
  cls?: string;
  /** The label is trusted HTML (an inline SVG glyph); otherwise it is escaped. */
  html?: boolean;
}

/** A native button with live text over a kit face. */
function key(o: KeyOpts): string {
  const attrs = [`type="button"`, `class="k k-${o.family}${o.cls ? ' ' + o.cls : ''}"`, `data-action="${esc(o.action)}"`, `data-focus="${esc(o.focus ?? o.action)}"`];
  if (o.testid) attrs.push(`data-testid="${esc(o.testid)}"`);
  if (o.disabled) attrs.push('disabled');
  if (o.pressed !== undefined) attrs.push(`aria-pressed="${o.pressed}"`);
  if (o.expanded !== undefined) attrs.push(`aria-expanded="${o.expanded}"`);
  if (o.describedBy) attrs.push(`aria-describedby="${esc(o.describedBy)}"`);
  if (o.ariaLabel) attrs.push(`aria-label="${esc(o.ariaLabel)}"`);
  if (o.title) attrs.push(`title="${esc(o.title)}"`);
  if (o.focusDefault) attrs.push('data-focus-default');
  return `<button ${attrs.join(' ')}>${o.html ? o.label : esc(o.label)}</button>`;
}

const PIN_GLYPH = '<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 3h6l-1 6 3 3v2h-4v7l-1 1-1-1v-7H7v-2l3-3z" fill="currentColor"/></svg>';

function soundControl(store: Store, id: string): string {
  const a = store.ui.audio;
  return `<div class="sound" data-testid="sound-${esc(id)}">
    ${key({ family: 'selector', action: 'sound-toggle', focus: 'sound-toggle', testid: 'sound-toggle', pressed: a.enabled, label: `SOUND: ${a.enabled ? 'ON' : 'OFF'}` })}
    <label class="vol">Volume <input type="range" min="0" max="100" step="5" value="${Math.round(a.master * 100)}" data-volume="master" data-focus="volume-master" data-testid="volume-master" aria-label="Master volume" /></label>
  </div>`;
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export function render(store: Store): string {
  const { ui } = store;
  let body: string;
  switch (ui.screen) {
    case 'opening': body = renderOpening(store); break;
    case 'console': body = renderConsole(store); break;
    case 'debrief': body = renderDebrief(store); break;
    case 'planning': body = renderPlanning(store); break;
  }
  return body + renderOverlay(store);
}

// ---------------------------------------------------------------------------
// Opening: start → dedication → notices → (montage) → hero title → main menu
// ---------------------------------------------------------------------------

function plateImgs(): string {
  const room = assetUrl('room-gemini-console');
  const emblem = assetUrl('emblem-flight-operations');
  return `${room ? `<img id="plate" class="plate" src="${room}" alt="" aria-hidden="true" data-testid="plate" />` : ''}${emblem ? `<img id="emblem" class="emblem" src="${emblem}" alt="" aria-hidden="true" data-testid="emblem" />` : ''}`;
}

function renderOpening(store: Store): string {
  const { ui } = store;
  const reg = store.content.bundle.registry;
  const m = store.content.mission;
  const stage = ui.stage;
  const message = ui.message ? `<p class="message" role="alert" data-testid="message">${esc(ui.message)}</p>` : '';
  if (stage === 'start') {
    return `
  <main class="screen-opening op-start" data-testid="screen-opening" data-stage="start">
    <div class="op-quiet">
      <div class="op-keys">
        ${key({ family: 'key', action: 'begin', focus: 'begin', testid: 'begin', focusDefault: true, label: 'BEGIN' })}
        ${key({ family: 'selector', action: 'skip-to-menu', focus: 'skip-to-menu', testid: 'skip-to-menu', label: 'SKIP TO MENU' })}
      </div>
      ${soundControl(store, 'start')}
      ${message}
    </div>
  </main>`;
  }
  if (stage === 'dedication' || stage === 'notices') {
    const texts = stage === 'dedication' ? reg.notices.dedication : [reg.notices.project_disclaimer, reg.notices.ai_disclosure, reg.notices.dramatization];
    const words = texts.join(' ').split(/\s+/).length;
    const seconds = Math.round(6 + words / 3.5); // a reading pace; Continue is always available
    return `
  <main class="screen-opening op-chapter" data-testid="screen-opening" data-stage="${stage}">
    <section id="op-scroll" class="op-scroll${ui.reducedMotion ? ' static' : ''}${ui.scrollPaused ? ' paused' : ''}" data-testid="op-scroll" data-seconds="${seconds}" tabindex="0" aria-label="${stage === 'dedication' ? 'Dedication' : 'Notices'}">
      <div class="op-prose" data-testid="op-prose">${texts.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
    </section>
    <div class="op-controls" data-testid="op-controls">
      ${ui.reducedMotion ? '' : key({ family: 'selector', action: 'scroll-toggle', focus: 'scroll-toggle', testid: 'scroll-toggle', pressed: ui.scrollPaused, label: ui.scrollPaused ? 'RESUME' : 'PAUSE' })}
      ${key({ family: 'key', action: 'stage-next', focus: 'stage-next', testid: 'stage-next', focusDefault: true, label: 'CONTINUE' })}
      ${key({ family: 'selector', action: 'skip-to-menu', focus: 'skip-to-menu', testid: 'skip-to-menu', label: 'SKIP TO MENU' })}
      ${soundControl(store, stage)}
    </div>
    ${message}
  </main>`;
  }
  if (stage === 'montage') {
    // Named empty slot for the future archival montage (07): a 0-duration pass-through in M00b.
    return `<main class="screen-opening op-montage" data-testid="screen-opening" data-stage="montage" aria-hidden="true"></main>`;
  }
  // title / menu — Study A, Engineering block: live text at title-layout.json coordinates, scaled with the plate.
  const study = titleLayout.studies.find((s) => s.id === 'a') ?? titleLayout.studies[0]!;
  const menu = stage === 'menu';
  const cs = ui.continueSave;
  const svg = `<svg class="hero-svg" viewBox="0 0 ${study.canvas[0]} ${study.canvas[1]}" role="img" aria-label="Failure is Not an Option" focusable="false">${study.rows.map((r) => `<text x="${r.x}" y="${r.baseline}" font-size="${r.font_size}">${esc(r.text)}</text>`).join('')}</svg>`;
  return `
  <main class="screen-opening op-hero ${menu ? 'stage-menu' : 'stage-title'}" data-testid="screen-opening" data-stage="${stage}">
    ${plateImgs()}
    <div class="hero-overlay">
    <h1 class="hero-title" data-testid="hero-title">${svg}</h1>
    ${menu ? '' : `<button type="button" class="hero-continue" data-action="stage-next" data-focus="hero-continue" data-focus-default data-testid="hero-continue">CONTINUE →</button>`}
    ${menu ? `
    <div class="menu-block">
      <nav class="menu" aria-label="Main menu" data-testid="menu">
        ${key({ family: 'title', action: 'start-new', focus: 'start-new', testid: 'start-new', focusDefault: true, label: 'NEW CAMPAIGN' })}
        ${key({ family: 'title', action: 'start-load', focus: 'start-load', testid: 'start-load', disabled: !cs.ok, describedBy: cs.ok ? undefined : 'continue-reason', label: 'CONTINUE' })}
        ${key({ family: 'title', action: 'open:saveload', focus: 'open:saveload', testid: 'menu-load', label: 'LOAD' })}
        ${key({ family: 'title', action: 'open:about', focus: 'open:about', testid: 'menu-about', label: 'ABOUT' })}
      </nav>
      ${cs.ok ? '' : `<p class="menu-reason" id="continue-reason" data-testid="continue-reason">${esc(cs.reason)}</p>`}
      <p class="menu-subtitle" data-testid="menu-subtitle">${esc(m.title)} — ${esc(m.subtitle ?? '')} · ${esc(m.start_notice)}</p>
      <div class="menu-tools">
        ${key({ family: 'selector', action: 'text-size', focus: 'text-size', testid: 'text-size', pressed: ui.textSize === 'large', label: `TEXT SIZE: ${ui.textSize === 'large' ? 'ENLARGED' : 'DEFAULT'}` })}
        ${key({ family: 'selector', action: 'open:settings', focus: 'open:settings', testid: 'open-settings', label: 'SETTINGS' })}
        ${soundControl(store, 'menu')}
      </div>
      ${message}
    </div>` : ''}
    </div>
  </main>`;
}

// ---------------------------------------------------------------------------
// Console
// ---------------------------------------------------------------------------

function renderConsole(store: Store): string {
  const run = store.run!;
  const view = describeNode(run);
  if (!view) return renderDebrief(store);
  const evidence = describeEvidence(store.content, run.state);
  return `
  <div class="console-shell" data-testid="screen-console" data-node="${esc(view.node.id)}" data-phase="${esc(view.phase.id)}">
    ${plateImgs()}
    ${renderStatusBar(store, view)}
    <div class="stage">
      ${renderConversation(store, view)}
    </div>
    ${renderEvidencePanel(store, evidence)}
    ${renderStrip(store, view)}
  </div>`;
}

function lamps(store: Store, historical: boolean, alternate: boolean): string {
  const labels = store.content.bundle.registry.labels;
  if (alternate) return `<button type="button" class="lamp lamp-alternate" data-action="open:history" data-focus="badge-alt" data-testid="badge-alt-history" aria-label="${esc(labels.alternate_history_badge)} — open the history panel">${esc(labels.alternate_history_badge)}</button>`;
  if (historical) return `<button type="button" class="lamp lamp-historical" data-action="open:history" data-focus="badge-historical" data-testid="badge-historical-choice" aria-label="${esc(labels.historical_choice_badge ?? 'HISTORICAL CHOICE')} — open the history panel">${esc(labels.historical_choice_badge ?? 'HISTORICAL CHOICE')}</button>`;
  return '';
}

function renderStatusBar(store: Store, view: NodeView): string {
  const m = store.content.mission;
  const current = store.content.nodes.get(view.node.id)?.node;
  const historical = !view.phase.alternate_history && current?.type === 'decision' && !!current.historical_option;
  const contactLabel: Record<string, string> = { 'houston': 'HOUSTON', 'tracking-ship': 'TRACKING SHIP', 'none': 'NONE', 'not-in-flight': 'NOT IN FLIGHT' };
  const attention = view.attention
    ? `<span class="attention" data-testid="attention" aria-label="Preparation opportunities: ${view.attention.remaining} of ${view.attention.declared} remaining">${'●'.repeat(view.attention.remaining)}${'○'.repeat(Math.max(0, view.attention.declared - view.attention.remaining))}</span>`
    : '';
  return `
  <header class="status-bar" data-testid="status-bar">
    <span class="mission">${esc(m.title.toUpperCase())}</span>
    <span class="sep">·</span>
    <span class="phase" data-testid="phase-title">${esc(view.phase.title)}</span>
    <span class="sep">·</span>
    <span class="time" data-testid="display-time">${esc(view.phase.display_time)}</span>
    <span class="sep">·</span>
    <span class="badge contact ${view.phase.contact === 'none' ? 'none' : ''}" data-testid="contact">CONTACT: ${contactLabel[view.phase.contact] ?? view.phase.contact}</span>
    ${attention}
    ${lamps(store, historical, view.phase.alternate_history)}
    <span class="spacer"></span>
    ${key({ family: 'selector', action: 'open:binder', testid: 'open-binder', label: 'BINDER' })}
    ${key({ family: 'selector', action: 'open:history', testid: 'open-history', label: 'HISTORY' })}
    ${key({ family: 'selector', action: 'open:saveload', testid: 'open-saveload', label: 'SAVE / LOAD' })}
    ${key({ family: 'selector', action: 'open:settings', testid: 'open-settings', label: 'SETTINGS' })}
  </header>`;
}

function renderLine(store: Store, l: LineView, idx?: string): string {
  const portrait = l.speaker ? assetUrl(l.speaker.portrait) : null;
  const who = l.speaker ? `<div class="who">${esc(l.speaker.display)}</div>` : '';
  const img = l.speaker
    ? portrait
      ? `<img class="portrait" src="${portrait}" alt="Portrait: ${esc(l.speaker.display)}" />`
      : `<div class="portrait empty" aria-hidden="true">text only</div>`
    : '';
  const role = l.speaker?.role ?? '';
  return `<div class="line ${l.speaker ? '' : 'no-speaker'}"${l.speaker ? '' : ' data-narration'}${role ? ` data-role="${esc(role)}"` : ''}${idx ? ` data-line="${esc(idx)}"` : ''}>${img}<div>${who}<div class="what">${esc(l.text)}</div></div></div>`;
}

/** The active speaker: the last rendered line (or asked answer) whose speaker has a portrait. */
function activeSpeaker(view: NodeView): LineView['speaker'] {
  const ordered: LineView[] = [...view.lines];
  for (const q of view.questions) if (q.asked) ordered.push(q.answer);
  for (let i = ordered.length - 1; i >= 0; i--) {
    const sp = ordered[i]!.speaker;
    if (sp && sp.portrait) return sp;
  }
  return null;
}

function renderConversation(store: Store, view: NodeView): string {
  const parts: string[] = [];
  const head: string[] = [];
  head.push(`<div class="scene-title">${esc(view.node.title ?? view.phase.title)}</div>`);
  if (view.node.header_label) head.push(`<div class="header-label" data-testid="header-label">${esc(view.node.header_label)}</div>`);
  if (view.node.text) parts.push(`<div class="narration" data-testid="narration">${esc(view.node.text)}</div>`);
  view.lines.forEach((l, i) => parts.push(renderLine(store, l, `${view.node.id}#${i + 1}`)));
  if (view.event_text) parts.push(`<div class="report" data-testid="event-text"><div class="label">${esc(view.node.header_label ?? 'Report')}</div>${esc(view.event_text)}</div>`);
  if (view.applied.length) {
    parts.push(`<div class="applied" data-testid="applied"><div class="label">Logged at this event</div><ul>${view.applied.map((a) => `<li>${esc(a.label)}</li>`).join('')}</ul></div>`);
  }
  if (view.questions.length) {
    parts.push(`<div class="questions" data-testid="questions">${view.questions.map((q) => `
      <button type="button" class="question paper" data-action="question:${esc(q.id)}" data-focus="question:${esc(q.id)}" data-testid="question-${esc(q.id)}" aria-expanded="${q.asked}">${esc(q.text)}</button>
      ${q.asked ? `<div class="answer">${renderLine(store, q.answer, `${q.id}#answer`)}</div>` : ''}`).join('')}</div>`);
  }
  const active = activeSpeaker(view);
  const activeUrl = active ? assetUrl(active.portrait) : null;
  const portrait = active && activeUrl
    ? `<figure class="active-portrait" data-testid="active-portrait" data-speaker="${esc(active.id)}"><img src="${activeUrl}" alt="Portrait: ${esc(active.display)}" /><figcaption class="who">${esc(active.display)}</figcaption></figure>`
    : '';
  return `<section class="conversation panel" aria-label="Conversation" data-testid="conversation">
    <div class="conv-head">${head.join('')}</div>
    <div class="conv-body ${portrait ? 'with-portrait' : ''}">${portrait}<div class="conv-lines">${parts.join('')}</div></div>
  </section>`;
}

function renderEvidencePanel(store: Store, evidence: EvidenceView[]): string {
  const pinnedSet = new Set(store.ui.pinned);
  const ordered = [...evidence.filter((e) => pinnedSet.has(e.id)), ...evidence.filter((e) => !pinnedSet.has(e.id))];
  const items = ordered.map((e) => {
    const pinned = pinnedSet.has(e.id);
    const open = pinned || store.ui.open.includes(e.id);
    const badgeClass = e.badge === 'REFERENCE' ? 'ref' : e.badge === 'CURRENT CONTACT' ? 'cur' : 'prev';
    return `
    <article class="ev-item paper ${pinned ? 'pinned' : ''}" data-testid="evidence-${esc(e.id)}" data-badge="${esc(e.badge)}">
      <div class="ev-head">
        <button type="button" class="ev-title" data-action="toggle-open:${esc(e.id)}" data-focus="open-ev:${esc(e.id)}" aria-expanded="${open}">${esc(e.title)}</button>
        <button type="button" class="k k-arrow pin ${pinned ? 'is-pinned' : ''}" data-action="pin:${esc(e.id)}" data-pin="${esc(e.id)}" data-focus="pinbtn:${esc(e.id)}" data-testid="pin-${esc(e.id)}" aria-pressed="${pinned}" aria-label="${pinned ? 'Unpin' : 'Pin'}: ${esc(e.title)}" title="${esc(PIN_HINT)}">${PIN_GLYPH}</button>
      </div>
      <div class="ev-meta">
        <span class="badge ${badgeClass}">${esc(e.badge)}</span>
        ${e.kind !== 'reference' ? `<span>Received: ${esc(e.stage)}</span>` : ''}
        ${e.observation ? `<span>Observation time: ${e.observation}</span>` : ''}
      </div>
      ${open ? (e.body !== null ? `<div class="ev-body" data-testid="evidence-body">${esc(e.body)}</div>` : `<div class="ev-body muted">Not visible at this point.</div>`) : ''}
    </article>`;
  });
  const hint = store.ui.pinHintOpen && !store.ui.pinHintSeen
    ? `<div class="pin-hint" role="status" data-testid="pin-hint"><span>${esc(PIN_HINT)}</span>${key({ family: 'selector', action: 'pin-hint-dismiss', focus: 'pin-hint-dismiss', testid: 'pin-hint-dismiss', label: 'GOT IT' })}</div>`
    : '';
  return `<aside class="evidence panel" aria-label="Evidence" data-testid="evidence-panel"><h2>Evidence · ${evidence.length}</h2>${hint}${items.length ? items.join('') : '<p class="empty">No evidence acquired yet.</p>'}</aside>`;
}

type CardState = 'rest' | 'chosen' | 'unavailable' | 'closed';

/** ORDERED for an order given in flight (sets facts about the flight); CHOSEN for a lesson (adopts a procedure), a statement, a rehearsal or a plan. */
function stampFor(nodeType: string, option: Option | undefined): string {
  if (nodeType !== 'decision' || !option) return 'CHOSEN';
  if (option.statement) return 'CHOSEN';
  if (option.effects.some((e) => 'adopt_procedure' in e)) return 'CHOSEN';
  return 'ORDERED';
}

function renderCard(store: Store, o: OptionView, nodeType: string, state: CardState, detailsDefault: boolean): string {
  const option = store.content.options.get(o.id)?.option;
  const detailsOpen = store.ui.details[o.id] ?? detailsDefault;
  const support = o.supported_by.length
    ? `<div class="support"><b>Supported by</b> ${o.supported_by.map((s) => `<span class="${s.ready ? 'ready' : 'not-ready'}">${esc(s.label)}: ${s.ready ? 'READY' : 'NOT REHEARSED'}</span>`).join(' · ')}</div>`
    : '';
  const isPrep = nodeType === 'prep_choice';
  const chooseLabel = isPrep ? 'Rehearse' : 'Choose';
  const foot = state === 'rest'
    ? key({ family: 'choose', action: `option:${o.id}`, focus: `option:${o.id}`, testid: `option-${o.id}`, label: chooseLabel })
    : state === 'chosen'
      ? `<span class="stamp" data-testid="stamp-${esc(o.id)}">${stampFor(nodeType, option)}</span>`
      : state === 'unavailable' && o.reason
        ? `<div class="reason" id="reason-${esc(o.id)}" data-testid="reason-${esc(o.id)}">${esc(o.reason)}</div>`
        : '';
  return `
  <article class="card paper" data-state="${state}" data-testid="card-${esc(o.id)}"${state === 'unavailable' ? ` aria-describedby="reason-${esc(o.id)}"` : ''}>
    ${o.subtitle ? `<div class="subtitle">${esc(o.subtitle)}</div>` : ''}
    <div class="field intent"><b>Intent</b>${esc(o.intent)}</div>
    ${o.statement ? `<div class="field statement"><b>Glen says</b>“${esc(o.statement)}”</div>` : ''}
    <div class="field cost"><b>${isPrep ? 'Cost' : 'Risk'}</b>${esc(o.cost)}</div>
    <details class="card-details" data-details="${esc(o.id)}"${detailsOpen ? ' open' : ''}>
      <summary data-focus="details:${esc(o.id)}" data-testid="details-${esc(o.id)}">Details</summary>
      ${o.attraction ? `<div class="field"><b>Attraction</b>${esc(o.attraction)}</div>` : ''}
      <div class="field"><b>Uncertainty</b>${esc(o.uncertainty)}</div>
      ${support}
    </details>
    <div class="card-foot">${foot}</div>
  </article>`;
}

function renderStrip(store: Store, view: NodeView): string {
  const run = store.run!;
  const parts: string[] = [];
  if (view.status) {
    parts.push(`<div class="status-panel" data-testid="status-panel" role="group" aria-label="Status">${view.status.map((s) => `<span class="lamp-op">${esc(s)}</span>`).join('')}</div>`);
  }
  // A decision just committed in this phase: its cards stay on screen, stamped and greyed, until the player continues.
  const committed = view.node.type === 'briefing' ? describeCommittedDecision(run) : null;
  if (committed) {
    parts.push(`<div class="cards committed" data-testid="committed-cards" role="group" aria-label="Your decision">${committed.options.map((o) => renderCard(store, o, 'decision', o.chosen ? 'chosen' : 'closed', false)).join('')}</div>`);
  }
  if (view.node.prompt) {
    parts.push(`<h2 class="prompt"><span class="glen">Glen Kurtz — FLIGHT</span>${esc(view.node.prompt)}</h2>`);
  }
  if (view.node.type === 'prep_choice' && view.attention) {
    parts.push(`<p class="hint">Opportunities remaining: ${view.attention.remaining} of ${view.attention.declared}. Reading reports and asking questions use no rehearsal opportunities.</p>`);
  }
  if (view.readout) {
    parts.push(`<div class="readout" data-testid="readout" role="group" aria-label="Rehearsal readout">${view.readout.map((r) => `<span class="${r.ready ? 'ready' : 'not-ready'}">${esc(r.label)}: ${esc(r.text)}</span>`).join('')}</div><p class="hint">Unrehearsed does not mean untrained or incapable. Both orders remain available.</p>`);
  }
  if (view.options) {
    // Details open by default at the return fork only — the one decision with a rehearsal readout.
    const detailsDefault = view.readout !== null;
    const state = (o: OptionView): CardState => (o.chosen ? 'chosen' : o.available ? 'rest' : 'unavailable');
    parts.push(`<div class="cards" role="group" aria-label="Options">${view.options.map((o) => renderCard(store, o, view.node.type, state(o), detailsDefault)).join('')}</div>`);
  }
  if (view.continue) {
    parts.push(`<div class="continue-row">${key({ family: 'key', action: `continue:${view.continue.id}`, focus: 'continue', testid: `continue-${view.continue.id}`, focusDefault: true, label: view.continue.label })}${store.ui.message ? `<span class="message" role="alert">${esc(store.ui.message)}</span>` : ''}</div>`);
  } else if (store.ui.message) {
    parts.push(`<p class="message" role="alert">${esc(store.ui.message)}</p>`);
  }
  return `<section class="strip" aria-label="Console" data-testid="strip">${parts.join('')}</section>`;
}

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------

function renderOverlay(store: Store): string {
  const o = store.ui.overlay;
  if (!o) return '';
  let title = '';
  let body = '';
  switch (o) {
    case 'binder': { title = 'Procedures binder'; body = renderBinder(store); break; }
    case 'history': { title = 'History panel'; body = renderHistory(store); break; }
    case 'saveload': { title = 'Save / Load'; body = renderSaveLoad(store); break; }
    case 'about': { title = 'About / Credits'; body = renderAbout(store); break; }
    case 'settings': { title = 'Settings'; body = renderSettings(store); break; }
  }
  return `
  <div class="overlay-backdrop" data-testid="overlay-${o}">
    <div class="overlay ${o === 'binder' ? 'paper-overlay' : ''}" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
      <div class="close-row">${key({ family: 'selector', action: 'close-overlay', focus: 'close-overlay', testid: 'close-overlay', label: 'CLOSE (ESC)' })}</div>
      <h2 id="overlay-title">${esc(title)}</h2>
      ${body}
    </div>
  </div>`;
}

function renderBinder(store: Store): string {
  const run = store.run;
  const procs = run ? run.state.ledger.procedures : [];
  const pages = procs.map((id) => {
    const p = store.content.procedures.get(id);
    if (!p) return '';
    return `<div class="page" data-testid="binder-${esc(id)}"><div class="status">${p.status === 'commissioned-task' ? 'Commissioned task — not a completed procedure' : 'Adopted procedure'}</div><div class="title">${esc(p.title)}</div><div>${esc(p.text)}</div></div>`;
  });
  const rules = run ? describeEvidence(store.content, run.state).filter((e) => e.kind === 'reference' && e.body !== null) : [];
  return `
    <h3>Adopted procedures and commissioned tasks</h3>
    ${pages.length ? pages.join('') : '<p class="muted">The binder is empty. Procedures are adopted at the end of the mission.</p>'}
    <h3>Reference pages</h3>
    ${rules.length ? rules.map((r) => `<div class="page"><div class="title">${esc(r.title)}</div><div>${esc(r.body ?? '')}</div></div>`).join('') : '<p class="muted">No references acquired yet.</p>'}`;
}

function renderHistory(store: Store): string {
  const reg = store.content.bundle.registry;
  const chars = store.content.bundle.characters;
  const labels = reg.labels;
  return `
    <p data-testid="alt-history-explanation">${esc(labels.alternate_history_explanation)}</p>
    <p class="muted" data-testid="lamp-explanation">The status bar shows ${esc(labels.historical_choice_badge ?? 'HISTORICAL CHOICE')} on a decision where one option matches the record, and ${esc(labels.alternate_history_badge)} once play has left it. Neither lamp is a recommendation.</p>
    <h3>Historical sources</h3>
    <ul class="plain">${reg.sources.map((s) => `<li><b>${esc(s.id)}</b> — <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>${s.author ? ` (${esc(s.author)})` : ''}. <span class="muted">${esc(s.note)}</span></li>`).join('')}</ul>
    <h3>Report, procedure, and departure references</h3><ul class="plain">${[...store.content.bundle.evidence, ...store.content.bundle.procedures, ...store.content.mission.debrief.filter((r) => r.provenance)].map((item) => `<li><b>${esc(item.id)}</b> ${esc(provenanceLine(item.provenance))}</li>`).join('')}</ul>
    <h3>Fiction register</h3>
    <ul class="plain">${reg.fiction.map((f) => `<li><b>${esc(f.id)} — ${esc(f.title)}.</b> ${esc(f.text)}</li>`).join('')}</ul>
    <h3>People in this scenario</h3>
    <ul class="plain">${chars.map((c) => `<li><b>${esc(c.display)}</b> — ${esc(c.portrayal)}</li>`).join('')}</ul>
    <h3>Mission anchors</h3>
    <ul class="plain">${store.content.mission.anchors.map((a) => `<li><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.label)}</a></li>`).join('')}</ul>`;
}

function renderSaveLoad(store: Store): string {
  const has = store.run !== null;
  return `
    <p class="muted">One browser slot plus JSON export/import. An import is verified (structure, versions, references, replay) before anything is replaced; a failed import leaves your current session and stored save untouched.</p>
    <div class="actions">
      ${key({ family: 'selector', action: 'save-browser', testid: 'save-browser', disabled: !has, label: 'SAVE TO THIS BROWSER' })}
      ${key({ family: 'selector', action: 'load-browser', testid: 'load-browser', disabled: !store.ui.hasBrowserSave, label: 'LOAD FROM THIS BROWSER' })}
      ${key({ family: 'selector', action: 'export', testid: 'export', disabled: !has, label: 'EXPORT JSON FILE' })}
      <label class="file">Import JSON file <input type="file" accept="application/json,.json" data-import-file data-focus="import-file" data-testid="import-file" /></label>
      ${key({ family: 'selector', action: 'new-campaign', testid: 'new-campaign', label: 'START A NEW CAMPAIGN' })}
    </div>
    ${store.ui.saveMessage ? `<p class="message" role="status" data-testid="save-message">${esc(store.ui.saveMessage)}</p>` : ''}`;
}

function renderSettings(store: Store): string {
  const a = store.ui.audio;
  const pct = (v: number) => Math.round(v * 100);
  const slider = (id: 'master' | 'music' | 'effects' | 'beds', label: string) =>
    `<label class="vol"><span>${esc(label)}</span><input type="range" min="0" max="100" step="5" value="${pct(a[id])}" data-volume="${id}" data-focus="volume-${id}" data-testid="volume-${id}" aria-label="${esc(label)}" /></label>`;
  return `
    <h3>Text</h3>
    <div class="actions">${key({ family: 'selector', action: 'text-size', testid: 'text-size', pressed: store.ui.textSize === 'large', label: `TEXT SIZE: ${store.ui.textSize === 'large' ? 'ENLARGED' : 'DEFAULT'}` })}${key({ family: 'selector', action: 'open:about', testid: 'settings-about', label: 'ABOUT / CREDITS' })}</div>
    <h3>Sound</h3>
    <p class="muted">Off until you turn it on. Music and room sound never carry information you need; nothing here changes the mission.</p>
    <div class="actions">${key({ family: 'selector', action: 'sound-toggle', testid: 'sound-toggle', pressed: a.enabled, label: `SOUND: ${a.enabled ? 'ON' : 'OFF'}` })}</div>
    <div class="sliders">${slider('master', 'Master volume')}${slider('music', 'Music')}${slider('effects', 'Effects')}${slider('beds', 'Room')}</div>
    ${MODERN_UI_AVAILABLE ? `<h3>Interface</h3><div class="actions">${key({ family: 'selector', action: 'ui-mode', testid: 'ui-mode', label: `INTERFACE: ${store.ui.uiMode.toUpperCase()}` })}</div>` : ''}
    ${store.ui.reducedMotion ? '<p class="muted">Reduced motion is on: the opening shows static chapters and cuts between scenes.</p>' : ''}`;
}

function renderAbout(store: Store): string {
  const reg = store.content.bundle.registry;
  const seen = new Set<string>();
  const ost = [...musicMap.cues.map((c) => c.asset), ...(musicMap.reserved ?? []).map((r) => r.asset)].filter((id) => (seen.has(id) ? false : (seen.add(id), true))).map((id) => assetEntry(id)).filter((e): e is NonNullable<typeof e> => !!e);
  const sfxIds = new Set<string>([...soundscapeMap.beds.map((b) => b.asset), ...soundscapeMap.one_shots.map((o) => o.asset)]);
  const sfx = [...sfxIds].map((id) => assetEntry(id)).filter((e): e is NonNullable<typeof e> => !!e);
  return `
    <div class="actions">${key({ family: 'selector', action: 'replay-opening', testid: 'replay-opening', label: 'REPLAY OPENING' })}</div>
    <div class="dedication">${reg.notices.dedication.map((d) => `<p>${esc(d)}</p>`).join('')}</div>
    <h3>Project disclaimer</h3><p>${esc(reg.notices.project_disclaimer)}</p>
    <h3>Generative AI disclosure</h3><p>${esc(reg.notices.ai_disclosure)}</p>
    <h3>Historical dramatization</h3><p>${esc(reg.notices.dramatization)}</p>
    <h3>Attribution</h3>
    <p>Dan Lee-Odinson directs and dispositions. Codex (GPT-6 Astra) designs, writes the content, and reviews. Claude (Anthropic) engineers the schema, core, application, and tests.</p>
    <h3>Sources</h3>
    <ul class="plain">${reg.sources.map((s) => `<li><b>${esc(s.id)}</b> — <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>${s.author ? ` (${esc(s.author)})` : ''}</li>`).join('')}</ul>
    <h3>Original soundtrack</h3>
    <p>Music: Dan Lee-Odinson, produced with Suno Pro, instrumental.</p>
    <ul class="plain" data-testid="ost-list">${ost.map((e) => `<li>${esc(e.credit ?? e.title ?? e.id)}</li>`).join('')}</ul>
    <h3>Soundscape</h3>
    <ul class="plain" data-testid="soundscape-credits">${sfx.map((e) => `<li>${esc(e.credit ?? e.title ?? e.id)}${e.source_url ? ` — <a href="${esc(e.source_url)}" target="_blank" rel="noopener">source</a>` : ''}</li>`).join('')}</ul>
    <h3>Typefaces</h3>
    <p>Barlow and Barlow Condensed (Barlow Project Authors, 2017) and Chakra Petch (Chakra Petch Project Authors, 2018), each under the SIL Open Font License 1.1; the unmodified fonts and their OFL.txt ship under public/fonts/.</p>
    <h3>Licences</h3>
    <p class="muted">Content package ${esc(store.content.mission.content_version)} · fingerprint <code>${esc(store.content.fingerprint)}</code>. No NASA insignia, worm, or seal appears in any generated asset. Licenses are proposed (MIT for code, CC BY 4.0 for content) pending confirmation before publication.</p>`;
}

// ---------------------------------------------------------------------------
// Debrief
// ---------------------------------------------------------------------------

function renderDebrief(store: Store): string {
  const run = store.run!;
  const d = describeDebrief(run);
  if (!d) return '<main class="screen-debrief"><p>The mission is not complete.</p></main>';
  const labels = store.content.bundle.registry.labels;
  const person = (p: { id: string; display: string; before: number; after: number; label: string; notes: string[] }) => `
    <div class="person" data-testid="person-${esc(p.id)}">
      <div class="name">${esc(p.display)}</div>
      <div class="trust">Trust ${p.before} → ${p.after} · ${esc(p.label)}</div>
      ${p.notes.length ? `<div class="notes">Notes: ${p.notes.map((n) => esc(n)).join(', ')}</div>` : ''}
    </div>`;
  const events = store.ui.debug ? d.events.map((e) => `<div>${esc(JSON.stringify(e))}</div>`).join('') : '';
  const alt = alternateHistoryActive(run);
  return `
  <main class="screen-debrief" data-testid="screen-debrief">
    <div class="screen-head">${lamps(store, false, alt)}<h1>Debrief — ${esc(store.content.mission.title)}</h1></div>
    <p class="outcome-title" data-testid="outcome-title">${esc(d.outcome.title)}</p>
    <div class="panel paper"><h2>Crew condition on pickup</h2><p data-testid="consequence-text">${esc(d.consequence?.text ?? '')}</p></div>
    <div class="panel paper"><h2>The room remembers</h2>
      ${d.relationship ? d.relationship.lines.map((l) => renderLine(store, l)).join('') : ''}
      <div class="people">${d.controllers.map(person).join('')}</div>
    </div>
    ${d.constraint ? `<div class="panel paper"><h2>Required practice for the next mission</h2><p data-testid="constraint-text">${esc(d.constraint.text)}</p></div>` : ''}
    <div class="panel paper" data-testid="postflight-panel"><h2>${esc(labels.postflight_header)}</h2>
      ${d.postflight.context ? `<div class="report"><div class="label">Post-flight findings and disagreement</div>${esc(d.postflight.context.body ?? '')}</div>` : ''}
      ${d.postflight.statement ? `<p><b>Glen's statement:</b> “${esc(d.postflight.statement)}”</p>` : ''}
      ${d.postflight.response ? `<p data-testid="response-text">${esc(d.postflight.response.text)}</p>` : ''}
      <div class="people">${d.postflight.astronauts.map(person).join('')}</div>
      ${d.postflight.status.map((s) => `<p data-testid="status-${esc(s.id)}"><b>${esc(s.title)}.</b> ${esc(s.text)}</p>`).join('')}
    </div>
    <div class="panel paper"><h2>Procedures binder</h2>${d.procedures.length ? d.procedures.map((p) => `<p data-testid="debrief-proc-${esc(p.id)}"><b>${esc(p.title)}</b> (${p.status === 'commissioned-task' ? 'commissioned task' : 'adopted procedure'}): ${esc(p.text)}</p>`).join('') : '<p class="muted">Empty.</p>'}</div>
    <div class="panel paper paragraphs" data-testid="debrief-paragraphs"><h2>What happened, and why</h2>${d.paragraphs.filter((p) => p.section !== 'departures').map((p) => `<p data-rule="${esc(p.id)}">${esc(p.text)}</p>`).join('')}</div>
    <section class="panel paper paragraphs" data-testid="departures-from-record"><h2>${esc(labels.departures_heading ?? 'Departures from the record')}</h2>${d.paragraphs.filter((p) => p.section === 'departures').map((p) => `<p data-rule="${esc(p.id)}">${esc(p.text)}</p>`).join('')}</section>
    ${store.ui.debug ? `<details class="panel"><summary data-focus="event-record" data-testid="event-record-toggle">Event record (${d.events.length} entries)</summary><div class="event-record" data-testid="event-record">${events}</div></details>` : ''}
    <div class="actions">
      ${key({ family: 'key', action: 'to-planning', testid: 'to-planning', focusDefault: true, label: 'CONTINUE TO GEMINI IX-A' })}
      ${key({ family: 'selector', action: 'open:saveload', testid: 'open-saveload', label: 'SAVE / LOAD' })}
      ${key({ family: 'selector', action: 'open:history', testid: 'open-history', label: 'HISTORY' })}
      ${key({ family: 'selector', action: 'open:settings', testid: 'open-settings', label: 'SETTINGS' })}
    </div>
  </main>`;
}

// ---------------------------------------------------------------------------
// Planning (Gemini IX-A)
// ---------------------------------------------------------------------------

function renderPlanning(store: Store): string {
  const run = store.run!;
  const fo = describeFollowOnForRun(run);
  if (!fo) return '<main class="screen-planning"><p>The Gemini VIII mission has not been finalized.</p></main>';
  const highlight = store.ui.highlightPlan;
  const highlighted = fo.plans.find((p) => p.id === highlight);
  const canConfirm = !!highlighted && highlighted.enabled && !fo.committed;
  const person = (p: { id: string; trust: number; label: string; notes: string[] }) => {
    const c = store.content.characters.get(p.id);
    return `<div class="person" data-testid="plan-person-${esc(p.id)}"><div class="name">${esc(c?.display ?? p.id)}</div><div class="trust">Trust ${p.trust} · ${esc(p.label)}</div></div>`;
  };
  const alt = alternateHistoryActive(run);
  const tileState = (p: { enabled: boolean; committed: boolean }): CardState => (p.committed ? 'chosen' : fo.committed ? 'closed' : p.enabled ? 'rest' : 'unavailable');
  return `
  <main class="screen-planning" data-testid="screen-planning">
    <div class="screen-head">${lamps(store, false, alt)}<h1>${esc(fo.display_title)}</h1></div>
    <p class="muted">Initialized from the committed Gemini VIII record: ${esc(fo.completion.title)}.</p>
    ${fo.constraint_text ? `<div class="constraint" data-testid="constraint">${esc(fo.constraint_text)}</div>` : ''}
    <div class="panel paper"><h2>Controller confidence</h2><div class="people">${fo.controllers.map(person).join('')}</div><p class="hint">Critical information is always available regardless of confidence.</p></div>
    <div class="panel paper"><h2>Astronaut relationships</h2><div class="people">${fo.astronauts.map(person).join('')}</div>
      ${fo.status_blocks.map((s) => `<p data-testid="status-${esc(s.id)}"><b>${esc(s.title)}.</b> ${esc(s.text)}${s.procedure ? ` <i>Task: ${esc(store.content.procedures.get(s.procedure)?.title ?? s.procedure)} — ${esc(store.content.procedures.get(s.procedure)?.text ?? '')}</i>` : ''}</p>`).join('')}
    </div>
    <div class="panel paper"><h2>Procedures binder reference</h2>${fo.procedures.length ? fo.procedures.map((id) => `<p><b>${esc(store.content.procedures.get(id)?.title ?? id)}</b>: ${esc(store.content.procedures.get(id)?.text ?? '')}</p>`).join('') : '<p class="muted">Empty.</p>'}<p class="hint">The required rehearsal determines which plans are available.</p></div>
    <h2 class="prompt">Choose the preparation plan. Each plan contains exactly two supplemental exercises.</h2>
    <div class="cards tiles" role="group" aria-label="Preparation plans">
      ${fo.plans.map((p) => {
        const state = tileState(p);
        return `
      <article class="card paper tile" data-state="${state}" data-testid="plan-${esc(p.id)}" data-enabled="${p.enabled}"${highlight === p.id ? ' data-highlight="true"' : ''}>
        <div class="field intent"><b>Plan</b>${esc(p.label)}</div>
        <div class="field"><b>Benefit</b>${esc(p.benefit)}</div>
        <div class="card-foot">
          ${state === 'rest' ? key({ family: 'choose', action: `highlight-plan:${p.id}`, focus: `plan:${p.id}`, testid: `select-${p.id}`, pressed: highlight === p.id, label: highlight === p.id ? 'Selected' : 'Select' }) : ''}
          ${state === 'chosen' ? `<span class="stamp" data-testid="stamp-${esc(p.id)}">CHOSEN</span>` : ''}
          ${state === 'unavailable' ? `${key({ family: 'choose', action: `highlight-plan:${p.id}`, focus: `plan:${p.id}`, testid: `select-${p.id}`, disabled: true, describedBy: `plan-reason-${p.id}`, label: 'Select' })}<div class="reason" id="plan-reason-${esc(p.id)}" data-testid="plan-reason-${esc(p.id)}">${esc(p.reason ?? '')}</div>` : ''}
        </div>
      </article>`;
      }).join('')}
    </div>
    <div class="continue-row">
      ${key({ family: 'action', action: 'confirm-plan', testid: 'confirm-plan', focusDefault: true, disabled: !canConfirm, label: 'COMMIT THIS PLAN' })}
      ${fo.committed ? `<span class="committed-text" data-testid="committed-text">${esc(fo.committed_text)}</span>` : '<span class="hint">Selecting a plan highlights it; only Commit records the plan.</span>'}
      ${store.ui.message ? `<span class="message" role="alert">${esc(store.ui.message)}</span>` : ''}
    </div>
    <div class="actions">
      ${key({ family: 'selector', action: 'to-debrief', testid: 'to-debrief', label: 'REVIEW THE DEBRIEF' })}
      ${key({ family: 'selector', action: 'open:saveload', testid: 'open-saveload', label: 'SAVE / LOAD' })}
      ${key({ family: 'selector', action: 'open:history', testid: 'open-history', label: 'HISTORY' })}
      ${key({ family: 'selector', action: 'open:settings', testid: 'open-settings', label: 'SETTINGS' })}
    </div>
  </main>`;
}
