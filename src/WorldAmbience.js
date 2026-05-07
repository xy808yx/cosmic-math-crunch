// Map ambience layers: starfield, drifting nebulae, shooting stars, and
// per-world themed particles. Designed for the WorldMapScene. The starfield
// helper already provides background stars; this module adds animated layers
// on top of (but behind) the world nodes.
//
// All emission respects a scene-wide cap to keep mid-tier phones at 60fps.

const SCENE_CAP = 60;
const PER_WORLD_CAP = 4;

// Build all ambience layers for the map.
// `nodePositions` is an array of {x, y} in path order, and `furthestUnlocked`
// is the highest world index that should emit theme particles.
export function createMapAmbience(scene, opts) {
  const { width, height, nodePositions, furthestUnlocked, accentColors } = opts;

  const state = {
    activeParticles: 0,
    layers: scene.add.container(0, 0).setDepth(1)
  };

  // Twinkling stars
  buildTwinkleStars(scene, state, width, height);

  // Drifting nebula clouds
  buildNebulaClouds(scene, state, width, height, accentColors);

  // Shooting stars
  scheduleShootingStar(scene, state, width, height);

  // Theme particles per unlocked world
  for (let i = 0; i <= furthestUnlocked; i++) {
    const pos = nodePositions[i];
    if (!pos) continue;
    buildWorldEmitter(scene, state, i + 1, pos.x, pos.y);
  }

  return state;
}

// 80 small dots; ~30% of them gently twinkle.
function buildTwinkleStars(scene, state, W, H) {
  const stars = [];
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * W;
    const y = 240 + Math.random() * (H - 460);
    const r = Math.random() < 0.15 ? 2 : 1;
    const dot = scene.add.circle(x, y, r, 0xffffff, 0.6 + Math.random() * 0.3);
    state.layers.add(dot);
    stars.push(dot);

    if (Math.random() < 0.3) {
      scene.tweens.add({
        targets: dot,
        alpha: 0.3,
        duration: 1500 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 2000
      });
    }
  }
  state.stars = stars;
}

// Three large soft pastel ellipses that slowly translate.
function buildNebulaClouds(scene, state, W, H, accentColors) {
  const palette = accentColors && accentColors.length
    ? accentColors
    : [0xb5e6ff, 0xff9ec7, 0xffe07a];
  for (let i = 0; i < 3; i++) {
    const color = palette[i % palette.length];
    const cloud = scene.add.graphics();
    cloud.fillStyle(color, 0.10);
    const w = 600 + Math.random() * 240;
    const h = 320 + Math.random() * 120;
    cloud.fillEllipse(0, 0, w, h);
    cloud.x = Math.random() * W;
    cloud.y = 320 + Math.random() * (H - 640);
    state.layers.add(cloud);

    const dir = i % 2 === 0 ? 1 : -1;
    const span = W + 800;
    scene.tweens.add({
      targets: cloud,
      x: cloud.x + dir * span,
      duration: 38000 + Math.random() * 20000,
      repeat: -1,
      onRepeat: () => {
        cloud.x = dir > 0 ? -400 : W + 400;
      }
    });
  }
}

// One shooting star every ~10s; randomized angle + length.
function scheduleShootingStar(scene, state, W, H) {
  const fire = () => {
    if (state.activeParticles >= SCENE_CAP) {
      scene.time.delayedCall(2000, fire);
      return;
    }
    const startX = Math.random() * W * 0.6;
    const startY = 280 + Math.random() * 400;
    const dx = 320 + Math.random() * 400;
    const dy = 220 + Math.random() * 280;

    const head = scene.add.circle(startX, startY, 3, 0xffffff, 1);
    state.layers.add(head);
    state.activeParticles++;

    const trail = scene.add.graphics();
    trail.lineStyle(3, 0xffffff, 0.55);
    trail.lineBetween(0, 0, -dx * 0.18, -dy * 0.18);
    trail.x = startX;
    trail.y = startY;
    state.layers.add(trail);
    state.activeParticles++;

    const dur = 800 + Math.random() * 400;
    scene.tweens.add({
      targets: [head, trail],
      x: '+=' + dx,
      y: '+=' + dy,
      alpha: 0,
      duration: dur,
      ease: 'Quad.easeIn',
      onComplete: () => {
        head.destroy();
        trail.destroy();
        state.activeParticles -= 2;
      }
    });

    scene.time.delayedCall(8000 + Math.random() * 6000, fire);
  };
  scene.time.delayedCall(2000 + Math.random() * 4000, fire);
}

