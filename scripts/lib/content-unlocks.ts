/** Content 0.5.5 unlock reference validation. Presentation metadata, no state changes. */
import type { ContentBundle, Line } from '../../core/types';
import { indexContent } from '../../core/content';

export function validateUnlocks(bundle: ContentBundle): string[] {
  const errors: string[] = [];
  const index = indexContent(bundle);
  const ids = new Set<string>();
  const visit = (line: Line): void => {
    if (!line.id) return;
    if (ids.has(line.id)) errors.push(`unlock: duplicate line id ${line.id}`);
    ids.add(line.id);
  };
  for (const { node } of index.nodes.values()) {
    if (node.type === 'event') for (const r of node.resolutions) for (const l of r.lines ?? []) visit(l);
    else if (node.type === 'briefing' || node.type === 'decision') {
      for (const l of node.lines ?? []) visit(l);
      for (const q of node.questions ?? []) visit(q.answer);
    }
  }
  for (const item of [...bundle.evidence, ...bundle.procedures]) {
    const u = item.unlocked_by;
    if (!u) { errors.push(`${item.id}: missing unlocked_by`); continue; }
    if ('node' in u && !index.nodes.has(u.node)) errors.push(`${item.id}: unknown unlock node ${u.node}`);
    if ('line' in u && !ids.has(u.line)) errors.push(`${item.id}: unknown unlock line ${u.line}`);
    if ('preparation' in u && index.options.get(u.preparation)?.node.type !== 'prep_choice') errors.push(`${item.id}: unlock preparation ${u.preparation} is not a preparation choice`);
  }
  return errors;
}
