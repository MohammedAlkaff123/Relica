// Makes the ground detail texture in the three sizes the quality presets ask for.
//   node make.mjs            (needs: npm install sharp)
//
// Source: "Rocks Ground 05" from Poly Haven, CC0 (public domain), 1k diffuse map.
//   https://polyhaven.com/a/rocks_ground_05
// Put the downloaded file next to this script as source/rocks_ground_05_diff_1k.jpg (not committed).
//
// We keep only how light or dark each pixel is, not its colour: the game multiplies this grey
// texture by each world's own ground colour, so the Moon stays grey and Mars stays red.
import fs from 'node:fs';
import sharp from 'sharp';

const SOURCE = 'source/rocks_ground_05_diff_1k.jpg';
const OUT = '../../public/textures';
const CONTRAST = 1.5;  // how strongly the photo's light and dark show
const LEVEL = 0.82;    // the average brightness of the result (1 would leave no room for highlights)

fs.mkdirSync(OUT, { recursive: true });
for (const size of [256, 512, 1024]) {
  const { data } = await sharp(SOURCE).resize(size, size, { kernel: 'lanczos3' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (const v of data) sum += v;
  const mean = sum / data.length / 255;
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) out[i] = Math.round(Math.max(0, Math.min(1, LEVEL + (data[i] / 255 - mean) * CONTRAST)) * 255);
  const file = `${OUT}/ground_detail_${size}.jpg`;
  await sharp(out, { raw: { width: size, height: size, channels: 1 } }).jpeg({ quality: 84, mozjpeg: true }).toFile(file);
  console.log(file, (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
}
