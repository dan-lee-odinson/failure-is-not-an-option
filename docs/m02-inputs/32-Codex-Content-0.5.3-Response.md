# 32 — Content 0.5.3 delivered

**From:** Codex · **For:** Dan and Claude · **Follows:** 31 · **Baseline:** M01 `d679b2b`, content 0.5.2 as integrated.

## Confirmed direction — Lovell conveys Scott's report

Dan has reaffirmed the relay model: **Scott reports the tumbling from Gemini VIII; Lovell conveys that report to Glen and Mission Control.** Lovell remains the on-screen speaker, with his headshot, name and CAPCOM role. The source attribution identifies whose report he is relaying.

The delivered crisis line already implements this: “Flight, Coastal Sentry Quebec relays Scott…” Keep that line and its H7 PDF page 76 provenance. The Scott attribution is a correction to the original crew speaker named in the brief; it does not change Lovell's role delivering the report in the game. The Houston relay framing remains identified as dramatized in provenance.

Proceed with the existing 0.5.3 relay implementation, including Glen's two optional questions. This confirmation requires no dialogue, portrait, mechanics or code revision. The separately discussed Command 400 exchange is a possible future addition and is not added to this drop by this confirmation.

[Download the complete packet](C:/Users/wolfe/Documents/Claude_GPT_Shared_Workflow/Failure-is-Not-an-Option/FNO-M00-Codex-Content-v0.5.3.zip) · [Handoff and all seven CAPCOM lines](C:/Users/wolfe/Documents/Claude_GPT_Shared_Workflow/Failure-is-Not-an-Option/FNO-M00-Codex-Content-v0.5.3/00_HANDOFF.md) · [Dialogue sheet](C:/Users/wolfe/Documents/Claude_GPT_Shared_Workflow/Failure-is-Not-an-Option/FNO-M00-Codex-Content-v0.5.3/docs/dialogue-sheet.md) · [CSV sheet](C:/Users/wolfe/Documents/Claude_GPT_Shared_Workflow/Failure-is-Not-an-Option/FNO-M00-Codex-Content-v0.5.3/docs/dialogue-sheet.csv)

Jim Lovell is the named CAPCOM on the relay model, with two portraits cut from the existing v003 sheet and both requested questions. Every utterance has H7 page provenance or a procedural tag. The old composite portrait is preserved in art history. The scan identifies the emergency caller as **Scott (P), PDF page 76**, so that attribution is corrected in the relay and called out for clearance.

The drop also contains ordered credits, the History cleanup and Lovell note, Glen's ageless note, and the den plate plus smoke and beam layers. [The den treatment](C:/Users/wolfe/Documents/Claude_GPT_Shared_Workflow/Failure-is-Not-an-Option/FNO-M00-Codex-Content-v0.5.3/art/OPENING-DEN.md) supplies the projection rectangle, camera framing, loop and light-matched transition. The actual montage/credits player remains the assembly task described in 30 §8; existing cues and opening code are unchanged.

**Checks:** 135 tests passed across 15 files; typecheck, content validation, mechanics comparison, image QA and patch applicability passed. The sweep remains 56 routes / 6 outcomes / 112 plan commits / 0 draws. The regenerated sheet has 728 strings, 219 branch-only. No browser suite was rerun for this content drop. The live repo was not edited.

Credits retain the supplied draft roles and pending licence confirmation; the Archive section remains a placeholder. All seven original sound attributions are retained. No additional 0.5.2 sheet notes arrived before packaging.

Fingerprint: `63fa5eacd8b7433e9e08b6c03f366d621eac5bc7fa72d24c994f427897ccf36d`.

![Lovell portrait cuts](C:/Users/wolfe/Documents/Claude_GPT_Shared_Workflow/Failure-is-Not-an-Option/art/M02-opening-den-v001/lovell-review.png)

![Den composition preview](C:/Users/wolfe/Documents/Claude_GPT_Shared_Workflow/Failure-is-Not-an-Option/art/M02-opening-den-v001/den-composite-review.png)

Next free document number: **33**.

## Lighting revision — lamp off

At Dan's request, the den is darker and the floor lamp is off, retained only as set dressing. The projector and its reflected wall light are the primary illumination. Glen and the furniture recede into shadow with light on their projector-facing edges. Composition, projection coordinates, smoke/beam layers and motion are retained.

This is an art-only revision within content 0.5.3. The runtime filename `fno_opening_den_room_plate_v001.png` and asset ID `opening-den` are retained for integration compatibility; its pixels are now asset revision 2. The standalone versioned export is `art/M02-opening-den-v001/runtime/fno_opening_den_room_plate_v002.png` in the shared project. Replace the old runtime PNG if 0.5.3 has already been copied. No content JSON, manifest, integration patch, dialogue sheet or gameplay code changes accompany this revision, so the content fingerprint is unchanged.

The built-in image-generation tool performed the lighting edit. The exact prompt and source path are recorded in `art/lighting-revision-record.json`. The prior plate and composite are in `art/history/`. Image dimensions and the composite with existing smoke and beam were checked again; packet file hashes and the ZIP were rebuilt and verified. The original gameplay test results remain those of the delivered 0.5.3 content drop.
