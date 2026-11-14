// The three graphics presets: Low, Medium, High. Owner: Set B.
//
// This is the one place the numbers live. Nothing here touches the renderer or a mesh by itself:
//   - Set B's worlds and effects read a preset in  env.applyQuality(level)  and  fx.applyQuality(level)
//   - Set A's runtime settings read the renderer part with  applyRendererQuality(renderer, level)
//   - Set C's menu only needs QUALITY_LEVELS and the level name
//
// Wiring it up (Set A), once the menu calls quality.set(level):
//   applyRendererQuality(ctx.renderer, level);      // pixel ratio and shadow maps
//   stage.env.applyQuality(level);                  // the world that is loaded now
//   stage.fx.applyQuality(level);                   // its dust, storm and shadow
// and pass the level to worlds loaded later:
//   buildWorld(name, scene, { quality: level });  createEffects({ ..., quality: level });
// Until that exists, add ?quality=low (or medium, high) to the address to try a level.
//
// The same land, landmarks, routes, faces and mission targets exist at every level. Only decoration,
// texture size, shadow method and particle counts change. Low is a finished look, not a placeholder.

export const QUALITY_LEVELS = ['low', 'medium', 'high'];
export const DEFAULT_QUALITY = 'medium';

export const QUALITY = {
  low: {
    pixelRatio: 1.0,     // cap on the drawing buffer; menus and text stay at full sharpness
    shadowMap: 0,        // no shadow map: a soft dark patch under the hero, the props and each rock
    shadowRange: 0,
    textureSize: 256,    // the shared ground detail texture, in pixels
    rocks: 0.55,         // share of each world's standard number of decorative rocks
    pebbles: 0,          // small stones near the route
    dust: 0.25,          // share of the dust pool (the pool is fixed at DUST_POOL specks)
    stormSpecks: 90,     // blowing specks in the Mars storm; the fog and the dimmed Sun do the real work
    stars: 0.45,         // share of the stars
    starBand: 0.3,       // share of the faint band of stars in deep space
  },
  medium: {
    pixelRatio: 1.5,
    shadowMap: 1024,     // one Sun shadow map, kept to a box that follows the hero
    shadowRange: 30,     // half the width of that box, in metres
    textureSize: 512,
    rocks: 1,
    pebbles: 260,
    dust: 0.5,
    stormSpecks: 180,
    stars: 0.75,
    starBand: 0.6,
  },
  high: {
    pixelRatio: 2.0,
    shadowMap: 2048,
    shadowRange: 40,
    textureSize: 1024,
    rocks: 1.6,
    pebbles: 700,
    dust: 1,
    stormSpecks: 320,
    stars: 1,
    starBand: 1,
  },
};

export const DUST_POOL = 600; // the most dust specks ever alive at once, at High

// Any saved or typed value becomes one of the three names; anything else is the default.
export function normalizeQuality(level) {
  return QUALITY_LEVELS.includes(level) ? level : DEFAULT_QUALITY;
}

export function presetFor(level) {
  return QUALITY[normalizeQuality(level)];
}

// The level a world starts with when nobody passes one: ?quality=... in the address, else Medium.
export function initialQuality() {
  try {
    return normalizeQuality(new URLSearchParams(globalThis.location?.search ?? '').get('quality'));
  } catch {
    return DEFAULT_QUALITY;
  }
}

// The renderer's share of a preset. Shadow maps are switched on here; each world decides what casts.
// Antialiasing is left alone: it can only be chosen when the renderer is created.
export function applyRendererQuality(renderer, level) {
  const preset = presetFor(level);
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio ?? 1, preset.pixelRatio));
  const on = preset.shadowMap > 0;
  if (renderer.shadowMap.enabled !== on) {
    renderer.shadowMap.enabled = on;
    renderer.shadowMap.needsUpdate = true;
  }
  return preset;
}
