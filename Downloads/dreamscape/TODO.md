# DreamScape Redesign Outcomes

## Preserved foundation

- [ ] The existing DreamScape is redesigned in place rather than rebuilt from scratch; useful Room/Ocean/Hallway/Void scenes, semantic object buttons, responsive layout, parallax, Canvas particles, Web Audio, field notes, localStorage, route manifest, and preview harness remain functional.
- [ ] The viewport remains an immersive environment rather than a conventional navbar, hero section, card grid, dashboard, standard section stack, or generic game UI.

## Story-state progression

- [ ] Story state persists and follows `ROOM → MOON_FOUND → OCEAN → EYE_FOUND → HALLWAY → COLLAPSE → PHYSICS → KEY_FOUND → VOID → ENDING`.
- [ ] The opening screen presents `DREAMSCAPE`, “You were not supposed to find this place.”, “Look around.”, and a minimal `DREAM 01 / THE ROOM` context.
- [ ] The Room includes bed, window, moon, clock, television, mirror, telephone, photograph, locked door, floating objects, and shadows; the moon can be discovered and the locked door opens the Ocean only after the moon is found.
- [ ] The Ocean transition darkens and fills the viewport with underwater color, light, particles, floating furniture, fish, photographs, TV/clock remnants, and the discoverable eye; the eye unlocks the Hallway door.
- [ ] The Hallway is an impossible infinite space with repeating doors, perspective distortion, flickering lights, long shadows, floating fragments, photographs, and the messages “Not this way.”, “Closer.”, and “You've been here before.”.
- [x] C3 Chaos Card is a zero-raster procedural SVG/Canvas puzzle with a visible target-color row, three tappable lower signal dials, algorithmic three-slot color lock feedback (`MATCH 0 / 3` through `MATCH 3 / 3 — UNLOCKED`), and clear instructions.
- [x] The Chaos Card can be closed with a prominent `CLOSE ×` button, a full-width “Close card and return to the Hallway” button, backdrop click, or Escape.
- [x] The Hallway has one explicit escape door: the middle door is labeled `EXIT`, opens the Chaos Card while locked, and transitions to the Void once the color lock is aligned; the other two doors remain misleading/story interactions.

## Track Alpha velocity collapse

- [ ] Pointer and touch velocity are tracked. Slow movement keeps the environment stable; increasing velocity adds subtle distortion, typography shifts, object shake, and unstable lighting.
- [ ] High velocity displays “SOMETHING IS WRONG.” and extreme velocity displays “STOP.” followed by `DREAM INSTABILITY: 100%`.
- [ ] Extreme velocity in the Hallway triggers a physical shatter instead of an ordinary fade: letters separate, doors/photographs/clock/furniture/symbol fragments scatter, the screen shakes briefly, and gravity takes over.

## Physics gravity mode

- [ ] The shatter produces an interactive 2D physics/gravity environment with falling, bouncing, rotating, colliding, sliding, dragging, throwing, and pointer/touch gravity control.
- [ ] Pointer/touch direction maps to gravity: right/left changes horizontal gravity and up/down changes vertical gravity.
- [ ] The physics world includes letters, doors, photographs, clock pieces, furniture fragments, symbols, environmental debris, and a hidden key; it displays “YOU BROKE THE DREAM.” and “NOW CONTROL WHAT REMAINS.”.
- [ ] Finding the physical key slows physics, settles objects, slows particles, fades audio, makes the key glow, and opens the next doorway.

## Void and ending loop

- [ ] The Void uses deep navy/black, empty space, one chair, one photograph, one door, tiny particles, and subtle lighting; it displays “This is where you woke up.”.
- [ ] The Void photograph reveals the user sitting in the chair, followed by “You weren't trapped here.” and “You built this place.”; the final door opens.
- [ ] The ending fades to white, removes sound, returns to the opening composition, changes the message to “You already have.”, leaves one floating key, and clicking that key restarts the dream.

## System quality

- [ ] Cursor/touch microinteractions include a moon-inspired glow, trail, proximity reactions, hover distortion, text displacement, and rare contextual whispers.
- [ ] Web Audio includes room, water, TV static, telephone, low-frequency, glitch, physics-collision, and key sounds, with a small sound toggle and no copyrighted music.
- [x] C2 audio-reactive visuals route scene audio through an `AnalyserNode`, sample frequency-bin energy, render a scene-colored reactive waveform/glow, expose bass/treble/energy CSS signals, and remain muted/reduced when audio is off or motion is reduced.
- [ ] The experience remains responsive, touch-capable, performant, reduced-motion aware, visibility-aware, semantically labeled, and free of backend/database/auth application code.
