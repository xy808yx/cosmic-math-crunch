// Centered-card modal shell shared by info popups, lore cards, and confirm
// dialogs. Builds the dim overlay, rounded-rect panel, optional close hint,
// and tap-to-close handler. The caller adds children to the returned `card`
// container (coordinates are relative to the card center).

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

  // Transparent hit-rect inside the card for closeOnCardTap. Buttons added by
  // callers later sit above this in the container and stay clickable; clicks
  // that miss them fall to this rect and close. Using a Rectangle (not the
  // Graphics bg) avoids fragile hit-testing on Graphics-in-Container.
  let cardHit = null;
  if (closeOnCardTap) {
    cardHit = scene.add.rectangle(0, 0, width, height, 0x000000, 0).setInteractive();
    card.add(cardHit);
  }

  let closeHint = null;
  if (showCloseHint) {
    closeHint = scene.add.text(W / 2, H / 2 + height / 2 + 50, closeHintText, style('caption', {
      fontSize: '26px',
      fill: '#9a9aae'
    })).setOrigin(0.5).setDepth(depth + 1);
  }

  let closed = false;
  let sceneCloseHandler = null;
  const close = () => {
    if (closed) return;
    closed = true;
    if (sceneCloseHandler) scene.input.off('pointerdown', sceneCloseHandler);
    try { audio.playClick?.(); } catch (e) { /* audio may be unavailable */ }
    overlay.destroy();
    card.destroy();
    closeHint?.destroy();
    onClose?.();
  };

  overlay.on('pointerdown', close);
  cardHit?.on('pointerdown', close);

  // Scene-level pointerdown backup for closeOnCardTap. The camera renderList
  // sortGameObjects uses can be stale on the first frame after the modal
  // opens — overlay isn't in it yet, so a tap routes to whichever interactive
  // object underneath the modal sorts highest. Phaser emits this scene-level
  // event AFTER per-object dispatch in the same input cycle, so we defer
  // registration past the current event to avoid catching the tap that
  // opened the modal.
  if (closeOnCardTap) {
    setTimeout(() => {
      if (closed) return;
      sceneCloseHandler = () => close();
      scene.input.on('pointerdown', sceneCloseHandler);
    }, 0);
  }

  return { overlay, card, close, closeHint, width, height };
}

