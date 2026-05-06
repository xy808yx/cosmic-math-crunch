// Tiny color helpers used by the procedural pixel-art renderers.
// Phaser ships its own Color utilities, but a 0xRRGGBB-in-0xRRGGBB-out
// pair is a lot less ceremony when we just need a per-pixel fill.

export function darken(color, amount) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const k = 1 - amount;
  return ((Math.max(0, Math.round(r * k)) << 16) |
          (Math.max(0, Math.round(g * k)) << 8) |
           Math.max(0, Math.round(b * k)));
}

export function lighten(color, amount) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return ((Math.min(255, Math.round(r + (255 - r) * amount)) << 16) |
          (Math.min(255, Math.round(g + (255 - g) * amount)) << 8) |
           Math.min(255, Math.round(b + (255 - b) * amount)));
}
