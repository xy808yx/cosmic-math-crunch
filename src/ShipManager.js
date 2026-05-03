// Ship cosmetic chassis. Four slots — hull / wings / paint / decal.
// Defaults are owned for free; alternates are bought in the shop.

import { progress } from './GameData.js';

export const SHIP_PARTS = [
  // hulls
  { id: 'hull_default', slot: 'hull',  name: 'Standard Hull',  price: 0,  isDefault: true,  color: 0xb6c2cf },
  { id: 'hull_round',   slot: 'hull',  name: 'Bubble Hull',    price: 50, color: 0xffd86b },

  // wings
  { id: 'wings_default', slot: 'wings', name: 'Stub Wings',  price: 0,  isDefault: true, color: 0x8b9bb4 },
  { id: 'wings_swept',   slot: 'wings', name: 'Swept Wings', price: 50, color: 0xff8b3d },

  // paints (recolor the body fill)
  { id: 'paint_default', slot: 'paint', name: 'Steel',   price: 0,  isDefault: true, color: 0xb6c2cf },
  { id: 'paint_crimson', slot: 'paint', name: 'Crimson', price: 30, color: 0xff5b6e },
  { id: 'paint_aqua',    slot: 'paint', name: 'Aqua',    price: 30, color: 0x4ecdc4 },

  // decal (small icon stuck on the hull)
  { id: 'decal_star', slot: 'decal', name: 'Star Decal', price: 25, color: 0xf7dc6f },

  // Milestone-only paint — granted via 30-day streak, not buyable.
  { id: 'paint_galaxy', slot: 'paint', name: 'Galaxy', price: 0, color: 0x9d6bff, unlock: { type: 'streak', days: 30 } }
];

class ShipManager {
  getCurrentParts() {
    return { ...progress.ship.parts };
  }

  ownsPart(partId) {
    return progress.ship.ownedParts.includes(partId);
  }

  addOwnedPart(partId) {
    if (this.ownsPart(partId)) return;
    progress.ship.ownedParts.push(partId);
    if (!progress.ship.newSinceLastView.includes(partId)) {
      progress.ship.newSinceLastView.push(partId);
    }
    progress.save();
  }

  equipPart(partId) {
    const part = SHIP_PARTS.find(p => p.id === partId);
    if (!part || !this.ownsPart(partId)) return false;
    progress.ship.parts[part.slot] = partId;
    progress.save();
    return true;
  }

  isNew(partId) {
    return progress.ship.newSinceLastView.includes(partId);
  }

  markSeen(partId) {
    const i = progress.ship.newSinceLastView.indexOf(partId);
    if (i >= 0) {
      progress.ship.newSinceLastView.splice(i, 1);
      progress.save();
    }
  }
}

export const ship = new ShipManager();
