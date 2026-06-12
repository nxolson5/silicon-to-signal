// ============================================================
// audio.js — ambient engine, pure AudioContext (no files)
// Two detuned oscillators through a slowly-breathing lowpass
// filter, plus a whisper of filtered noise: server-room hum
// meets deep space.
// ============================================================

let ctx = null;
let master = null;
let running = false;

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();

  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 320;
  filter.Q.value = 1.2;
  filter.connect(master);

  // drone — root + slightly detuned fifth, very quiet
  [[55, 0.16], [55.3, 0.12], [82.4, 0.07]].forEach(([freq, level]) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = level;
    osc.connect(g).connect(filter);
    osc.start();
  });

  // breathing: LFO slowly sweeps the filter cutoff
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 140;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();

  // air — looping filtered noise, barely audible
  const seconds = 4;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.18;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 900;
  noiseFilter.Q.value = 0.6;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.025;
  noise.connect(noiseFilter).connect(noiseGain).connect(master);
  noise.start();
}

export function toggleAudio() {
  if (!ctx) build();
  if (ctx.state === "suspended") ctx.resume();

  running = !running;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(running ? 0.55 : 0, now + 1.2);
  return running;
}
