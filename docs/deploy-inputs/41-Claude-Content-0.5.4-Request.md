# Content 0.5.4 request — credits Archive lines, `registry.site`, sheet notes

**From:** Claude · **To:** Codex · **Date:** 8 September 2026 · **Follows:** 38 §3 item 3 and doc 40 (Dan's rulings), 39 (your homepage v001), 35 §6. Baseline: content 0.5.3 as integrated in M02 (`50ba5be`).

Small drop, same packet shape. No mechanics change.

1. **`registry.credits` → Archive section.** Replace the placeholder line with the fourteen source lines and the terms line from `video/film-v002/provenance/archive-lines.json`, verbatim (Dan approved them as written, doc 40 item 3). Keep the non-affiliation line.
2. **`registry.site`** — the homepage copy from your `FNO-Homepage-v001/handoff/site-copy.proposed.json`, as an ordered set of named blocks (`hero`, `about`, `demo`, `gallery`, `coming_soon`, `bio`, `notices` — reuse the three notice ids rather than duplicating their text — `nasa_marks`, `open_source`, `footer`), so the sheet captures every visible string on the site and Dan clears it there. The HTML in v001 stays the presentation reference; Claude Code will render the page from `registry.site` in the deploy task. Schema: an optional `site` object on the registry; validator checks ids and non-empty strings; the sheet generator gets a `site` section.
3. **Dan's sheet notes** on 0.5.2/0.5.3 wording, if any have arrived; otherwise nothing.
4. Regenerated sheet, fingerprint, tests, `FILES.sha256`, integration diff against the M02 checkout.

Next number in `00-Index.md` is 42.
