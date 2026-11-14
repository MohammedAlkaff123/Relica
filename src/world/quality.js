// Shared data used by the renderer, worlds and effects; no second set of preset values.
import { loadJSON } from '../core/content.js';
export const QUALITY_DATA = await loadJSON('content/quality.json');
export const QUALITY_LEVELS = QUALITY_DATA.order;
export const DEFAULT_QUALITY = QUALITY_DATA.default;
export const DUST_POOL = 600;
export const normalizeQuality = (level) => QUALITY_LEVELS.includes(level) ? level : DEFAULT_QUALITY;
export const presetFor = (level) => QUALITY_DATA.levels[normalizeQuality(level)];
export function initialQuality() {
  const query = new URLSearchParams(globalThis.location?.search ?? '').get('quality');
  if (QUALITY_LEVELS.includes(query)) return query;
  try { return normalizeQuality(localStorage.getItem('relica.quality')); } catch { return DEFAULT_QUALITY; }
}
