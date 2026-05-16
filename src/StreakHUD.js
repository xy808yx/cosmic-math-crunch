// Streak HUD with five "grow & glow" visual tiers driven by the current
// streak count. Owned by the game top bar; the scene calls `setStreak(n)`
// each time the streak changes.
//
// Tiers:
//   0–2   : plain orange digit (current behavior).
//   3–6   : flame outline pulse behind the digit.
//   7–9   : ember particles drift upward from the digit.
//   10–19 : comet trail under the digit (fading streaks behind).
//   20–29 : nova halo — 8 slow rotating rays at low alpha.
//   30+   : rays slightly faster, halo color saturates toward warm yellow.
//
// On reset (streak → 0): digit snaps to 0; halo, comet, embers fade over 180ms.

import { style } from './textStyles.js';
import { MOTION } from './motionConstants.js';

const FLAME_COLOR = 0xff8b3d;
const NOVA_COLOR_BASE = 0xffd07a;
const NOVA_COLOR_HOT = 0xfff3b8;
const EMBER_POOL_SIZE = 8;
const RAY_COUNT = 8;

export function createStreakHUD(scene, opts = {}) {
  const {
    x = 0,
    y = 0,
    depth = 10,
    textStyle = { fontSize: '52px', fill: '#ff8b3d' },
  } = opts;

  // Digit's left edge sits at container origin (origin 0, 0.5 on text).
  const root = scene.add.container(x, y).setDepth(depth);

  // Halo (deepest layer) — 8 rotating rays, hidden at low tiers.
  const halo = scene.add.graphics();
  halo.setAlpha(0);
  root.add(halo);

  // Comet trail — short tail behind the digit, hidden at low tiers.
  const comet = scene.add.graphics();
  comet.setAlpha(0);
  root.add(comet);

  // Flame outline — pulsing glow behind the digit at mid tiers.
  const flameOutline = scene.add.graphics();
  flameOutline.setAlpha(0);
  root.add(flameOutline);

  // Embers — pre-allocated pool of tiny circles that drift upward.
  const embers = [];
  for (let i = 0; i < EMBER_POOL_SIZE; i++) {
    const e = scene.add.graphics();
    e.fillStyle(FLAME_COLOR, 1);
    e.fillCircle(0, 0, 4);
    e.setAlpha(0);
    e.setActive(false);
    embers.push(e);
    root.add(e);
  }

  // Digit text — origin left/center to match the legacy streakText layout.
  const text = scene.add.text(0, 0, '0', style('display', textStyle)).setOrigin(0, 0.5);
  root.add(text);

  const tweens = {
    flamePulse: null,
    haloRotate: null,
    emberSpawn: null,
    cometDraw: null,
  };

  let currentTier = -1;
  let currentStreak = 0;
  let cometPhase = 0;
  let textW = 0;

  function tierFor(n) {
    if (n >= 30) return 5;
    if (n >= 20) return 4;
    if (n >= 10) return 3;
    if (n >= 7) return 2;
    if (n >= 3) return 1;
    return 0;
  }

  function killTween(key) {
    if (tweens[key]) {
      tweens[key].stop();
      tweens[key] = null;
    }
  }

  function drawFlameOutline() {
    flameOutline.clear();
    flameOutline.lineStyle(6, FLAME_COLOR, 0.6);
    flameOutline.strokeRoundedRect(-12, -text.height / 2 - 6, textW + 24, text.height + 12, 18);
  }

  function drawComet() {
    comet.clear();
    const tailLen = 90;
    for (let i = 0; i < 5; i++) {
      const a = (1 - i / 5) * 0.45;
      const len = tailLen - i * 14;
      comet.lineStyle(8 - i * 1.2, FLAME_COLOR, a);
      const phase = cometPhase + i * 0.4;
      const yOff = Math.sin(phase) * 2;
      comet.lineBetween(-i * 12, yOff, -i * 12 - len, yOff + Math.sin(phase + 0.5) * 4);
    }
  }

  // Rays drawn once around the graphic origin; rotation is animated via
  // halo.rotation rather than per-frame redraws. drawHalo runs only when the
  // hot/normal color flips or the digit width changes.
  function drawHalo(hot) {
    halo.clear();
    const color = hot ? NOVA_COLOR_HOT : NOVA_COLOR_BASE;
    const r0 = 40;
    const r1 = 100;
    halo.lineStyle(6, color, 0.32);
    for (let i = 0; i < RAY_COUNT; i++) {
      const ang = (i / RAY_COUNT) * Math.PI * 2;
      halo.lineBetween(Math.cos(ang) * r0, Math.sin(ang) * r0, Math.cos(ang) * r1, Math.sin(ang) * r1);
    }
    halo.x = textW / 2;
  }

  function startFlamePulse() {
    killTween('flamePulse');
    drawFlameOutline();
    flameOutline.setAlpha(0.85);
    tweens.flamePulse = scene.tweens.add({
      targets: flameOutline,
      alpha: { from: 0.85, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: MOTION.transitions.ease,
    });
  }

  function stopFlamePulse(fadeMs = 180) {
    killTween('flamePulse');
    if (flameOutline.alpha === 0) return;
    scene.tweens.add({
      targets: flameOutline,
      alpha: 0,
      duration: fadeMs,
      onComplete: () => flameOutline.clear(),
    });
  }

  function startEmberLoop() {
    killTween('emberSpawn');
    let idx = 0;
    tweens.emberSpawn = scene.time.addEvent({
      delay: 180,
      loop: true,
      callback: () => {
        const e = embers[idx % embers.length];
        idx++;
        if (!e.active && idx > embers.length * 2) {
          // Reactivate stalled slots
          e.setActive(true);
        }
        if (e.alpha > 0) return; // still drifting; skip
        const startX = Math.random() * Math.max(60, text.width);
        const startY = -text.height / 2 + 4;
        e.x = startX;
        e.y = startY;
        e.alpha = 0.9;
        e.setActive(true);
        scene.tweens.add({
          targets: e,
          y: startY - 80,
          x: startX + (Math.random() - 0.5) * 24,
          alpha: 0,
          duration: 1100,
          ease: 'Sine.easeOut',
          onComplete: () => { e.setActive(false); },
        });
      },
    });
  }

  function stopEmberLoop(fadeMs = 180) {
    if (tweens.emberSpawn) {
      tweens.emberSpawn.remove(false);
      tweens.emberSpawn = null;
    }
    embers.forEach(e => {
      if (e.alpha > 0) {
        scene.tweens.add({ targets: e, alpha: 0, duration: fadeMs });
      }
    });
  }

  function startCometDraw() {
    killTween('cometDraw');
    comet.setAlpha(1);
    cometPhase = 0;
    drawComet();
    tweens.cometDraw = scene.tweens.add({
      targets: { v: 0 },
      v: Math.PI * 2,
      duration: 1800,
      repeat: -1,
      onUpdate: (tw, tgt) => {
        cometPhase = tgt.v;
        drawComet();
      },
    });
  }

  function stopCometDraw(fadeMs = 180) {
    killTween('cometDraw');
    if (comet.alpha === 0) return;
    scene.tweens.add({
      targets: comet,
      alpha: 0,
      duration: fadeMs,
      onComplete: () => comet.clear(),
    });
  }

  function startHaloRotate(hot) {
    killTween('haloRotate');
    halo.setAlpha(1);
    halo.rotation = 0;
    drawHalo(hot);
    const cycleMs = hot ? 2400 : 3000;
    tweens.haloRotate = scene.tweens.add({
      targets: halo,
      rotation: Math.PI * 2,
      duration: cycleMs,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  function stopHaloRotate(fadeMs = 180) {
    killTween('haloRotate');
    if (halo.alpha === 0) return;
    scene.tweens.add({
      targets: halo,
      alpha: 0,
      duration: fadeMs,
      onComplete: () => halo.clear(),
    });
  }

  function applyTier(tier) {
    // Halo: tiers 4 & 5
    if (tier >= 4) startHaloRotate(tier >= 5);
    else stopHaloRotate();

    // Comet: tiers 3+
    if (tier >= 3) startCometDraw();
    else stopCometDraw();

    // Ember loop: tier 2+
    if (tier >= 2) startEmberLoop();
    else stopEmberLoop();

    // Flame outline: tier 1+
    if (tier >= 1) startFlamePulse();
    else stopFlamePulse();
  }

  function setStreak(n) {
    currentStreak = n;
    text.setText(n.toString());
    textW = text.width;

    if (n > 0) {
      scene.tweens.killTweensOf(text);
      text.setScale(1);
      scene.tweens.add({
        targets: text,
        scale: { from: 1.25, to: 1 },
        duration: MOTION.gameplay.normal,
        ease: MOTION.gameplay.ease,
      });
    }

    const tier = tierFor(n);
    if (tier !== currentTier) {
      currentTier = tier;
      applyTier(tier);
    } else if (tier >= 1) {
      drawFlameOutline();
      if (tier >= 4) halo.x = textW / 2;
    }
  }

  function destroy() {
    killTween('flamePulse');
    killTween('haloRotate');
    killTween('cometDraw');
    if (tweens.emberSpawn) tweens.emberSpawn.remove(false);
    root.destroy();
  }

  // Apply initial tier (0).
  applyTier(0);

  return { root, text, setStreak, destroy };
}
