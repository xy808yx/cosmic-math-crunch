// Borderlands-style boss intro card. Full-screen takeover with a slashed
// black/red bar effect, the villain's name in heavy bold, an epithet, screen
// shake, and a low boom. Skippable on tap. Calls onDone when finished.

import { WORLDS } from './GameData.js';
import { audio } from './AudioManager.js';
import { style } from './textStyles.js';

const W = 1080;
const H = 1920;

// Per-world flavor subtitles. Names come from WORLDS[i].villain.
const BOSS_EPITHETS = {
  1: 'THE BURROWING TERROR',
  2: 'TYRANT OF THE RUBBLE',
  3: 'THE SHATTERED MAW',
  4: 'VEIL OF LOST SUNS',
  5: 'GRINDER OF THE CORE',
  6: 'WHO EATS THE HORIZON',
  7: 'JAW OF ENDLESS WINTER',
  8: 'THE DYING-STAR REVENANT',
  9: 'CRUSHER OF GALAXIES',
  10: 'YOUR REFLECTION, ARMED',
  11: 'WHEN ALL LIGHT ENDS'
};

export function playBossIntro(scene, worldId, onDone) {
  const world = WORLDS[worldId - 1];
  const villainName = (world?.villain || 'Boss').toUpperCase();
  const epithet = BOSS_EPITHETS[worldId] || '';

  const root = scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);

  // Black overlay
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 0);
  overlay.fillRect(0, 0, W, H);
  overlay.alpha = 0;
  root.add(overlay);

  // Diagonal red/black bars (Borderlands signature)
  const barG = scene.add.graphics();
  barG.fillStyle(0x0a0000, 1);
  // 4 thick angled bars sweeping from bottom-left to top-right
  for (let i = 0; i < 4; i++) {
    const y0 = 280 + i * 360;
    barG.fillStyle(i % 2 === 0 ? 0x0a0000 : 0x2a0006, 1);
    barG.fillTriangle(
      -200, y0,
      W + 200, y0 - 240,
      W + 200, y0 + 80
    );
  }
  // Red accent stripes
  barG.fillStyle(0xff2236, 1);
  barG.fillTriangle(-200, 600, W + 200, 360, W + 200, 380);
  barG.fillTriangle(-200, 1100, W + 200, 860, W + 200, 880);
  barG.fillTriangle(-200, 1500, W + 200, 1260, W + 200, 1280);

  barG.x = -W * 1.4;
  barG.alpha = 0.97;
  root.add(barG);

  // Boss name — heavy bold, white with red drop shadow.
  // Long villain names (e.g. "THE VOID DEVOURER", "CRATERSHADE") would overflow
  // the canvas at 170px; auto-shrink the X scale to fit with side padding.
  const nameShadow = scene.add.text(W / 2 + 8, H / 2 - 60 + 8, villainName, style('display', {
    fontSize: '170px', fill: '#a40015', fontStyle: '900'
  })).setOrigin(0.5);
  nameShadow.alpha = 0;
  root.add(nameShadow);

  const nameText = scene.add.text(W / 2, H / 2 - 60, villainName, style('display', {
    fontSize: '170px', fill: '#ffffff', fontStyle: '900',
    stroke: '#0a0000', strokeThickness: 8
  })).setOrigin(0.5);
  nameText.alpha = 0;
  root.add(nameText);

  const maxNameWidth = W - 80;
  const nameScale = Math.min(1, maxNameWidth / nameText.width);
  nameText.scaleX = nameScale;
  nameShadow.scaleX = nameScale;
  nameShadow.scaleY = nameScale;
  nameText.scaleY = nameScale * 0.2;

  // Epithet — smaller red text
  const epithetText = scene.add.text(W / 2, H / 2 + 100, epithet, style('subhead', {
    fontSize: '52px', fill: '#ff2236', fontStyle: '900',
    stroke: '#0a0000', strokeThickness: 4,
    letterSpacing: 4
  })).setOrigin(0.5);
  epithetText.alpha = 0;
  root.add(epithetText);

  // "TAP TO SKIP" hint
  const skipHint = scene.add.text(W / 2, H - 120, 'TAP TO SKIP', style('caption', {
    fontSize: '22px', fill: '#cfcfe0'
  })).setOrigin(0.5);
  skipHint.alpha = 0;
  root.add(skipHint);

  let dismissed = false;

  function finish() {
    if (dismissed) return;
    dismissed = true;
    scene.tweens.add({
      targets: root,
      alpha: 0,
      duration: 280,
      onComplete: () => {
        root.destroy();
        if (typeof onDone === 'function') onDone();
      }
    });
  }

  // Sequence:
  // 0    -> overlay fades to 0.85
  // 200  -> bars sweep across
  // 500  -> villain name slams down + screen shake + boom
  // 800  -> epithet fades in
  // 1300 -> skip hint shows
  // 2200 -> auto-finish
  scene.tweens.add({ targets: overlay, alpha: 0.92, duration: 240 });
  scene.tweens.add({
    targets: barG, x: 0,
    duration: 380, ease: 'Cubic.easeOut', delay: 120
  });

  scene.time.delayedCall(500, () => {
    if (dismissed) return;
    scene.tweens.add({
      targets: [nameText, nameShadow],
      alpha: 1, scaleY: nameScale,
      duration: 140, ease: 'Back.easeOut'
    });
    scene.cameras.main.shake(280, 0.012);
    audio.playBossIntroSlam?.();
  });

  scene.time.delayedCall(820, () => {
    if (dismissed) return;
    scene.tweens.add({
      targets: epithetText, alpha: 1,
      duration: 320, ease: 'Sine.easeOut'
    });
  });

  scene.time.delayedCall(1300, () => {
    if (dismissed) return;
    scene.tweens.add({
      targets: skipHint, alpha: 0.7,
      duration: 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  });

  // Auto-dismiss
  const autoTimer = scene.time.delayedCall(2400, finish);

  // Tap to skip
  const hit = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001)
    .setDepth(1001)
    .setScrollFactor(0)
    .setInteractive();
  root.add(hit);
  hit.on('pointerdown', () => {
    autoTimer.remove();
    finish();
  });
}
