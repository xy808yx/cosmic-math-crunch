// Flat-cute pet renderer. Shapes are smooth Phaser Graphics primitives —
// big head, oversized eyes, cheek blush, soft body — drawn against the
// pixel-art ship/world. Each species/stage tweaks proportions and adds
// archetype accents (flame tuft for Ember, droplet antennae for Tide,
// sprig + leaves for Sprout).
//
// Public API:
//   drawCompanion(scene, x, y, opts) → container
//     opts.speciesId, opts.stage, opts.scale, opts.preview, opts.mood
//   container.bounceHappy() / .slumpSad() / .missedYou()
//   container.rocketBoost() / .propellerSpin() / .radioWavePing() / .starHaloOrbit()
//   container.applyCosmetics() — re-reads cosmetics + redraws hat/accessory layers

import { progress } from './GameData.js';
import { companion, SPECIES } from './CompanionManager.js';
import { cosmetics, PET_COSMETICS } from './CosmeticManager.js';
import { darken, lighten } from './colorUtils.js';

// Per-species palette + soft pastel highlights.
function paletteFor(species) {
  const c = species.color;
  return {
    body:    c,
    bodyHi:  lighten(c, 0.30),
    bodyLo:  darken(c, 0.18),
    accent:  species.accent,
    accentHi: lighten(species.accent, 0.30),
    outline: 0x07071a,
    eyeWhite: 0xffffff,
    eyeBlack: 0x121225,
    blush:    0xffb3c1,
    sparkle:  0xffffff
  };
}

// Stage proportions -----------------------------------------------------------
// Returns {head, body, eye, scale} ratios used to render the pet body.
function proportionsFor(stage) {
  switch (stage) {
    case 'egg':
      return { headFrac: 1.0, bodyFrac: 0.0, eyeFrac: 0.20, totalScale: 1.0, hasLimbs: false };
    case 'baby':
      return { headFrac: 0.70, bodyFrac: 0.30, eyeFrac: 0.32, totalScale: 1.0, hasLimbs: false };
    case 'teen':
      return { headFrac: 0.58, bodyFrac: 0.42, eyeFrac: 0.26, totalScale: 1.15, hasLimbs: true };
    case 'adult':
    default:
      return { headFrac: 0.50, bodyFrac: 0.50, eyeFrac: 0.22, totalScale: 1.30, hasLimbs: true };
  }
}

// Public API -----------------------------------------------------------------

