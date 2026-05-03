import Phaser from 'phaser';
import { audio } from './AudioManager.js';
import { style } from './textStyles.js';

// Standard rounded-rect button. Returns the container.
// onClick fires on pointerup if the pointer is still inside.
export function createButton(scene, opts) {
  const {
    x = 0,
    y = 0,
    label = '',
    width = 280,
    height = 80,
    color = 0x4ecdc4,
    textStyle = 'subhead',
    textOverrides = {},
    onClick = () => {},
    enabled = true,
    radius = 18
  } = opts;

  const container = scene.add.container(x, y);

  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.45);
  shadow.fillRoundedRect(-width / 2 + 2, -height / 2 + 5, width, height, radius);
  container.add(shadow);

  const bg = scene.add.graphics();
  drawButtonFace(bg, width, height, radius, color, enabled);
  container.add(bg);

  const text = scene.add.text(0, 0, label, style(textStyle, textOverrides)).setOrigin(0.5);
  if (!enabled) text.setAlpha(0.5);
  container.add(text);

  const hit = scene.add.rectangle(0, 0, width, height, 0x000000, 0).setInteractive({ useHandCursor: enabled });
  container.add(hit);

  if (enabled) {
    hit.on('pointerover', () => {
      scene.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 100, ease: 'Quad.easeOut' });
    });
    hit.on('pointerout', () => {
      scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100, ease: 'Quad.easeOut' });
    });
    hit.on('pointerdown', () => {
      scene.tweens.add({ targets: container, scaleX: 0.94, scaleY: 0.94, duration: 70, ease: 'Quad.easeOut', yoyo: true });
      audio.playClick();
      onClick();
    });
  }

  return container;
}

function drawButtonFace(graphics, width, height, radius, color, enabled) {
  const baseColor = enabled ? color : 0x3a3a4a;
  const highlightColor = enabled
    ? Phaser.Display.Color.ValueToColor(color).lighten(20).color
    : 0x4a4a5a;
  const shadowColor = enabled
    ? Phaser.Display.Color.ValueToColor(color).darken(25).color
    : 0x2a2a3a;

  // Bottom shadow band (for depth)
  graphics.fillStyle(shadowColor, 1);
  graphics.fillRoundedRect(-width / 2, -height / 2 + 4, width, height - 4, radius);

  // Main face
  graphics.fillStyle(baseColor, 1);
  graphics.fillRoundedRect(-width / 2, -height / 2, width, height - 6, radius);

  // Top highlight gloss
  graphics.fillStyle(highlightColor, 0.55);
  graphics.fillRoundedRect(
    -width / 2 + 4,
    -height / 2 + 3,
    width - 8,
    (height - 6) / 2.2,
    { tl: radius - 2, tr: radius - 2, bl: 4, br: 4 }
  );
}

// Compact icon-style circular button
export function createIconButton(scene, opts) {
  const {
    x = 0,
    y = 0,
    radius = 28,
    color = 0x1a1a2e,
    accentColor = 0x4ecdc4,
    drawIcon, // function(graphics, size) — caller draws into graphics
    onClick = () => {}
  } = opts;

  const container = scene.add.container(x, y);

  const glow = scene.add.circle(0, 0, radius + 4, accentColor, 0.2);
  container.add(glow);

  const bg = scene.add.circle(0, 0, radius, color, 0.85);
  bg.setStrokeStyle(2, accentColor, 0.7);
  container.add(bg);

  if (drawIcon) {
    const icon = scene.add.graphics();
    drawIcon(icon, radius * 0.7);
    container.add(icon);
  }

  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => {
    scene.tweens.add({ targets: container, scaleX: 1.12, scaleY: 1.12, duration: 100 });
    glow.setAlpha(0.4);
  });
  bg.on('pointerout', () => {
    scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    glow.setAlpha(0.2);
  });
  bg.on('pointerdown', () => {
    audio.playClick();
    onClick();
  });

  return container;
}
