/**
 * Renderer: (store) -> HTML string. Every interactive element is a real
 * <button>, <a>, <input>, or <summary>, reachable by keyboard in DOM order.
 * Actions are declared with data-action="name" or "name:arg".
 */
import { alternateHistoryActive, describeDebrief, describeEvidence, describeFollowOnForRun, describeNode, type EvidenceView, type LineView, type NodeView, type OptionView } from '../core';
import manifest from '../assets/manifest.json';
import type { Store } from './main';

const assetUrls = import.meta.glob('../assets/*.{png,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

function assetUrl(id: string | null): string | null {
  if (!id) return null;
  const entry = (manifest as { assets: { id: string; filename: string }[] }).assets.find((a) => a.id === id);
  if (!entry) return null;
  return assetUrls[`../assets/${entry.filename}`] ?? null;
}

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

function paras(text: string): string {
  return text.split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join('');
}

export function render(store: Store): string {
  const { ui } = store;
  let body: string;
  switch (ui.screen) {
    case 'notices': body = renderNotices(store); break;
    case 'console': body = renderConsole(store); break;
    case 'debrief': body = renderDebrief(store); break;
    case 'planning': body = renderPlanning(store); break;
  }
  return body + renderOverlay(store);
}

// ---------------------------------------------------------------------------
// Notices
// ---------------------------------------------------------------------------

function renderNotices(store: Store): string {
  const reg = store.content.bundle.registry;
  const m = store.content.mission;
  return `
  <main class="screen-notices" data-testid="screen-notices">
    <h1>Failure is Not an Option</h1>
    <div class="subtitle">${esc(m.title)} — ${esc(m.subtitle ?? '')}</div>
    <section class="notice dedication" aria-label="Dedication">
      ${reg.notices.dedication.map((d) => `<p>${esc(d)}</p>`).join('')}
    </section>
    <section class="notice start" aria-label="Scenario notice"><h2>This scenario</h2><p><b>${esc(m.start_notice)}</b></p></section>
    <section class="notice"><h2>Project disclaimer</h2><p>${esc(reg.notices.project_disclaimer)}</p></section>
    <section class="notice"><h2>Generative AI disclosure</h2><p>${esc(reg.notices.ai_disclosure)}</p></section>
    <section class="notice"><h2>Historical dramatization</h2><p>${esc(reg.notices.dramatization)}</p></section>
    <p class="hint">Content package ${esc(m.content_version)} · fingerprint <code>${esc(store.content.fingerprint.slice(0, 16))}…</code>. All dialogue is on screen; there is no voiced or timed content. Text size and overlays never change the simulation.</p>
    <div class="actions">
      <button class="primary" data-action="start-new" data-focus="start-new" data-focus-default data-testid="start-new">New campaign</button>
      <button data-action="start-load" data-focus="start-load" data-testid="start-load" ${store.ui.hasBrowserSave ? '' : 'disabled'}>Load browser save</button>
      <button data-action="open:saveload" data-focus="open:saveload">Import a save file</button>
      <button data-action="text-size" data-focus="text-size" data-testid="text-size">Text size: ${store.ui.textSize === 'large' ? 'enlarged' : 'default'}</button>
      <button data-action="open:about" data-focus="open:about">About</button>
    </div>
    ${store.ui.message ? `<p class="message" role="alert">${esc(store.ui.message)}</p>` : ''}
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
  const room = assetUrl('room-gemini-console');
  const emblem = assetUrl('emblem-flight-operations');
  return `
  <div class="console-shell" data-testid="screen-console" data-node="${esc(view.node.id)}" data-phase="${esc(view.phase.id)}">
    ${room ? `<img id="plate" class="plate" src="${room}" alt="" aria-hidden="true" data-testid="plate" />` : ''}
    ${emblem ? `<img id="emblem" class="emblem" src="${emblem}" alt="" aria-hidden="true" data-testid="emblem" />` : ''}
    ${renderStatusBar(store, view)}
    <div class="stage">
      ${renderConversation(store, view)}
    </div>
    ${renderEvidencePanel(store, evidence)}
    ${renderStrip(store, view)}
  </div>`;
}

function renderStatusBar(store: Store, view: NodeView): string {
  const m = store.content.mission;
  const labels = store.content.bundle.registry.labels;
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
    ${view.phase.alternate_history ? `<button class="badge alt" data-action="open:history" data-focus="badge-alt" data-testid="badge-alt-history" aria-label="${esc(labels.alternate_history_badge)} — open the history panel">${esc(labels.alternate_history_badge)}</button>` : ''}
    <span class="spacer"></span>
    ${historical ? `<button class="badge history-mode" data-action="open:history" data-focus="badge-historical" data-testid="badge-historical-choice">${esc(labels.historical_choice_badge ?? 'HISTORICAL CHOICE')}</button>` : ''}
    <button data-action="open:binder" data-focus="open:binder" data-testid="open-binder">Binder</button>
    <button data-action="open:history" data-focus="open:history" data-testid="open-history">History</button>
    <button data-action="open:saveload" data-focus="open:saveload" data-testid="open-saveload">Save / Load</button>
    <button data-action="open:about" data-focus="open:about">About</button>
    <button data-action="text-size" data-focus="text-size" data-testid="text-size" aria-pressed="${store.ui.textSize === 'large'}">Text size: ${store.ui.textSize === 'large' ? 'enlarged' : 'default'}</button>
  </header>`;
}

function renderLine(store: Store, l: LineView): string {
  const portrait = l.speaker ? assetUrl(l.speaker.portrait) : null;
  const who = l.speaker ? `<div class="who">${esc(l.speaker.display)}</div>` : '';
  const img = l.speaker
    ? portrait
      ? `<img class="portrait" src="${portrait}" alt="Portrait: ${esc(l.speaker.display)}" />`
      : `<div class="portrait empty" aria-hidden="true">text only</div>`
    : '';
  return `<div class="line ${l.speaker ? '' : 'no-speaker'}"${l.speaker ? '' : ' data-narration'}>${img}<div>${who}<div class="what">${esc(l.text)}</div></div></div>`;
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
  for (const l of view.lines) parts.push(renderLine(store, l));
  if (view.event_text) parts.push(`<div class="report" data-testid="event-text"><div class="label">${esc(view.node.header_label ?? 'Report')}</div>${esc(view.event_text)}</div>`);
  if (view.applied.length) {
    parts.push(`<div class="applied" data-testid="applied"><div class="label">Logged at this event</div><ul>${view.applied.map((a) => `<li>${esc(a.label)}</li>`).join('')}</ul></div>`);
  }
  if (view.questions.length) {
    parts.push(`<div class="questions" data-testid="questions">${view.questions.map((q) => `
      <button data-action="question:${esc(q.id)}" data-focus="question:${esc(q.id)}" data-testid="question-${esc(q.id)}" aria-expanded="${q.asked}">${esc(q.text)}</button>
      ${q.asked ? `<div class="answer">${renderLine(store, q.answer)}</div>` : ''}`).join('')}</div>`);
  }
  const active = activeSpeaker(view);
  const activeUrl = active ? assetUrl(active.portrait) : null;
  const portrait = active && activeUrl
    ? `<figure class="active-portrait" data-testid="active-portrait" data-speaker="${esc(active.id)}"><img src="${activeUrl}" alt="Portrait: ${esc(active.display)}" /><figcaption class="who">${esc(active.display)}</figcaption></figure>`
    : '';
  return `<section class="conversation" aria-label="Conversation" data-testid="conversation">
    <div class="conv-head">${head.join('')}</div>
    <div class="conv-body ${portrait ? 'with-portrait' : ''}">${portrait}<div class="conv-lines">${parts.join('')}</div></div>
  </section>`;
}

function renderEvidencePanel(store: Store, evidence: EvidenceView[]): string {
  const labels = store.content.bundle.registry.labels;
  const pinnedSet = new Set(store.ui.pinned);
  const ordered = [...evidence.filter((e) => pinnedSet.has(e.id)), ...evidence.filter((e) => !pinnedSet.has(e.id))];
  const items = ordered.map((e) => {
    const pinned = pinnedSet.has(e.id);
    const open = pinned || store.ui.open.includes(e.id);
    const badgeClass = e.badge === 'REFERENCE' ? 'ref' : e.badge === 'CURRENT CONTACT' ? 'cur' : 'prev';
    return `
    <article class="ev-item ${pinned ? 'pinned' : ''}" data-testid="evidence-${esc(e.id)}" data-badge="${esc(e.badge)}">
      <div class="ev-head">
        <button class="ev-title" data-action="toggle-open:${esc(e.id)}" data-focus="open-ev:${esc(e.id)}" aria-expanded="${open}" style="background:none;border:none;padding:0;text-align:left">${esc(e.title)}</button>
        <button class="pin" data-action="pin:${esc(e.id)}" data-focus="pinbtn:${esc(e.id)}" aria-pressed="${pinned}" data-testid="pin-${esc(e.id)}">${pinned ? 'Unpin report' : 'Pin report'}</button>
      </div>
      <div class="ev-meta">
        <span class="badge ${badgeClass}">${esc(e.badge)}</span>
        ${e.kind !== 'reference' ? `<span>Received: ${esc(e.stage)}</span>` : ''}
        ${e.observation ? `<span>Observation time: ${e.observation}</span>` : ''}
      </div>
      ${open ? (e.body !== null ? `<div class="ev-body" data-testid="evidence-body">${esc(e.body)}</div>` : `<div class="ev-body muted">Not visible at this point.</div>`) : ''}
    </article>`;
  });
  return `<aside class="evidence" aria-label="Evidence" data-testid="evidence-panel"><h2>Evidence · ${evidence.length}</h2><p class="hint">Pin to keep this report in view. Pinning changes nothing in the mission.</p>${items.length ? items.join('') : '<p class="empty">No evidence acquired yet.</p>'}</aside>`;
}

function renderOption(store: Store, o: OptionView, kind: 'prep' | 'decision'): string {
  const support = o.supported_by.length
    ? `<div class="support"><b>Supported by</b> ${o.supported_by.map((s) => `<span class="${s.ready ? 'ready' : 'not-ready'}">${esc(s.label)}: ${s.ready ? 'READY' : 'NOT REHEARSED'}</span>`).join(' · ')}</div>`
    : '';
  const cls = ['card', o.available ? '' : 'unavailable', o.chosen ? 'chosen' : ''].join(' ');
  const label = kind === 'prep' ? 'Rehearse' : 'Choose';
  return `
  <article class="${cls}" data-testid="card-${esc(o.id)}">
    ${o.subtitle ? `<div class="subtitle">${esc(o.subtitle)}</div>` : ''}
    <div class="field intent"><b>Intent</b>${esc(o.intent)}</div>
    ${o.statement ? `<div class="field statement"><b>Glen says</b>“${esc(o.statement)}”</div>` : ''}
    ${o.attraction ? `<div class="field"><b>Attraction</b>${esc(o.attraction)}</div>` : ''}
    <div class="field"><b>Cost</b>${esc(o.cost)}</div>
    <div class="field"><b>Uncertainty</b>${esc(o.uncertainty)}</div>
    ${support}
    <button class="select" data-action="option:${esc(o.id)}" data-focus="option:${esc(o.id)}" data-testid="option-${esc(o.id)}" ${o.available ? '' : 'disabled'} ${o.available ? '' : `aria-describedby="reason-${esc(o.id)}"`}>${o.chosen ? 'Completed' : label}</button>
    ${!o.available && o.reason ? `<div class="reason" id="reason-${esc(o.id)}" data-testid="reason-${esc(o.id)}">${esc(o.reason)}</div>` : ''}
  </article>`;
}

function renderStrip(store: Store, view: NodeView): string {
  const parts: string[] = [];
  if (view.status) {
    parts.push(`<div class="status-panel" data-testid="status-panel" role="group" aria-label="Status">${view.status.map((s) => `<span class="lamp">${esc(s)}</span>`).join('')}</div>`);
  }
  if (view.node.prompt) {
    parts.push(`<h2 class="prompt"><span class="glen">Glen Kurtz — FLIGHT</span>${esc(view.node.prompt)}</h2>`);
  }
  if (view.node.type === 'prep_choice' && view.attention) {
    parts.push(`<p class="hint">Opportunities remaining: ${view.attention.remaining} of ${view.attention.declared}. Reading reports and asking questions use no rehearsal opportunities.</p>`);
  }
  if (view.readout) {
    parts.push(`<div class="readout" data-testid="readout" role="group" aria-label="Preparation readout">${view.readout.map((r) => `<span class="${r.ready ? 'ready' : 'not-ready'}">${esc(r.label)}: ${esc(r.text)}</span>`).join('')}</div><p class="hint">Unrehearsed does not mean untrained or incapable. Both orders remain available.</p>`);
  }
  if (view.options) {
    parts.push(`<div class="cards">${view.options.map((o) => renderOption(store, o, view.node.type === 'prep_choice' ? 'prep' : 'decision')).join('')}</div>`);
  }
  if (view.continue) {
    parts.push(`<div class="continue-row" style="margin-top:0.8rem"><button class="primary" data-action="continue:${esc(view.continue.id)}" data-focus="continue" data-focus-default data-testid="continue-${esc(view.continue.id)}">${esc(view.continue.label)}</button>${store.ui.message ? `<span class="message" role="alert">${esc(store.ui.message)}</span>` : ''}</div>`);
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
    case 'about': { title = 'About'; body = renderAbout(store); break; }
  }
  return `
  <div class="overlay-backdrop" data-testid="overlay-${o}">
    <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
      <div class="close-row"><button data-action="close-overlay" data-focus="close-overlay" data-testid="close-overlay">Close (Esc)</button></div>
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
  return `
    <p data-testid="alt-history-explanation">${esc(reg.labels.alternate_history_explanation)}</p>
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
      <button data-action="save-browser" data-focus="save-browser" data-testid="save-browser" ${has ? '' : 'disabled'}>Save to this browser</button>
      <button data-action="load-browser" data-focus="load-browser" data-testid="load-browser" ${store.ui.hasBrowserSave ? '' : 'disabled'}>Load from this browser</button>
      <button data-action="export" data-focus="export" data-testid="export" ${has ? '' : 'disabled'}>Export JSON file</button>
      <label>Import JSON file <input type="file" accept="application/json,.json" data-import-file data-focus="import-file" data-testid="import-file" /></label>
      <button data-action="new-campaign" data-focus="new-campaign" data-testid="new-campaign">Start a new campaign</button>
    </div>
    ${store.ui.saveMessage ? `<p class="message" role="status" data-testid="save-message">${esc(store.ui.saveMessage)}</p>` : ''}`;
}

function renderAbout(store: Store): string {
  const reg = store.content.bundle.registry;
  return `
    <div class="dedication">${reg.notices.dedication.map((d) => `<p>${esc(d)}</p>`).join('')}</div>
    <h3>Project disclaimer</h3><p>${esc(reg.notices.project_disclaimer)}</p>
    <h3>Generative AI disclosure</h3><p>${esc(reg.notices.ai_disclosure)}</p>
    <h3>Historical dramatization</h3><p>${esc(reg.notices.dramatization)}</p>
    <h3>Attribution</h3>
    <p>Dan Lee-Odinson directs and dispositions. Codex (GPT-6 Astra) designs, writes the content, and reviews. Claude (Anthropic) engineers the schema, core, application, and tests.</p>
    <p class="muted">Content package ${esc(store.content.mission.content_version)} · fingerprint <code>${esc(store.content.fingerprint)}</code>. Placeholder images are labeled flat rectangles; no NASA insignia, worm, or seal appears in any generated asset. Licenses are proposed (MIT for code, CC BY 4.0 for content) pending confirmation before publication.</p>`;
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
  const events = d.events.map((e) => `<div>${esc(JSON.stringify(e))}</div>`).join('');
  return `
  <main class="screen-debrief" data-testid="screen-debrief">
    ${alternateHistoryActive(run) ? `<span class="badge alt" data-testid="badge-alt-history">${esc(labels.alternate_history_badge)}</span>` : ''}
    <h1>Debrief — ${esc(store.content.mission.title)}</h1>
    <p class="outcome-title" data-testid="outcome-title">${esc(d.outcome.title)}</p>
    <div class="panel fiction"><h2>Crew condition on pickup</h2><p data-testid="consequence-text">${esc(d.consequence?.text ?? '')}</p></div>
    <div class="panel"><h2>The room remembers</h2>
      ${d.relationship ? d.relationship.lines.map((l) => renderLine(store, l)).join('') : ''}
      <div class="people" style="margin-top:0.6rem">${d.controllers.map(person).join('')}</div>
    </div>
    ${d.constraint ? `<div class="panel"><h2>Required practice for the next mission</h2><p data-testid="constraint-text">${esc(d.constraint.text)}</p></div>` : ''}
    <div class="panel fiction" data-testid="postflight-panel"><h2>${esc(labels.postflight_header)}</h2>
      ${d.postflight.context ? `<div class="report"><div class="label">Post-flight findings and disagreement</div>${esc(d.postflight.context.body ?? '')}</div>` : ''}
      ${d.postflight.statement ? `<p><b>Glen's statement:</b> “${esc(d.postflight.statement)}”</p>` : ''}
      ${d.postflight.response ? `<p data-testid="response-text">${esc(d.postflight.response.text)}</p>` : ''}
      <div class="people">${d.postflight.astronauts.map(person).join('')}</div>
      ${d.postflight.status.map((s) => `<p data-testid="status-${esc(s.id)}"><b>${esc(s.title)}.</b> ${esc(s.text)}</p>`).join('')}
    </div>
    <div class="panel"><h2>Procedures binder</h2>${d.procedures.length ? d.procedures.map((p) => `<p data-testid="debrief-proc-${esc(p.id)}"><b>${esc(p.title)}</b> (${p.status === 'commissioned-task' ? 'commissioned task' : 'adopted procedure'}): ${esc(p.text)}</p>`).join('') : '<p class="muted">Empty.</p>'}</div>
    <div class="panel paragraphs" data-testid="debrief-paragraphs"><h2>What happened, and why</h2>${d.paragraphs.filter((p) => p.section !== 'departures').map((p) => `<p data-rule="${esc(p.id)}">${esc(p.text)}</p>`).join('')}</div>
    <section class="panel" data-testid="departures-from-record"><h2>${esc(labels.departures_heading ?? 'Departures from the record')}</h2>${d.paragraphs.filter((p) => p.section === 'departures').map((p) => `<p data-rule="${esc(p.id)}">${esc(p.text)}</p>`).join('')}</section>
    <details class="panel"><summary data-focus="event-record" data-testid="event-record-toggle">Event record (${d.events.length} entries)</summary><div class="event-record" data-testid="event-record">${events}</div></details>
    <div class="actions">
      <button class="primary" data-action="to-planning" data-focus="to-planning" data-focus-default data-testid="to-planning">Continue to Gemini IX-A</button>
      <button data-action="open:saveload" data-focus="open:saveload" data-testid="open-saveload">Save / Load</button>
      <button data-action="open:history" data-focus="open:history">History</button>
      <button data-action="text-size" data-focus="text-size" data-testid="text-size">Text size: ${store.ui.textSize === 'large' ? 'enlarged' : 'default'}</button>
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
  const labels = store.content.bundle.registry.labels;
  const highlight = store.ui.highlightPlan;
  const highlighted = fo.plans.find((p) => p.id === highlight);
  const canConfirm = !!highlighted && highlighted.enabled && !fo.committed;
  const person = (p: { id: string; trust: number; label: string; notes: string[] }) => {
    const c = store.content.characters.get(p.id);
    return `<div class="person" data-testid="plan-person-${esc(p.id)}"><div class="name">${esc(c?.display ?? p.id)}</div><div class="trust">Trust ${p.trust} · ${esc(p.label)}</div></div>`;
  };
  return `
  <main class="screen-planning" data-testid="screen-planning">
    ${alternateHistoryActive(run) ? `<span class="badge alt" data-testid="badge-alt-history">${esc(labels.alternate_history_badge)}</span>` : ''}
    <h1>${esc(fo.display_title)}</h1>
    <p class="muted">Initialized from the committed Gemini VIII record: ${esc(fo.completion.title)}.</p>
    ${fo.constraint_text ? `<div class="constraint" data-testid="constraint">${esc(fo.constraint_text)}</div>` : ''}
    <div class="panel"><h2>Controller confidence</h2><div class="people">${fo.controllers.map(person).join('')}</div><p class="hint">Critical information is always available regardless of confidence.</p></div>
    <div class="panel fiction"><h2>Astronaut relationships</h2><div class="people">${fo.astronauts.map(person).join('')}</div>
      ${fo.status_blocks.map((s) => `<p data-testid="status-${esc(s.id)}"><b>${esc(s.title)}.</b> ${esc(s.text)}${s.procedure ? ` <i>Task: ${esc(store.content.procedures.get(s.procedure)?.title ?? s.procedure)} — ${esc(store.content.procedures.get(s.procedure)?.text ?? '')}</i>` : ''}</p>`).join('')}
    </div>
    <div class="panel"><h2>Procedures binder reference</h2>${fo.procedures.length ? fo.procedures.map((id) => `<p><b>${esc(store.content.procedures.get(id)?.title ?? id)}</b>: ${esc(store.content.procedures.get(id)?.text ?? '')}</p>`).join('') : '<p class="muted">Empty.</p>'}<p class="hint">The required rehearsal determines which plans are available.</p></div>
    <h2 class="prompt">Choose the preparation plan. Each plan contains exactly two supplemental exercises.</h2>
    <div class="tiles" role="group" aria-label="Preparation plans">
      ${fo.plans.map((p) => `
      <div class="tile ${p.enabled ? '' : 'disabled'} ${highlight === p.id ? 'highlight' : ''} ${p.committed ? 'committed' : ''}" data-testid="plan-${esc(p.id)}" data-enabled="${p.enabled}">
        <div class="label">${esc(p.label)}</div>
        <div>${esc(p.benefit)}</div>
        ${p.committed ? '<div class="committed-text">Committed</div>' : ''}
        <button data-action="highlight-plan:${esc(p.id)}" data-focus="plan:${esc(p.id)}" data-testid="select-${esc(p.id)}" aria-pressed="${highlight === p.id}" ${p.enabled && !fo.committed ? '' : 'disabled'} ${!p.enabled ? `aria-describedby="plan-reason-${esc(p.id)}"` : ''}>${highlight === p.id ? 'Selected' : 'Select'}</button>
        ${!p.enabled ? `<div class="reason" id="plan-reason-${esc(p.id)}" data-testid="plan-reason-${esc(p.id)}">${esc(p.reason ?? '')}</div>` : ''}
      </div>`).join('')}
    </div>
    <div class="continue-row">
      <button class="primary" data-action="confirm-plan" data-focus="confirm-plan" data-focus-default data-testid="confirm-plan" ${canConfirm ? '' : 'disabled'}>Commit this plan</button>
      ${fo.committed ? `<span class="committed-text" data-testid="committed-text">${esc(fo.committed_text)}</span>` : '<span class="hint">Selecting a tile highlights it; only Commit records the plan.</span>'}
      ${store.ui.message ? `<span class="message" role="alert">${esc(store.ui.message)}</span>` : ''}
    </div>
    <div class="actions">
      <button data-action="to-debrief" data-focus="to-debrief" data-testid="to-debrief">Review the debrief</button>
      <button data-action="open:saveload" data-focus="open:saveload" data-testid="open-saveload">Save / Load</button>
      <button data-action="open:history" data-focus="open:history">History</button>
      <button data-action="text-size" data-focus="text-size" data-testid="text-size">Text size: ${store.ui.textSize === 'large' ? 'enlarged' : 'default'}</button>
    </div>
  </main>`;
}
