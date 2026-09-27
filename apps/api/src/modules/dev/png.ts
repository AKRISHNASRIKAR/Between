import { deflateSync } from "node:zlib";

/** Tiny PNG encoder for dev placeholder photos: a soft two-colour diagonal gradient + sun. */
export function placeholderPng(
  w: number,
  h: number,
  a: [number, number, number],
  b: [number, number, number],
): Uint8Array<ArrayBuffer> {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  const sun = { x: w * 0.7, y: h * 0.35, r: Math.min(w, h) * 0.14 };
  for (let y = 0; y < h; y++) {
    const row = y * (w * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < w; x++) {
      const t = (x / w + y / h) / 2;
      let px = [0, 1, 2].map((i) => Math.round((a[i] ?? 0) * (1 - t) + (b[i] ?? 0) * t));
      if ((x - sun.x) ** 2 + (y - sun.y) ** 2 < sun.r ** 2) px = [255, 253, 248];
      raw.set(px, row + 1 + x * 3);
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(Bun.hash.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  // Copy into a standalone ArrayBuffer (Buffer may share a pooled/SharedArrayBuffer).
  return new Uint8Array(png);
}
