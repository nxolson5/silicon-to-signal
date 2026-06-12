// ============================================================
// main.js — boot & orchestration
// ============================================================

import { initScene } from "./scene.js";
import { initStory } from "./story.js";
import { initConsole } from "./themes.js";

const stage = initScene(document.getElementById("stage"));
initStory(stage);
initConsole(stage);

// open on the first frame already revealed
window.scrollTo(0, 0);
