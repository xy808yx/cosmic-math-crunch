// Companion (pet) system — species data, hunger decay, feeding, evolution.
// Singleton; reads/writes through `progress.companion` on GameData.

import { progress } from './GameData.js';

export const SPECIES = {
  ember: {
    id: 'ember',
    name: 'Ember',
    archetype: 'fire',
    color: 0xff6b3d,
    accent: 0xffd86b,
    tagline: 'Plasma comet, fast and fierce',
    lore: 'Born from a dying star, Ember chases the brightest player in the galaxy. Loves long streaks.'
  },
  tide: {
    id: 'tide',
    name: 'Tide',
    archetype: 'water',
    color: 0x5dade2,
    accent: 0xa9e6ff,
    tagline: 'Liquid-metal jelly, calm and ancient',
    lore: 'Drifted in from the Andromeda spiral. Tide rewards careful, accurate play.'
  },
  sprout: {
    id: 'sprout',
    name: 'Sprout',
    archetype: 'grass',
    color: 0x58d68d,
    accent: 0xc8f7c5,
    tagline: 'Crystal-flora alien, cheerful and curious',
    lore: 'The last seedling of a green planet. Reseeds whatever it lands on. Practice helps it grow.'
  }
};

// Pellet thresholds for visible evolution stages.
const STAGE_THRESHOLDS = {
  egg:  0,
  baby: 30,
  teen: 150,
  adult: 500
};

// Hunger increases by this many points per real-world hour since last fed.
// 1 day ≈ 24 hours × 1.5 = 36 → noticeably grumpy after a day, sad/hungry after ~2.
const HUNGER_PER_HOUR = 1.5;

const MS_PER_HOUR = 1000 * 60 * 60;

class CompanionManager {
  // Set the species on first-launch picker.
  pickStarter(speciesId) {
    if (!SPECIES[speciesId]) return false;
    progress.companion.speciesId = speciesId;
    progress.companion.stage = 'egg';
    progress.companion.totalPellets = 0;
    progress.companion.hunger = 0;
    progress.companion.lastFedAt = Date.now();
    progress.save();
    return true;
  }

  hasStarter() {
    return !!progress.companion.speciesId;
  }

  getSpecies() {
    return SPECIES[progress.companion.speciesId] || null;
  }

  // Recompute hunger from elapsed time. Called on app open and scene transitions.
  // Honors the parent vacation-pause toggle.
  tickHunger() {
    if (progress.parentSettings.pauseHunger) {
      // Slide lastFedAt forward so resumed play doesn't suddenly spike hunger.
      progress.companion.lastFedAt = Date.now();
      progress.save();
      return;
    }
    const hours = (Date.now() - progress.companion.lastFedAt) / MS_PER_HOUR;
    const newHunger = Math.min(100, hours * HUNGER_PER_HOUR);
    progress.companion.hunger = Math.max(progress.companion.hunger, newHunger);
    progress.save();
  }

  // Feed N pellets (called per correct answer in GameScene).
  feed(pellets = 1) {
    progress.companion.totalPellets += pellets;
    progress.companion.hunger = Math.max(0, progress.companion.hunger - pellets * 5);
    progress.companion.lastFedAt = Date.now();
    this.recomputeStage();
    progress.save();
  }

  recomputeStage() {
    const total = progress.companion.totalPellets;
    let next = 'egg';
    if (total >= STAGE_THRESHOLDS.adult) next = 'adult';
    else if (total >= STAGE_THRESHOLDS.teen) next = 'teen';
    else if (total >= STAGE_THRESHOLDS.baby) next = 'baby';
    progress.companion.stage = next;
  }

  getStage() {
    return progress.companion.stage;
  }

  getHunger() {
    return Math.round(progress.companion.hunger);
  }

  // Mood is derived from hunger — used for face/animation choice.
  // Returns 'happy' | 'okay' | 'grumpy' | 'sad'.
  getMood() {
    const h = progress.companion.hunger;
    if (h < 25) return 'happy';
    if (h < 55) return 'okay';
    if (h < 80) return 'grumpy';
    return 'sad';
  }

  getTotalPellets() {
    return progress.companion.totalPellets;
  }

  // Pellets-to-next-stage progress for UI roadmap.
  getStageProgress() {
    const total = progress.companion.totalPellets;
    const order = ['egg', 'baby', 'teen', 'adult'];
    const idx = order.indexOf(progress.companion.stage);
    if (idx < 0 || idx === order.length - 1) {
      return { current: total, target: total, nextStage: null };
    }
    const nextStage = order[idx + 1];
    return {
      current: total,
      target: STAGE_THRESHOLDS[nextStage],
      nextStage
    };
  }
}

