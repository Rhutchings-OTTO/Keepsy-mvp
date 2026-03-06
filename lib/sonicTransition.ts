/**
 * Plays a "sonic boom" transition: low-frequency rumble + white-noise whoosh.
 * Call on region click to sync with the color wash and cloud flight.
 * @param isEasterEgg - If true, shifts to 440Hz + high-pass for a magical shimmer instead of sonic boom
 */
export function playSonicTransition(isEasterEgg = false): void {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const audioCtx = new AudioContextClass();
  const masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);

  const oscillator = audioCtx.createOscillator();
  const lowGain = audioCtx.createGain();
  oscillator.type = "sine";
  if (isEasterEgg) {
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 2);
  } else {
    oscillator.frequency.setValueAtTime(40, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 2);
  }
  lowGain.gain.setValueAtTime(isEasterEgg ? 0.15 : 0.25, audioCtx.currentTime);

  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  const noiseFilter = audioCtx.createBiquadFilter();
  if (isEasterEgg) {
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(2000, audioCtx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(8000, audioCtx.currentTime + 2);
  } else {
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(200, audioCtx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(8000, audioCtx.currentTime + 2);
  }

  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(isEasterEgg ? 0.3 : 0.4, audioCtx.currentTime + 0.5);
  masterGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.5);

  whiteNoise.connect(noiseFilter);
  noiseFilter.connect(masterGain);
  oscillator.connect(lowGain);
  lowGain.connect(masterGain);

  whiteNoise.start();
  oscillator.start();
  whiteNoise.stop(audioCtx.currentTime + 3);
  oscillator.stop(audioCtx.currentTime + 3);
}

/**
 * Heavy mechanical thrum (vault door closing) with metallic reverb.
 * Call when Konami code completes for Atelier mode transition.
 */
export function playVaultThrum(): void {
  if (typeof window === "undefined") return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;

  const ctx = new AC();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.03);
  masterGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
  masterGain.connect(ctx.destination);

  // Primary thrum: low descending tone (vault impact)
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(70, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.35);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.8, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

  // Metallic reverb: delay line with feedback + resonant filter for metal character
  const delay = ctx.createDelay(0.5);
  delay.delayTime.setValueAtTime(0.045, ctx.currentTime);
  const delayFeedback = ctx.createGain();
  delayFeedback.gain.setValueAtTime(0.42, ctx.currentTime);
  const metallicFilter = ctx.createBiquadFilter();
  metallicFilter.type = "bandpass";
  metallicFilter.frequency.setValueAtTime(2400, ctx.currentTime);
  metallicFilter.Q.setValueAtTime(2.5, ctx.currentTime);

  osc.connect(oscGain);
  oscGain.connect(delay);
  oscGain.connect(masterGain);
  delay.connect(metallicFilter);
  metallicFilter.connect(delayFeedback);
  delayFeedback.connect(delay);
  metallicFilter.connect(masterGain);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}

/** Subtle air-whoosh for Transatlantic Flight easter egg. */
export function playPaperPlaneSfx(): void {
  if (typeof window === "undefined") return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
  const buf = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.3));
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 800;
  src.connect(f);
  f.connect(gain);
  src.start();
  src.stop(ctx.currentTime + 0.5);
}
