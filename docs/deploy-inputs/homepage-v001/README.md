# Failure is Not an Option — homepage v001

Prepared for Dan Lee-Odinson and Claude, 8 September 2026.

The finished portable homepage is **site/index.html**. Open that file directly to review the page, or serve `site/` as a static website. The enhanced screenshot viewer works without a build step. Without JavaScript, screenshots open as ordinary image links and all navigation still works.

## Included

- Oversized Chakra Petch hero title over the existing illustrated control room.
- Original approved emblem, Barlow typography, the game's cream/green/amber palette, and original Apollo action faces.
- Gemini VIII demo introduction and launch links to `./demo/`.
- Three new 1920×1080 game captures, with small gallery versions and a keyboard-accessible native dialog viewer.
- Full game “Coming soon,” without announcing additional scenarios or release dates.
- Dan's polished first-person bio and supplied Kennedy Space Center photograph.
- Established character name **Glen Kurtz** and the ageless Gene Kranz tribute explained.
- Exact game AI disclosure, independent-project notice and dramatization notice.
- A separate NASA marks and generated artwork disclosure, added at Dan's request: explicit non-sponsorship, respectful intent to follow NASA's published guidance, original fictional emblem, and context for marks in authentic photographs or archive footage. Includes a direct link to NASA's guidance.
- An accurate open-source statement: the current repository labels MIT and CC BY 4.0 as proposed and not yet in force.
- Local fonts with their OFL notices, canonical URL, metadata, approved SVG favicon and a prepared CNAME file.

## Local preview

`python handoff/preview.py --demo-dir <path-to-existing-game-dist>` serves the homepage at `http://127.0.0.1:8767/` and mounts that game at `/demo/`. It reads the existing demo without modifying or copying it. Without `--demo-dir`, the homepage works but a separate demo build must be supplied before launch links can resolve.

The preview currently running for Dan uses `C:/Users/wolfe/projects/failure-is-not-an-option/dist`. Its purpose is review; it is not a deployment at finaogame.com.

## Delivery structure

Only the contents of **site/** belong on the public web root. **handoff/** and **review/** are development materials; keep them out of the public deployment.

```text
published-root/
  index.html
  styles.css
  site.js
  CNAME
  site-assets/...
  demo/
    index.html
    assets/...
    audio/...
    fonts/...
```

Claude supplies the final demo build at `demo/` and performs the GitHub Pages deployment. No repository files, DNS records or hosting settings were changed by this delivery. The public repository is not linked as an already-open project; Dan's supplied GitHub profile is linked instead.

See **handoff/CLAUDE-INTEGRATION.md** for integration and **handoff/ASSET-PROVENANCE.md** for sources and credits. **handoff/site-copy.proposed.json** is a copy extraction for the proposed `registry.site` integration, not a replacement registry or a validated 0.5.4 content drop.

## Validation

Local homepage and preview demo entry respond successfully. Static validation checks local references, unique IDs, image alternatives, exact notice parity and the custom-domain file; JavaScript syntax is checked. All three game screenshots were freshly captured through normal player controls at 1920×1080, default text and sound on. The homepage itself has not undergone browser interaction or responsive visual testing; Claude should include that in deployment acceptance. See `review/static-validation.json` and `review/capture-settings.json`.

## License status

This package does not enact the proposed project licenses. Dan's portrait is supplied for this homepage, not automatically licensed for general reuse. Fonts retain their included OFL notices. Other third-party material retains its own terms. Confirmed public-release wording can replace the provisional open-source paragraph when Dan's license decision is recorded.
