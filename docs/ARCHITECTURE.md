# Architecture

How SILICON → SIGNAL is put together. The whole site is a zero-build static
page: vanilla ES modules, Three.js and GSAP from CDN via import-map/script
tags, no bundler, no framework.

```
┌──────────────────────────────────────────────────────────┐
│ index.html — narrative DOM (11 chapters, data-* hooks)   │
└───────────────┬──────────────────────────────────────────┘
                │
        ┌───────▼────────┐
        │  js/main.js    │  boot; WebGL fallback to no-op stage
        └──┬─────┬─────┬─┘
           │     │     │
  ┌────────▼─┐ ┌─▼───────────┐ ┌─▼────────────┐
  │ scene.js │ │ story.js    │ │ themes.js    │
  │ 3D stage │ │ScrollTrigger│ │ console UI   │──► audio.js
  └──────────┘ └─────────────┘ └──────────────┘    (AudioContext)
```

## The contract between DOM and stage

Every `<section class="panel">` carries three data attributes:

| Attribute | Purpose |
|-----------|---------|
| `data-chapter` | HUD index (`CH·03`) |
| `data-label` | HUD telemetry label (`MICRO`, `DNS`, …) |
| `data-artifact` | Which 3D artifact owns the screen (`tube`, `transistor`, `chip`, `pc`, `globe`, `rack`, `core`) |

`story.js` reads these when a panel crosses the 50%-viewport line and calls
`stage.showArtifact(name, side)`. `side` (±1/0) is derived from the panel's
layout class, so the artifact always drifts to the empty half of the screen,
opposite the text.

## scene.js — the persistent stage

One `WebGLRenderer` on a fixed full-viewport canvas, `z-index: 0`, behind all
text. Seven artifact groups are built procedurally at boot (no model or
texture downloads) and live in the scene simultaneously, hidden until needed.

- **Crossfades** — every material is created `transparent: true` with a
  recorded `userData.baseOpacity`. `showArtifact` GSAP-tweens the outgoing
  group's materials to 0 / scale 0.7, and the incoming group up to its base
  opacities with a scale pop.
- **Self-animation** — each group exposes `userData.update(t, group)`; the
  render loop calls it only for visible groups (filament flicker, packet
  orbits, blinkenlights, knot rotation…).
- **Accent system** — materials that should follow the theme are flagged
  `userData.isAccent`. `setAccent(hex)` tweens their emissive/color, plus the
  accent point light and the additive glow sprite.
- **Wireframe** — `setWireframe(on)` flips every mesh material except those
  flagged `lockWireframe` (the globe is *designed* wireframe).
- **Camera** — gentle mouse parallax each frame, plus `setDrift(progress)`
  fed by global scroll progress for a slow orbital drift across the story.

## story.js — choreography

Four ScrollTrigger layers, all defined in one pass over `.panel` elements:

1. **Global progress** — `#narrative` top→bottom scrub updates the HUD
   progress bar and `stage.setDrift`.
2. **Reveals** — `.reveal` children rise/fade in with a 0.12s stagger when a
   panel reaches 62% viewport; reversed when scrolling back up.
3. **Artifact + HUD swap** — a 50%–50% trigger band per panel calls
   `showArtifact` and rewrites the HUD chapter/label.
4. **Depth** — each text block scrubs ±6% slower than the page for parallax.

`prefers-reduced-motion` short-circuits layers 2 and 4 (text becomes static
and fully visible).

## themes.js + audio.js — the console

The console is the "live material controls" panel. A swatch click does two
things atomically: sets `body[data-theme]` (CSS custom properties retheme
every gradient, border, and glow) and calls `stage.setAccent` (3D materials
follow). Audio is built lazily on first toggle — required anyway, since
`AudioContext` must start from a user gesture. The drone is synthesized:
three detuned sines through a lowpass whose cutoff is swept by a 0.05 Hz LFO,
plus a bandpassed noise loop at −32 dB for "air."

## Why no build step

The site's only dependencies are Three.js and GSAP, both stable from CDN.
Skipping the bundler keeps the repo readable as source, deployable on GitHub
Pages with zero CI, and trivially forkable — view-source *is* the docs.

## Performance notes

- Pixel ratio is clamped to 2; geometry budgets are small (the heaviest
  artifact is the globe at ~5k triangles + 12 packet meshes).
- Particles use additive blending with `depthWrite: false` to avoid sorting.
- Only the visible artifact's `update` runs per frame.
- The film grain is a tiny inline SVG `feTurbulence`, animated with
  `steps()` so it never invalidates layout.