// Per-world themed emitter. Each world contributes up to PER_WORLD_CAP active
// particles. Uses simple Phaser Graphics + tweens (cheap) rather than the full
// particle system so we have tight control over the cap.
function buildWorldEmitter(scene, state, worldId, cx, cy) {
  const themeFn = THEME_EMITTERS[worldId];
  if (!themeFn) return;

  let activeForWorld = 0;
  const tick = () => {
    if (state.activeParticles >= SCENE_CAP || activeForWorld >= PER_WORLD_CAP) {
      scene.time.delayedCall(700, tick);
      return;
    }
    const obj = themeFn(scene, state, cx, cy);
    if (obj) {
      activeForWorld++;
      state.activeParticles++;
      obj.once('destroy', () => {
        activeForWorld--;
        state.activeParticles--;
      });
    }
    const next = 600 + Math.random() * 800;
    scene.time.delayedCall(next, tick);
  };
  scene.time.delayedCall(500 + Math.random() * 1500, tick);
}

const THEME_EMITTERS = {
  // 1 — Moon Base: rising dust puffs (sky mint)
  1: (scene, state, cx, cy) => {
    const p = scene.add.circle(cx + (Math.random() - 0.5) * 50, cy + 20, 3, 0xb5e6ff, 0.9);
    state.layers.add(p);
    scene.tweens.add({
      targets: p, y: '-=40', alpha: 0,
      duration: 1800, ease: 'Sine.easeOut',
      onComplete: () => p.destroy()
    });
    return p;
  },
  // 2 — Asteroid Belt: small rock orbiting the node
  2: (scene, state, cx, cy) => {
    const radius = 70;
    const startA = Math.random() * Math.PI * 2;
    const p = scene.add.circle(cx + Math.cos(startA) * radius, cy + Math.sin(startA) * radius, 3, 0xc77a4a, 1);
    state.layers.add(p);
    const tween = { a: startA };
    scene.tweens.add({
      targets: tween, a: startA + Math.PI * 2,
      duration: 4000, ease: 'Linear',
      onUpdate: () => {
        p.x = cx + Math.cos(tween.a) * radius;
        p.y = cy + Math.sin(tween.a) * radius;
      },
      onComplete: () => p.destroy()
    });
    return p;
  },
  // 3 — Crystal Planet: lavender twinkle bursting outward
  3: (scene, state, cx, cy) => {
    const a = Math.random() * Math.PI * 2;
    const p = scene.add.circle(cx, cy, 2.5, 0xd5a6ff, 1);
    state.layers.add(p);
    scene.tweens.add({
      targets: p,
      x: cx + Math.cos(a) * 80, y: cy + Math.sin(a) * 80,
      alpha: 0, duration: 1200, ease: 'Quad.easeOut',
      onComplete: () => p.destroy()
    });
    return p;
  },
  // 4 — Nebula Gardens: pollen orbs drifting up
  4: (scene, state, cx, cy) => {
    const colors = [0xff9ec7, 0xfff3b8, 0xd5a6ff];
    const p = scene.add.circle(
      cx + (Math.random() - 0.5) * 70, cy + 30,
      3, colors[Math.floor(Math.random() * colors.length)], 0.85
    );
    state.layers.add(p);
    scene.tweens.add({
      targets: p, y: '-=70', alpha: 0,
      duration: 2400, ease: 'Sine.easeOut',
      onComplete: () => p.destroy()
    });
    return p;
  },
  // 5 — Robot Station: small electrical sparks
  5: (scene, state, cx, cy) => {
    const a = Math.random() * Math.PI * 2;
    const r = 50 + Math.random() * 20;
    const p = scene.add.rectangle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 6, 0xfff3b8);
    p.rotation = a;
    state.layers.add(p);
    scene.tweens.add({
      targets: p, alpha: 0,
      duration: 400, ease: 'Quad.easeIn',
      onComplete: () => p.destroy()
    });
    return p;
  },
  // 6 — Black Hole Edge: dots being pulled inward
  6: (scene, state, cx, cy) => {
    const a = Math.random() * Math.PI * 2;
    const startR = 120;
    const sx = cx + Math.cos(a) * startR;
    const sy = cy + Math.sin(a) * startR;
    const p = scene.add.circle(sx, sy, 2.5, 0xff9ec7, 1);
    state.layers.add(p);
    scene.tweens.add({
      targets: p, x: cx, y: cy, alpha: 0,
      duration: 1600, ease: 'Cubic.easeIn',
      onComplete: () => p.destroy()
    });
    return p;
  },
  // 7 — Ice Comet: snowflake glints
  7: (scene, state, cx, cy) => {
    const p = scene.add.circle(
      cx + (Math.random() - 0.5) * 100, cy + (Math.random() - 0.5) * 60,
      2, 0xffffff, 1
    );
    state.layers.add(p);
    scene.tweens.add({
      targets: p, alpha: 0, scale: 1.6,
      duration: 1500, ease: 'Sine.easeOut',
      onComplete: () => p.destroy()
    });
    return p;
  },
  // 8 — Supernova: orange sparks shooting outward
  8: (scene, state, cx, cy) => {
    const a = Math.random() * Math.PI * 2;
    const colors = [0xffae8a, 0xffe07a, 0xfff3b8];
    const p = scene.add.circle(cx, cy, 3, colors[Math.floor(Math.random() * colors.length)], 1);
    state.layers.add(p);
    scene.tweens.add({
      targets: p,
      x: cx + Math.cos(a) * 90, y: cy + Math.sin(a) * 90,
      alpha: 0, duration: 900, ease: 'Quad.easeOut',
      onComplete: () => p.destroy()
    });
    return p;
  },
  // 9 — Galactic Core: gold star bursts
  9: (scene, state, cx, cy) => {
    const a = Math.random() * Math.PI * 2;
    const r = 70 + Math.random() * 20;
    const p = scene.add.circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 0xffe07a, 1);
    state.layers.add(p);
    scene.tweens.add({
      targets: p, alpha: 0, scale: 1.8,
      duration: 1200, ease: 'Sine.easeOut',
      onComplete: () => p.destroy()
    });
    return p;
  },
  // 10 — Parallel Dimension: mirror-flicker outline pulses
  10: (scene, state, cx, cy) => {
    const ring = scene.add.circle(cx, cy, 60, 0x000000, 0);
    ring.setStrokeStyle(2, 0xa6f0e8, 1);
    state.layers.add(ring);
    scene.tweens.add({
      targets: ring, scale: 1.4, alpha: 0,
      duration: 1400, ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });
    return ring;
  },
  // 11 — Universe's End: faint cosmic-ray streaks
  11: (scene, state, cx, cy) => {
    const a = Math.random() * Math.PI * 2;
    const len = 80;
    const sx = cx + Math.cos(a) * 40;
    const sy = cy + Math.sin(a) * 40;
    const ex = cx + Math.cos(a) * (40 + len);
    const ey = cy + Math.sin(a) * (40 + len);
    const ray = scene.add.line(0, 0, sx, sy, ex, ey, 0xfff3b8, 0.7);
    ray.setLineWidth(1.5);
    state.layers.add(ray);
    scene.tweens.add({
      targets: ray, alpha: 0,
      duration: 1100, ease: 'Quad.easeIn',
      onComplete: () => ray.destroy()
    });
    return ray;
  }
};
