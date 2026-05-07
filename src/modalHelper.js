// Centered-card modal shell shared by info popups, lore cards, and confirm
// dialogs. Builds the dim overlay, rounded-rect panel, optional close hint,
// and tap-to-close handler. The caller adds children to the returned `card`
// container (coordinates are relative to the card center).

import Phaser from 'phaser';
import { audio } from './AudioManager.js';
import { style } from './textStyles.js';
import { COLORS } from './colorPalette.js';

export function createModal(scene, opts = {}) {
  const {
    width = 800,
    height = 600,
    depth = 80,
    overlayAlpha = 0.80,
    overlayFadeMs = 0,
    accentColor = COLORS.accentPurple,
    radius = 28,
    strokeWidth = 3,
    showCloseHint = true,
    closeHintText = 'tap anywhere to close',
    closeOnCardTap = false,
    onClose = null,
  } = opts;

  const W = scene.cameras.main.width;
  const H = scene.cameras.main.height;

  const overlay = scene.add.rectangle(
    W / 2, H / 2, W, H, 0x000000, overlayFadeMs > 0 ? 0 : overlayAlpha
  ).setDepth(depth).setInteractive();
  if (overlayFadeMs > 0) {
    scene.tweens.add({ targets: overlay, alpha: overlayAlpha, duration: overlayFadeMs });
  }
  const card = scene.add.container(W / 2, H / 2).setDepth(depth + 1);

  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.bgPanel, 1);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
  bg.lineStyle(strokeWidth, accentColor, 0.95);
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  card.add(bg);


  let closeHint = null;
  if (showCloseHint) {
    closeHint = scene.add.text(W / 2, H / 2 + height / 2 + 50, closeHintText, style('caption', {
      fontSize: '26px',
      fill: '#9a9aae'
    })).setOrigin(0.5).setDepth(depth + 1);
  }

  const close = () => {
    audio.playClick();
    overlay.destroy();
    card.destroy();
    closeHint?.destroy();
    onClose?.();
  };

  overlay.on('pointerdown', close);

  if (closeOnCardTap) {
    bg.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    bg.on('pointerdown', close);
  }

  return { overlay, card, close, closeHint, width, height };
}
