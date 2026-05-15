// Pixel-art pet renderer. Each (species × stage) is a hand-crafted pixel grid
// in PetSprites.js — silhouettes diverge dramatically per stage so a Cinder Egg
// looks like an egg and a Solfire looks like a dragon.
//
// Public API:
//   drawCompanion(scene, x, y, opts) → container
//     opts.speciesId, opts.stage, opts.scale, opts.preview, opts.mood,
//     opts.cosmeticsOverride — { accessory, aura } overriding
//                              progress.cosmetics.pet (used by shop previews)
//   container.bounceHappy() / .slumpSad()
//   container.applyCosmetics() — re-reads cosmetics + redraws accessory layers

import { progress } from './GameData.js';
import { companion, SPECIES } from './CompanionManager.js';
import { cosmetics } from './CosmeticManager.js';
import { darken, lighten } from './colorUtils.js';
import { PET_SPRITES, gridLayout, anchorXY } from './PetSprites.js';
import { renderPetCosmetic } from './PetCosmeticSprites.js';

// Per-species palette resolves grid characters → colors.
function paletteFor(species, stage) {
  const c = species.color;
  const isCosmic = stage === 'cosmic';
  return {
    body:    c,
    bodyHi:  lighten(c, isCosmic ? 0.45 : 0.30),
    bodyLo:  darken(c, isCosmic ? 0.32 : 0.22),
    accent:  isCosmic ? lighten(species.accent, 0.18) : species.accent,
    accentHi: lighten(species.accent, isCosmic ? 0.50 : 0.30),
    secondary: darken(species.accent, isCosmic ? 0.18 : 0.30),
    secondaryHi: species.accent,
    outline: 0x07071a,
    eyeWhite: 0xffffff,
    eyeBlack: 0x121225,
    sparkle:  0xffffff,
    mouth:    0x3a1a2a,
    tongue:   isCosmic ? 0xff5b9e : 0xff7a99,
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
  const stage = opts.stage || companion.getActiveStage() || 'egg';
  const userScale = opts.scale ?? 1;
  const species = SPECIES[speciesId];

  const container = scene.add.container(x, y);
  if (!species) return container;

  const pal = paletteFor(species, stage);
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

  if (stage === 'cosmic') {
    const pulseOverlay = pixelGrid(
      scene, grid, layout.originX, layout.originY, PIXEL_SIZE,
      ch => (ch === 'A' || ch === 'a' || ch === 'T') ? pal.sparkle : null
    );
    pulseOverlay.setBlendMode('ADD');
    pulseOverlay.alpha = 0;
    bodyG.add(pulseOverlay);
    const stillAlive = () => pulseOverlay.active && scene.scene.isActive();
    const pulseOnce = () => {
      if (!stillAlive()) return;
      scene.tweens.add({
        targets: pulseOverlay,
        alpha: { from: 0, to: 0.45 },
        duration: 520,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          if (!stillAlive()) return;
          scene.time.delayedCall(6000 + Math.random() * 2000, pulseOnce);
        }
      });
    };
    scene.time.delayedCall(900 + Math.random() * 1200, pulseOnce);
  }

  // Mouth swap for sad mood. Cells with 'M' (mouth) get hidden and a frown
  // overlay is drawn at the mouth row.
  const mouth = scene.add.graphics();
  bodyG.add(mouth);

  // Cosmetics that bob WITH the pet body — held items, shades, etc.
  const wornG = scene.add.container(0, 0);
  bodyG.add(wornG);

  // Auras orbit/pulse independently and do not bob.
  const auraG = scene.add.container(0, 0);
  container.add(auraG);

  container.setScale(userScale);
  container.species = species;
  container.stage = stage;
  container.pal = pal;
  container.layout = layout;
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

  // Cosmetic application — reads override if provided (used by shop preview).
  container.applyCosmetics = () => {
    wornG.removeAll(true);
    auraG.removeAll(true);

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
