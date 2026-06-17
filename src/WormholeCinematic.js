// Wormhole travel cinematic — "The Ring-Tunnel Dive".
//
// A self-contained ~3.4s full-screen sequence that plays every time the player
// crosses the chapter wormhole, replacing the old flat fade-to-black. The
// wormhole is a RECEDING RING TUNNEL (nested squashed ellipse outlines streaming
// past a bright breathing lens core) with hyperspace STREAKS, the kid's real
// SHIP + PET as the hero, and a climax SHOCKWAVE — never a spiral, swirl, swept
// arc, or ray-burst (per the project's no-spiral / no-sigil art policy).
//
//   playWormholeCinematic(scene, 'in',  onDone)  — Ch1 → Ch2: the ship dives
//       INWARD, big→swallowed by the core; cold cosmic (indigo/teal/gold) morphs
//       to warm living (violet/rose); ends on a low heartbeat thump.
//   playWormholeCinematic(scene, 'out', onDone)  — Ch2 → Ch1: the ship BURSTS
//       OUTWARD from the core toward the viewer, small→large; warm morphs back to
//       cold; ends on a bright chime.
//
// Both directions show the SAME ship+pet (their customization) as the clear hero,
// driven by the single master clock so it can never desync from the visuals.
//
// Handoff contract: onDone() (setCurrentChapter + scene.restart) is invoked
// while the screen is held opaque at 0x0a0a1a — the exact colour the rebuilt
// map's TransitionManager.fadeIn() starts from — so the swap is seamless.

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
  const CLOCK_MS = 3400;

  const root = scene.add.container(0, 0).setDepth(2000).setScrollFactor(0);

  // --- BACKDROP (normal blend, opaque from frame 0 so the live map is hidden) ---
  const COLD_BG = 0x0a0a1a, WARM_BG = 0x2a0a14;
  const backdrop = scene.add.graphics();
  root.add(backdrop);

  // --- RING TUNNEL (the hero structure) ---
  const tunnel = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  root.add(tunnel);
  const RINGS = 14;
  const ringWob = [];
  for (let i = 0; i < RINGS; i++) ringWob.push((i * 0.7) % TAU);

  // --- STREAKS (hyperspace speed-lines toward/away from the core) ---
  const streaks = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  root.add(streaks);
  const STREAKS = 26;
  const stkA = [], stkT0 = [], stkSpd = [];
  for (let m = 0; m < STREAKS; m++) {
    stkA.push((m / STREAKS) * TAU + (m % 4) * 0.5);
    stkT0.push((m * 0.137) % 1);
    stkSpd.push(0.9 + (m % 5) * 0.2);
  }

  // --- CORE LENS (bright breathing pupil) + orbiting sparks ---
  const core = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  root.add(core);

  // --- SHOCKWAVE layer (climax burst; drawn behind the ship) ---
  const shock = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  root.add(shock);

  // --- SHIP — the kid's REAL ship + companion, matching the parked map ship, so
  // the showcase keeps their customization (parts read is synchronous &
  // warp-safe; falls back to defaults if unavailable). Driven by the master
  // clock in redraw() so it stays locked to the visuals (and is force-steppable). ---
  let parts;
  try { parts = ship.getCurrentParts(); } catch (e) { parts = undefined; }
  // The ship GEOMETRY is baked at the hero size; the warp then animates the
  // CONTAINER scale (0.2 = tiny/swallowed … 1.0 = full hero) — NOT drawShip's
  // `scale` (that bakes into the geometry; double-driving it left the old 'out'
  // ship microscopic, so only the pet read). Pet rides in the porthole and so
  // scales with the ship.
  const HERO_BAKE = 1.0;
  const shipG = drawShip(scene, CX, CY, { scale: HERO_BAKE, showTrail: true, parts });
  shipG.setScrollFactor(0);
  try {
    if (companion.hasStarter?.() && shipG.portholeCenter) {
      const pc = shipG.portholeCenter;
      shipG.add(drawCompanion(scene, pc.x, pc.y, { scale: 0.70 }));
    }
  } catch (e) { /* pet is optional */ }
  root.add(shipG);

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
  timers.push(scene.time.delayedCall(1000, () => {
    scene.tweens.add({ targets: skipHint, alpha: 0.85, duration: 500, ease: 'Sine.easeOut' });
  }));

  function redraw() {
    const p = clock.p;
    const mix = dirIn ? p : 1 - p;            // 0 = cold/cosmos, 1 = warm/body
    const accent = dirIn ? lerpHex(0xfff3b8, 0xff7a8a, p) : lerpHex(0xff7a8a, 0xfff3b8, p);

    // Backdrop: morph cold↔warm, fully opaque.
    backdrop.clear();
    backdrop.fillStyle(lerpHex(COLD_BG, WARM_BG, mix), 1);
    backdrop.fillRect(0, 0, W, H);

    // Ring tunnel: concentric squashed ellipses, quadratic depth spacing.
    tunnel.clear();
    for (let i = 0; i < RINGS; i++) {
      let t = ((i / RINGS) + p * 2.2 * (dirIn ? 1 : -1)) % 1;
      if (t < 0) t += 1;
      const sc = Math.pow(t, 1.9);
      const rw = 30 + sc * 1340;
      const squash = 0.74 + 0.06 * Math.sin(ringWob[i] + p * TAU);
      const rh = rw * squash;
      const offX = Math.sin(ringWob[i] * 0.7 + p * 3) * 16 * sc;
      const offY = Math.cos(ringWob[i] * 0.5) * 9 * sc;
      const a = Math.min(0.66, 0.12 + 0.66 * (1 - Math.min(1, Math.abs(t - 0.5) * 1.4)));
      const col = sampleGrad(Math.max(0, Math.min(1, mix + (t - 0.5) * 0.22)));
      tunnel.lineStyle(2 + sc * 8, col, a);
      tunnel.strokeEllipse(CX + offX, CY + offY, rw, rh);
    }

    // Hyperspace streaks: short radial speed-lines accelerating toward/away.
    streaks.clear();
    const speedUp = 1 + 1.6 * (dirIn ? p : 1 - p);   // streaks get longer/faster mid-dive
    for (let m = 0; m < STREAKS; m++) {
      let u = (stkT0[m] + p * stkSpd[m] * 1.5) % 1;
      if (u < 0) u += 1;
      const rp = dirIn ? 1 - u : u;                   // 0 = core, 1 = rim
      const r1 = Math.pow(rp, 1.6) * 760;
      const r2 = Math.pow(Math.max(0, rp - 0.05 * speedUp), 1.6) * 760;
      const a = (dirIn ? (0.12 + 0.8 * rp) : (0.12 + 0.8 * (1 - rp))) * 0.9;
      const ca = Math.cos(stkA[m]), sa = Math.sin(stkA[m]) * 0.82;
      streaks.lineStyle(1.6 + rp * 3, sampleGrad(mix), a);
      streaks.lineBetween(CX + ca * r2, CY + sa * r2, CX + ca * r1, CY + sa * r1);
    }

    // Core lens: stacked filled ellipses + hot pupil + orbiting sparks.
    const baseScale = (dirIn ? 0.35 + 0.95 * p : 1.30 - 0.95 * p) * (1 + 0.07 * Math.sin(p * 20));
    const cs = Math.max(0.12, baseScale);
    core.clear();
    core.fillStyle(accent, 0.16); core.fillEllipse(CX, CY, 240 * cs, 240 * cs * 0.82);
    core.fillStyle(accent, 0.30); core.fillEllipse(CX, CY, 150 * cs, 150 * cs * 0.82);
    core.fillStyle(accent, 0.55); core.fillEllipse(CX, CY, 90 * cs, 90 * cs * 0.82);
    core.fillStyle(0xffffff, 0.95); core.fillEllipse(CX, CY, 46 * cs, 46 * cs * 0.82);
    for (let s = 0; s < 6; s++) {
      const sa2 = s / 6 * TAU + p * TAU * (dirIn ? 1.4 : -1.4);
      const sr = (120 + 60 * Math.sin(p * 12 + s)) * cs;
      core.fillStyle(0xffffff, 0.5 + 0.4 * Math.sin(p * 16 + s));
      core.fillCircle(CX + Math.cos(sa2) * sr, CY + Math.sin(sa2) * sr * 0.82, 2.5 + 2 * cs);
    }

    // Ship hero — driven by the clock. IN: big→swallowed (dives up into the core).
    // OUT: bursts from the core toward the viewer, small→large (front-loaded so it
    // reads as the hero almost immediately, not just at the very end).
    // `csc` is the CONTAINER zoom (0.2 tiny … 1.0 full hero); effective ship size
    // is HERO_BAKE × csc. IN: hero at the bottom → accelerates up + shrinks into
    // the core. OUT: bursts from the core → grows toward the viewer (front-loaded
    // easeOut so it's clearly the hero almost immediately).
    let sy, csc, sal, srot;
    if (dirIn) {
      const k = Math.min(1, p / 0.94); const ke = k * k;     // easeIn accelerate
      sy = 1470 + (CY - 1470) * ke;
      csc = 1.0 - 0.8 * ke;
      sal = p < 0.74 ? 1 : Math.max(0.08, 1 - (p - 0.74) / 0.26 * 0.92);
      srot = Math.sin(p * Math.PI) * 0.06;
    } else {
      const eo = 1 - (1 - p) * (1 - p);                       // easeOut, front-loaded
      sy = CY + (1250 - CY) * eo;
      csc = 0.2 + 0.8 * eo;
      sal = Math.min(1, p / 0.16);
      srot = Math.sin(p * Math.PI) * 0.06;
    }
    shipG.setPosition(CX, sy);
    shipG.setScale(csc);
    shipG.setAlpha(sal);
    shipG.setRotation(srot);

    // Membrane-crossing wink at the teal pivot (p ≈ 0.5).
    if (!winkFired && p >= 0.5) {
      winkFired = true;
      scene.tweens.add({
        targets: flash, alpha: { from: 0, to: 0.28 },
        duration: 160, yoyo: true, ease: 'Sine.easeOut',
      });
      scene.cameras.main.flash(140, 255, 240, 210);
      audio.playTone?.(523, 0.12, 'sine', 0.18);
    }
  }

  // Expanding shockwave rings from the core at the climax.
  function fireShockwave() {
    const tint = dirIn ? 0xff9ec7 : 0xbcd4ff;
    for (let r = 0; r < 3; r++) {
      const wave = { rad: 30, a: 0.85 };
      scene.tweens.add({
        targets: wave, rad: 1500, a: 0,
        duration: 460, delay: r * 90, ease: 'Cubic.easeOut',
        onUpdate: () => {
          shock.clear();
          shock.lineStyle(3 + 12 * wave.a, r === 0 ? 0xffffff : tint, wave.a);
          shock.strokeEllipse(CX, CY, wave.rad, wave.rad * 0.82);
        },
      });
    }
  }

  function punchOut() {
    if (punched) return;
    punched = true;
    skipHint.setAlpha(0);
    fireShockwave();
    // Bright bloom + a harder kick.
    scene.tweens.add({ targets: flash, alpha: 1, duration: 220, ease: 'Cubic.easeIn' });
    scene.cameras.main.flash(220, 255, 255, 255);
    scene.cameras.main.shake(220, 0.012);
    if (dirIn) audio.playTone?.(180, 0.22, 'sine', 0.24);     // low heartbeat thump
    else       audio.playTone?.(880, 0.22, 'triangle', 0.24); // bright starlight chime
    // Settle to opaque 0x0a0a1a, then hand off under the cover.
    timers.push(scene.time.delayedCall(200, () => {
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
