// Pixel-art pet renderer. Each (species × stage) is a hand-crafted pixel grid
// in PetSprites.js — silhouettes diverge dramatically per stage so a Cinder Egg
// looks like an egg and a Solfire looks like a dragon.
//
// Public API (callsite-compatible with the old Phaser-Graphics renderer):
//   drawCompanion(scene, x, y, opts) → container
//     opts.speciesId, opts.stage, opts.scale, opts.preview, opts.mood,
//     opts.cosmeticsOverride — { hat, accessory, aura } overriding
//                              progress.cosmetics.pet (used by shop previews)
//   container.bounceHappy() / .slumpSad()
//   container.rocketBoost() / .propellerSpin() / .radioWavePing() / .starHaloOrbit()
//   container.applyCosmetics() — re-reads cosmetics + redraws hat/accessory layers

import { progress } from './GameData.js';
import { companion, SPECIES } from './CompanionManager.js';
import { cosmetics } from './CosmeticManager.js';
import { darken, lighten } from './colorUtils.js';
import { PET_SPRITES, gridLayout, anchorXY } from './PetSprites.js';
import { renderPetCosmetic } from './PetCosmeticSprites.js';

// Per-species palette resolves grid characters → colors.
function paletteFor(species) {
  const c = species.color;
  return {
    body:    c,
    bodyHi:  lighten(c, 0.30),
    bodyLo:  darken(c, 0.22),
    accent:  species.accent,
    accentHi: lighten(species.accent, 0.30),
    secondary: darken(species.accent, 0.30), // wing membrane / fin / bark
    secondaryHi: species.accent,
    outline: 0x07071a,
    eyeWhite: 0xffffff,
    eyeBlack: 0x121225,
    sparkle:  0xffffff,
    mouth:    0x3a1a2a,
    tongue:   0xff7a99,
    blush:    0xffb3c1
  };
}

// Map a single grid character to a fill color (or null = skip).
function colorFor(ch, pal) {
  switch (ch) {
    case 'O': return pal.outline;
    case 'B': return pal.body;
    case 'H': return pal.bodyHi;
    case 'L': return pal.bodyLo;
    case 'W': return pal.eyeWhite;
    case 'E': return pal.eyeBlack;
    case 'K': return pal.sparkle;
    case 'M': return pal.mouth;
    case 'T': return pal.tongue;
    case 'A': return pal.accent;
    case 'a': return pal.accentHi;
    case 'S': return pal.secondary;
    case 's': return pal.secondaryHi;
    default: return null;
  }
}

