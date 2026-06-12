// ============================================================
// themes.js — live material/theme console
// Swatches retheme the CSS custom properties AND the 3D
// materials simultaneously; wireframe and ambient-audio
// toggles live in the same panel.
// ============================================================

import { toggleAudio } from "./audio.js";

const THEMES = {
  phosphor: "#00ff9d",
  hologram: "#4cc2ff",
  plasma: "#ff4ecd",
  amber: "#ffb347",
};

export function initConsole(stage) {
  const root = document.getElementById("console");
  const toggle = document.getElementById("console-toggle");

  toggle.addEventListener("click", () => {
    const open = root.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // material swatches — CSS theme + 3D accent in one click
  document.querySelectorAll(".swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.swatch;
      document.body.dataset.theme = name;
      stage.setAccent(THEMES[name]);
      document.querySelectorAll(".swatch").forEach((b) =>
        b.classList.toggle("is-active", b === btn)
      );
    });
  });

  // wireframe toggle
  const wire = document.getElementById("wire-toggle");
  wire.addEventListener("click", () => {
    const on = wire.getAttribute("aria-pressed") !== "true";
    wire.setAttribute("aria-pressed", String(on));
    wire.textContent = on ? "ON" : "OFF";
    stage.setWireframe(on);
  });

  // ambient audio toggle
  const audio = document.getElementById("audio-toggle");
  audio.addEventListener("click", () => {
    const playing = toggleAudio();
    audio.setAttribute("aria-pressed", String(playing));
    audio.textContent = playing ? "LIVE" : "MUTED";
  });
}
