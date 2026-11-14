// Graphics quality: Low / Medium / High. One runtime settings API. Owner: Set A.
//
//   quality.get()                 'low' | 'medium' | 'high'
//   quality.preset()              the current preset object from content/quality.json
//   await quality.set(level)      applies it: renderer now, then the active world; saves it
//   quality.subscribe(fn)         fn(level, preset) on every applied change; returns unsubscribe()
//   quality.levels                ['low', 'medium', 'high']
//
// Who does what (BRANDING_AND_ART_DIRECTION.md, Graphics quality):
//   Abdullatif's Settings menus only call get / set / subscribe. They never touch the 3D scene.
//   This file applies the renderer settings (drawing-buffer resolution, shadow map on/off and size)
//   and remembers the choice (localStorage "relica.quality"; works without storage too).
//   Abdulkarim's worlds receive the whole preset through env.applyQuality(preset, level) and
//   fx.applyQuality(preset, level) when they exist. Chapters call applyToStage for each new world,
//   so a newly loaded world always starts in the chosen mode.
//
// Rules from the brief: invalid or unreadable saved values fall back to the default; if applying fails,
// the previous working level stays; when the player clicks quickly, only the latest choice finishes;
// changes happen between frames; antialiasing is fixed when the renderer is made and is not switched.
const STORE = 'relica.quality';

export function createQuality({ renderer, scene, data }) {
  const levels = data.order ?? Object.keys(data.levels);
  const valid = (l) => typeof l === 'string' && levels.includes(l);
  const listeners = new Set();
  let token = 0;
  let stage = null; // the active chapter's stage, for its world hooks

  function saved() {
    try { const v = localStorage.getItem(STORE); return valid(v) ? v : null; } catch { return null; }
  }
  function save(l) {
    try { localStorage.setItem(STORE, l); } catch { /* storage unavailable: the choice lasts this visit */ }
  }

  const fromAddress = new URLSearchParams(location.search).get('quality');
  let level = valid(fromAddress) ? fromAddress : saved() ?? (valid(data.default) ? data.default : 'medium');

  function applyRenderer(preset) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, preset.pixelRatioCap ?? 2));
    const shadows = !!preset.shadows;
    if (renderer.shadowMap.enabled !== shadows) {
      renderer.shadowMap.enabled = shadows;
      // Materials compile shadow code once; recompile them for the new setting.
      scene.traverse((o) => {
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) m.needsUpdate = true;
      });
    }
    // Lights that cast shadows get the preset's map size; their old map is released.
    scene.traverse((o) => {
      if (o.isLight && o.castShadow && o.shadow && preset.shadowMapSize) {
        if (o.shadow.mapSize.x !== preset.shadowMapSize) {
          o.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
          o.shadow.map?.dispose();
          o.shadow.map = null;
        }
      }
    });
  }

  async function applyToStage(s, preset, l) {
    if (!s?.alive) return;
    await s.env?.applyQuality?.(preset, l);
    await s.fx?.applyQuality?.(preset, l);
  }

  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

  const quality = {
    levels,
    get: () => level,
    preset: () => data.levels[level],
    async set(l) {
      if (!valid(l)) throw new Error(`unknown graphics quality "${l}"`);
      const mine = ++token;
      const previous = level;
      await nextFrame(); // between frames
      if (mine !== token) return quality.get(); // a newer choice came in meanwhile
      try {
        applyRenderer(data.levels[l]);
        await applyToStage(stage, data.levels[l], l);
        if (mine !== token) return quality.get();
        level = l;
        save(l);
      } catch (err) {
        console.warn(`graphics quality "${l}" failed, keeping "${previous}"`, err);
        applyRenderer(data.levels[previous]);
        await applyToStage(stage, data.levels[previous], previous).catch(() => {});
        level = previous;
        throw err;
      }
      for (const fn of listeners) { try { fn(level, data.levels[level]); } catch (err) { console.warn(err); } }
      return level;
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    // Called by each new chapter after its world is built, so it starts in the chosen mode.
    attach(s) {
      stage = s;
      return applyToStage(s, data.levels[level], level).catch((err) => console.warn('world could not apply graphics quality', err));
    },
  };

  applyRenderer(data.levels[level]);
  return quality;
}