function pixelGrid(scene, grid, ox, oy, pixelSize, paletteFn) {
  const g = scene.add.graphics();
  for (let row = 0; row < grid.length; row++) {
    const line = grid[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (!ch || ch === '.' || ch === ' ') continue;
      const color = paletteFn(ch);
      if (color === null) continue;
      g.fillStyle(color, 1);
      // Tiny overdraw avoids hairline gaps between cells when scale isn't an integer.
      g.fillRect(ox + col * pixelSize, oy + row * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
    }
  }
  return g;
}

// ----------------------------------------------------------------------------

export function drawCompanion(scene, x, y, opts = {}) {
  const speciesId = opts.speciesId || progress.companion.speciesId || 'ember';
  const stage = opts.stage || progress.companion.stage || 'egg';
  const userScale = opts.scale ?? 1;
  const species = SPECIES[speciesId];

  const container = scene.add.container(x, y);
  if (!species) return container;

  const pal = paletteFor(species);
  const grid = (PET_SPRITES[speciesId] && PET_SPRITES[speciesId][stage]) || PET_SPRITES.ember.egg;

  // Pixel size — eggs/babies stay punchy; teens/adults render at the same
  // cell pitch but their grids are taller, so they read as bigger creatures.
  const PIXEL_SIZE = 6;
  const layout = gridLayout(grid, PIXEL_SIZE);

  // Soft glow halo behind the body (always on).
  const glow = scene.add.graphics();
  glow.fillStyle(species.accent, 0.18);
  glow.fillEllipse(0, 0, layout.width * 0.95, layout.height * 0.85);
  container.add(glow);
  scene.tweens.add({
    targets: glow,
    alpha: { from: 0.18, to: 0.32 },
    scaleX: 1.06,
    scaleY: 1.06,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // Drop shadow under the feet.
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.30);
  shadow.fillEllipse(0, layout.height / 2 + PIXEL_SIZE * 1.2, layout.width * 0.55, PIXEL_SIZE * 1.4);
  container.add(shadow);

  // Body container so we can bob it independently of cosmetics & glow.
  const bodyG = scene.add.container(0, 0);
  container.add(bodyG);

  const sprite = pixelGrid(scene, grid, layout.originX, layout.originY, PIXEL_SIZE, ch => colorFor(ch, pal));
  bodyG.add(sprite);

  // Mouth swap for sad mood. Cells with 'M' (mouth) get hidden and a frown
  // overlay is drawn at the mouth row.
  const mouth = scene.add.graphics();
  bodyG.add(mouth);

  // Cosmetics that should bob WITH the pet body — hats and accessories.
  const wornG = scene.add.container(0, 0);
  bodyG.add(wornG);

  // Auras orbit/pulse independently and do not bob.
  const auraG = scene.add.container(0, 0);
  container.add(auraG);

  // Back-compat alias — older code paths read .cosmeticG; we expose wornG so
  // animation hooks (jetpack flame, propeller, antenna) keep working.
  const cosmeticG = wornG;

  container.setScale(userScale);
  container.species = species;
  container.stage = stage;
  container.pal = pal;
  container.layout = layout;
  container.cosmeticG = cosmeticG;
  container.bodyG = bodyG;
  container.mouthG = mouth;

  // Idle bob — body floats up and down a few px.
  scene.tweens.add({
    targets: bodyG,
    y: { from: 0, to: -PIXEL_SIZE * 0.7 },
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // Animation methods ---------------------------------------------------------

  container.bounceHappy = () => {
    scene.tweens.add({
      targets: container,
      scaleY: { from: userScale * 0.85, to: userScale },
      scaleX: { from: userScale * 1.15, to: userScale },
      duration: 250,
      ease: 'Back.easeOut'
    });
    for (const item of cosmetics.itemsWithTrigger('correct')) {
      const fn = container[item.animation];
      if (typeof fn === 'function') fn();
    }
  };

  container.slumpSad = () => {
    drawFrownOverlay(mouth, layout, pal);
    scene.tweens.add({
      targets: bodyG,
      y: 8,
      angle: { from: 0, to: -4 },
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => mouth.clear()
    });
  };

  container.rocketBoost = () => {
    if (!cosmeticG.jetpackFlame) return;
    const flame = cosmeticG.jetpackFlame;
    flame.setAlpha(1);
    scene.tweens.add({
      targets: bodyG,
      y: { from: bodyG.y, to: bodyG.y - 30 },
      duration: 220,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
    scene.tweens.add({
      targets: flame,
      scaleY: { from: 1, to: 1.8 },
      alpha: { from: 1, to: 0.2 },
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => flame.setAlpha(0)
    });
  };

  container.propellerSpin = () => {
    if (!cosmeticG.propeller) return;
    const prop = cosmeticG.propeller;
    scene.tweens.add({
      targets: prop,
      angle: prop.angle + 720,
      duration: 480,
      ease: 'Quad.easeOut'
    });
    scene.tweens.add({
      targets: bodyG,
      y: { from: bodyG.y, to: bodyG.y - 8 },
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  };

  container.radioWavePing = () => {
    if (!cosmeticG.antennaTip) return;
    const tip = cosmeticG.antennaTip;
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(2, 0xffd86b, 0.9);
      ring.strokeCircle(tip.x, tip.y, 6);
      cosmeticG.add(ring);
      scene.tweens.add({
        targets: ring,
        scaleX: 4, scaleY: 4, alpha: 0,
        duration: 700,
        delay: i * 130,
        ease: 'Quad.easeOut',
        onComplete: () => ring.destroy()
      });
    }
  };

  container.starHaloOrbit = () => {
    if (!cosmeticG.starHalo) return;
    for (const star of cosmeticG.starHalo.list) {
      scene.tweens.add({
        targets: star,
        scale: { from: 1.6, to: 1 },
        duration: 320,
        ease: 'Back.easeOut'
      });
    }
  };

  // Cosmetic application — reads override if provided (used by shop preview).
  container.applyCosmetics = () => {
    wornG.removeAll(true);
    auraG.removeAll(true);
    wornG.jetpackFlame = null;
    wornG.propeller = null;
    wornG.antennaTip = null;
    wornG.starHalo = null;

    const equipped = opts.cosmeticsOverride || cosmetics.getEquipped();
    const slots = ['accessory', 'hat', 'aura'];
    for (const slot of slots) {
      const id = equipped[slot];
      if (!id) continue;
      const item = cosmetics.getItemById ? cosmetics.getItemById(id) : null;
      // Auras render to auraG (no bob); everything else to wornG (bobs with body).
      const isAura = (slot === 'aura');
      const ctx = {
        scene,
        parent: isAura ? auraG : wornG,
        item: item || { id },
        speciesId, stage, layout, pal,
        anchor: (name) => anchorXY(speciesId, stage, name, layout)
      };
      renderPetCosmetic(ctx);
    }

    // Always-on halo orbit
    if (wornG.starHalo) {
      scene.tweens.add({
        targets: wornG.starHalo,
        angle: 360,
        duration: 6000,
        repeat: -1,
        ease: 'Linear'
      });
    }
  };

  container.applyCosmetics();

  return container;
}

// Frown overlay — draws a small dark arc near the mouth row of the grid.
function drawFrownOverlay(g, layout, pal) {
  g.clear();
  // Mouth row sits ~60% down the head — approximate anchor:
  const cy = layout.originY + layout.rows * 0.55 * layout.pixelSize;
  const w = layout.pixelSize * 3;
  g.lineStyle(layout.pixelSize * 0.6, pal.mouth, 1);
  g.beginPath();
  g.moveTo(-w, cy + 2);
  g.lineTo(-w * 0.4, cy - 2);
  g.lineTo(w * 0.4, cy - 2);
  g.lineTo(w, cy + 2);
  g.strokePath();
}
