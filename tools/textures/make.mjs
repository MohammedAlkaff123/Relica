// Approved G / Ready-made (CC0) / Our palette. npm install sharp, then node make.mjs.
// Source download is cached locally; only the three derived JPEGs ship with the game.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const dir = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(dir, 'source/sand_01_diff_1k.jpg');
const out = path.resolve(dir, '../../public/textures');
const url = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sand_01/sand_01_diff_1k.jpg';
await fs.mkdir(path.dirname(source), { recursive: true });
await fs.mkdir(out, { recursive: true });
try { await fs.access(source); } catch {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Texture download failed: ' + response.status);
  await fs.writeFile(source, Buffer.from(await response.arrayBuffer()));
}
const original = await fs.readFile(source);
for (const size of [256, 512, 1024]) {
  const { data, info } = await sharp(original).removeAlpha().toColourspace('srgb')
    .resize(size, size, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const lum = new Float32Array(size * size);
  let sum = 0;
  for (let i = 0; i < lum.length; i++) {
    const p = i * info.channels;
    lum[i] = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
    sum += lum[i];
  }
  const mean = sum / lum.length, pixels = Buffer.alloc(lum.length);
  for (let i = 0; i < lum.length; i++) pixels[i] = Math.round(Math.max(0, Math.min(1, 0.82 + (lum[i] - mean) * 1.5)) * 255);
  const file = path.join(out, 'ground_detail_' + size + '.jpg');
  await sharp(pixels, { raw: { width: size, height: size, channels: 1 } }).jpeg({ quality: 84, mozjpeg: true }).toFile(file);
  console.log(size + ': ' + (await fs.stat(file)).size + ' bytes');
}
console.log('Source SHA-256: ' + createHash('sha256').update(original).digest('hex'));
