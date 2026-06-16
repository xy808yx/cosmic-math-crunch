// Wormhole travel cinematic — "The Ring-Tunnel Dive".
//
// A self-contained ~3.8s full-screen sequence that plays every time the player
// crosses the chapter wormhole, replacing the old flat fade-to-black. The
// wormhole is a RECEDING RING TUNNEL (nested squashed ellipse outlines streaming
// past a bright breathing lens core) — never a spiral, swirl, swept arc, or
// ray-burst (per the project's no-spiral / no-sigil art policy).
//
//   playWormholeCinematic(scene, 'in',  onDone)  — Ch1 → Ch2: dive INWARD,
//       cold cosmic (indigo/teal/gold) morphs to warm living (violet/rose),
//       the ship shrinks into the pupil, ends on a low heartbeat thump.
//   playWormholeCinematic(scene, 'out', onDone)  — Ch2 → Ch1: surface OUTWARD,
//       warm morphs back to cold, the ship grows, ends on a bright chime.
//
// Handoff contract: onDone() (setCurrentChapter + scene.restart) is invoked
// while the screen is held opaque at 0x0a0a1a — the exact colour the rebuilt
// map's TransitionManager.fadeIn() starts from — so the swap is seamless.
//
// Driven by ONE master "clock" tween whose onUpdate redraws every layer from a
// single p∈[0,1]; no per-frame allocation (integer colour lerp), tap-to-skip,
// done-flag guarded so onDone fires exactly once.

import Phaser from 'phaser';
import { audio } from './AudioManager.js';
import { drawShip } from './ShipRenderer.js';
import { ship } from './ShipManager.js';
import { companion, drawCompanion } from './CompanionManager.js';
import { style } from './textStyles.js';

const W = 1080;
const H = 1920;
const CX = 540;
const CY = 760;            // core sits in the upper visual third (room for ship)
const TAU = Math.PI * 2;

// Canonical cold → warm bridge gradient (shared with the gate + map palettes).
// Teal (0x4ecdc4) is the deliberate centre pivot: the one hue living in BOTH
// the cosmic and the body palettes, so the eye never sees a hard seam.
const GRAD = [0x4a4a8c, 0x6e7bd6, 0x4ecdc4, 0xfff3b8, 0xc77eff, 0xff7a8a];

// Allocation-free integer colour lerp + gradient sample (called every frame).
function lerpHex(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (((ar + (br - ar) * t) | 0) << 16)
       | (((ag + (bg - ag) * t) | 0) << 8)
       | (((ab + (bb - ab) * t) | 0));
}
function sampleGrad(p) {
  const c = p < 0 ? 0 : p > 1 ? 1 : p;
  const n = GRAD.length - 1;
  const x = c * n;
  const i = Math.min(n - 1, Math.floor(x));
  return lerpHex(GRAD[i], GRAD[i + 1], x - i);
}

