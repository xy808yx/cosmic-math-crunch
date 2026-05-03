// Weekly rotating "featured" shop items. Each ISO week, a small subset of
// buyable items is highlighted as Featured. Items unchanged within the week.

import { PET_COSMETICS } from './CosmeticManager.js';
import { SHIP_PARTS } from './ShipManager.js';

const FEATURE_COUNT = 3;

function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function buyablePool() {
  return [
    ...PET_COSMETICS.filter(c => !c.unlock && c.price > 0),
    ...SHIP_PARTS.filter(p => !p.unlock && !p.isDefault && p.price > 0)
  ];
}

// Deterministic shuffle by week-number seed, return first FEATURE_COUNT IDs.
export function getFeaturedIds(date = new Date()) {
  const week = isoWeek(date);
  const pool = buyablePool();
  const indices = pool.map((_, i) => i);
  // Simple deterministic shuffle: rotate then reverse-by-bit using week
  const seed = week + date.getFullYear() * 53;
  for (let i = indices.length - 1; i > 0; i--) {
    const j = ((seed * (i + 13)) >>> 0) % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return new Set(indices.slice(0, FEATURE_COUNT).map(i => pool[i].id));
}
