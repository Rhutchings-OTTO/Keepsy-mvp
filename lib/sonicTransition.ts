/**
 * Plays a "sonic boom" transition: low-frequency rumble + white-noise whoosh.
 * Call on region click to sync with the color wash and cloud flight.
 */
export function playSonicTransition(): void {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const audioCtx = new AudioContextClass();
  const masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);

  const oscillator = audioCtx.createOscillator();
  const lowGain = audioCtx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(40, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 2);
  lowGain.gain.setValueAtTime(0.25, audioCtx.currentTime);

  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.setValueAtTime(200, audioCtx.currentTime);
  noiseFilter.frequency.exponentialRampToValueAtTime(8000, audioCtx.currentTime + 2);

  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.5);
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
