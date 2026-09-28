/**
 * Generates apps/mobile/assets/sounds/chime.wav: the Love Notes notification sound.
 * Two soft bell tones (E6 → B6) with gentle harmonics and a quick decay, ~0.9s, 16-bit mono.
 * Run: bun scripts/make-chime.ts
 */
const RATE = 44_100;
const LENGTH = 0.9;

const notes = [
  { at: 0, freq: 1318.5, gain: 0.5 }, // E6
  { at: 0.14, freq: 1975.5, gain: 0.42 }, // B6
];

const samples = new Float32Array(Math.round(RATE * LENGTH));
for (const n of notes) {
  const start = Math.round(n.at * RATE);
  for (let i = start; i < samples.length; i++) {
    const t = (i - start) / RATE;
    const attack = Math.min(1, t / 0.006);
    const env = attack * Math.exp(-t * 6.5);
    const tone =
      Math.sin(2 * Math.PI * n.freq * t) + 0.28 * Math.sin(2 * Math.PI * n.freq * 2.01 * t) * Math.exp(-t * 9);
    samples[i] = (samples[i] ?? 0) + n.gain * env * tone;
  }
}

const data = new DataView(new ArrayBuffer(44 + samples.length * 2));
const str = (o: number, s: string) => {
  for (const [i, c] of [...s].entries()) data.setUint8(o + i, c.charCodeAt(0));
};
str(0, "RIFF");
data.setUint32(4, 36 + samples.length * 2, true);
str(8, "WAVE");
str(12, "fmt ");
data.setUint32(16, 16, true);
data.setUint16(20, 1, true); // PCM
data.setUint16(22, 1, true); // mono
data.setUint32(24, RATE, true);
data.setUint32(28, RATE * 2, true);
data.setUint16(32, 2, true);
data.setUint16(34, 16, true);
str(36, "data");
data.setUint32(40, samples.length * 2, true);
for (const [i, s] of samples.entries()) data.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s * 0.8)) * 0x7fff, true);

const out = new URL("../apps/mobile/assets/sounds/chime.wav", import.meta.url).pathname;
await Bun.write(out, data.buffer);
console.info(`chime → ${out} (${data.byteLength} bytes)`);
