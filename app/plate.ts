/**
 * Room plate geometry and the emblem overlay.
 *
 * The plate is a fixed, full-viewport <img> with `object-fit: cover`,
 * centered. The emblem is a separate non-interactive <img> layer placed on
 * Glen's upper vest back at the plate's native coordinates given in Codex's
 * FNO-M00a art handoff, scaled and offset with the plate's rendered
 * rectangle — never positioned against the viewport or a UI panel.
 */

/** Native plate size from the manifest contract (room-gemini-console). */
export const PLATE_NATIVE = { width: 1920, height: 1080 } as const;

/** Emblem rectangle at native plate size, from docs/codex-art-1.0.0/00_CODEX_HANDOFF.md. */
export const EMBLEM_AT_NATIVE = { x: 180, y: 628, width: 30, height: 40 } as const;

/** Glen's head region at native plate size (the region no opaque panel may cover), from the M00a directive. */
export const GLEN_HEAD_REGION = { x0: 0.05, y0: 0.3, x1: 0.25, y1: 0.6 } as const;

export interface RenderedPlate {
  scale: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Where the plate's pixels land inside a box of `boxWidth × boxHeight` under object-fit: cover, centered. */
export function coverRect(boxWidth: number, boxHeight: number, boxLeft = 0, boxTop = 0): RenderedPlate {
  const scale = Math.max(boxWidth / PLATE_NATIVE.width, boxHeight / PLATE_NATIVE.height);
  const width = PLATE_NATIVE.width * scale;
  const height = PLATE_NATIVE.height * scale;
  return { scale, width, height, left: boxLeft + (boxWidth - width) / 2, top: boxTop + (boxHeight - height) / 2 };
}

export function emblemRect(plate: RenderedPlate): { left: number; top: number; width: number; height: number } {
  return {
    left: plate.left + EMBLEM_AT_NATIVE.x * plate.scale,
    top: plate.top + EMBLEM_AT_NATIVE.y * plate.scale,
    width: EMBLEM_AT_NATIVE.width * plate.scale,
    height: EMBLEM_AT_NATIVE.height * plate.scale,
  };
}

/** Position the emblem element from the plate element's current box. Safe to call when neither exists. */
export function layoutEmblem(): void {
  const plate = document.getElementById('plate');
  const emblem = document.getElementById('emblem');
  if (!plate || !emblem) return;
  const box = plate.getBoundingClientRect();
  const r = emblemRect(coverRect(box.width, box.height, box.left, box.top));
  emblem.style.left = `${r.left}px`;
  emblem.style.top = `${r.top}px`;
  emblem.style.width = `${r.width}px`;
  emblem.style.height = `${r.height}px`;
}
