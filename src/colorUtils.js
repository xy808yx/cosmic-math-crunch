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

// Linear blend between two 0xRRGGBB colours (t in 0..1). Allocation-free, so
// it's safe to call every frame (the wormhole cinematic samples a gradient with
// it on each redraw).
export function lerpHex(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  return ((Math.round(ar + (br - ar) * t) << 16) |
          (Math.round(ag + (bg - ag) * t) << 8) |
           Math.round(ab + (bb - ab) * t));
}
