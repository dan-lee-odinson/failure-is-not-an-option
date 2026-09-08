import type { ContentBundle, MovingElement } from '../../core/types';
interface Asset { id: string; width?: number; height?: number; alpha?: boolean }
export function validatePresentation(bundle: ContentBundle, assets: Asset[]): string[] {
  const errors: string[] = [];
  const map = new Map(assets.map(a => [a.id, a]));
  const people = new Map(bundle.characters.map(c => [c.id, c]));
  const sources = new Set(bundle.registry.sources.map(s => s.id));
  const image = (id: string, w: number, h: number, alpha: boolean, where: string) => {
    const a = map.get(id);
    if (!a) errors.push(where + ': unknown presentation asset ' + id);
    else if (a.width !== w || a.height !== h || a.alpha !== alpha) errors.push(where + ': asset ' + id + ' must be ' + w + 'x' + h + ' alpha=' + alpha);
  };
  const cite = (ids: string[], where: string) => { for (const id of ids) if (!sources.has(id)) errors.push(where + ': unknown presentation source ' + id); };
  const motion = (m: MovingElement, where: string) => {
    image(m.asset, 1920, 1080, true, where);
    const dx = m.motion.to.x - m.motion.from.x, dy = m.motion.to.y - m.motion.from.y;
    const valid = m.motion.direction === 'left' ? dx < 0 && dy === 0 : m.motion.direction === 'right' ? dx > 0 && dy === 0 : m.motion.direction === 'up' ? dy < 0 && dx === 0 : dy > 0 && dx === 0;
    if (!valid) errors.push(where + ': motion direction disagrees with coordinates');
  };
  for (const c of bundle.characters) if (c.portraits) {
    image(c.portraits.neutral, 768, 1024, true, c.id);
    image(c.portraits.concerned, 768, 1024, true, c.id);
    if (c.portraits.neutral === c.portraits.concerned) errors.push(c.id + ': expressions must use distinct assets');
  }
  for (const node of bundle.mission.phases.flatMap(p => p.nodes)) {
    if (node.type !== 'briefing' && node.type !== 'decision') continue;
    const seen = new Set<string>();
    for (const participant of node.participants ?? []) {
      if (seen.has(participant.id)) errors.push(node.id + ': duplicate participant ' + participant.id);
      seen.add(participant.id);
      if (!people.get(participant.id)?.portraits) errors.push(node.id + ': participant has no expression pair ' + participant.id);
    }
    if (bundle.mission.prologue && node.type === 'decision' && !node.hint?.trim()) errors.push(node.id + ': presentation decision hint missing');
  }
  const prologue = bundle.mission.prologue;
  if (prologue) {
    const seen = new Set<string>();
    for (const plate of [...prologue.plates, prologue.scenario_card]) {
      if (seen.has(plate.id)) errors.push('prologue: duplicate plate id ' + plate.id);
      seen.add(plate.id);
      image(plate.background, 1920, 1080, false, plate.id);
      motion(plate.moving_element, plate.id);
      cite(plate.sources, plate.id);
    }
    cite(prologue.history_sources, 'prologue history');
  }
  const labels = bundle.mission.resolution_presentation;
  if (labels) {
    const tiers = new Set(labels.tiers.map(t => t.id));
    for (const o of bundle.mission.outcomes) {
      if (!o.tier || !tiers.has(o.tier) || !o.result_line?.trim() || !o.plate) errors.push(o.id + ': incomplete resolution presentation');
      if (o.plate) image(o.plate, 1920, 1080, false, o.id);
      if (o.kind === 'abort-safe' && (o.tier === 'FAILURE' || o.tier === 'LOSS')) errors.push(o.id + ': safe recovery must not be labeled FAILURE or LOSS');
    }
    for (const id of [...bundle.mission.debrief_layout.controllers, ...bundle.mission.debrief_layout.astronauts]) if (!people.get(id)?.portraits) errors.push(id + ': resolution participant has no expression pair');
  }
  const den = bundle.registry.opening_den;
  if (den) {
    image(den.background, 1920, 1080, false, 'opening den');
    motion(den.smoke, 'opening smoke');
    image(den.beam.asset, 1920, 1080, true, 'opening beam');
    const r = den.projection_rect;
    if (r.x < 0 || r.y < 0 || r.x + r.width > 1920 || r.y + r.height > 1080 || r.width * 9 !== r.height * 16) errors.push('opening den: projection rectangle must fit the frame at 16:9');
    if (den.smoke_loop.crossfade_seconds >= den.smoke_loop.seconds || den.smoke_loop.seconds !== den.smoke.motion.seconds) errors.push('opening den: invalid smoke loop timing');
  }
  return errors;
}
