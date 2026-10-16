# DreamScape Redesign Plan

## Scope and preservation

This is an in-place redesign of the existing DreamScape project. The established dependency-free HTML/CSS/vanilla JavaScript architecture, CSS/SVG-like scene illustration, Canvas particle layer, Web Audio ambience, responsive controls, field notes, and localStorage preferences are preserved. The redesign adds a gated narrative state machine and a custom lightweight 2D physics layer rather than rebuilding the site or adding a physics dependency.

## Narrative state

The new story state is persisted under a versioned localStorage key and follows: `ROOM → MOON_FOUND → OCEAN → EYE_FOUND → HALLWAY → COLLAPSE → PHYSICS → KEY_FOUND → VOID → ENDING`. Existing direct scene controls remain useful for orientation, but story-critical doors are gated by discoveries so exploration matters. The Room moon opens the Ocean; the Ocean eye opens the Hallway; high pointer/touch velocity in the Hallway collapses the interface; the physics key opens the Void; the Void photograph and final door trigger the ending loop.

## Track Alpha velocity system

Pointer and touch movement are sampled with timestamps and converted into an exponentially smoothed velocity. Slow movement leaves the stage stable. Medium velocity applies CSS distortion, text displacement, object shake, and unstable lighting. High velocity reveals `SOMETHING IS WRONG.`; extreme velocity reveals `STOP.` and `DREAM INSTABILITY: 100%`, then starts a physical collapse. The system respects reduced-motion by raising the threshold and suppressing visual shake while preserving the narrative trigger.

## Physics mode

`physics.js` owns an efficient Canvas-based 2D world with a small set of story fragments: DreamScape letters, door shards, photographs, clock pieces, furniture fragments, and symbols. Bodies have velocity, rotation, simple circle/box collision response, gravity, boundary bounce, pointer dragging, and pointer/touch release. The user’s movement direction maps to gravity: right/left changes horizontal gravity, up/down changes vertical gravity. The gold key is a physical body hidden among the fragments. Dragging or clicking it triggers a slowdown, key glow, audio fade, and transition to the Void. This is a custom lightweight physics layer, not a generic physics demonstration.

## Ending loop

The Void becomes intentionally sparse with one chair, one photograph, and one door. The photograph reveals the story text in two beats; the final door fades to white, mutes audio, records ending status, and returns to the opening composition with the changed line `You already have.` and one floating restart key.

## Design extension

The visual movement remains analog dreamcore installation: deep navy/black and faded cream, dusty pink, lavender, muted blue, and pale yellow, with red reserved for instability. The collapse moment introduces glass-like fragmentation, clipped typography, canvas debris, and a brief warning HUD without introducing neon cyberpunk styling. Ordinary scene transitions stay under 900ms; collapse and ending are intentionally longer pauses.

## Project structure

```text
/
├── index.html                 # Scene shell plus velocity/physics/ending overlays
├── styles.css                 # Existing scenes plus warning, collapse, physics, and ending skins
├── app.js                     # Story state, velocity trigger, audio, interactions, persistence
├── physics.js                 # Custom Canvas 2D gravity world and draggable fragments
├── particles.js               # Visibility-aware ambient particle renderer
├── plan.md                    # This redesign plan
├── TODO.md                    # Redesign outcome tracking
├── public/manus-routes.json   # Static route manifest
├── server.mjs                 # Dependency-free preview harness only
└── app.config.ts              # Project logo metadata
```

## Build and verification

Keep the existing port 3000 preview. Register diagnostics before the first redesign code batch, run syntax checks, verify `/` and `/manus-routes.json`, capture desktop/mobile previews, and use targeted browser interaction checks for the Room → Ocean gate, velocity collapse, physics key, Void ending, and restart loop. Save the finished redesign as a canonical `main` checkpoint; do not publish unless requested.


## Audio-reactive extension

The Web Audio graph now routes the scene filter through an `AnalyserNode` into the master output. Frequency-bin energy is sampled on a visibility-aware animation loop and rendered as a restrained scene-colored radial waveform/glow on `#reactiveCanvas`; bass, treble, and total energy also become CSS variables for responsive visual intensity. Audio remains interaction-gated and muted states reduce the layer to a minimal trace.


## Chaos Card and Hallway escape

Dream 03 now exposes a zero-raster procedural SVG Chaos Card. Its three color-lock swatches are generated from a deterministic hash of the current story phase and discoveries; cycling the swatches counts matching slots and unlocks the card when all three align. The middle Hallway door is the explicit escape door: it opens the color-lock card while locked, then transitions to the Void once the card is aligned. The other doors remain misleading/collapse-path doors.


## Chaos Card puzzle clarification

The Chaos Card now presents a visible target row and a separate user-signal row. Each lower signal cycles on tap/click; the status reports `MATCH 0 / 3` through `MATCH 3 / 3 — UNLOCKED`, while the target colors remain algorithmically derived. The card can be closed with a prominent `CLOSE ×` control, a full-width return button, backdrop click, or Escape.
