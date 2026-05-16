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
