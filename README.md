# SILICON → SIGNAL

**An interactive documentary on the evolution of computing — and what happens inside the internet when you press Enter.**

A cinematic, scroll-driven storytelling experience that travels from the vacuum tubes of the 1940s to the transistor, the microprocessor, the personal computer, and the networked world — then dives below the surface to follow a single HTTP request: DNS resolution, the TCP handshake, packets crossing undersea cables, a data-center response, and the cloud/AI era we live in now.

![status](https://img.shields.io/badge/status-live-00ff9d?style=flat-square) ![stack](https://img.shields.io/badge/stack-Three.js%20%2B%20GSAP-111?style=flat-square) ![build](https://img.shields.io/badge/build-none%20required-555?style=flat-square)

---

## The experience

The site is one continuous scroll. A persistent WebGL stage sits behind the narrative; as you move through each chapter, procedurally built 3D artifacts crossfade in and out — a vacuum tube, a point-contact transistor, a microprocessor, a wireframe Earth with live packet arcs, a data-center rack, and a neural core. GSAP ScrollTrigger choreographs every transition so the page reads like a documentary, not a landing page.

### Chapters

| # | Chapter | Era / Layer |
|---|---------|-------------|
| 01 | The Room-Sized Mind | Vacuum tubes · 1940s |
| 02 | The Crystal That Changed Everything | Transistors · 1947–1960s |
| 03 | A Computer on a Fingertip | Microprocessors · 1971+ |
| 04 | The Machine Comes Home | Personal computing · 1977–1990s |
| 05 | The Wires Wake Up | ARPANET → WWW |
| — | INTERLUDE: Press Enter | The request begins |
| 06 | The Phonebook of the Planet | DNS resolution |
| 07 | The Three-Way Handshake | TCP/IP |
| 08 | Light Under the Ocean | Routing & submarine cables |
| 09 | The Building That Answers | Data centers |
| 10 | The Weather of Intelligence | Cloud & AI |

## Features

- **Persistent 3D stage** — Three.js scene with seven procedurally generated era artifacts, particle starfield, and scroll-scrubbed camera drift
- **Scroll choreography** — GSAP ScrollTrigger pins, scrubs, and crossfades the entire narrative
- **Live material console** — swap the accent material/theme (Phosphor, Hologram, Plasma, Amber) and the 3D materials + UI glow update in real time; wireframe toggle included
- **Ambient audio engine** — pure `AudioContext` drone (no audio files), one-click toggle
- **Zero-image glow** — every spotlight and aura is a CSS `radial-gradient`
- **Precision HUD** — monospace instrumentation: chapter index, scroll progress, era telemetry readouts

## Running locally

No build step. Serve the folder with any static server:

```bash
cd silicon-to-signal
python3 -m http.server 4173
# → http://localhost:4173
```

(Modules are loaded via CDN import-map, so opening `index.html` over `file://` will not work — use a server.)

## Project structure

```
silicon-to-signal/
├── index.html          # Narrative structure & import map
├── css/
│   └── style.css       # Cinematic styling, glow system, HUD
├── js/
│   ├── main.js         # Boot & module orchestration
│   ├── scene.js        # Three.js stage + era artifacts
│   ├── story.js        # GSAP ScrollTrigger choreography
│   ├── themes.js       # Live theme / material console
│   └── audio.js        # AudioContext ambient engine
└── docs/
    └── ARCHITECTURE.md # How the pieces fit together
```

## Tech

[Three.js](https://threejs.org/) · [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) · vanilla ES modules · CSS custom properties · Web Audio API

## License

MIT — see [LICENSE](LICENSE).
