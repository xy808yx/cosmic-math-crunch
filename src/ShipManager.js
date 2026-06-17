// Ship cosmetic chassis. Slots: hull / wings / paint / addon / pattern / trail.
// Defaults are owned for free; alternates are bought in the shop.

import { progress } from './GameData.js';

export const SHIP_PARTS = [
  // hulls
  { id: 'hull_default', slot: 'hull',  name: 'Standard Hull',  price: 0,  isDefault: true,  color: 0xb6c2cf, rarity: 'common' },
  { id: 'hull_round',   slot: 'hull',  name: 'Bubble Hull',    price: 100, color: 0xffd86b, rarity: 'common' },
  { id: 'hull_sleek',   slot: 'hull',  name: 'Sleek Hull',     price: 150, color: 0x9be8a3, rarity: 'common' },
  { id: 'hull_bulky',   slot: 'hull',  name: 'Bulky Hull',     price: 250, color: 0xff9ec7, rarity: 'rare' },
  { id: 'hull_arrow',   slot: 'hull',  name: 'Arrow Hull',     price: 350, color: 0x4ecdc4, rarity: 'rare' },
  { id: 'hull_finned',  slot: 'hull',  name: 'Finned Hull',    price: 350, color: 0xffae3a, rarity: 'rare' },
  { id: 'hull_wraith',  slot: 'hull',  name: 'Wraith Hull',    price: 1500, color: 0xa6f0e8, rarity: 'legendary' },
  { id: 'hull_eclipse', slot: 'hull',  name: 'Eclipse Hull',   price: 1500, color: 0xfff3b8, rarity: 'legendary' },
  // Reward-only: the signature trophy of the Chapter 2 grand finale (World 28).
  { id: 'hull_nanocraft', slot: 'hull', name: 'Nanocraft Hull', price: 0, unlock_only: true, color: 0x4ecdc4, rarity: 'legendary', desc: 'Forged in the Singularity Cell.' },
  // Reward-only: trophy for beating King Coli, the hidden hygiene superboss (W17).
  { id: 'hull_aegis',     slot: 'hull', name: 'Aegis Hull',     price: 0, unlock_only: true, color: 0xd8e4ec, rarity: 'legendary', desc: 'Scrubbed sterile in the Royal Flush.' },

  // wings
  { id: 'wings_default', slot: 'wings', name: 'Stub Wings',  price: 0,   isDefault: true, color: 0x8b9bb4, rarity: 'common' },
  { id: 'wings_swept',   slot: 'wings', name: 'Swept Wings', price: 100, color: 0xff8b3d, rarity: 'common' },
  { id: 'wings_wide',    slot: 'wings', name: 'Wide Wings',  price: 150, color: 0xb5e6ff, rarity: 'common' },
  { id: 'wings_stub',    slot: 'wings', name: 'Snub Wings',   price: 250,  color: 0xd5a6ff, rarity: 'rare' },
  { id: 'wings_delta',   slot: 'wings', name: 'Delta Wings',  price: 350,  color: 0x9be8a3, rarity: 'rare' },
  { id: 'wings_ribbed',  slot: 'wings', name: 'Ribbed Wings', price: 350,  color: 0xffae8a, rarity: 'rare' },
  { id: 'wings_phantom', slot: 'wings', name: 'Phantom Wings', price: 1500, color: 0xfff3b8, rarity: 'legendary' },
  { id: 'wings_solar',   slot: 'wings', name: 'Solar Sails',   price: 1500, color: 0xffd86b, rarity: 'legendary' },
  { id: 'wings_seraph',  slot: 'wings', name: 'Seraph Wings',  price: 1500, color: 0xeaf6ff, rarity: 'legendary' },

  // paints (recolor the body fill — some paints carry an embedded `pattern`
  // that the renderer overlays on top, replacing the old separate pattern slot)
  { id: 'paint_default', slot: 'paint', name: 'Steel',    price: 0,  isDefault: true, color: 0xb6c2cf, rarity: 'common' },
  { id: 'paint_crimson', slot: 'paint', name: 'Crimson',  price: 50, color: 0xff5b6e, rarity: 'common' },
  { id: 'paint_aqua',    slot: 'paint', name: 'Aqua',     price: 50, color: 0x4ecdc4, rarity: 'common' },
  { id: 'paint_sunburst', slot: 'paint', name: 'Sunburst', price: 100, color: 0xffb142, rarity: 'common' },
  { id: 'paint_void',    slot: 'paint', name: 'Void',     price: 150, color: 0x6c2bd9, rarity: 'common' },
  { id: 'paint_mint',    slot: 'paint', name: 'Mint',     price: 100, color: 0x9be8a3, rarity: 'common' },
  { id: 'paint_coral',   slot: 'paint', name: 'Coral',    price: 100, color: 0xffae8a, rarity: 'common' },
  // Chapter 2 "Inner Space" set — pair with the Nanocraft hull.
  { id: 'paint_plasma',    slot: 'paint', name: 'Plasma',    price: 150, color: 0xff5b8a, rarity: 'common' },
  { id: 'paint_cytoplasm', slot: 'paint', name: 'Cytoplasm', price: 150, color: 0x5fe0c0, rarity: 'common' },
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

  // addon (prominent module mounted on top of the ship — replaces decals)
  { id: 'addon_antenna',     slot: 'addon', name: 'Antenna',        price: 50,  color: 0xf7dc6f, rarity: 'common' },
  { id: 'addon_spoiler',     slot: 'addon', name: 'Tail Spoiler',   price: 75,  color: 0xff9ec7, rarity: 'common' },
  { id: 'addon_periscope',   slot: 'addon', name: 'Periscope',      price: 100, color: 0xffe07a, rarity: 'common' },
  { id: 'addon_cannons',     slot: 'addon', name: 'Twin Cannons',   price: 350, color: 0xb6e0ff, rarity: 'rare' },
  { id: 'addon_satellite',   slot: 'addon', name: 'Satellite Dish', price: 300, color: 0xffd86b, rarity: 'rare' },
  { id: 'addon_phoenix_crest', slot: 'addon', name: 'Phoenix Crest', price: 1500, color: 0xff8b3d, rarity: 'legendary' },
  { id: 'addon_galaxy_orb',    slot: 'addon', name: 'Galaxy Orb',    price: 1500, color: 0xc77eff, rarity: 'legendary' },
  { id: 'addon_dragon_horns',  slot: 'addon', name: 'Dragon Horns',  price: 1500, color: 0xff5b3d, rarity: 'legendary' },
  // Reward-only: awarded by clearing the Glitch World boss fight.
  { id: 'addon_glitch_module', slot: 'addon', name: 'Glitch Module', price: 0, unlock_only: true, color: 0x39ff14, rarity: 'legendary', desc: 'Spoils of war from Datamosh.' },

  // patterns are now folded into paints (see paint_racing, paint_blaze, etc.).
  // Keep pattern_none as the default record so legacy progress.ship.parts.pattern
  // values still resolve, but it's never shown in the shop.
  { id: 'pattern_none', slot: 'pattern', name: 'No Pattern', price: 0, isDefault: true, color: 0x000000, rarity: 'common' },

  // engine trails (particles emitted behind the booster)
  { id: 'trail_default_flame', slot: 'trail', name: 'Standard Flame', price: 0,   isDefault: true, color: 0xff8b3d, rarity: 'common' },
  { id: 'trail_fire_swirl',    slot: 'trail', name: 'Fire Swirl',     price: 100, color: 0xff5b3d, rarity: 'common' },
  { id: 'trail_lightning',     slot: 'trail', name: 'Lightning',      price: 100, color: 0xfff3b8, rarity: 'common' },
  { id: 'trail_bubbles',       slot: 'trail', name: 'Bubbles',        price: 100, color: 0xb6e0ff, rarity: 'common' },
  { id: 'trail_pixel_smoke',   slot: 'trail', name: '8-Bit Smoke',    price: 100, color: 0xc8c8d8, rarity: 'common' },
  { id: 'trail_neon_grid',     slot: 'trail', name: 'Neon Grid',      price: 250, color: 0x4ecdc4, rarity: 'rare' },
  { id: 'trail_snowflake',     slot: 'trail', name: 'Snowflakes',     price: 350, color: 0xffffff, rarity: 'rare' },
  { id: 'trail_pixel_lava',    slot: 'trail', name: 'Pixel Lava',     price: 1500, color: 0xff5b3d, rarity: 'legendary' },
  { id: 'trail_cosmic_dust',   slot: 'trail', name: 'Cosmic Dust',    price: 1500, color: 0xc77eff, rarity: 'legendary' },
  // Original additions
  { id: 'trail_rainbow',       slot: 'trail', name: 'Rainbow Streak', price: 250, color: 0xff5577, rarity: 'rare' },
  { id: 'trail_comet',         slot: 'trail', name: 'Comet Sparkle',  price: 250, color: 0xffffff, rarity: 'rare' },
  { id: 'trail_galaxy',        slot: 'trail', name: 'Galaxy Dust',    price: 350, color: 0xc77eff, rarity: 'rare' },
  { id: 'trail_notes',         slot: 'trail', name: 'Music Notes',    price: 250, color: 0xd5a6ff, rarity: 'rare' },
  { id: 'trail_petals',        slot: 'trail', name: 'Petals',         price: 250, color: 0xff9ec7, rarity: 'rare' },
  { id: 'trail_aurora',        slot: 'trail', name: 'Aurora',         price: 1500, color: 0xa6f0e8, rarity: 'legendary' },

  { id: 'paint_galaxy', slot: 'paint', name: 'Galaxy', price: 1500, color: 0x9d6bff, rarity: 'legendary' }
];

class ShipManager {
  getCurrentParts() {
    return { ...progress.ship.parts };
  }

  ownsPart(partId) {
    return progress.ship.ownedParts.includes(partId);
  }

  equipPart(partId) {
    const part = SHIP_PARTS.find(p => p.id === partId);
    if (!part || !this.ownsPart(partId)) return false;
    progress.ship.parts[part.slot] = partId;
    progress.save();
    return true;
  }

  // Reset a slot back to its default. For nullable slots (addon), set to null.
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
    if (!this.ownsPart(partId)) progress.ship.ownedParts.push(partId);
    progress.ship.parts[part.slot] = partId;
    progress.save();
    return true;
  }
}

export const ship = new ShipManager();
