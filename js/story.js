// ============================================================
// story.js — GSAP ScrollTrigger choreography
// One scroll = one documentary. Each panel drives the 3D stage,
// the HUD telemetry, and its own staggered text reveal.
// ============================================================

export function initStory(stage) {
  gsap.registerPlugin(ScrollTrigger);

  const hudChapter = document.getElementById("hud-chapter");
  const hudLabel = document.getElementById("hud-label");
  const progressBar = document.getElementById("progress-bar");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- global progress → bar + camera drift ----------------
  ScrollTrigger.create({
    trigger: "#narrative",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      progressBar.style.width = `${(self.progress * 100).toFixed(2)}%`;
      stage.setDrift(self.progress);
    },
  });

  // ---- per-panel choreography --------------------------------
  document.querySelectorAll(".panel").forEach((panel) => {
    const inner = panel.querySelector(".panel__inner");
    const side = inner.classList.contains("panel__inner--left") ? 1
               : inner.classList.contains("panel__inner--right") ? -1
               : 0;

    // text reveal — staggered rise as the panel enters
    const reveals = panel.querySelectorAll(".reveal");
    if (reduceMotion) {
      reveals.forEach((el) => el.classList.add("is-static"));
    } else {
      gsap.to(reveals, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: panel,
          start: "top 62%",
          toggleActions: "play none none reverse",
        },
      });
    }

    // artifact + HUD swap when the panel takes the screen
    ScrollTrigger.create({
      trigger: panel,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => {
        if (!self.isActive) return;
        stage.showArtifact(panel.dataset.artifact, side);
        hudChapter.textContent = `CH·${panel.dataset.chapter}`;
        hudLabel.textContent = panel.dataset.label;
        gsap.fromTo(hudLabel, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      },
    });

    // subtle depth: text block drifts slower than the scroll
    if (!reduceMotion) {
      gsap.fromTo(inner,
        { yPercent: 6 },
        {
          yPercent: -6,
          ease: "none",
          scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom top", scrub: 0.6 },
        }
      );
    }
  });

  // ---- interlude: type the URL while the panel is in view ----
  const urlEl = document.getElementById("url-type");
  if (urlEl) {
    const full = "example.com";
    ScrollTrigger.create({
      trigger: ".panel--interlude",
      start: "top 55%",
      onEnter: () => typeUrl(urlEl, full),
      onEnterBack: () => typeUrl(urlEl, full),
    });
  }
}

let typeTween = null;
function typeUrl(el, full) {
  if (typeTween) typeTween.kill();
  const state = { n: 0 };
  el.textContent = "";
  typeTween = gsap.to(state, {
    n: full.length,
    duration: 1.4,
    delay: 0.5,
    ease: "steps(" + full.length + ")",
    onUpdate: () => (el.textContent = full.slice(0, Math.round(state.n))),
  });
}
