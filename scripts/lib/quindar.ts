/** Pure Quindar-tone synthesis (shared by the generator and its test). */

export interface QuindarParams {
  open_hz: number;
  close_hz: number;
  duration_ms: number;
  ramp_ms: number;
  sample_rate: number;
  bits: number;
  peak_dbfs: number;
}

export function QUINDAR_FILES(q: QuindarParams): [string, number][] {
  return [['quindar-open.wav', q.open_hz], ['quindar-close.wav', q.close_hz]];
}

/** A 16-bit mono PCM WAV of one sine tone with linear ramps, byte-for-byte deterministic. */
export function quindarWav(hz: number, q: QuindarParams): Buffer {
  if (q.bits !== 16) throw new Error('quindarWav: only 16-bit output is implemented');
  const n = Math.round((q.duration_ms / 1000) * q.sample_rate);
  const ramp = Math.round((q.ramp_ms / 1000) * q.sample_rate);
  const peak = Math.pow(10, q.peak_dbfs / 20);
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    let env = 1;
    if (i < ramp) env = i / ramp;
    else if (i >= n - ramp) env = (n - 1 - i) / ramp;
    const s = Math.sin((2 * Math.PI * hz * i) / q.sample_rate) * peak * env;
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(q.sample_rate, 24);
  header.writeUInt32LE(q.sample_rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
