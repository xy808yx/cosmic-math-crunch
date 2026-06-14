// Arcade run results — shared end screen for the arcade modes that run on the
// real GameScene engine (Endless, Boss Rush). GameScene short-circuits its
// campaign endRound/failLevel into here when this.arcadeMode is set, so none of
// the campaign progression (stars, stardust, evolution) runs for arcade play.
//
// Retry restarts the launcher scene (fresh gauntlet / fresh run); Done returns
// to the arcade hub.

import { progress } from './GameData.js';
import { style } from './textStyles.js';
import { COLORS } from './colorPalette.js';
import { createButton } from './buttonHelper.js';
import { TransitionManager } from './TransitionManager.js';

const W = 1080;
const H = 1920;

export function showArcadeResults(scene, opts) {
  const { mode } = opts;

  let title, accent, lines, launcherKey;
  let wasBest = false;

  if (mode === 'bossRush') {
    const { won, correct, attempts, timeMs } = opts;
    wasBest = progress.recordBossRushResult({ won, timeMs, correct, total: attempts });
    title = won ? 'GAUNTLET CLEARED' : 'OVERWHELMED';
    accent = won ? 0xfbbf24 : 0xc44b5e;
    const acc = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
    lines = [`Accuracy: ${acc}%`, `Time: ${(timeMs / 1000).toFixed(1)}s`];
    launcherKey = 'BossRushScene';
  } else {
    // Endless ends only on ship death — score is how many you crunched.
    const { score } = opts;
    wasBest = progress.recordEndlessScore(score);
    title = 'GOOD RUN!';
    accent = 0x4ecdc4;
    lines = [`Score: ${score}`, `Best: ${progress.arcade?.endlessBest || 0}`];
    launcherKey = 'EndlessScene';
  }

  const overlay = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(70).setInteractive();
  scene.tweens.add({ targets: overlay, alpha: 0.78, duration: 320 });

  const panelW = 760;
  const panelH = 560;
  const panel = scene.add.container(W / 2, H + panelH / 2).setDepth(71);

  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.bgPanel, 0.98);
  bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 28);
  bg.lineStyle(4, accent, 0.95);
  bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 28);
  panel.add(bg);

  panel.add(scene.add.text(0, -panelH / 2 + 80, title, style('display', {
    fontSize: '50px',
    fill: '#' + accent.toString(16).padStart(6, '0')
  })).setOrigin(0.5));

  lines.forEach((t, i) => {
    panel.add(scene.add.text(0, -panelH / 2 + 190 + i * 64, t, style('subhead', {
      fontSize: i === 0 ? '38px' : '32px',
      fill: i === 0 ? '#ffffff' : '#cfcfe0'
    })).setOrigin(0.5));
  });

  if (wasBest) {
    panel.add(scene.add.text(0, -panelH / 2 + 330, 'NEW BEST!', style('subhead', {
      fontSize: '38px',
      fill: '#fbbf24'
    })).setOrigin(0.5));
  }

  const btnY = panelH / 2 - 90;
  panel.add(createButton(scene, {
    x: -130, y: btnY, label: 'Retry',
    width: 250, height: 88,
    color: 0x4a4a6a,
    onClick: () => scene.scene.start(launcherKey)
  }));
  panel.add(createButton(scene, {
    x: 130, y: btnY, label: 'Done',
    width: 250, height: 88,
    color: accent,
    onClick: () => new TransitionManager(scene).fadeToScene('ArcadeMenuScene')
  }));

  scene.tweens.add({ targets: panel, y: H / 2, duration: 480, ease: 'Back.easeOut' });
}
