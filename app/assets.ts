/**
 * The one place presentation resolves an asset id to a URL. Every image and
 * every sound the app shows or plays is a manifest entry:
 *   - images (`kind` room / portrait / emblem / layer / image) live under
 *     assets/ and are bundled by Vite (hashed URLs, never inlined);
 *   - audio (`kind: audio`) lives under public/audio/ and is served as a
 *     plain file so the tracks stay byte-identical to Dan's originals.
 */
import manifest from '../assets/manifest.json';

export interface ManifestAsset {
  id: string;
  filename: string;
  kind?: string;
  format?: string;
  width?: number;
  height?: number;
  alpha?: boolean;
  status: string;
  attribution: string;
  origin: string;
  title?: string;
  credit?: string;
  rights?: string;
  license?: string;
  source_url?: string;
  duration_s?: number;
}

export const MANIFEST = manifest as { content_version: string; assets: ManifestAsset[] };

const imageUrls = import.meta.glob('../assets/*.{png,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export function assetEntry(id: string | null): ManifestAsset | null {
  if (!id) return null;
  return MANIFEST.assets.find((a) => a.id === id) ?? null;
}

/** URL of a manifest image, or null when the id is unknown or not an image. */
export function assetUrl(id: string | null): string | null {
  const entry = assetEntry(id);
  if (!entry || entry.kind === 'audio') return null;
  return imageUrls[`../assets/${entry.filename}`] ?? null;
}

/** URL of a manifest audio file under public/audio/. The file may be absent at runtime (missing sound → silence). */
export function audioUrl(id: string | null): string | null {
  const entry = assetEntry(id);
  if (!entry || entry.kind !== 'audio') return null;
  const base = (import.meta.env?.BASE_URL as string | undefined) ?? './';
  return `${base.endsWith('/') ? base : base + '/'}audio/${entry.filename.split('/').map(encodeURIComponent).join('/')}`;
}

export function audioAssets(): ManifestAsset[] {
  return MANIFEST.assets.filter((a) => a.kind === 'audio');
}