export const companion = new CompanionManager();

// ============================================================
// Procedural chibi pet rendering — no sprite assets needed.
// Construction order (back→front):
//   shadow → ambient glow → body → limbs → species rear features →
//   head → species crown features → blush → mouth → eyes
// Chibi rule: head ~65% of silhouette, eyes ~30% of head width.
// ============================================================
export function drawCompanion(scene, x, y, opts = {}) {
  const speciesId = opts.speciesId || progress.companion.speciesId || 'ember';
  const stage = opts.stage || progress.companion.stage || 'egg';
  const mood = opts.mood || (opts.preview ? 'happy' : companion.getMood());
  const scale = opts.scale ?? 1;
  const species = SPECIES[speciesId];

  const container = scene.add.container(x, y);
  if (!species) return container;

  // Soft ambient glow behind the pet.
  const glow = scene.add.circle(0, 0, 78 * scale, species.accent, 0.18);
  container.add(glow);
  scene.tweens.add({
    targets: glow,
    alpha: 0.32,
    scale: 1.1,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  if (stage === 'egg') {
    drawEgg(scene, container, species, scale);
  } else {
    const stageScale = stageScaleFor(stage);
    drawCreature(scene, container, species, scale * stageScale, mood, stage);
  }

  // Idle bob.
  scene.tweens.add({
    targets: container,
    y: y - 4 * scale,
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  container.species = species;
  container.stage = stage;
  return container;
}

function stageScaleFor(stage) {
  if (stage === 'baby') return 0.78;
  if (stage === 'teen') return 0.95;
  return 1.12;             // adult
}

// Stage-driven chibi proportions.
// chibiness = how much head dominates (0=normal, 1=max chibi).
function chibiProfile(stage) {
  if (stage === 'baby') return { headR: 50, eyeSize: 1.18, eyeSpacing: 17, mouthY: 14 };
  if (stage === 'teen') return { headR: 46, eyeSize: 1.05, eyeSpacing: 18, mouthY: 16 };
  return { headR: 44, eyeSize: 1.0, eyeSpacing: 19, mouthY: 17 }; // adult — most proportionate but still chibi
}

// ============================================================
// EGG — eyes peek through a hairline crack.
// ============================================================
function drawEgg(scene, container, species, scale) {
  const s = scale;
  const eggW = 78 * s;
  const eggH = 96 * s;

  // Soft drop shadow under egg.
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.22);
  shadow.fillEllipse(0, eggH / 2 + 8 * s, eggW * 0.85, 14 * s);
  container.add(shadow);

  // Egg body
  const g = scene.add.graphics();
  g.fillStyle(species.color, 1);
  g.fillEllipse(0, 0, eggW, eggH);
  // Subtle gradient feel — darker bottom band
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(0, eggH * 0.18, eggW * 0.96, eggH * 0.62);

  // Belly accent / lighter underside
  g.fillStyle(species.accent, 0.45);
  g.fillEllipse(0, eggH * 0.25, eggW * 0.7, eggH * 0.32);

  // Spots in accent color
  g.fillStyle(species.accent, 0.95);
  g.fillCircle(-18 * s, 22 * s, 5 * s);
  g.fillCircle(20 * s, 6 * s, 4 * s);
  g.fillCircle(-4 * s, 32 * s, 3.5 * s);

  // Top highlight (glossy egg)
  g.fillStyle(0xffffff, 0.42);
  g.fillEllipse(-14 * s, -28 * s, 22 * s, 14 * s);
  g.fillStyle(0xffffff, 0.25);
  g.fillEllipse(-6 * s, -16 * s, 8 * s, 6 * s);

  // Outline
  g.lineStyle(3 * Math.max(0.6, s), 0x07071a, 0.78);
  g.strokeEllipse(0, 0, eggW, eggH);
  container.add(g);

  // Hairline crack across the middle (jagged line)
  const crack = scene.add.graphics();
  crack.lineStyle(2 * Math.max(0.6, s), 0x07071a, 0.85);
  const crackY = -2 * s;
  const xs = [-eggW * 0.42, -eggW * 0.28, -eggW * 0.12, eggW * 0.04, eggW * 0.2, eggW * 0.34, eggW * 0.46];
  const ys = [crackY, crackY - 5 * s, crackY + 4 * s, crackY - 3 * s, crackY + 5 * s, crackY - 4 * s, crackY + 2 * s];
  crack.beginPath();
  crack.moveTo(xs[0], ys[0]);
  for (let i = 1; i < xs.length; i++) crack.lineTo(xs[i], ys[i]);
  crack.strokePath();
  container.add(crack);

  // Eyes peeking through the crack — small but sparkly.
  addAnimeEyes(scene, container, {
    mood: 'happy',
    scale: s * 0.7,
    eyeY: -10 * s,
    eyeSpacing: 14 * s,
    irisColor: species.accent,
    showLashes: false
  });
}

// ============================================================
// CREATURE — chibi body with anime face.
// ============================================================
function drawCreature(scene, container, species, scale, mood, stage) {
  const s = scale;
  const profile = chibiProfile(stage);
  const headR = profile.headR;

  // ----- Drop shadow (very bottom) -----
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.25);
  shadow.fillEllipse(0, headR * 1.05 * s, headR * 1.7 * s, 14 * s);
  container.add(shadow);

  // ----- Body (small rounded blob below head) -----
  const bodyY = headR * 0.62 * s;
  const bodyW = headR * 1.0 * s;
  const bodyH = headR * 0.68 * s;
  const body = scene.add.graphics();
  body.fillStyle(darken(species.color, 0.08), 1);
  body.fillEllipse(0, bodyY, bodyW, bodyH);
  // Belly accent
  body.fillStyle(species.accent, 0.55);
  body.fillEllipse(0, bodyY + 4 * s, bodyW * 0.7, bodyH * 0.6);
  body.lineStyle(2.5 * Math.max(0.6, s), 0x07071a, 0.7);
  body.strokeEllipse(0, bodyY, bodyW, bodyH);
  container.add(body);

  // ----- Tiny stub limbs (mittens at body sides) -----
  const limbY = bodyY + bodyH * 0.1;
  const limbR = headR * 0.18 * s;
  const limbX = bodyW * 0.55;
  const limbs = scene.add.graphics();
  limbs.fillStyle(species.color, 1);
  limbs.fillCircle(-limbX, limbY, limbR);
  limbs.fillCircle(limbX, limbY, limbR);
  limbs.lineStyle(2 * Math.max(0.6, s), 0x07071a, 0.65);
  limbs.strokeCircle(-limbX, limbY, limbR);
  limbs.strokeCircle(limbX, limbY, limbR);
  container.add(limbs);

  // ----- Species REAR features (drawn behind head — ears, antennae) -----
  drawSpeciesRearFeatures(scene, container, species, stage, s, headR);

  // ----- Head (the dominant feature) -----
  const head = scene.add.graphics();
  head.fillStyle(species.color, 1);
  head.fillCircle(0, 0, headR * s);
  // Top sheen
  head.fillStyle(0xffffff, 0.28);
  head.fillEllipse(-headR * 0.34 * s, -headR * 0.5 * s, headR * 0.55 * s, headR * 0.28 * s);
  // Lower head shading (very subtle)
  head.fillStyle(0x000000, 0.08);
  head.fillEllipse(0, headR * 0.42 * s, headR * 1.4 * s, headR * 0.5 * s);
  // Outline
  head.lineStyle(3 * Math.max(0.6, s), 0x07071a, 0.78);
  head.strokeCircle(0, 0, headR * s);
  container.add(head);

  // ----- Species CROWN features (drawn on top of head) -----
  drawSpeciesCrownFeatures(scene, container, species, stage, s, headR);

  // ----- Blush -----
  if (mood === 'happy' || mood === 'okay') {
    addBlush(scene, container, mood, s, headR);
  }

  // ----- Mouth -----
  addChibiMouth(scene, container, mood, s, profile.mouthY, headR);

  // ----- Eyes (always last so they sit on top) -----
  addAnimeEyes(scene, container, {
    mood,
    scale: s * profile.eyeSize,
    eyeY: -headR * 0.12 * s,
    eyeSpacing: profile.eyeSpacing * s,
    irisColor: species.accent,
    showLashes: stage === 'teen' || stage === 'adult'
  });
}

// ============================================================
// ANIME EYES — sclera + iris + pupil + sparkles.
// ============================================================
function addAnimeEyes(scene, container, opts) {
  const { mood, scale: s, eyeY, eyeSpacing, irisColor, showLashes } = opts;
  const g = scene.add.graphics();

  // Sad / grumpy moods use simpler eye shapes.
  if (mood === 'sad') {
    g.lineStyle(3.5 * s, 0x07071a, 1);
    g.beginPath();
    g.arc(-eyeSpacing, eyeY + 2 * s, 8 * s, 0, Math.PI, true);
    g.strokePath();
    g.beginPath();
    g.arc(eyeSpacing, eyeY + 2 * s, 8 * s, 0, Math.PI, true);
    g.strokePath();
    // Tear drops
    g.fillStyle(0x9be3ff, 0.9);
    g.fillCircle(-eyeSpacing - 6 * s, eyeY + 12 * s, 3 * s);
    g.fillCircle(eyeSpacing + 6 * s, eyeY + 12 * s, 3 * s);
    container.add(g);
    return;
  }

  if (mood === 'grumpy') {
    g.lineStyle(3.5 * s, 0x07071a, 1);
    // Squinty diagonal lines
    g.lineBetween(-eyeSpacing - 8 * s, eyeY - 2 * s, -eyeSpacing + 8 * s, eyeY + 3 * s);
    g.lineBetween(eyeSpacing - 8 * s, eyeY + 3 * s, eyeSpacing + 8 * s, eyeY - 2 * s);
    // Small pupil dots beneath
    g.fillStyle(0x07071a, 1);
    g.fillCircle(-eyeSpacing, eyeY + 8 * s, 2.5 * s);
    g.fillCircle(eyeSpacing, eyeY + 8 * s, 2.5 * s);
    container.add(g);
    return;
  }

  // Full anime eyes for happy / okay.
  const scleraW = 18 * s;
  const scleraH = 22 * s;
  const irisR = 8 * s;
  const pupilR = 5 * s;
  const sparkleBigR = 4 * s;
  const sparkleSmallR = 1.8 * s;

  // Slight outward tilt for anime appeal.
  for (const dir of [-1, 1]) {
    const cx = dir * eyeSpacing;

    // Sclera (white)
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx, eyeY, scleraW, scleraH);

    // Iris (colored)
    const irisCY = eyeY + (mood === 'happy' ? 1 * s : 0);
    g.fillStyle(irisColor, 1);
    g.fillCircle(cx, irisCY, irisR);
    // Iris darker rim
    g.lineStyle(1.5 * s, darken(irisColor, 0.35), 0.9);
    g.strokeCircle(cx, irisCY, irisR);

    // Pupil (black)
    g.fillStyle(0x07071a, 1);
    g.fillCircle(cx, irisCY, pupilR);

    // Big sparkle highlight (top-left of iris)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 3 * s, irisCY - 3 * s, sparkleBigR);
    // Small sparkle (bottom-right)
    g.fillCircle(cx + 3 * s, irisCY + 3 * s, sparkleSmallR);

    // Outer eye outline (defines the sclera)
    g.lineStyle(2.2 * s, 0x07071a, 0.95);
    g.strokeEllipse(cx, eyeY, scleraW, scleraH);

    // Lashes (3 short upper strokes)
    if (showLashes) {
      g.lineStyle(2 * s, 0x07071a, 1);
      const topY = eyeY - scleraH * 0.5;
      g.lineBetween(cx - 6 * s, topY + 1 * s, cx - 9 * s, topY - 4 * s);
      g.lineBetween(cx, topY - 1 * s, cx, topY - 6 * s);
      g.lineBetween(cx + 6 * s, topY + 1 * s, cx + 9 * s, topY - 4 * s);
    }
  }

  container.add(g);
}

// ============================================================
// MOUTH — chibi ":3" cat-style for happy.
// ============================================================
function addChibiMouth(scene, container, mood, s, mouthY, headR) {
  const g = scene.add.graphics();
  g.lineStyle(2.8 * s, 0x07071a, 1);
  const y = mouthY * s;

  if (mood === 'happy') {
    // ":3" — two upward arcs meeting at center
    g.beginPath();
    g.arc(-3 * s, y, 4 * s, 0, Math.PI);   // left bump (curve down)
    g.strokePath();
    g.beginPath();
    g.arc(3 * s, y, 4 * s, 0, Math.PI);
    g.strokePath();
    // Tiny tongue dot for extra cute
    g.fillStyle(0xff9aa8, 1);
    g.fillCircle(0, y + 2.5 * s, 1.6 * s);
  } else if (mood === 'okay') {
    // Small contented smile
    g.beginPath();
    g.arc(0, y, 6 * s, 0, Math.PI);
    g.strokePath();
  } else if (mood === 'grumpy') {
    // Small "o" frown
    g.fillStyle(0x07071a, 0.9);
    g.fillCircle(0, y + 2 * s, 3.5 * s);
  } else {
    // Sad — open frown
    g.beginPath();
    g.arc(0, y + 6 * s, 7 * s, Math.PI, Math.PI * 2);
    g.strokePath();
  }
  container.add(g);
}

// ============================================================
// BLUSH — pink ovals on cheeks.
// ============================================================
function addBlush(scene, container, mood, s, headR) {
  const g = scene.add.graphics();
  const alpha = mood === 'happy' ? 0.55 : 0.35;
  g.fillStyle(0xffb3c1, alpha);
  const cheekY = headR * 0.18 * s;
  const cheekX = headR * 0.55 * s;
  g.fillEllipse(-cheekX, cheekY, 13 * s, 6 * s);
  g.fillEllipse(cheekX, cheekY, 13 * s, 6 * s);
  container.add(g);
}

// ============================================================
// SPECIES SILHOUETTES — distinct rear/crown features per archetype.
// ============================================================
function drawSpeciesRearFeatures(scene, container, species, stage, s, headR) {
  if (species.archetype === 'fire') {
    // Inner glow ring around head
    const ring = scene.add.graphics();
    ring.lineStyle(4 * s, species.accent, 0.45);
    ring.strokeCircle(0, 0, (headR + 3) * s);
    container.add(ring);
  } else if (species.archetype === 'water') {
    // Two thin antennae with droplet tips reaching above the head
    const ant = scene.add.graphics();
    ant.lineStyle(2.4 * s, darken(species.color, 0.15), 0.95);
    // Left antenna
    ant.beginPath();
    ant.moveTo(-headR * 0.45 * s, -headR * 0.78 * s);
    ant.lineTo(-headR * 0.7 * s, -headR * 1.45 * s);
    ant.strokePath();
    // Right antenna
    ant.beginPath();
    ant.moveTo(headR * 0.45 * s, -headR * 0.78 * s);
    ant.lineTo(headR * 0.7 * s, -headR * 1.45 * s);
    ant.strokePath();
    // Droplet tips
    ant.fillStyle(species.accent, 1);
    ant.fillCircle(-headR * 0.7 * s, -headR * 1.5 * s, 5 * s);
    ant.fillCircle(headR * 0.7 * s, -headR * 1.5 * s, 5 * s);
    // Sparkle on droplets
    ant.fillStyle(0xffffff, 0.85);
    ant.fillCircle(-headR * 0.74 * s, -headR * 1.54 * s, 1.6 * s);
    ant.fillCircle(headR * 0.66 * s, -headR * 1.54 * s, 1.6 * s);
    container.add(ant);
    // Subtle bob on antennae (sway)
    scene.tweens.add({
      targets: ant,
      angle: { from: -3, to: 3 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  } else {
    // Sprout — leaf-shaped ears tilted outward
    const ears = scene.add.graphics();
    ears.fillStyle(species.accent, 1);
    drawLeafShape(ears, -headR * 0.85 * s, -headR * 0.55 * s, 12 * s, 22 * s, -25);
    drawLeafShape(ears, headR * 0.85 * s, -headR * 0.55 * s, 12 * s, 22 * s, 25);
    ears.lineStyle(1.8 * s, darken(species.accent, 0.35), 0.85);
    drawLeafOutline(ears, -headR * 0.85 * s, -headR * 0.55 * s, 12 * s, 22 * s, -25);
    drawLeafOutline(ears, headR * 0.85 * s, -headR * 0.55 * s, 12 * s, 22 * s, 25);
    container.add(ears);
  }
}

function drawSpeciesCrownFeatures(scene, container, species, stage, s, headR) {
  if (species.archetype === 'fire') {
    // Flame mohawk — 3 tips for baby, 5 for adult
    const tips = stage === 'adult' ? 5 : stage === 'teen' ? 4 : 3;
    const tuft = scene.add.graphics();
    tuft.fillStyle(species.accent, 1);
    const baseY = -headR * 0.85 * s;
    const spread = headR * 0.6 * s;
    for (let i = 0; i < tips; i++) {
      const t = tips === 1 ? 0 : (i / (tips - 1)) * 2 - 1;          // -1..1
      const cx = t * spread;
      const tipH = (1 - Math.abs(t) * 0.5) * headR * 0.7 * s;
      const baseW = headR * 0.18 * s;
      tuft.beginPath();
      tuft.moveTo(cx - baseW, baseY);
      tuft.lineTo(cx, baseY - tipH);
      tuft.lineTo(cx + baseW, baseY);
      tuft.closePath();
      tuft.fillPath();
    }
    // Inner flame highlight
    tuft.fillStyle(0xffe8b0, 0.85);
    tuft.fillCircle(0, baseY - headR * 0.32 * s, headR * 0.08 * s);
    container.add(tuft);
    scene.tweens.add({
      targets: tuft,
      scaleY: 1.18,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Ear tufts at 10/2 o'clock
    const ears = scene.add.graphics();
    ears.fillStyle(species.color, 1);
    ears.lineStyle(2 * s, 0x07071a, 0.7);
    drawTriangle(ears, -headR * 0.78 * s, -headR * 0.6 * s, headR * 0.22 * s, headR * 0.36 * s, -18);
    drawTriangle(ears, headR * 0.78 * s, -headR * 0.6 * s, headR * 0.22 * s, headR * 0.36 * s, 18);
    container.add(ears);
  } else if (species.archetype === 'water') {
    // Small water droplet "tear" highlight at the top of the head
    const drop = scene.add.graphics();
    drop.fillStyle(species.accent, 0.95);
    drop.fillCircle(0, -headR * 0.78 * s, 7 * s);
    drop.fillStyle(0xffffff, 0.8);
    drop.fillCircle(-2 * s, -headR * 0.82 * s, 2 * s);
    container.add(drop);
  } else {
    // Sprout — curling sprig + tiny leaf at the crown
    const sprig = scene.add.graphics();
    sprig.lineStyle(3 * s, darken(species.accent, 0.35), 0.95);
    sprig.beginPath();
    sprig.moveTo(0, -headR * 0.78 * s);
    // Curve up and slightly right
    sprig.lineTo(2 * s, -headR * 1.0 * s);
    sprig.lineTo(5 * s, -headR * 1.18 * s);
    sprig.lineTo(3 * s, -headR * 1.32 * s);
    sprig.strokePath();

    // Tiny leaf at end of sprig
    sprig.fillStyle(species.accent, 1);
    drawLeafShape(sprig, 8 * s, -headR * 1.32 * s, 8 * s, 14 * s, 35);
    sprig.lineStyle(1.4 * s, darken(species.accent, 0.4), 0.9);
    drawLeafOutline(sprig, 8 * s, -headR * 1.32 * s, 8 * s, 14 * s, 35);
    container.add(sprig);

    // Cheek vine curls (tiny, decorative)
    const vines = scene.add.graphics();
    vines.lineStyle(1.5 * s, darken(species.accent, 0.25), 0.7);
    for (const dir of [-1, 1]) {
      vines.beginPath();
      vines.arc(dir * headR * 0.62 * s, headR * 0.22 * s, 4 * s, 0, Math.PI * 1.4);
      vines.strokePath();
    }
    container.add(vines);
  }
}

// ============================================================
// SHAPE HELPERS
// ============================================================
function drawTriangle(g, cx, cy, w, h, rotationDeg) {
  const rot = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const pts = [
    { x: -w, y: h * 0.5 },
    { x: 0, y: -h * 0.5 },
    { x: w, y: h * 0.5 }
  ].map(p => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos }));
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  g.lineTo(pts[1].x, pts[1].y);
  g.lineTo(pts[2].x, pts[2].y);
  g.closePath();
  g.fillPath();
  g.strokePath();
}

function drawLeafShape(g, cx, cy, halfW, halfH, rotationDeg) {
  // Almond/leaf shape: two arcs meeting at top and bottom.
  const rot = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const pts = [];
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    // Leaf-ish: x = cos(t)*halfW, y = sin(t)*halfH, but pinch the ends
    const px = Math.cos(t) * halfW;
    const py = Math.sin(t) * halfH;
    pts.push({ x: cx + px * cos - py * sin, y: cy + px * sin + py * cos });
  }
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.fillPath();
}

function drawLeafOutline(g, cx, cy, halfW, halfH, rotationDeg) {
  const rot = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const pts = [];
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const px = Math.cos(t) * halfW;
    const py = Math.sin(t) * halfH;
    pts.push({ x: cx + px * cos - py * sin, y: cy + px * sin + py * cos });
  }
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.strokePath();
}

// Returns the same color shifted darker by `amount` (0..1).
function darken(color, amount) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const k = 1 - amount;
  return ((Math.max(0, Math.min(255, Math.round(r * k))) << 16) |
          (Math.max(0, Math.min(255, Math.round(g * k))) << 8) |
          (Math.max(0, Math.min(255, Math.round(b * k)))));
}
