# Archive and site — clearance notes

## Archive, exactly as delivered

The approved file supplies 13 source lines and its terms line; the pre-existing non-affiliation line follows. All fifteen registry entries are shown below.

1. Gemini VIII, Atlas-Agena lift-off, 16 March 1966 — NASA photograph S66-24482 (Johnson Space Center)
2. Apollo 11 crew walkout — Michael Collins NASA TV video file (NASA Headquarters)
3. Apollo 11 launch, 16 July 1969 — KSC-69-71212 (NASA)
4. Apollo 11 moonwalk — Apollo 11 moonwalk montage (NASA Headquarters)
5. Apollo–Soyuz, 1975 — The Mission of Apollo / Soyuz, National Archives and Records Administration, via Public.Resource.Org, CC0 1.0
6. Skylab — KSC-08-S-00032 (NASA Kennedy Space Center)
7. STS-1, 12 April 1981 — STS-1 Columbia 40th Anniversary (NASA Armstrong Flight Research Center)
8. The Challenger and Columbia crews — NASA Remembers Its Fallen Heroes 2023 (NASA Headquarters)
9. International Space Station — ISS@25: Operations (NASA Kennedy Space Center)
10. Atlantis, STS-135, 21 July 2011 — The Shuttle's Last Flight | An end. A new beginning (NASA Headquarters)
11. Crew Dragon Demo-2, 30 May 2020 — NASA Astronauts Launch from America in Historic Test Flight of SpaceX Crew Dragon (NASA Headquarters)
12. Artemis II, 1 April 2026 — Artemis II Live Launch Coverage (NASA Kennedy Space Center)
13. Earth — Earth Views from the International Space Station (NASA Headquarters)
14. NASA content is generally not subject to copyright and is used under NASA's media usage guidelines.
15. This project is not affiliated with, authorized, sponsored, or endorsed by NASA.

## Site blocks

| Block | Named items | Resolved sheet rows |
|---|---:|---:|
| `hero` | 20 | 20 |
| `about` | 14 | 14 |
| `demo` | 11 | 11 |
| `gallery` | 33 | 33 |
| `coming_soon` | 4 | 4 |
| `bio` | 13 | 13 |
| `notices` | 8 | 9 |
| `nasa_marks` | 4 | 4 |
| `open_source` | 3 | 3 |
| `footer` | 3 | 3 |

## Renderer contract

`registry.site.blocks` is ordered. Resolve items by `(block.id, item.id)`, not by their text or their array position. Render plain text; retain the v001 HTML as the layout reference. IDs are frozen for this clearance drop.

- `hero` includes page metadata, skip/header navigation, title, CTA and location/genre labels.
- `gallery` includes the image-link controls, captions, alternatives, viewer labels, dynamic viewer titles and the counter template.
- `bio` carries Dan’s photo alternative, caption, paragraphs and social links.
- `notices` references the existing three single-string notices plus the dedication array. Resolve the value from `registry.notices[notice_id]`; do not copy it into a second site text field.
- `nasa_marks` is Dan’s specifically requested extra disclosure; `open_source` retains the pending-license wording.
- `kind: template` contains `{current} / {total}`. Substitute the viewer’s 1-based current image and total image count; do not display the braces literally.
- `href` is the presentation link destination. The demo remains `./demo/`. Asset paths/layout stay with the established homepage presentation; this is a copy registry, not a replacement asset manifest.

The site section of the generated sheet shows all 114 resolved occurrences. Canonical notice rows identify the source notice after `->` in their owning path. The game’s existing text deduplication is unchanged; site repetitions and numeric labels retain separate clearance IDs.

Reference coverage includes every HTML text run and nonempty accessibility attribute, metadata descriptions, the proposed-copy blocks, and the three dynamic viewer titles/alternatives from site.js. The preliminary JSON had three concatenated figcaption boundaries; the actual HTML supplies their whitespace. No wording was removed.

No homepage renderer or film player was added to M02 by this packet. Those remain Claude Code’s deploy integration.