export function playWormholeCinematic(scene, direction, onDone) {
  const dirIn = direction !== 'out';
  const CLOCK_MS = 2900;

  const root = scene.add.container(0, 0).setDepth(2000).setScrollFactor(0);

  // --- BACKDROP (normal blend, opaque from frame 0 so the live map is hidden) ---
  const COLD_BG = 0x0a0a1a, WARM_BG = 0x2a0a14;
  const backdrop = scene.add.graphics();
  root.add(backdrop);

  // --- RING TUNNEL (the hero) ---
  const tunnel = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  root.add(tunnel);
  const RINGS = 12;
  const ringWob = [];
  for (let i = 0; i < RINGS; i++) ringWob.push((i * 0.7) % TAU);

  // --- MOTES (inward/outward streaks) ---
  const motes = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  root.add(motes);
  const MOTES = 14;
  const moteA = [], moteT0 = [], moteSpd = [];
  for (let m = 0; m < MOTES; m++) {
    moteA.push((m / MOTES) * TAU + (m % 3) * 0.6);
    moteT0.push((m * 0.137) % 1);
    moteSpd.push(0.8 + (m % 5) * 0.18);
  }

  // --- CORE LENS (bright breathing pupil) ---
  const core = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  root.add(core);

  // --- SHIP — the kid's REAL ship + companion, matching the parked map ship, so
  // the showcase moment keeps their customization (parts read is synchronous &
  // warp-safe; falls back to defaults if unavailable). ---
  let parts;
  try { parts = ship.getCurrentParts(); } catch (e) { parts = undefined; }
  const shipG = drawShip(scene, CX, dirIn ? 1500 : CY, {
    scale: dirIn ? 0.55 : 0.12, showTrail: true, parts
  });
  shipG.setScrollFactor(0);
  shipG.setAlpha(dirIn ? 1 : 0.2);
  try {
    if (companion.hasStarter?.() && shipG.portholeCenter) {
      const pc = shipG.portholeCenter;
      shipG.add(drawCompanion(scene, pc.x, pc.y, { scale: 0.42 }));
    }
  } catch (e) { /* pet is optional */ }
  root.add(shipG);
  const shipTween = scene.tweens.add({
    targets: shipG,
    y: dirIn ? 690 : 1200,
    scale: dirIn ? 0.12 : 0.55,
    alpha: dirIn ? 0.2 : 1,
    duration: 1100,
    delay: 200,
    ease: dirIn ? 'Cubic.easeIn' : 'Cubic.easeOut',
  });

  // --- FLASH (ADD) for the mid wink + climax bloom ---
  const flash = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  flash.fillStyle(0xffffff, 1);
  flash.fillRect(0, 0, W, H);
  flash.setAlpha(0);
  root.add(flash);

  // --- DARK COVER (normal) — seamless handoff to the rebuilt map's black fade ---
  const cover = scene.add.rectangle(CX, 960, W, H, COLD_BG, 1).setAlpha(0);
  root.add(cover);

  let winkFired = false;
  let punched = false;
  let done = false;
  const timers = [];

  // --- TAP-TO-SKIP (invisible full-screen surface + a gentle late-fading hint) ---
  const hit = scene.add.rectangle(CX, 960, W, H, 0x000000, 0.001).setInteractive();
  root.add(hit);
  const skipHint = scene.add.text(CX, H - 150, 'tap to skip', style('caption', {
    fontSize: '30px', fill: '#9a9aae'
  })).setOrigin(0.5).setAlpha(0);
  root.add(skipHint);
  // Fade the hint in well after the dive begins so it never undercuts the first
  // wow; it rides along in `root` and is torn down with everything else.
  timers.push(scene.time.delayedCall(900, () => {
    scene.tweens.add({ targets: skipHint, alpha: 0.85, duration: 500, ease: 'Sine.easeOut' });
  }));

  function redraw() {
    const p = clock.p;
    const mix = dirIn ? p : 1 - p;            // 0 = cold/cosmos, 1 = warm/body

    // Backdrop: morph cold↔warm, fully opaque.
    backdrop.clear();
    backdrop.fillStyle(lerpHex(COLD_BG, WARM_BG, mix), 1);
    backdrop.fillRect(0, 0, W, H);

    // Ring tunnel: 12 concentric squashed ellipses, quadratic depth spacing.
    // Sine-eased p already gives the slow→fast→settle "inhale" pacing.
    tunnel.clear();
    for (let i = 0; i < RINGS; i++) {
      let t = ((i / RINGS) + p * 2.0 * (dirIn ? 1 : -1)) % 1;
      if (t < 0) t += 1;
      const sc = Math.pow(t, 1.9);
      const rw = 30 + sc * 1320;
      const squash = 0.74 + 0.06 * Math.sin(ringWob[i] + p * TAU);
      const rh = rw * squash;
      const offX = Math.sin(ringWob[i] * 0.7 + p * 3) * 16 * sc;
      const offY = Math.cos(ringWob[i] * 0.5) * 9 * sc;
      const a = Math.min(0.62, 0.12 + 0.62 * (1 - Math.min(1, Math.abs(t - 0.5) * 1.4)));
      const col = sampleGrad(Math.max(0, Math.min(1, mix + (t - 0.5) * 0.22)));
      tunnel.lineStyle(2 + sc * 7, col, a);
      tunnel.strokeEllipse(CX + offX, CY + offY, rw, rh);
    }

    // Motes streaking toward/away from the core.
    motes.clear();
    for (let m = 0; m < MOTES; m++) {
      let u = (moteT0[m] + p * moteSpd[m]) % 1;
      if (u < 0) u += 1;
      const rp = dirIn ? 1 - u : u;            // radius param: 0 = core, 1 = rim
      const radius = Math.pow(rp, 1.6) * 640;
      const a = (dirIn ? (0.2 + 0.7 * rp) : (0.2 + 0.7 * (1 - rp))) * 0.9;
      motes.fillStyle(sampleGrad(mix), a);
      motes.fillCircle(CX + Math.cos(moteA[m]) * radius,
                       CY + Math.sin(moteA[m]) * radius * 0.82,
                       2 + rp * 3);
    }

    // Core lens: stacked filled ellipses + hot pupil, pale-gold↔rose accent.
    const accent = dirIn ? lerpHex(0xfff3b8, 0xff7a8a, p) : lerpHex(0xff7a8a, 0xfff3b8, p);
    const baseScale = (dirIn ? 0.35 + 0.9 * p : 1.25 - 0.9 * p) * (1 + 0.06 * Math.sin(p * 18));
    const cs = Math.max(0.12, baseScale);
    core.clear();
    core.fillStyle(accent, 0.16); core.fillEllipse(CX, CY, 230 * cs, 230 * cs * 0.82);
    core.fillStyle(accent, 0.30); core.fillEllipse(CX, CY, 145 * cs, 145 * cs * 0.82);
    core.fillStyle(accent, 0.55); core.fillEllipse(CX, CY, 88 * cs, 88 * cs * 0.82);
    core.fillStyle(0xffffff, 0.95); core.fillEllipse(CX, CY, 44 * cs, 44 * cs * 0.82);

    // Membrane-crossing wink at the teal pivot (p ≈ 0.5).
    if (!winkFired && p >= 0.5) {
      winkFired = true;
      scene.tweens.add({
        targets: flash, alpha: { from: 0, to: 0.25 },
        duration: 150, yoyo: true, ease: 'Sine.easeOut',
      });
      scene.cameras.main.flash(120, 255, 240, 210);
      audio.playTone?.(523, 0.12, 'sine', 0.18);
    }
  }

  function punchOut() {
    if (punched) return;
    punched = true;
    skipHint.setAlpha(0);
    // Bright bloom.
    scene.tweens.add({ targets: flash, alpha: 1, duration: 200, ease: 'Cubic.easeIn' });
    scene.cameras.main.flash(180, 255, 255, 255);
    scene.cameras.main.shake(160, 0.008);
    if (dirIn) audio.playTone?.(180, 0.20, 'sine', 0.22);     // low heartbeat thump
    else       audio.playTone?.(880, 0.20, 'triangle', 0.22); // bright starlight chime
    // Settle to opaque 0x0a0a1a, then hand off under the cover.
    timers.push(scene.time.delayedCall(150, () => {
      scene.tweens.add({
        targets: cover, alpha: 1, duration: 300, ease: 'Cubic.easeIn',
        onComplete: finish,
      });
    }));
  }

  function finish() {
    if (done) return;
    done = true;
    timers.forEach(t => t.remove?.());
    scene.tweens.killTweensOf(clock);
    // The opaque `cover` must stay up until the scene ACTUALLY swaps. onDone()
    // restarts the scene, but Phaser defers the restart to the next step — so
    // destroying root synchronously here would pull the cover and flash the old
    // map for a frame. Tear root down on the scene's shutdown instead (fired by
    // the restart, in the same step the new scene takes over), so there's no gap.
    scene.events.once('shutdown', () => { try { root.destroy(); } catch (e) { /* already torn down */ } });
    try { onDone?.(); } catch (e) { /* scene swap in flight */ }
  }

  function skip() {
    if (punched || done) return;
    scene.tweens.killTweensOf(clock);
    scene.tweens.killTweensOf(shipG);
    clock.p = 1;
    redraw();
    punchOut();
  }
  hit.on('pointerdown', skip);

  // Master clock — the single frame loop.
  const clock = { p: 0 };
  const clockTween = scene.tweens.add({
    targets: clock, p: 1,
    duration: CLOCK_MS, ease: 'Sine.easeInOut',
    onUpdate: redraw, onComplete: punchOut,
  });

  // Warp whoosh (the rising sawtooth maps onto the accelerating dive).
  audio.playWarp?.();
  redraw();

  return { skip };
}
