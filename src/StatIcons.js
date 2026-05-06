// Pixel-art icon helpers used throughout the UI in place of emoji glyphs.
// Each function takes a Phaser Graphics object (or scene) and draws an icon
// centered on (x, y) with `size` controlling overall scale.

export function drawFlameIcon(g, x, y, size, color = 0xff8b3d, hi = 0xffd86b) {
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(x, y - size);
  g.lineTo(x + size * 0.7, y - size * 0.1);
  g.lineTo(x + size * 0.5, y + size * 0.6);
  g.lineTo(x, y + size);
  g.lineTo(x - size * 0.5, y + size * 0.6);
  g.lineTo(x - size * 0.7, y - size * 0.1);
  g.closePath();
  g.fillPath();
  g.fillStyle(hi, 0.85);
  g.fillCircle(x, y + size * 0.15, size * 0.35);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(x - size * 0.1, y + size * 0.05, size * 0.12);
}

export function drawStarIcon(g, x, y, size, color = 0xf7dc6f, hi = 0xffffff) {
  const points = 5;
  const outerR = size;
  const innerR = size * 0.4;
  g.fillStyle(color, 1);
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fillPath();
  g.fillStyle(hi, 0.4);
  g.fillCircle(x - size * 0.2, y - size * 0.2, size * 0.25);
}

export function drawHourglassIcon(g, x, y, size, color = 0x81ecec) {
  g.fillStyle(color, 1);
  // Top trapezoid
  g.beginPath();
  g.moveTo(x - size, y - size);
  g.lineTo(x + size, y - size);
  g.lineTo(x + size * 0.2, y);
  g.lineTo(x - size * 0.2, y);
  g.closePath();
  g.fillPath();
  // Bottom trapezoid
  g.beginPath();
  g.moveTo(x - size * 0.2, y);
  g.lineTo(x + size * 0.2, y);
  g.lineTo(x + size, y + size);
  g.lineTo(x - size, y + size);
  g.closePath();
  g.fillPath();
  g.lineStyle(2, 0x07071a, 0.8);
  g.lineBetween(x - size * 1.05, y - size, x + size * 1.05, y - size);
  g.lineBetween(x - size * 1.05, y + size, x + size * 1.05, y + size);
  g.fillStyle(0xffffff, 0.85);
  g.fillTriangle(x - size * 0.6, y - size * 0.7, x + size * 0.6, y - size * 0.7, x, y - size * 0.1);
}

export function drawHeartIcon(g, x, y, size, full = true) {
  if (full) {
    g.fillStyle(0xff5c7c, 1);
    g.fillCircle(x - size * 0.42, y - size * 0.18, size * 0.55);
    g.fillCircle(x + size * 0.42, y - size * 0.18, size * 0.55);
    g.fillTriangle(
      x - size * 0.95, y - size * 0.05,
      x + size * 0.95, y - size * 0.05,
      x, y + size * 0.95
    );
    g.fillStyle(0xffffff, 0.45);
    g.fillCircle(x - size * 0.42, y - size * 0.42, size * 0.18);
  }
  g.lineStyle(Math.max(2, size * 0.12), full ? 0xff8ba3 : 0x4a4a60, full ? 0.9 : 1);
  g.strokeCircle(x - size * 0.42, y - size * 0.18, size * 0.55);
  g.strokeCircle(x + size * 0.42, y - size * 0.18, size * 0.55);
  g.beginPath();
  g.moveTo(x - size * 0.95, y - size * 0.05);
  g.lineTo(x, y + size * 0.95);
  g.lineTo(x + size * 0.95, y - size * 0.05);
  g.strokePath();
}

export function drawSkullIcon(g, x, y, size, color = 0xeeeef0) {
  // Cranium
  g.fillStyle(color, 1);
  g.fillEllipse(x, y - size * 0.1, size * 1.6, size * 1.6);
  // Jaw
  g.fillRect(x - size * 0.55, y + size * 0.4, size * 1.1, size * 0.4);
  // Eye sockets
  g.fillStyle(0x07071a, 1);
  g.fillEllipse(x - size * 0.4, y - size * 0.05, size * 0.45, size * 0.5);
  g.fillEllipse(x + size * 0.4, y - size * 0.05, size * 0.45, size * 0.5);
  // Nose triangle
  g.fillTriangle(x - size * 0.12, y + size * 0.30, x + size * 0.12, y + size * 0.30, x, y + size * 0.55);
  // Teeth
  g.fillStyle(color, 1);
  for (let i = -2; i <= 2; i++) {
    g.fillRect(x + i * size * 0.18 - size * 0.07, y + size * 0.55, size * 0.14, size * 0.18);
  }
}

export function drawCheckIcon(g, x, y, size, color = 0x58d68d) {
  g.lineStyle(Math.max(3, size * 0.18), color, 1);
  g.beginPath();
  g.moveTo(x - size * 0.7, y);
  g.lineTo(x - size * 0.15, y + size * 0.6);
  g.lineTo(x + size * 0.85, y - size * 0.5);
  g.strokePath();
}

