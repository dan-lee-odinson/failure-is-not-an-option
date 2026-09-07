# Failure is Not an Option — Over-the-Shoulder Camera Direction

**Status:** User-approved camera direction, 7 September 2026. Three revised scene images generated and available for visual review. **For:** Claude's presentation work and Codex's art production.

## The decision

Use a close third-person view just behind and slightly above Glen Kurtz's shoulder. Show the back of his head, shoulders and waistcoat as he sits upright at the console. Follow his attention when he turns toward another person. This replaces the first-person torso/hands framing in the initial samples and older briefs.

The user approved retaining the 2D approach: a small set of illustrated camera angles and character poses, connected by gentle transitions. The GTA comparison describes the relationship between camera and character; it does not require a 3D engine or a continuously rotating camera.

## Framing

- Establishing view: Glen in the lower-left foreground, approximately one quarter to one third of frame width. Keep the mission room and console as most of the image.
- Position the camera high enough to see over his shoulder, close enough to read hair, glasses, headset and vest, with a natural upright or slightly forward working posture.
- Show the waistcoat's back and adjustment strap. The broad front-of-vest strip and detached first-person hands from sample v001 are removed in the revised composition.
- His arms remain visibly connected to his shoulders when using a phone or writing. The chair back stays low enough to preserve the vest silhouette.
- Use the small approved version-5 emblem as a separate production asset. An illustrative rendering is only a placement proposal; production should use the exact master. No earned mission patches appear before the first completed mission.
- Reserve a quiet region for dialogue and keep face, gaze direction and relevant evidence unobstructed at supported screen sizes. The exact art placement can adapt when the UI is visible.
- Default Glen has a steel-gray regulation crew cut, horn-rimmed glasses, ivory vest and white shirt. This is a sample appearance, not a restriction on player gender, name or customization.

## A bounded 2D implementation

Use three initial presentation states: forward console, attention toward the left-side controller, attention toward the right-side controller. Each state has a composed room view and appropriate director pose. Do not simulate a large orbit by merely rotating or stretching a single flat image; that would distort the desks and faces.

Selecting a controller hotspot or its keyboard equivalent sets the active conversation target. Transition Glen's pose and scene composition together, then show the corresponding dialogue. A Console/Back control returns attention to the forward view. Evidence overlays can remain in the current view; they do not require another camera angle.

For the first implementation, authored crossfades and subtle positional movement are enough. Begin around 250–400 ms, tune by playtest, and provide an immediate transition with reduced motion enabled. Keep the dialogue readable throughout; movement must not introduce a reading deadline, motion-controlled interaction or an extra confirmation step for mission orders.

For production, separate the room plate, Glen's rear pose, vest/patch overlay and controller portraits so customization does not require regenerating the room. If those layers are not yet supplied, Claude may demonstrate the same composition with labeled placeholders and fixed pose states. The revised illustration samples are flattened art-direction references, not a promise that separate layers or animation have been delivered.

Camera focus is presentation state. Looking at a person does not spend attention, advance simulation time, change trust, acquire hidden reports or submit a mission choice. On scene entry or reload, reconstruct the default viewpoint from the active narrative context; cosmetic camera movement is excluded from canonical simulation replay. Domain actions still follow the content specification.

## Effect on existing handoffs

This user decision supersedes first-person framing in older concept, asset and M00 packet text. The live concept, division-of-labor and opening-cinematic briefs have been updated. The existing content archives and Claude's build-context ZIP remain historical snapshots; read this file as the current presentation addendum.

The M00 logical room asset slot may retain its ID while its description and composition change during integration. Existing four controller slots remain useful. Glen's rear pose is an additional presentation layer, not an extra simulated controller or a change to mission outcomes. Record any added production-layer entries in the asset manifest when those actual assets exist.

All operational choices, post-flight accountability, save/replay requirements, 2D medium, text-only dialogue, dramatic lighting and approved original emblem remain in scope.

## Revised samples

1. **Before the first contact:** establish the room over Glen's shoulder, showing his upright seated silhouette and ivory vest.
2. **The return decision:** Glen turns his head toward Mara and Elias; the conversation composition follows his attention while retaining his back/shoulder as an anchor.
3. **The wait at sea:** a rightward conversational view toward Elias, with Glen's rear profile and vest visible and Mara farther into the room.

The three [completed over-the-shoulder samples](art/scene-samples-v002/README.md) are saved in the shared art folder with [exact prompts used](art/scene-samples-v002/PROMPTS-USED.md). A temporary usage-limit rejection preceded successful generation. These are flattened illustrated camera compositions, not a playable camera or supplied animation layers. The first-person v001 samples remain useful lighting/room/character references, but their camera framing is superseded.

## Visual acceptance

The view should read immediately as sitting behind an attentive director. His body must not resemble a reclining first-person torso. The room, current speaker and available choices must remain readable. Turns should keep the same character identity and plausible room geometry. The vest should be visible in ordinary play, with the camera feeling attached to Glen's attention rather than floating independently around the room.
