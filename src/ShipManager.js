// Ship cosmetic chassis. Six slots — hull / wings / paint / decal / pattern / trail.
// Defaults are owned for free; alternates are bought in the shop.

import { progress } from './GameData.js';

export const SHIP_PARTS = [
  // hulls
  { id: 'hull_default', slot: 'hull',  name: 'Standard Hull',  price: 0,  isDefault: true,  color: 0xb6c2cf, rarity: 'common' },
  { id: 'hull_round',   slot: 'hull',  name: 'Bubble Hull',    price: 100, color: 0xffd86b, rarity: 'common' },
  { id: 'hull_sleek',   slot: 'hull',  name: 'Sleek Hull',     price: 150, color: 0x9be8a3, rarity: 'common' },
  { id: 'hull_bulky',   slot: 'hull',  name: 'Bulky Hull',     price: 250, color: 0xff9ec7, rarity: 'rare' },
  { id: 'hull_vortex',  slot: 'hull',  name: 'Vortex Hull',    price: 1500, color: 0xc77eff, rarity: 'legendary' },
  { id: 'hull_wraith',  slot: 'hull',  name: 'Wraith Hull',    price: 1500, color: 0xa6f0e8, rarity: 'legendary' },

  // wings
  { id: 'wings_default', slot: 'wings', name: 'Stub Wings',  price: 0,   isDefault: true, color: 0x8b9bb4, rarity: 'common' },
  { id: 'wings_swept',   slot: 'wings', name: 'Swept Wings', price: 100, color: 0xff8b3d, rarity: 'common' },
  { id: 'wings_wide',    slot: 'wings', name: 'Wide Wings',  price: 150, color: 0xb5e6ff, rarity: 'common' },
  { id: 'wings_stub',    slot: 'wings', name: 'Snub Wings',  price: 250, color: 0xd5a6ff, rarity: 'rare' },
  { id: 'wings_phantom', slot: 'wings', name: 'Phantom Wings', price: 1500, color: 0xfff3b8, rarity: 'legendary' },

  // paints (recolor the body fill — some paints carry an embedded `pattern`
  // that the renderer overlays on top, replacing the old separate pattern slot)
  { id: 'paint_default', slot: 'paint', name: 'Steel',    price: 0,  isDefault: true, color: 0xb6c2cf, rarity: 'common' },
  { id: 'paint_crimson', slot: 'paint', name: 'Crimson',  price: 50, color: 0xff5b6e, rarity: 'common' },
  { id: 'paint_aqua',    slot: 'paint', name: 'Aqua',     price: 50, color: 0x4ecdc4, rarity: 'common' },
  { id: 'paint_sunburst', slot: 'paint', name: 'Sunburst', price: 100, color: 0xffb142, rarity: 'common' },
  { id: 'paint_void',    slot: 'paint', name: 'Void',     price: 150, color: 0x6c2bd9, rarity: 'common' },
  { id: 'paint_mint',    slot: 'paint', name: 'Mint',     price: 100, color: 0x9be8a3, rarity: 'common' },
  { id: 'paint_coral',   slot: 'paint', name: 'Coral',    price: 100, color: 0xffae8a, rarity: 'common' },
  // Patterned common paints
  { id: 'paint_racing',     slot: 'paint', name: 'Racing Stripes', price: 200, color: 0x07071a, color2: 0xffffff, pattern: 'pattern_stripes', rarity: 'common' },
  { id: 'paint_checkered',  slot: 'paint', name: 'Checkered',      price: 200, color: 0x12122a, color2: 0xffffff, pattern: 'pattern_checkered', rarity: 'common' },
  { id: 'paint_starfield',  slot: 'paint', name: 'Star Field',     price: 250, color: 0x12122a, color2: 0xffd86b, pattern: 'pattern_stars', rarity: 'common' },
  // Rare paints (some patterned)
  { id: 'paint_shadow',  slot: 'paint', name: 'Shadow',   price: 250, color: 0x4a2a55, rarity: 'rare' },
  { id: 'paint_blaze',   slot: 'paint', name: 'Blaze',    price: 350, color: 0xff5b3d, color2: 0xffe07a, pattern: 'pattern_flames', rarity: 'rare' },
  { id: 'paint_sweetheart', slot: 'paint', name: 'Sweetheart', price: 350, color: 0xff9ec7, color2: 0xffffff, pattern: 'pattern_hearts', rarity: 'rare' },
  { id: 'paint_galaxy_swirl', slot: 'paint', name: 'Galaxy Swirl', price: 500, color: 0x4a2a55, color2: 0xc77eff, color3: 0x4ecdc4, pattern: 'pattern_galaxy_swirl', rarity: 'rare' },
  { id: 'paint_frostbite',    slot: 'paint', name: 'Frostbite',    price: 350, color: 0x6ba8d8, color2: 0xeaf6ff, pattern: 'pattern_frost', rarity: 'rare' },
  // Legendary paints
  { id: 'paint_holo',    slot: 'paint', name: 'Holo',     price: 1200, color: 0xfce7ff, rarity: 'legendary' },
  { id: 'paint_cosmic',  slot: 'paint', name: 'Cosmic',   price: 1500, color: 0x12122a, color2: 0xfff3b8, color3: 0xc77eff, pattern: 'pattern_cosmic', rarity: 'legendary' },

  // decal (small icon stuck on the hull)
  { id: 'decal_star',  slot: 'decal', name: 'Star Decal',  price: 50,  color: 0xf7dc6f, rarity: 'common' },
  { id: 'decal_heart', slot: 'decal', name: 'Heart Decal', price: 75,  color: 0xff9ec7, rarity: 'common' },
  { id: 'decal_crown', slot: 'decal', name: 'Crown Decal', price: 100, color: 0xffe07a, rarity: 'common' },
  { id: 'decal_bolt',  slot: 'decal', name: 'Bolt Decal',  price: 100, color: 0xfff3b8, rarity: 'common' },
  { id: 'decal_skull', slot: 'decal', name: 'Skull Decal', price: 250, color: 0xffffff, rarity: 'rare' },
  { id: 'decal_comet', slot: 'decal', name: 'Comet Decal', price: 350, color: 0xb6e0ff, rarity: 'rare' },
  { id: 'decal_phoenix',      slot: 'decal', name: 'Phoenix Decal', price: 1500, color: 0xff8b3d, rarity: 'legendary' },
  { id: 'decal_galaxy_swirl', slot: 'decal', name: 'Galaxy Decal',  price: 1500, color: 0xc77eff, rarity: 'legendary' },

  // patterns are now folded into paints (see paint_racing, paint_blaze, etc.).
  // Keep pattern_none as the default record so legacy progress.ship.parts.pattern
  // values still resolve, but it's never shown in the shop.
  { id: 'pattern_none', slot: 'pattern', name: 'No Pattern', price: 0, isDefault: true, color: 0x000000, rarity: 'common' },

  // engine trails (particles emitted behind the booster)
  { id: 'trail_default_flame', slot: 'trail', name: 'Standard Flame', price: 0,   isDefault: true, color: 0xff8b3d, rarity: 'common' },
  { id: 'trail_fire_swirl',    slot: 'trail', name: 'Fire Swirl',     price: 100, color: 0xff5b3d, rarity: 'common' },
  { id: 'trail_lightning',     slot: 'trail', name: 'Lightning',      price: 100, color: 0xfff3b8, rarity: 'common' },
  { id: 'trail_bubbles',       slot: 'trail', name: 'Bubbles',        price: 100, color: 0xb6e0ff, rarity: 'common' },
  // 5 NEW TRAILS — designed to match the existing particle-emitter style.
  { id: 'trail_starlight',     slot: 'trail', name: 'Starlight',      price: 100, color: 0xfff3b8, rarity: 'common' },
  { id: 'trail_pixel_smoke',   slot: 'trail', name: '8-Bit Smoke',    price: 100, color: 0xc8c8d8, rarity: 'common' },
  { id: 'trail_neon_grid',     slot: 'trail', name: 'Neon Grid',      price: 250, color: 0x4ecdc4, rarity: 'rare' },
  { id: 'trail_snowflake',     slot: 'trail', name: 'Snowflakes',     price: 350, color: 0xffffff, rarity: 'rare' },
  { id: 'trail_pixel_lava',    slot: 'trail', name: 'Pixel Lava',     price: 1500, color: 0xff5b3d, rarity: 'legendary' },
  // Original additions
  { id: 'trail_rainbow',       slot: 'trail', name: 'Rainbow Streak', price: 250, color: 0xff5577, rarity: 'rare' },
  { id: 'trail_comet',         slot: 'trail', name: 'Comet Sparkle',  price: 250, color: 0xffffff, rarity: 'rare' },
  { id: 'trail_galaxy',        slot: 'trail', name: 'Galaxy Dust',    price: 350, color: 0xc77eff, rarity: 'rare' },
  { id: 'trail_notes',         slot: 'trail', name: 'Music Notes',    price: 250, color: 0xd5a6ff, rarity: 'rare' },
  { id: 'trail_petals',        slot: 'trail', name: 'Petals',         price: 250, color: 0xff9ec7, rarity: 'rare' },
  { id: 'trail_aurora',        slot: 'trail', name: 'Aurora',         price: 1500, color: 0xa6f0e8, rarity: 'legendary' },

  // Milestone-only paint — granted via 30-day streak, not buyable.
  { id: 'paint_galaxy', slot: 'paint', name: 'Galaxy', price: 0, color: 0x9d6bff, unlock: { type: 'streak', days: 30 }, rarity: 'legendary' }
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

  // Reset a slot back to its default. For nullable slots (decal), set to null.
  unequipSlot(slot) {
    const def = SHIP_PARTS.find(p => p.slot === slot && p.isDefault);
    progress.ship.parts[slot] = def ? def.id : null;
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
