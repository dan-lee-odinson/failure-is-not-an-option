import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Registry } from '../../core/types';
import { CONTENT_FILES, loadBundle, readJson } from '../../scripts/lib/load-content';
import { validateContent } from '../../scripts/lib/validator';
import { buildSheet, extractRuns, norm } from '../../scripts/lib/dialogue-sheet';

const ROOT = resolve(__dirname, '../..');
const FIX = resolve(ROOT, 'tests/fixtures/content-054');
const read = (name: string) => readFileSync(resolve(FIX, name), 'utf8');
function check(mutate: (r: Registry) => void) {
  const bundle = loadBundle(ROOT);
  mutate(bundle.registry);
  const raw = Object.fromEntries(Object.entries(CONTENT_FILES).map(([k, f]) => [k, readJson(ROOT, f)])) as unknown as Parameters<typeof validateContent>[0]['raw'];
  raw.registry = bundle.registry;
  return validateContent({ root: ROOT, schemaDir: resolve(ROOT, 'schema'), assetsDir: resolve(ROOT, 'assets'), skipFiles: true,
    raw, manifest: readJson(ROOT, 'assets/manifest.json'), bundle: () => bundle }).errors;
}
const textItems = (r: Registry) => r.site!.blocks.flatMap(b => b.items.flatMap(i => {
  const value = i.notice_id === undefined ? i.text : r.notices[i.notice_id];
  return Array.isArray(value) ? value : [value];
}));

describe('content 0.5.4 Archive and homepage contract', () => {
  it('copies the approved file verbatim, in order, and retains the existing non-affiliation line', () => {
    const a = JSON.parse(read('archive-lines.json')) as { lines: string[]; terms_line: string };
    const r = loadBundle(ROOT).registry;
    const lines = r.credits!.find(s => s.heading === 'Archive')!.lines;
    expect(a.lines).toHaveLength(13); // The approved file has 13 sources + 1 terms line, not 14 sources.
    expect(lines.slice(0, -1)).toEqual([...a.lines, a.terms_line]);
    expect(lines.at(-1)).toBe('This project is not affiliated with, authorized, sponsored, or endorsed by NASA.');
  });
  it('accepts the complete named block set and still accepts a registry without optional site', () => {
    expect(check(() => {})).toEqual([]);
    expect(check(r => { delete r.site; })).toEqual([]);
  });
  it('rejects duplicate/reordered blocks and duplicate item ids', () => {
    expect(check(r => { r.site!.blocks[1]!.id = 'hero'; }).join('\n')).toContain('ten named ids');
    expect(check(r => { r.site!.blocks.reverse(); }).join('\n')).toContain('display order');
    expect(check(r => { const items=r.site!.blocks[0]!.items; items[1]!.id=items[0]!.id; }).join('\n')).toContain('duplicate');
  });
  it('rejects blank strings, invalid ids, unsafe link schemes and malformed notice references', () => {
    for (const value of ['', '   ', '\n\t']) expect(check(r => { r.site!.blocks[0]!.items[0]!.text=value; }).length).toBeGreaterThan(0);
    expect(check(r => { r.site!.blocks[0]!.items[0]!.id='bad id'; }).length).toBeGreaterThan(0);
    expect(check(r => { r.site!.blocks[0]!.items[0]!.href='javascript:alert(1)'; }).length).toBeGreaterThan(0);
    expect(check(r => { r.site!.blocks[0]!.items[0]={id:'bad',kind:'notice',notice_id:'not-a-notice'} as never; }).length).toBeGreaterThan(0);
    expect(check(r => { r.site!.blocks[0]!.items[0]={id:'bad',kind:'notice',notice_id:'ai_disclosure',text:'duplicate'} as never; }).length).toBeGreaterThan(0);
    expect(check(r => { r.site!.blocks[0]!.items[0]={id:'bad',kind:'notice',text:'not a reference'}; }).join('\n')).toContain('canonical notice');
  });
  it('references canonical notices and covers every HTML text run, accessibility label and proposed-copy block', () => {
    const r=loadBundle(ROOT).registry;
    const items=r.site!.blocks.flatMap(b=>b.items);
    for (const notice of ['project_disclaimer','ai_disclosure','dramatization'] as const) {
      expect(items.filter(i=>i.notice_id===notice)).toHaveLength(1);
      expect(items.some(i=>i.text===r.notices[notice])).toBe(false);
    }
    const values=textItems(r).map(norm);
    // The game extractor treats anchors as inline; separate adjacent navigation controls for this HTML fixture.
    const html=read('homepage.html').replace(/<!doctype[^>]*>/i,'').replace(/(<\/a>)\s*(<a\b)/g,'$1<hr>$2');
    const missing=extractRuns(html).map(x=>norm(x.text)).filter(t=>!values.some(v=>v.includes(t)));
    expect(missing).toEqual([]);
    const proposed=JSON.parse(read('site-copy.proposed.json')) as {site:{blocks:{text:string}[]}};
    // The preliminary extractor glued three figcaption heading/paragraph boundaries; the HTML supplies their spacing.
    const compact=(s:string)=>s.replace(/\s/g,'');
    expect(proposed.site.blocks.map(b=>b.text).filter(t=>!compact(values.join(' ')).includes(compact(t)))).toEqual([]);
    const js=read('homepage.js');
    const modal=[...js.matchAll(/title:'([^']*)', alt:'([^']*)'/g)].flatMap(m=>[m[1]!,m[2]!]);
    expect(modal.filter(t=>!values.includes(norm(t)))).toEqual([]);
    expect(values).toContain('{current} / {total}');
  });
  it('puts every site occurrence and resolved notice on the review sheet without numeric deduplication', {timeout:20000}, () => {
    const r=loadBundle(ROOT).registry;
    const rows=buildSheet(ROOT).rows.filter(row=>row.phase==='site');
    expect(rows.map(row=>row.text)).toEqual(textItems(r));
    expect(new Set(rows.map(row=>row.id)).size).toBe(rows.length);
    expect([...new Set(rows.map(row=>row.node))]).toEqual(r.site!.blocks.map(b=>'site-'+b.id));
    expect(rows.filter(row=>row.branch)).toEqual([]);
    expect(rows.filter(row=>row.id.includes('-> registry.notices.'))).toHaveLength(5);
  });
});