export function drawXIcon(g, x, y, size, color = 0xff6b6b) {
  g.lineStyle(Math.max(3, size * 0.18), color, 1);
  g.lineBetween(x - size * 0.7, y - size * 0.7, x + size * 0.7, y + size * 0.7);
  g.lineBetween(x + size * 0.7, y - size * 0.7, x - size * 0.7, y + size * 0.7);
}

export function drawLockIcon(g, x, y, size, color = 0x8888a0, locked = true) {
  g.fillStyle(color, 1);
  g.fillRoundedRect(x - size * 0.6, y, size * 1.2, size, size * 0.15);
  if (locked) {
    g.lineStyle(Math.max(3, size * 0.20), color, 1);
    g.beginPath();
    g.arc(x, y - size * 0.20, size * 0.45, Math.PI, 0);
    g.strokePath();
  } else {
    g.lineStyle(Math.max(3, size * 0.20), color, 1);
    g.beginPath();
    g.arc(x - size * 0.30, y - size * 0.20, size * 0.45, Math.PI, -Math.PI * 0.4);
    g.strokePath();
  }
  g.fillStyle(0x07071a, 1);
  g.fillCircle(x, y + size * 0.5, size * 0.18);
}

export function drawSparkleIcon(g, x, y, size, color = 0xc77eff) {
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(x, y - size);
  g.lineTo(x + size * 0.45, y);
  g.lineTo(x, y + size);
  g.lineTo(x - size * 0.45, y);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(x, y - size * 0.15, size * 0.15);
}

export function drawShopIcon(g, x, y, size, color = 0xc77eff) {
  g.fillStyle(color, 1);
  g.fillRoundedRect(x - size * 0.7, y - size * 0.2, size * 1.4, size * 1.0, size * 0.2);
  g.lineStyle(Math.max(3, size * 0.18), color, 1);
  g.beginPath();
  g.arc(x, y - size * 0.20, size * 0.4, Math.PI, 0);
  g.strokePath();
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(x + size * 0.20, y + size * 0.30, size * 0.10);
}

export function drawTrophyIcon(g, x, y, size, color = 0xffd86b) {
  // Cup
  g.fillStyle(color, 1);
  g.fillRoundedRect(x - size * 0.55, y - size * 0.55, size * 1.1, size * 0.95, size * 0.1);
  // Handles
  g.lineStyle(Math.max(3, size * 0.16), color, 1);
  g.beginPath();
  g.arc(x - size * 0.85, y - size * 0.08, size * 0.40, -Math.PI * 0.5, Math.PI * 0.5);
  g.strokePath();
  g.beginPath();
  g.arc(x + size * 0.85, y - size * 0.08, size * 0.40, Math.PI * 0.5, -Math.PI * 0.5, true);
  g.strokePath();
  // Stem and base
  g.fillStyle(0x8b6f1a, 1);
  g.fillRect(x - size * 0.15, y + size * 0.4, size * 0.30, size * 0.30);
  g.fillRoundedRect(x - size * 0.55, y + size * 0.7, size * 1.1, size * 0.20, size * 0.05);
  // Highlight
  g.fillStyle(0xffffff, 0.45);
  g.fillRect(x - size * 0.4, y - size * 0.35, size * 0.18, size * 0.55);
}

export function drawGearIcon(g, x, y, size, color = 0x81ecec) {
  g.lineStyle(Math.max(3, size * 0.18), color, 1);
  const teeth = 8;
  const outerR = size;
  const innerR = size * 0.7;
  g.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.strokePath();
  g.fillStyle(0x07071a, 1);
  g.fillCircle(x, y, size * 0.35);
  g.lineStyle(Math.max(2, size * 0.12), color, 1);
  g.strokeCircle(x, y, size * 0.35);
}

export function drawArrowLeftIcon(g, x, y, size, color = 0xffffff) {
  g.lineStyle(Math.max(4, size * 0.22), color, 1);
  g.beginPath();
  g.moveTo(x + size * 0.5, y - size * 0.6);
  g.lineTo(x - size * 0.5, y);
  g.lineTo(x + size * 0.5, y + size * 0.6);
  g.strokePath();
}

export function drawSoundIcon(g, x, y, size, color = 0xffffff, on = true) {
  g.fillStyle(color, 1);
  g.fillRect(x - size * 0.5, y - size * 0.25, size * 0.3, size * 0.5);
  g.beginPath();
  g.moveTo(x - size * 0.2, y - size * 0.25);
  g.lineTo(x + size * 0.1, y - size * 0.5);
  g.lineTo(x + size * 0.1, y + size * 0.5);
  g.lineTo(x - size * 0.2, y + size * 0.25);
  g.closePath();
  g.fillPath();
  if (on) {
    g.lineStyle(Math.max(2, size * 0.14), color, 0.9);
    g.beginPath();
    g.arc(x + size * 0.25, y, size * 0.35, -Math.PI / 4, Math.PI / 4);
    g.strokePath();
  } else {
    g.lineStyle(Math.max(2, size * 0.14), 0xff6b6b, 1);
    g.lineBetween(x + size * 0.25, y - size * 0.3, x + size * 0.6, y + size * 0.3);
    g.lineBetween(x + size * 0.6, y - size * 0.3, x + size * 0.25, y + size * 0.3);
  }
}
