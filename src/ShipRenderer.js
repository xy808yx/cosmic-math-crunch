// Procedural ship sprite — pure Phaser Graphics primitives, no asset loading.
// Returns a container so callers can position/scale/tween it like drawCompanion.

import { SHIP_PARTS } from './ShipManager.js';

function partById(id) {
  return SHIP_PARTS.find(p => p.id === id) || null;
}

export function drawShip(scene, x, y, opts = {}) {
  const scale = opts.scale ?? 1;
  const parts = opts.parts || {
    hull: 'hull_default',
    wings: 'wings_default',
    paint: 'paint_default',
    decal: null
  };

  const container = scene.add.container(x, y);
  container.setScale(scale);

  const paint = partById(parts.paint);
  const hull = partById(parts.hull);
  const wings = partById(parts.wings);
  const decal = partById(parts.decal);

  const bodyColor = paint?.color ?? 0xb6c2cf;

  // Drop shadow
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.22);
  shadow.fillEllipse(0, 36, 70, 10);
  container.add(shadow);

  // Booster glow (subtle ambient, always on)
  const glow = scene.add.graphics();
  glow.fillStyle(0xff8b3d, 0.35);
  glow.fillEllipse(0, 30, 24, 12);
  glow.fillStyle(0xffd86b, 0.5);
  glow.fillEllipse(0, 30, 14, 7);
  container.add(glow);

  // Wings — drawn underneath so the body sits on top
  const wingsG = scene.add.graphics();
  wingsG.fillStyle(wings?.color ?? 0x8b9bb4, 1);
  wingsG.lineStyle(2, 0x07071a, 0.6);
  if (parts.wings === 'wings_swept') {
    // Swept-back wings
    wingsG.fillTriangle(-14, 4, -42, 24, -10, 18);
    wingsG.strokeTriangle(-14, 4, -42, 24, -10, 18);
    wingsG.fillTriangle(14, 4, 42, 24, 10, 18);
    wingsG.strokeTriangle(14, 4, 42, 24, 10, 18);
  } else {
    // Stub wings (default)
    wingsG.fillRoundedRect(-32, 6, 18, 12, 4);
    wingsG.strokeRoundedRect(-32, 6, 18, 12, 4);
    wingsG.fillRoundedRect(14, 6, 18, 12, 4);
    wingsG.strokeRoundedRect(14, 6, 18, 12, 4);
  }
  container.add(wingsG);

  // Hull body
  const body = scene.add.graphics();
  body.fillStyle(bodyColor, 1);
  body.lineStyle(2.5, 0x07071a, 0.85);
  if (parts.hull === 'hull_round') {
    // Bubble: nearly round, taller cockpit
    body.fillCircle(0, 0, 22);
    body.strokeCircle(0, 0, 22);
  } else {
    // Standard: classic teardrop chassis
    body.fillEllipse(0, 0, 36, 46);
    body.strokeEllipse(0, 0, 36, 46);
  }
  container.add(body);

  // Cockpit window
  const cockpit = scene.add.graphics();
  cockpit.fillStyle(0x4ecdc4, 1);
  cockpit.lineStyle(2, 0x07071a, 0.7);
  cockpit.fillEllipse(0, -8, 18, 12);
  cockpit.strokeEllipse(0, -8, 18, 12);
  cockpit.fillStyle(0xffffff, 0.6);
  cockpit.fillEllipse(-3, -10, 5, 3);
  container.add(cockpit);

  // Decal — small star sticker on the lower hull
  if (decal && parts.decal === 'decal_star') {
    const starG = scene.add.graphics();
    starG.fillStyle(decal.color, 1);
    const points = 5;
    const outerR = 5;
    const innerR = 2;
    starG.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = Math.cos(angle) * r;
      const py = 12 + Math.sin(angle) * r;
      if (i === 0) starG.moveTo(px, py);
      else starG.lineTo(px, py);
    }
    starG.closePath();
    starG.fillPath();
    container.add(starG);
  }

  // Highlight rim — a soft white sliver on the upper-left of the body
  const rim = scene.add.graphics();
  rim.fillStyle(0xffffff, 0.25);
  rim.fillEllipse(-8, -14, 12, 5);
  container.add(rim);

  return container;
}
