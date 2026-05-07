// Rarity tiers for cosmetics. Three tiers: Common / Rare / Legendary.
// Common: cyan border. Rare: purple border + soft pulse. Legendary: gold halo.
// Items missing a `rarity` field default to 'common'.

export const RARITY_COLOR = {
  common: 0x4ecdc4,
  rare: 0xc77eff,
  legendary: 0xffd86b
};

export const RARITY_LABEL = {
  common: 'COMMON',
  rare: 'RARE',
  legendary: 'LEGENDARY'
};

export function rarityOf(item) {
  return item?.rarity || 'common';
}

// Sort order — common before rare before legendary. Used by ShopScene to
// render every tab in the same predictable order.
export const RARITY_ORDER = {
  common: 0,
  rare: 1,
  legendary: 2
};

// Sort comparator — rarity first (low→high), then price (low→high), then name.
export function compareForShop(a, b) {
  const ra = RARITY_ORDER[rarityOf(a)] ?? 0;
  const rb = RARITY_ORDER[rarityOf(b)] ?? 0;
  if (ra !== rb) return ra - rb;
  if (a.price !== b.price) return a.price - b.price;
  return (a.name || '').localeCompare(b.name || '');
}