export function drawCompanion(scene, x, y, opts = {}) {
  const speciesId = opts.speciesId || progress.companion.speciesId || 'ember';
  const stage = opts.stage || progress.companion.stage || 'egg';
  const userScale = opts.scale ?? 1;
  const species = SPECIES[speciesId];

  const container = scene.add.container(x, y);
  if (!species) return container;

  const pal = paletteFor(species);
  const props = proportionsFor(stage);
  const scale = userScale * props.totalScale;

  // Reference base size — at scale=1 the pet sits ~120 tall.
  const BASE = 120;
  const totalH = BASE;
  const headR = (totalH * props.headFrac) * 0.5;
  const bodyH = totalH * props.bodyFrac;

  // Soft glow halo (always-on ambient) ------------------------------------
  const glow = scene.add.graphics();
  glow.fillStyle(species.accent, 0.18);
  glow.fillEllipse(0, 0, headR * 2.6, headR * 2.0);
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

  // Drop shadow ------------------------------------------------------------
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.30);
  shadow.fillEllipse(0, headR + bodyH * 0.55, headR * 1.6, headR * 0.30);
  container.add(shadow);

  // Body container (head + body + accents) so we can bob it together
  const bodyG = scene.add.container(0, 0);
  container.add(bodyG);

  if (stage === 'egg') {
    drawEgg(scene, bodyG, species, pal, headR);
  } else {
    // Body (sits below head)
    if (bodyH > 0) {
      const body = scene.add.graphics();
      const bodyW = headR * 1.5;
      const bodyCY = headR * 0.65;
      body.fillStyle(pal.bodyLo, 1);
      body.fillEllipse(0, bodyCY + 4, bodyW, bodyH);
      body.fillStyle(pal.body, 1);
      body.fillEllipse(0, bodyCY, bodyW, bodyH);
      body.fillStyle(pal.bodyHi, 0.6);
      body.fillEllipse(-bodyW * 0.18, bodyCY - bodyH * 0.18, bodyW * 0.5, bodyH * 0.35);
      bodyG.add(body);

      if (props.hasLimbs) {
        // Tiny feet
        const feet = scene.add.graphics();
        feet.fillStyle(pal.bodyLo, 1);
        feet.fillEllipse(-bodyW * 0.28, bodyCY + bodyH * 0.45, bodyW * 0.32, bodyH * 0.18);
        feet.fillEllipse(bodyW * 0.28, bodyCY + bodyH * 0.45, bodyW * 0.32, bodyH * 0.18);
        bodyG.add(feet);
      }
    }

    // Species archetype accents (drawn behind head where they belong)
    drawSpeciesAccents(scene, bodyG, speciesId, stage, pal, headR, bodyH);

    // Head — a big circle for chibi cuteness
    const head = scene.add.graphics();
    head.fillStyle(pal.bodyLo, 1);
    head.fillCircle(0, 4, headR);
    head.fillStyle(pal.body, 1);
    head.fillCircle(0, 0, headR);
    // Glossy highlight
    head.fillStyle(pal.bodyHi, 0.55);
    head.fillEllipse(-headR * 0.25, -headR * 0.40, headR * 0.85, headR * 0.55);
    bodyG.add(head);

    // Cheek blush
    const blush = scene.add.graphics();
    blush.fillStyle(pal.blush, 0.7);
    blush.fillEllipse(-headR * 0.55, headR * 0.25, headR * 0.30, headR * 0.18);
    blush.fillEllipse(headR * 0.55, headR * 0.25, headR * 0.30, headR * 0.18);
    bodyG.add(blush);

    // Eyes — oversized whites, dark pupils, two sparkle highlights
    const eyeR = headR * props.eyeFrac;
    const eyeY = -headR * 0.10;
    const eyeOffsetX = headR * 0.42;
    const eyes = scene.add.graphics();
    // Whites
    eyes.fillStyle(pal.eyeWhite, 1);
    eyes.fillCircle(-eyeOffsetX, eyeY, eyeR);
    eyes.fillCircle(eyeOffsetX, eyeY, eyeR);
    // Outline
    eyes.lineStyle(2, pal.outline, 0.6);
    eyes.strokeCircle(-eyeOffsetX, eyeY, eyeR);
    eyes.strokeCircle(eyeOffsetX, eyeY, eyeR);
    // Pupils
    const pupilR = eyeR * 0.55;
    const pupilOffsetY = eyeR * 0.10;
    eyes.fillStyle(pal.eyeBlack, 1);
    eyes.fillCircle(-eyeOffsetX, eyeY + pupilOffsetY, pupilR);
    eyes.fillCircle(eyeOffsetX, eyeY + pupilOffsetY, pupilR);
    // Big sparkle + small sparkle
    eyes.fillStyle(pal.sparkle, 1);
    eyes.fillCircle(-eyeOffsetX - pupilR * 0.35, eyeY - pupilR * 0.30, pupilR * 0.42);
    eyes.fillCircle(eyeOffsetX - pupilR * 0.35, eyeY - pupilR * 0.30, pupilR * 0.42);
    eyes.fillCircle(-eyeOffsetX + pupilR * 0.35, eyeY + pupilR * 0.20, pupilR * 0.18);
    eyes.fillCircle(eyeOffsetX + pupilR * 0.35, eyeY + pupilR * 0.20, pupilR * 0.18);
    bodyG.add(eyes);
    container.eyes = eyes;
    container.eyeMeta = { eyeOffsetX, eyeY, eyeR, pupilR, pupilOffsetY, pal };

    // Mouth — small curve, mood-aware
    const mouth = scene.add.graphics();
    drawMouth(mouth, pal, headR * 0.22, headR * 0.40, opts.mood || 'happy');
    bodyG.add(mouth);
    container.mouthG = mouth;
    container.mouthMeta = { pal, w: headR * 0.22, y: headR * 0.40 };
  }

  // Slot containers for cosmetic items (filled below).
  const cosmeticG = scene.add.container(0, 0);
  container.add(cosmeticG);

  // Apply scale so all earlier coords are relative to BASE.
  container.setScale(scale);
  container.species = species;
  container.stage = stage;
  container.pal = pal;
  container.headR = headR;
  container.bodyH = bodyH;
  container.cosmeticG = cosmeticG;

  // Idle bob — heavy head bobs subtly different from body
  scene.tweens.add({
    targets: bodyG,
    y: { from: 0, to: -headR * 0.06 },
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // Animation methods -------------------------------------------------
  container.bounceHappy = () => {
    scene.tweens.add({
      targets: container,
      scaleY: { from: scale * 0.85, to: scale },
      scaleX: { from: scale * 1.15, to: scale },
      duration: 250,
      ease: 'Back.easeOut'
    });
    // Trigger 'correct' animations
    for (const item of cosmetics.itemsWithTrigger('correct')) {
      const fn = container[item.animation];
      if (typeof fn === 'function') fn();
    }
  };

  container.slumpSad = () => {
    if (container.mouthG && container.mouthMeta) {
      drawMouth(container.mouthG, pal, container.mouthMeta.w, container.mouthMeta.y, 'sad');
    }
    scene.tweens.add({
      targets: bodyG,
      y: 8,
      angle: { from: 0, to: -4 },
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (container.mouthG && container.mouthMeta) {
          drawMouth(container.mouthG, pal, container.mouthMeta.w, container.mouthMeta.y, 'happy');
        }
      }
    });
  };

  container.missedYou = () => {
    scene.tweens.add({
      targets: container,
      scaleY: { from: scale * 0.7, to: scale },
      scaleX: { from: scale * 1.3, to: scale },
      duration: 400,
      ease: 'Bounce.easeOut'
    });
    const ring = scene.add.graphics();
    ring.lineStyle(3, species.accent, 1);
    ring.strokeCircle(0, 0, headR * 1.2);
    container.add(ring);
    scene.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const sp = scene.add.circle(0, 0, 3, 0xffffff, 1);
      container.add(sp);
      scene.tweens.add({
        targets: sp,
        x: Math.cos(angle) * headR * 4,
        y: Math.sin(angle) * headR * 4 - 20,
        alpha: 0,
        duration: 800,
        ease: 'Quad.easeOut',
        onComplete: () => sp.destroy()
      });
    }
  };

  // Item-triggered animations -----------------------------------------
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
        scaleX: 4,
        scaleY: 4,
        alpha: 0,
        duration: 700,
        delay: i * 130,
        ease: 'Quad.easeOut',
        onComplete: () => ring.destroy()
      });
    }
  };

  container.starHaloOrbit = () => {
    // No-op when called manually — orbit runs continuously when halo is equipped.
    if (!cosmeticG.starHalo) return;
    for (const star of cosmeticG.starHalo.children) {
      scene.tweens.add({
        targets: star,
        scale: { from: 1.6, to: 1 },
        duration: 320,
        ease: 'Back.easeOut'
      });
    }
  };

  container.applyCosmetics = () => {
    cosmeticG.removeAll(true);
    cosmeticG.jetpackFlame = null;
    cosmeticG.propeller = null;
    cosmeticG.antennaTip = null;
    cosmeticG.starHalo = null;
    if (opts.preview) return;
    const items = cosmetics.getEquippedItems();
    for (const item of items) renderCosmetic(scene, cosmeticG, item, headR, bodyH);
    // Always-on halo orbit
    if (cosmeticG.starHalo) {
      scene.tweens.add({
        targets: cosmeticG.starHalo,
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

// Mouth ---------------------------------------------------------------------

function drawMouth(g, pal, w, y, mood) {
  g.clear();
  g.lineStyle(3, pal.outline, 0.85);
  if (mood === 'sad') {
    g.beginPath();
    g.moveTo(-w, y + 4);
    // Frown — small downward arc
    g.lineTo(-w * 0.4, y - 4);
    g.lineTo(w * 0.4, y - 4);
    g.lineTo(w, y + 4);
    g.strokePath();
  } else {
    // Happy smile
    g.beginPath();
    g.arc(0, y - w * 0.4, w, 0.2, Math.PI - 0.2);
    g.strokePath();
    // Tongue / inner-mouth dot
    g.fillStyle(pal.blush, 0.85);
    g.fillCircle(0, y, w * 0.35);
  }
}

// Egg ------------------------------------------------------------------------

function drawEgg(scene, parent, species, pal, headR) {
  const egg = scene.add.graphics();
  // Shadow / lower body color
  egg.fillStyle(pal.bodyLo, 1);
  egg.fillEllipse(0, 6, headR * 1.7, headR * 2.1);
  // Body
  egg.fillStyle(pal.body, 1);
  egg.fillEllipse(0, 0, headR * 1.6, headR * 2.0);
  // Highlight
  egg.fillStyle(pal.bodyHi, 0.65);
  egg.fillEllipse(-headR * 0.3, -headR * 0.5, headR * 0.7, headR * 0.7);
  // Crack
  egg.lineStyle(3, pal.outline, 0.6);
  egg.beginPath();
  egg.moveTo(-headR * 0.45, headR * 0.20);
  egg.lineTo(-headR * 0.20, headR * 0.05);
  egg.lineTo(0, headR * 0.25);
  egg.lineTo(headR * 0.25, headR * 0.05);
  egg.lineTo(headR * 0.50, headR * 0.20);
  egg.strokePath();
  // Sparkle accent ring
  egg.fillStyle(species.accent, 0.55);
  egg.fillEllipse(0, headR * 0.55, headR * 0.85, headR * 0.20);
  parent.add(egg);

  // Tiny eyes peeking through the crack
  const eyeR = headR * 0.13;
  const eyes = scene.add.graphics();
  eyes.fillStyle(pal.eyeBlack, 1);
  eyes.fillCircle(-headR * 0.18, headR * 0.15, eyeR);
  eyes.fillCircle(headR * 0.18, headR * 0.15, eyeR);
  eyes.fillStyle(pal.sparkle, 1);
  eyes.fillCircle(-headR * 0.18 - eyeR * 0.3, headR * 0.15 - eyeR * 0.3, eyeR * 0.4);
  eyes.fillCircle(headR * 0.18 - eyeR * 0.3, headR * 0.15 - eyeR * 0.3, eyeR * 0.4);
  parent.add(eyes);
}

// Species accents ------------------------------------------------------------

function drawSpeciesAccents(scene, parent, speciesId, stage, pal, headR, bodyH) {
  if (speciesId === 'ember') {
    // Flame tuft on top of head
    const flame = scene.add.graphics();
    flame.fillStyle(pal.accent, 1);
    flame.fillEllipse(0, -headR * 1.05, headR * 0.6, headR * 0.55);
    flame.fillStyle(pal.accentHi, 0.85);
    flame.fillEllipse(0, -headR * 1.10, headR * 0.30, headR * 0.30);
    flame.fillStyle(0xffffff, 0.7);
    flame.fillCircle(0, -headR * 1.15, headR * 0.10);
    parent.add(flame);
    if (stage === 'adult') {
      // Crescent wings behind body
      const wings = scene.add.graphics();
      wings.fillStyle(pal.accent, 0.85);
      wings.fillEllipse(-headR * 1.3, headR * 0.4, headR * 0.6, headR * 0.4);
      wings.fillEllipse(headR * 1.3, headR * 0.4, headR * 0.6, headR * 0.4);
      parent.add(wings);
    }
  } else if (speciesId === 'tide') {
    // Two droplet antennae
    const ant = scene.add.graphics();
    ant.lineStyle(3, pal.bodyLo, 1);
    ant.lineBetween(-headR * 0.45, -headR * 0.95, -headR * 0.55, -headR * 1.35);
    ant.lineBetween(headR * 0.45, -headR * 0.95, headR * 0.55, -headR * 1.35);
    ant.fillStyle(pal.accent, 1);
    ant.fillCircle(-headR * 0.55, -headR * 1.40, headR * 0.18);
    ant.fillCircle(headR * 0.55, -headR * 1.40, headR * 0.18);
    ant.fillStyle(0xffffff, 0.85);
    ant.fillCircle(-headR * 0.60, -headR * 1.45, headR * 0.06);
    ant.fillCircle(headR * 0.50, -headR * 1.45, headR * 0.06);
    parent.add(ant);
    if (stage === 'adult' || stage === 'teen') {
      // Tiny side fins
      const fins = scene.add.graphics();
      fins.fillStyle(pal.accent, 0.7);
      fins.fillTriangle(-headR * 1.05, headR * 0.45, -headR * 0.6, headR * 0.20, -headR * 0.55, headR * 0.65);
      fins.fillTriangle(headR * 1.05, headR * 0.45, headR * 0.6, headR * 0.20, headR * 0.55, headR * 0.65);
      parent.add(fins);
    }
  } else if (speciesId === 'sprout') {
    // Sprig on top
    const sprig = scene.add.graphics();
    sprig.lineStyle(3, darken(pal.accent, 0.4), 1);
    sprig.lineBetween(0, -headR * 0.95, 0, -headR * 1.30);
    sprig.fillStyle(pal.accent, 1);
    sprig.fillEllipse(-headR * 0.18, -headR * 1.20, headR * 0.30, headR * 0.18);
    sprig.fillEllipse(headR * 0.18, -headR * 1.30, headR * 0.30, headR * 0.18);
    parent.add(sprig);
    if (stage === 'teen' || stage === 'adult') {
      // Bloom on cheek
      const bloom = scene.add.graphics();
      const bx = headR * 0.85;
      const by = -headR * 0.55;
      bloom.fillStyle(0xffb3c1, 1);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        bloom.fillCircle(bx + Math.cos(a) * headR * 0.12, by + Math.sin(a) * headR * 0.12, headR * 0.10);
      }
      bloom.fillStyle(pal.accent, 1);
      bloom.fillCircle(bx, by, headR * 0.08);
      parent.add(bloom);
    }
  }
}

// Cosmetics ------------------------------------------------------------------

function renderCosmetic(scene, parent, item, headR, bodyH) {
  if (!item) return;
  if (item.id === 'hat_cap') {
    const g = scene.add.graphics();
    g.fillStyle(item.color, 1);
    g.fillEllipse(0, -headR * 1.05, headR * 1.4, headR * 0.65);
    g.fillStyle(darken(item.color, 0.25), 1);
    g.fillEllipse(headR * 0.7, -headR * 0.95, headR * 0.6, headR * 0.18);
    g.fillStyle(lighten(item.color, 0.20), 0.7);
    g.fillEllipse(-headR * 0.25, -headR * 1.15, headR * 0.4, headR * 0.18);
    parent.add(g);
  } else if (item.id === 'hat_crown') {
    const g = scene.add.graphics();
    g.fillStyle(item.color, 1);
    g.beginPath();
    g.moveTo(-headR * 0.7, -headR * 0.85);
    g.lineTo(-headR * 0.5, -headR * 1.15);
    g.lineTo(-headR * 0.25, -headR * 0.95);
    g.lineTo(0, -headR * 1.20);
    g.lineTo(headR * 0.25, -headR * 0.95);
    g.lineTo(headR * 0.5, -headR * 1.15);
    g.lineTo(headR * 0.7, -headR * 0.85);
    g.lineTo(headR * 0.6, -headR * 0.75);
    g.lineTo(-headR * 0.6, -headR * 0.75);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xff5577, 1);
    g.fillCircle(0, -headR * 0.85, headR * 0.10);
    parent.add(g);
  } else if (item.id === 'acc_scarf') {
    const g = scene.add.graphics();
    g.fillStyle(item.color, 1);
    g.fillRoundedRect(-headR * 0.95, headR * 0.55, headR * 1.9, headR * 0.30, headR * 0.10);
    g.fillStyle(lighten(item.color, 0.30), 0.6);
    g.fillRect(-headR * 0.85, headR * 0.62, headR * 1.7, headR * 0.05);
    parent.add(g);
  } else if (item.id === 'acc_shades') {
    const g = scene.add.graphics();
    g.fillStyle(item.color, 1);
    g.fillRoundedRect(-headR * 0.75, -headR * 0.30, headR * 0.55, headR * 0.36, headR * 0.10);
    g.fillRoundedRect(headR * 0.20, -headR * 0.30, headR * 0.55, headR * 0.36, headR * 0.10);
    g.lineStyle(3, item.color, 1);
    g.lineBetween(-headR * 0.20, -headR * 0.16, headR * 0.20, -headR * 0.16);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(-headR * 0.55, -headR * 0.20, headR * 0.10);
    g.fillCircle(headR * 0.40, -headR * 0.20, headR * 0.10);
    parent.add(g);
  } else if (item.id === 'acc_starbow') {
    const g = scene.add.graphics();
    const colors = [0xff6b6b, 0xff8b3d, 0xffd86b, 0x58d68d, 0x4ecdc4, 0xc77eff];
    const stripeH = headR * 0.06;
    for (let i = 0; i < colors.length; i++) {
      g.fillStyle(colors[i], 1);
      g.fillRect(-headR * 0.95, headR * 0.55 + i * stripeH, headR * 1.9, stripeH);
    }
    parent.add(g);
  } else if (item.id === 'hat_starhat') {
    const g = scene.add.graphics();
    // Helmet dome
    g.fillStyle(item.color, 1);
    g.fillEllipse(0, -headR * 1.05, headR * 1.5, headR * 0.85);
    g.fillStyle(lighten(item.color, 0.30), 0.7);
    g.fillEllipse(-headR * 0.25, -headR * 1.20, headR * 0.45, headR * 0.18);
    // Star on the front
    g.fillStyle(0xffffff, 1);
    drawStar(g, 0, -headR * 1.05, 5, headR * 0.20, headR * 0.08);
    parent.add(g);
  } else if (item.id === 'acc_jetpack') {
    const g = scene.add.graphics();
    g.fillStyle(item.color, 1);
    g.fillRoundedRect(-headR * 0.95, headR * 0.55, headR * 0.30, headR * 0.65, headR * 0.06);
    g.fillRoundedRect(headR * 0.65, headR * 0.55, headR * 0.30, headR * 0.65, headR * 0.06);
    g.fillStyle(darken(item.color, 0.35), 1);
    g.fillRect(-headR * 0.92, headR * 1.15, headR * 0.24, headR * 0.10);
    g.fillRect(headR * 0.68, headR * 1.15, headR * 0.24, headR * 0.10);
    parent.add(g);

    // Flame plume (hidden until rocketBoost fires)
    const flame = scene.add.graphics();
    flame.fillStyle(0xff8b3d, 1);
    flame.fillTriangle(-headR * 0.92, headR * 1.25, -headR * 0.68, headR * 1.25, -headR * 0.80, headR * 1.65);
    flame.fillTriangle(headR * 0.68, headR * 1.25, headR * 0.92, headR * 1.25, headR * 0.80, headR * 1.65);
    flame.fillStyle(0xffd86b, 1);
    flame.fillTriangle(-headR * 0.86, headR * 1.30, -headR * 0.74, headR * 1.30, -headR * 0.80, headR * 1.55);
    flame.fillTriangle(headR * 0.74, headR * 1.30, headR * 0.86, headR * 1.30, headR * 0.80, headR * 1.55);
    flame.setAlpha(0);
    parent.add(flame);
    parent.jetpackFlame = flame;
  } else if (item.id === 'hat_propeller') {
    const g = scene.add.graphics();
    g.fillStyle(item.color, 1);
    g.fillEllipse(0, -headR * 1.0, headR * 0.9, headR * 0.45);
    g.fillStyle(lighten(item.color, 0.30), 0.6);
    g.fillEllipse(-headR * 0.15, -headR * 1.10, headR * 0.30, headR * 0.10);
    g.fillStyle(0x07071a, 1);
    g.fillRect(-headR * 0.04, -headR * 1.45, headR * 0.08, headR * 0.30);
    parent.add(g);

    // Propeller blades
    const prop = scene.add.container(0, -headR * 1.45);
    const blade = scene.add.graphics();
    blade.fillStyle(0xff5577, 1);
    blade.fillEllipse(-headR * 0.45, 0, headR * 0.7, headR * 0.10);
    blade.fillEllipse(headR * 0.45, 0, headR * 0.7, headR * 0.10);
    prop.add(blade);
    parent.add(prop);
    parent.propeller = prop;
    // Idle slow spin
    scene.tweens.add({
      targets: prop,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    });
  } else if (item.id === 'acc_antenna') {
    const g = scene.add.graphics();
    g.lineStyle(3, item.color, 1);
    g.lineBetween(0, -headR * 1.0, 0, -headR * 1.40);
    parent.add(g);
    const tip = scene.add.graphics();
    tip.fillStyle(item.color, 1);
    tip.fillCircle(0, 0, headR * 0.10);
    tip.fillStyle(0xffffff, 1);
    drawStar(tip, 0, 0, 5, headR * 0.13, headR * 0.05);
    tip.x = 0;
    tip.y = -headR * 1.45;
    parent.add(tip);
    parent.antennaTip = tip;
  } else if (item.id === 'acc_starhalo') {
    const halo = scene.add.container(0, -headR * 0.20);
    const radius = headR * 1.10;
    const stars = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const sx = Math.cos(a) * radius;
      const sy = Math.sin(a) * radius * 0.45;
      const star = scene.add.graphics();
      star.fillStyle(item.color, 1);
      drawStar(star, 0, 0, 5, headR * 0.13, headR * 0.05);
      star.x = sx;
      star.y = sy;
      halo.add(star);
      stars.push(star);
    }
    halo.children = stars;
    parent.add(halo);
    parent.starHalo = halo;
  }
}

// Filled star shape — caller sets fillStyle. Differs from drawStarIcon in
// StatIcons.js by not assuming a fixed inner/outer radius ratio.
function drawStar(g, cx, cy, points, outerR, innerR) {
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
}
