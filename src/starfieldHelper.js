import Phaser from 'phaser';

// Drop a parallax starfield + gradient background into a scene.
// Optional accentColor tints the bottom of the gradient (the world's accent).
// Phaser auto-cleans the time events and tweens on scene shutdown.
export function createStarfield(scene, opts = {}) {
  const {
    width = 800,
    height = 1400,
    bgTopColor = 0x070713,
    bgBottomColor = 0x141430,
    accentColor = null,
    accentStrength = 0.15,
    layers = [
      { count: 50, speed: 0.12, sizeMin: 1, sizeMax: 2, alpha: 0.35 },
      { count: 28, speed: 0.22, sizeMin: 1, sizeMax: 3, alpha: 0.55 },
      { count: 14, speed: 0.38, sizeMin: 2, sizeMax: 4, alpha: 0.85 }
    ],
    enableShootingStars = true,
    depth = -10,
    parent = null
  } = opts;

  const adopt = parent ? (obj) => parent.add(obj) : () => {};

  // === Background gradient ===
  const bg = scene.add.graphics().setDepth(depth);
  bg.fillGradientStyle(bgTopColor, bgTopColor, bgBottomColor, bgBottomColor, 1);
  bg.fillRect(0, 0, width, height);
  adopt(bg);

  if (accentColor !== null) {
    const accent = scene.add.graphics().setDepth(depth + 1);
    accent.fillStyle(accentColor, accentStrength);
    accent.fillEllipse(width / 2, height + height * 0.3, width * 1.4, height * 0.85);
    adopt(accent);
  }

  const layerData = layers.map((cfg) => {
    const stars = [];
    for (let i = 0; i < cfg.count; i++) {
      const star = scene.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(cfg.sizeMin, cfg.sizeMax),
        0xffffff,
        cfg.alpha
      ).setDepth(depth + 2);
      star.baseAlpha = cfg.alpha;
      star.twinkleSpeed = Phaser.Math.FloatBetween(0.5, 2);
      star.twinkleOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
      stars.push(star);
      adopt(star);
    }
    return { ...cfg, stars };
  });

  scene.time.addEvent({
    delay: 50,
    loop: true,
    callback: () => {
      const t = scene.time.now / 1000;
      for (const layer of layerData) {
        for (const star of layer.stars) {
          star.y += layer.speed;
          if (star.y > height + 20) {
            star.y = -20;
            star.x = Phaser.Math.Between(0, width);
          }
          const twinkle = Math.sin(t * star.twinkleSpeed + star.twinkleOffset);
          star.setAlpha(star.baseAlpha * (0.6 + 0.4 * twinkle));
        }
      }
    }
  });

  if (enableShootingStars) {
    const fire = () => {
      const startX = Phaser.Math.Between(80, width - 80);
      const startY = Phaser.Math.Between(-40, height * 0.25);
      const trail = scene.add.graphics().setDepth(depth + 3);
      const len = 70;
      for (let i = 0; i < len; i++) {
        const a = (1 - i / len) * 0.7;
        const r = 3 * (1 - i / len);
        trail.fillStyle(0xffffff, a);
        trail.fillCircle(-i * 0.7, i * 0.4, r);
      }
      trail.x = startX;
      trail.y = startY;
      adopt(trail);
      scene.tweens.add({
        targets: trail,
        x: startX + 280,
        y: startY + 160,
        alpha: 0,
        duration: 750,
        ease: 'Quad.easeIn',
        onComplete: () => trail.destroy()
      });
    };

    const schedule = () => {
      scene.time.delayedCall(
        Phaser.Math.Between(8000, 14000),
        () => {
          fire();
          schedule();
        }
      );
    };
    schedule();
  }
}

// Chapter 2 "Inner Space" map base — the warm living-body replacement for the
// cosmic starfield. Deliberately NO white stars and NO shooting stars: a deep
// arterial gradient, a soft plasma vignette, and one slowly breathing membrane
// overlay so the whole screen feels like it's gently inhaling. Drawn behind
// everything (depth -10 / -9); per-cell ambience + drifting cells are layered on
// top by WorldAmbience.createMapAmbience.
export function createInnerSpaceBase(scene, opts = {}) {
  const { width = W_DEFAULT, height = H_DEFAULT } = opts;

  // A1 — deep arterial vertical gradient (plum top → maroon bottom), darker than
  // any per-node background so the world nodes always read on top.
  const base = scene.add.graphics().setDepth(-10);
  base.fillGradientStyle(0x140208, 0x140208, 0x4a0e1c, 0x4a0e1c, 1);
  base.fillRect(0, 0, width, height);

  // A2 — plasma vignette: a warm glow welling up from the bottom plus a faint
  // top counter-glow. Keeps the centre dim for label contrast.
  const glow = scene.add.graphics().setDepth(-9);
  glow.fillStyle(0x8a2b3a, 0.22);
  glow.fillEllipse(width / 2, height + height * 0.28, width * 1.5, height * 0.9);
  glow.fillStyle(0xc23a4a, 0.06);
  glow.fillEllipse(width / 2, -height * 0.1, width * 1.4, height * 0.6);

  // A3 — the breathing membrane: one big soft rose ellipse drawn about its own
  // centre, then positioned, so it scales (breathes) in place. Opacity is driven
  // by the graphics' own alpha (0.05 → 0.09) so the whole warm wash gently swells
  // ~7 breaths/min — the signature "we're inside something alive" cue.
  const membrane = scene.add.graphics().setDepth(-9);
  membrane.fillStyle(0xff7a8a, 1);
  membrane.fillEllipse(0, 0, width * 1.25, height * 0.78);
  membrane.x = width / 2;
  membrane.y = height / 2;
  membrane.setAlpha(0.05);
  scene.tweens.add({
    targets: membrane,
    scaleX: 1.04, scaleY: 1.055, alpha: 0.09,
    duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  });

  return { base, glow, membrane };
}

const W_DEFAULT = 1080;
const H_DEFAULT = 1920;
