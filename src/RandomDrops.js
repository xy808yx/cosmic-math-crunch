// Surprise cosmetic drops at level end. Drop chance scales with stars earned.
// Drops are pulled from the buyable shop catalogs — milestone-only items never drop.

import { cosmetics, PET_COSMETICS } from './CosmeticManager.js';
import { ship, SHIP_PARTS } from './ShipManager.js';

const DROP_CHANCE = { 1: 0.05, 2: 0.12, 3: 0.22 };

function buyableShipParts() {
  return SHIP_PARTS.filter(p => !p.unlock && !p.isDefault && p.price > 0);
}

function buyablePetCosmetics() {
  return PET_COSMETICS.filter(c => !c.unlock && c.price > 0);
}

// Roll a drop. Returns { kind, item } or null. Skips items already owned.
export function rollLevelEndDrop(stars) {
  const chance = DROP_CHANCE[stars] || 0;
  if (Math.random() >= chance) return null;

  // Pool: unowned buyable items across both catalogs
  const petPool = buyablePetCosmetics().filter(c => !cosmetics.ownsItem(c.id));
  const shipPool = buyableShipParts().filter(p => !ship.ownsPart(p.id));
  const pool = [
    ...petPool.map(item => ({ kind: 'pet', item })),
    ...shipPool.map(item => ({ kind: 'ship', item }))
  ];
  if (pool.length === 0) return null;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (pick.kind === 'pet') {
    cosmetics.addOwned(pick.item.id);
  } else {
    ship.addOwnedPart(pick.item.id);
  }
  return pick;
}
