// Shared helpers: read a GLB into a flat list of world-space triangles with one plain colour each.
import sharp from 'sharp';
import { makeIO } from './io.mjs';

const srgb2lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

function mulPoint(m, x, y, z) {
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
}

// Returns { tris: [{ p: Float64Array(9), color: [r,g,b] linear, node, mat }] }
export async function loadTriangles(file) {
  const io = await makeIO();
  const doc = await io.read(file);
  const texCache = new Map();
  async function pixels(tex) {
    if (!texCache.has(tex)) {
      const { data, info } = await sharp(Buffer.from(tex.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      texCache.set(tex, { data, w: info.width, h: info.height });
    }
    return texCache.get(tex);
  }
  const tris = [];
  const nodes = [];
  doc.getRoot().listScenes()[0].traverse((n) => { if (n.getMesh()) nodes.push(n); });
  // "grandparent/parent/node": lets a model pick out everything under one named node.
  const pathOf = (n) => { const out = []; for (let p = n; p && p.getName; p = p.getParentNode ? p.getParentNode() : null) out.unshift(p.getName()); return out.join('/'); };
  for (const node of nodes) {
    const m = node.getWorldMatrix();
    const path = pathOf(node);
    for (const prim of node.getMesh().listPrimitives()) {
      if (prim.getMode() !== 4) continue; // triangles only
      const pos = prim.getAttribute('POSITION');
      const uv = prim.getAttribute('TEXCOORD_0');
      const idx = prim.getIndices();
      const mat = prim.getMaterial();
      const f = mat ? mat.getBaseColorFactor() : [0.8, 0.8, 0.8, 1];
      const tex = mat && uv ? mat.getBaseColorTexture() : null;
      const img = tex ? await pixels(tex) : null;
      const count = idx ? idx.getCount() : pos.getCount();
      const sample = (vi) => {
        if (!img) return [1, 1, 1];
        const [u, v] = uv.getElement(vi, []);
        const x = Math.min(img.w - 1, Math.floor((((u % 1) + 1) % 1) * img.w));
        const y = Math.min(img.h - 1, Math.floor((((v % 1) + 1) % 1) * img.h));
        const o = (y * img.w + x) * 4;
        return [srgb2lin(img.data[o] / 255), srgb2lin(img.data[o + 1] / 255), srgb2lin(img.data[o + 2] / 255)];
      };
      // One colour for the whole primitive: the average of the texture where its vertices sit.
      let acc = [0, 0, 0], nS = 0;
      const step = Math.max(1, Math.floor(pos.getCount() / 400));
      for (let vi = 0; vi < pos.getCount(); vi += step) { const c = sample(vi); acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; nS++; }
      const color = [f[0] * acc[0] / nS, f[1] * acc[1] / nS, f[2] * acc[2] / nS];
      for (let i = 0; i + 2 < count; i += 3) {
        const p = new Float64Array(9);
        for (let k = 0; k < 3; k++) {
          const vi = idx ? idx.getScalar(i + k) : i + k;
          const e = pos.getElement(vi, []);
          p.set(mulPoint(m, e[0], e[1], e[2]), k * 3);
        }
        tris.push({ p, color, node: node.getName(), path, mat: mat ? mat.getName() : '' });
      }
    }
  }
  return tris;
}

export function bounds(tris) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const t of tris) for (let i = 0; i < 9; i++) { const a = i % 3; if (t.p[i] < min[a]) min[a] = t.p[i]; if (t.p[i] > max[a]) max[a] = t.p[i]; }
  return { min, max, size: max.map((v, i) => v - min[i]), center: max.map((v, i) => (v + min[i]) / 2) };
}

export function centroid(t) { return [(t.p[0] + t.p[3] + t.p[6]) / 3, (t.p[1] + t.p[4] + t.p[7]) / 3, (t.p[2] + t.p[5] + t.p[8]) / 3]; }

// Weld by position. Returns { positions: Float32Array, indices: Uint32Array }.
export function weld(tris, eps) {
  const map = new Map(); const pos = []; const indices = new Uint32Array(tris.length * 3);
  tris.forEach((t, ti) => {
    for (let k = 0; k < 3; k++) {
      const x = t.p[k * 3], y = t.p[k * 3 + 1], z = t.p[k * 3 + 2];
      const key = Math.round(x / eps) + '_' + Math.round(y / eps) + '_' + Math.round(z / eps);
      let id = map.get(key);
      if (id === undefined) { id = pos.length / 3; pos.push(x, y, z); map.set(key, id); }
      indices[ti * 3 + k] = id;
    }
  });
  return { positions: new Float32Array(pos), indices };
}

// Connected pieces of the mesh. Sets t.comp on every triangle and returns the pieces, biggest first.
export function components(tris, eps) {
  const { positions, indices } = weld(tris, eps);
  const parent = new Int32Array(positions.length / 3).map((_, i) => i);
  const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  for (let i = 0; i < indices.length; i += 3) {
    const a = find(indices[i]), b = find(indices[i + 1]), c = find(indices[i + 2]);
    parent[b] = a; parent[find(c)] = a;
  }
  const groups = new Map();
  tris.forEach((t, ti) => { const r = find(indices[ti * 3]); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(t); });
  const list = [...groups.values()].sort((a, b) => b.length - a.length);
  list.forEach((g, i) => g.forEach((t) => (t.comp = i)));
  return list;
}
