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
