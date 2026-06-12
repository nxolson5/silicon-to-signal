// ============================================================
// main.js — boot & orchestration
// If WebGL is unavailable the 3D stage degrades to a no-op and
// the scroll narrative still runs in full.
// ============================================================

import { initStory } from "./story.js";
import { initConsole } from "./themes.js";

const noopStage = {
  showArtifact() {}, setAccent() {}, setWireframe() {}, setDrift() {},
};

let stage = noopStage;
try {
  const { initScene } = await import("./scene.js");
  stage = initScene(document.getElementById("stage"));
} catch (err) {
  console.warn("3D stage unavailable, continuing in 2D:", err);
  document.getElementById("stage").remove();
}

initStory(stage);
initConsole(stage);

// open on the first frame already revealed
window.scrollTo(0, 0);
