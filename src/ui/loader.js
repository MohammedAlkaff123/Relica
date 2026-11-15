// The loading screen's real work: download every file in content/preload.json before the game starts,
// keep it in memory, and report true progress in bytes. Owner: Set C.
//
//   const files = await preloadAll((p) => { p.loaded, p.total, p.done, p.count, p.group })
//
// Kept in memory:
// - data, models, sounds' code: the bytes are kept, and window.fetch answers from memory for those
//   addresses, so GLTFLoader, loadJSON and every other fetch in the game read RAM, not the network;
// - photos and textures: decoded Image objects are kept alive, so the browser reuses them when the game
//   shows the same picture;
// - fonts: loaded into document.fonts.
// Nothing here is simulated: the bar moves only when bytes arrive.
const memory = new Map(); // absolute URL -> { bytes: ArrayBuffer, type }
const images = [];        // decoded images, kept so they stay in the browser's memory cache
const TYPES = { json: 'application/json', glb: 'model/gltf-binary', js: 'text/javascript', css: 'text/css', csv: 'text/csv', jpg: 'image/jpeg', png: 'image/png' };

let installed = false;
function installMemoryFetch() {
  if (installed) return;
  installed = true;
  const network = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      const url = new URL(typeof input === 'string' ? input : input.url, location.href);
      url.hash = '';
      const hit = memory.get(url.href);
      if (hit && (!init || !init.method || init.method === 'GET')) {
        return Promise.resolve(new Response(hit.bytes, { status: 200, headers: { 'Content-Type': hit.type, 'Content-Length': String(hit.bytes.byteLength) } }));
      }
    } catch { /* not a URL we know: use the network */ }
    return network(input, init);
  };
}

// Reads a response body chunk by chunk so the bar moves while a big file arrives.
async function download(url, onBytes) {
  const res = await fetch(url, { cache: 'default' });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  if (!res.body || !res.body.getReader) {
    const buf = await res.arrayBuffer();
    onBytes(buf.byteLength);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
    onBytes(value.byteLength);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.byteLength; }
  return out.buffer;
}

async function keepImage(url, bytes, type) {
  // Decode from the bytes we already have, then also warm the browser's image cache for that address.
  const blobUrl = URL.createObjectURL(new Blob([bytes], { type }));
  const a = new Image();
  a.src = blobUrl;
  await a.decode().catch(() => {});
  URL.revokeObjectURL(blobUrl);
  const b = new Image();
  b.src = url;
  await b.decode().catch(() => {});
  images.push(a, b);
}

async function keepFont(path, bytes) {
  if (!('fonts' in document) || typeof FontFace === 'undefined') return;
  const family = path.includes('Arabic') ? 'RelicaArabic' : 'RelicaInter';
  const weight = path.includes('Arabic') ? '100 900' : path.includes('600') ? '600' : '400';
  try {
    const face = new FontFace(family, bytes, { weight, display: 'swap' });
    await face.load();
    document.fonts.add(face);
  } catch { /* the CSS @font-face still loads it */ }
}

export async function preloadAll(onProgress = () => {}) {
  installMemoryFetch();
  const manifest = await (await fetch('content/preload.json', { cache: 'no-store' })).json();
  const files = manifest.files;
  const total = manifest.total;
  let loaded = 0, done = 0;
  let group = files[0]?.group ?? 'code';
  const report = () => onProgress({ loaded: Math.min(loaded, total), total, done, count: files.length, group });
  report();

  // A few at a time: fast on a good connection, gentle on a slow one, and errors stay readable.
  const queue = files.slice();
  const failed = [];
  async function worker() {
    while (queue.length) {
      const f = queue.shift();
      group = f.group;
      const url = new URL(f.path, location.href).href;
      let got = 0;
      try {
        const bytes = await download(url, (n) => { got += n; loaded += n; report(); });
        const ext = f.path.split('.').pop().toLowerCase();
        const type = TYPES[ext] ?? 'application/octet-stream';
        if (f.group === 'photos' || f.group === 'textures') {
          if (ext === 'jpg' || ext === 'png') await keepImage(url, bytes, type);
          else memory.set(url, { bytes, type });
        } else if (f.group === 'fonts') await keepFont(f.path, bytes);
        else memory.set(url, { bytes, type });
        // The real size can differ from the manifest (compression): count the file as exactly done.
        loaded += f.bytes - got;
      } catch (err) {
        loaded -= got;
        failed.push(f.path);
        console.warn('preload failed', f.path, err);
      }
      done++;
      report();
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  if (failed.length) {
    const err = new Error(`${failed.length} files could not load`);
    err.failed = failed;
    throw err;
  }
  return { files: files.length, bytes: total };
}

export const preloaded = { memory, images };
