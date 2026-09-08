# Claude handoff — homepage v001

Dan requested a portable HTML homepage and assets for finaogame.com, with the playable scenario at `/demo/`. This implements the site shape in 35 §6. It is a complete static homepage; deployment and final demo packaging remain with Claude.

## Integration

1. Review `site/index.html` with Dan. Copy the finished homepage files from `site/` to the public root of the combined deployment. Keep `site-assets/` as its own namespace so it cannot collide with the game's hashed assets. CSS and JS names are local to the homepage; do not include the game's stylesheet on this entry.
2. Put the final game build at `/demo/`, preserve its asset tree, and ensure all game asset, audio, manifest and font URLs work from that path. The current build uses Vite `base: './'`, and the existing dist entry serves successfully under the local preview's `/demo/` mount. This is not a substitute for testing the final integrated build.
3. If retaining 35's Vite multi-page architecture, make root `index.html` the marketing entry and `demo/index.html` the game entry. Adjust source imports for the moved game entry. Copy static homepage assets to `public/site-assets/`; arrange for `styles.css` and `site.js` to be served at the paths referenced by the marketing HTML. Do not assume Vite copies unreferenced full-size images or ordinary non-module scripts: explicitly include this static asset tree. The homepage has no npm dependencies or bundler requirement.
4. Keep all launch links pointed to `./demo/`. The trailing slash matters for relative game URLs. Add the planned Demo label and Home link in the game's own UI. Give `/demo/` its own canonical metadata; the supplied homepage canonical belongs to the root only.
5. Move approved strings into `registry.site` as contemplated in 35 §6, extend schema and dialogue-sheet handling, and bump content to 0.5.4 when that integrated drop is ready. `site-copy.proposed.json` contains extracted visible blocks and exact notices to help; it is not a drop-in schema contract. Do not change the 0.5.3 baseline merely by copying this file. The HTML is the authoritative v001 presentation/copy artifact.
6. Deploy only the combined public output, not this entire packet. `CNAME` contains `finaogame.com`; placing it in this packet does not configure DNS, verify a domain or publish a site. Existing release prerequisites recorded in 35 remain for the release owner. No new approval gate is introduced here.

## Content decisions

- Kept Dan's established **Glen Kurtz** spelling; the new message's “Glenn Krutz” was treated as a typo.
- Dan's bio is personal testimony supplied by him; the STS-26 and Artemis II memories were preserved. The photo is copied byte-for-byte with a visible KSC caption.
- The demo pitch describes the playable return-planning and accountability sequence. It does not promise controllable thrusters, piloting, lethal outcomes, a currently playable multi-era campaign or a release date.
- “Full game — Coming soon” intentionally names no next mission.
- `project_disclaimer`, `ai_disclosure` and `dramatization` match the live 0.5.3 registry verbatim. Dedication text is also the established in-game wording.
- Both project license files begin “PROPOSED LICENSE - NOT YET IN FORCE.” The website therefore says an open-source release is being prepared and the proposed licenses are not yet in force. Replace that paragraph once Dan's confirmation is recorded; no licensing permission is inferred from preparing a homepage. The provided GitHub profile remains a valid public-facing destination even if the repository stays private.
- No NASA insignia is introduced as site branding. The original emblem is used unchanged. Dan's real-world photograph is displayed unchanged.
- Dan's follow-up adds a separate **NASA marks & generated artwork** disclosure beside the independent-project notice. It explicitly repeats non-sponsorship and describes the intent to respectfully follow NASA's published restrictions on insignia, logotypes and seals appearing with AI-generated imagery. It identifies the fictional emblem and explains the context of marks in authentic photos/footage without treating that context as a permission or policy exemption. This is additional site copy; the three inherited game notices remain verbatim. It states the project's approach, not NASA approval or certified legal compliance. Primary guidance checked 8 September 2026: https://www.nasa.gov/nasa-brand-center/images-and-media/ . Carry this approved addition with the proposed site copy during integration.
- No autoplay, tracking, analytics, newsletter form or backend. A social preview image has not been added; title/description/canonical metadata are present.

## Screenshot capture

Fresh screenshots came from the existing `dist/` build through normal player controls. Default text size; sound on; 1920×1080; no state injection, test harness screenshot reuse, CSS hiding or fake clocks. Source HEAD observed: `50ba5be`; dist observed timestamp: 7 September 2026, 22:46 local. We have not asserted that the existing dist is reproducible from that HEAD. The capture shows the named Jim Lovell CAPCOM, so it reflects the integrated relay presentation. Raw PNGs and settings are in `review/`.

Home gallery: Gemini program hangar/prologue, Lovell crisis relay, return decision. An additional docking-report capture is available in review but not shipped to the homepage. Images are never cropped; full-resolution WebP files preserve the entire frame, and 960×540 versions serve the inline gallery. Re-capture after any material UI change before public launch.

## Acceptance for the integrated deployment

- Root homepage, `/demo/`, full-size screenshots, fonts, audio and game save/load work at the final custom domain.
- Test the homepage at desktop, tablet and 320–390 px phone widths and at 200% zoom; check title wrapping, nav, paragraph reflow and horizontal overflow.
- Keyboard: skip link, nav, launch controls and disclosure summaries; gallery opening, next/previous, arrow keys, Escape and focus return. Native anchors remain useful with JavaScript off.
- Current local checks: references/IDs/image alternatives/notice parity/CNAME pass; JavaScript syntax passes; local homepage and mounted demo entry return HTTP 200. Homepage browser interaction and visual QA are still to be performed during integration.
- Preserve all included OFL notices. Do not publish the handoff scripts, raw review files, local filesystem paths, manifest bookkeeping or source maps merely by copying the entire packet.
