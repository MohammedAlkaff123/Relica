// Contact sheet: a grid of frames from one clip, to review it at a glance.
//   node sheet.mjs <clip> [every=10] [cols=5]   -> out/<clip>_sheet.jpg
import fs from 'node:fs';
import path from 'node:path';
import { launch, OUT } from './lib.mjs';
const [clip, every = '10', cols = '5'] = process.argv.slice(2);
const dir = path.join(OUT, clip);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort().filter((_, i) => i % +every === 0);
const html = `<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},1fr);gap:2px">` +
  files.map((f) => `<div style="position:relative"><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}" style="width:100%;display:block"><b style="position:absolute;left:4px;top:2px;color:#ff0;font:14px monospace;text-shadow:0 0 3px #000">${f.slice(0, 4)}</b></div>`).join('') + '</body>';
const browser = await launch();
const page = await browser.newPage();
await page.setViewport({ width: 1900, height: 1000 });
await page.setContent(html);
await page.screenshot({ path: path.join(OUT, clip + '_sheet.jpg'), type: 'jpeg', quality: 80, fullPage: true });
await browser.close();
console.log(files.length, 'frames ->', clip + '_sheet.jpg');
