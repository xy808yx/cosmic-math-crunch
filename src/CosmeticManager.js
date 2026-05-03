// Pet cosmetic items (hats + accessories). Ownership and equip live on
// `progress.cosmetics`. Items have a single slot.

import { progress } from './GameData.js';

export const PET_COSMETICS = [
  { id: 'hat_cap',     slot: 'hat',       name: 'Pilot Cap',     price: 40, color: 0x4ecdc4 },
  { id: 'hat_crown',   slot: 'hat',       name: 'Star Crown',    price: 80, color: 0xf7dc6f },
  { id: 'acc_scarf',   slot: 'accessory', name: 'Cozy Scarf',    price: 35, color: 0xff5b6e },
  { id: 'acc_shades',  slot: 'accessory', name: 'Sun Shades',    price: 60, color: 0x12122a },
  // Milestone-only items — granted via streak milestones, not buyable.
  { id: 'acc_starbow', slot: 'accessory', name: 'Rainbow Scarf', price: 0, color: 0xc77eff, unlock: { type: 'streak', days: 3 } },
  { id: 'hat_starhat', slot: 'hat',       name: 'Star Helmet',   price: 0, color: 0xffd86b, unlock: { type: 'streak', days: 7 } }
];

class CosmeticManager {
  getEquipped() {
    return { ...progress.cosmetics.pet };
  }

  ownsItem(id) {
    return progress.cosmetics.ownedIds.includes(id);
  }

  addOwned(id) {
    if (this.ownsItem(id)) return;
    progress.cosmetics.ownedIds.push(id);
    if (!progress.cosmetics.newSinceLastView.includes(id)) {
      progress.cosmetics.newSinceLastView.push(id);
    }
    progress.save();
  }

  equipItem(id) {
    const item = PET_COSMETICS.find(c => c.id === id);
    if (!item || !this.ownsItem(id)) return false;
    progress.cosmetics.pet[item.slot] = id;
    progress.save();
    return true;
  }

  markSeen(id) {
    const idx = progress.cosmetics.newSinceLastView.indexOf(id);
    if (idx >= 0) {
      progress.cosmetics.newSinceLastView.splice(idx, 1);
      progress.save();
    }
  }

  isNew(id) {
    return progress.cosmetics.newSinceLastView.includes(id);
  }
}

export const cosmetics = new CosmeticManager();
