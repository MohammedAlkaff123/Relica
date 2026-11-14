// One runtime API for UI, renderer and worlds. Serialize swaps so late texture requests
// cannot override a newer setting or leave a newly entered chapter at the wrong quality.
const STORE = 'relica.quality';
export function createQuality({ renderer, scene, data }) {
  const levels = data.order, valid = (l) => typeof l === 'string' && levels.includes(l);
  const listeners = new Set();
  let token = 0, stage = null, queue = Promise.resolve();
  const enqueue = (fn) => { const result = queue.then(fn); queue = result.catch(() => {}); return result; };
  let saved;
  try { saved = localStorage.getItem(STORE); } catch {}
  const query = new URLSearchParams(location.search).get('quality');
  let level = valid(query) ? query : valid(saved) ? saved : data.default;
  function applyRenderer(preset) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, preset.pixelRatioCap));
    if (renderer.shadowMap.enabled !== preset.shadows) {
      renderer.shadowMap.enabled = preset.shadows;
      scene.traverse((o) => {
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => { m.needsUpdate = true; });
      });
    }
    renderer.shadowMap.needsUpdate = true;
  }
  async function applyStage(s, l) {
    if (!s?.alive) return;
    // Retry a failed initial request. A failed switch retains the last working texture.
    await s.env?.ready?.catch(() => {});
    if (!s.alive) return;
    await s.env?.applyQuality?.(data.levels[l], l);
    if (!s.alive) return;
    await s.fx?.applyQuality?.(data.levels[l], l);
  }
  async function applyCurrent(l) {
    let current;
    do { current = stage; await applyStage(current, l); } while (current !== stage);
    applyRenderer(data.levels[l]);
  }
  const quality = {
    levels,
    get: () => level,
    preset: () => data.levels[level],
    set(l) {
      if (!valid(l)) return Promise.reject(new Error('unknown graphics quality "' + l + '"'));
      const mine = ++token;
      return enqueue(async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (mine !== token) return level;
        const previous = level;
        try {
          await applyCurrent(l);
          if (mine !== token) { await applyCurrent(previous); return level; }
          level = l;
          try { localStorage.setItem(STORE, level); } catch {}
        } catch (error) {
          await applyCurrent(previous).catch(() => {});
          applyRenderer(data.levels[previous]);
          throw error;
        }
        for (const fn of listeners) { try { fn(level, data.levels[level]); } catch (error) { console.warn(error); } }
        return level;
      });
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    attach(s) {
      stage = s;
      return enqueue(async () => {
        if (stage !== s || !s.alive) return;
        await applyStage(s, level);
        applyRenderer(data.levels[level]);
      });
    },
  };
  applyRenderer(data.levels[level]);
  return quality;
}
