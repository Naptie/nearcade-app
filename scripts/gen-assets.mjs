// Generates app icons/splash as PNGs using only Node built-ins (zlib).
// Dark rounded square + neon "joystick" glyph, drawn on a raw pixel buffer.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // depth
  ihdr[9] = 6; // RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const BG = [14, 16, 22, 255]; // #0E1016
const PINK = [255, 62, 142, 255];
const CYAN = [56, 224, 255, 255];
const WHITE = [240, 242, 248, 255];

function draw(size) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const o = (y * size + x) * 4;
    px[o] = c[0];
    px[o + 1] = c[1];
    px[o + 2] = c[2];
    px[o + 3] = c[3];
  };
  const rect = (x0, y0, x1, y1, c) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c);
  };
  const s = size / 1024;
  // background
  rect(0, 0, size - 1, size - 1, BG);
  // joystick base (pink)
  rect(Math.round(300 * s), Math.round(700 * s), Math.round(724 * s), Math.round(790 * s), PINK);
  // stick (cyan)
  rect(Math.round(480 * s), Math.round(330 * s), Math.round(544 * s), Math.round(700 * s), CYAN);
  // ball (pink)
  const cx = 512 * s, cy = 290 * s, r = 120 * s;
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r) set(Math.round(cx + x), Math.round(cy + y), PINK);
  // ball highlight
  const hr = 34 * s, hx = 468 * s, hy = 246 * s;
  for (let y = -hr; y <= hr; y++)
    for (let x = -hr; x <= hr; x++)
      if (x * x + y * y <= hr * hr) set(Math.round(hx + x), Math.round(hy + y), WHITE);
  // base feet accent (cyan)
  rect(Math.round(300 * s), Math.round(790 * s), Math.round(724 * s), Math.round(812 * s), CYAN);
  return px;
}

const outDir = join(root, 'assets', 'images');
mkdirSync(outDir, { recursive: true });
for (const [name, size] of [
  ['icon.png', 1024],
  ['adaptive-icon.png', 1024],
  ['splash-icon.png', 512],
  ['favicon.png', 64],
]) {
  writeFileSync(join(outDir, name), encodePNG(size, size, draw(size)));
  console.log('wrote', name);
}
