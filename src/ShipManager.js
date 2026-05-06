// Ship cosmetic chassis. Six slots — hull / wings / paint / decal / pattern / trail.
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
  { id: 'paint_default', slot: 'paint', name: 'Steel',    price: 0,  isDefault: true, color: 0xb6c2cf },
  { id: 'paint_crimson', slot: 'paint', name: 'Crimson',  price: 30, color: 0xff5b6e },
  { id: 'paint_aqua',    slot: 'paint', name: 'Aqua',     price: 30, color: 0x4ecdc4 },
  { id: 'paint_sunburst', slot: 'paint', name: 'Sunburst', price: 40, color: 0xffb142 },
  { id: 'paint_void',    slot: 'paint', name: 'Void',     price: 60, color: 0x6c2bd9 },

  // decal (small icon stuck on the hull)
  { id: 'decal_star', slot: 'decal', name: 'Star Decal', price: 25, color: 0xf7dc6f },

  // patterns (overlay design on the hull)
  { id: 'pattern_none',         slot: 'pattern', name: 'No Pattern',     price: 0,  isDefault: true, color: 0x000000 },
  { id: 'pattern_stripes',      slot: 'pattern', name: 'Racing Stripes', price: 60, color: 0xffffff, color2: 0x07071a },
  { id: 'pattern_stars',        slot: 'pattern', name: 'Star Field',     price: 70, color: 0xffd86b },
  { id: 'pattern_galaxy_swirl', slot: 'pattern', name: 'Galaxy Swirl',   price: 90, color: 0xc77eff, color2: 0x4ecdc4 },

  // engine trails (particles emitted behind the booster)
  { id: 'trail_default_flame', slot: 'trail', name: 'Standard Flame', price: 0,  isDefault: true, color: 0xff8b3d },
  { id: 'trail_fire_swirl',    slot: 'trail', name: 'Fire Swirl',     price: 50, color: 0xff5b3d },
  { id: 'trail_rainbow',       slot: 'trail', name: 'Rainbow Streak', price: 80, color: 0xff5577 },
  { id: 'trail_comet',         slot: 'trail', name: 'Comet Sparkle',  price: 80, color: 0xffffff },
  { id: 'trail_galaxy',        slot: 'trail', name: 'Galaxy Dust',    price: 100, color: 0xc77eff },

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

  // Adds + equips in a single save. Avoids two localStorage writes for the
  // common buy-and-equip flow.
  addAndEquip(partId) {
    const part = SHIP_PARTS.find(p => p.id === partId);
    if (!part) return false;
    if (!this.ownsPart(partId)) {
      progress.ship.ownedParts.push(partId);
      if (!progress.ship.newSinceLastView.includes(partId)) {
        progress.ship.newSinceLastView.push(partId);
      }
    }
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
