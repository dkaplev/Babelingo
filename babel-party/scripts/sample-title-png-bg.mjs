#!/usr/bin/env node
/**
 * Samples flat background from babelingo-title.png (may be JPEG data with .png extension).
 */
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode as decodeJpeg } from 'jpeg-js';
import { PNG } from 'pngjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imgPath = join(root, 'assets/images/babelingo-title.png');
const buf = fs.readFileSync(imgPath);

let width;
let height;
let data;

if (buf[0] === 0xff && buf[1] === 0xd8) {
  const raw = decodeJpeg(buf, { useTArray: true });
  width = raw.width;
  height = raw.height;
  data = raw.data;
} else {
  const png = PNG.sync.read(buf);
  width = png.width;
  height = png.height;
  data = png.data;
}

let r = 0,
  g = 0,
  b = 0,
  n = 0;
const sampleH = Math.min(80, height);
const sampleW = Math.min(200, width);
const stride = buf[0] === 0xff ? 4 : 4;
for (let y = 0; y < sampleH; y++) {
  for (let x = 0; x < sampleW; x++) {
    const i = (width * y + x) * stride;
    const a = stride === 4 ? data[i + 3] : 255;
    if (a < 200) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
}
if (n === 0) {
  console.error('No opaque pixels in corner sample');
  process.exit(1);
}
r = Math.round(r / n);
g = Math.round(g / n);
b = Math.round(b / n);
const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
console.log(JSON.stringify({ hex, rgb: [r, g, b], pixels: n, width, height }, null, 2));
