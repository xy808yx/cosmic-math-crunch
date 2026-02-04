// Procedural pixel art generation for world icons
// Each world gets a unique 48x48 pixel art icon

export function generateWorldIcons(scene) {
  const size = 48;

  // World 1: Moon Base - cute moon with craters
  generateMoon(scene, size);

  // World 2: Asteroid Belt - floating rocks
  generateAsteroids(scene, size);

  // World 3: Crystal Planet - sparkly crystals
  generateCrystal(scene, size);

  // World 4: Nebula Gardens - colorful space flowers
  generateNebula(scene, size);

  // World 5: Robot Station - friendly robot
  generateRobot(scene, size);

  // World 6: Black Hole Edge - swirling vortex
  generateBlackHole(scene, size);

  // World 7: Ice Comet - icy comet with tail
  generateComet(scene, size);

  // World 8: Supernova - exploding star
  generateSupernova(scene, size);

  // World 9: Galactic Core - spiral galaxy
  generateGalaxy(scene, size);

  // World 10: Parallel Dimension - portal
  generatePortal(scene, size);

  // World 11: Universe's End - cosmic finale
  generateCosmos(scene, size);
}

function generateMoon(scene, size) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Moon body
  g.fillStyle(0xe8e8e8);
  g.fillCircle(size / 2, size / 2, 18);

  // Lighter highlight
  g.fillStyle(0xffffff);
  g.fillCircle(size / 2 - 5, size / 2 - 5, 8);

  // Craters (darker spots)
  g.fillStyle(0xc0c0c0);
  g.fillCircle(size / 2 + 6, size / 2 - 2, 4);
  g.fillCircle(size / 2 - 3, size / 2 + 8, 3);
  g.fillCircle(size / 2 + 8, size / 2 + 7, 2);

  // Cute face
  g.fillStyle(0x333333);
  g.fillCircle(size / 2 - 5, size / 2 - 2, 2); // left eye
  g.fillCircle(size / 2 + 5, size / 2 - 2, 2); // right eye

  // Smile
  g.lineStyle(2, 0x333333);
  g.beginPath();
  g.arc(size / 2, size / 2 + 2, 5, 0.2, Math.PI - 0.2);
  g.strokePath();

  g.generateTexture('world_1', size, size);
  g.destroy();
}

function generateAsteroids(scene, size) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Large asteroid
  g.fillStyle(0x8b7355);
  g.fillCircle(size / 2 - 2, size / 2, 12);
  g.fillStyle(0xa08060);
  g.fillCircle(size / 2 - 6, size / 2 - 4, 5);

  // Craters on asteroid
  g.fillStyle(0x6b5344);
  g.fillCircle(size / 2 - 5, size / 2 + 3, 3);
  g.fillCircle(size / 2 + 3, size / 2 - 2, 2);

  // Small asteroids
  g.fillStyle(0x9a8465);
  g.fillCircle(size / 2 + 14, size / 2 - 8, 5);
  g.fillCircle(size / 2 + 10, size / 2 + 12, 4);
  g.fillCircle(size / 2 - 15, size / 2 + 10, 3);

  g.generateTexture('world_2', size, size);
  g.destroy();
}

function generateCrystal(scene, size) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const cx = size / 2;
  const cy = size / 2;

  // Main crystal (purple)
  g.fillStyle(0x9b59b6);
  g.beginPath();
  g.moveTo(cx, cy - 18);
  g.lineTo(cx + 10, cy + 8);
  g.lineTo(cx, cy + 15);
  g.lineTo(cx - 10, cy + 8);
  g.closePath();
  g.fillPath();

  // Crystal highlight
  g.fillStyle(0xc39bd3);
  g.beginPath();
  g.moveTo(cx, cy - 18);
  g.lineTo(cx + 5, cy);
  g.lineTo(cx, cy + 10);
  g.lineTo(cx - 5, cy);
  g.closePath();
  g.fillPath();

  // Sparkles
  g.fillStyle(0xffffff);
  g.fillCircle(cx - 3, cy - 8, 2);
  g.fillCircle(cx + 12, cy - 5, 1);
  g.fillCircle(cx - 14, cy + 3, 1);

  // Small side crystals
  g.fillStyle(0xa29bfe);
  g.beginPath();
  g.moveTo(cx + 14, cy);
  g.lineTo(cx + 18, cy + 10);
  g.lineTo(cx + 10, cy + 10);
  g.closePath();
  g.fillPath();

  g.fillStyle(0xdda0dd);
  g.beginPath();
  g.moveTo(cx - 12, cy + 2);
  g.lineTo(cx - 8, cy + 12);
  g.lineTo(cx - 16, cy + 12);
  g.closePath();
  g.fillPath();

  g.generateTexture('world_3', size, size);
  g.destroy();
}

function generateNebula(scene, size) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const cx = size / 2;
  const cy = size / 2;

  // Nebula clouds (overlapping circles)
  g.fillStyle(0x58d68d, 0.7);
  g.fillCircle(cx - 8, cy - 5, 12);

  g.fillStyle(0x82e0aa, 0.7);
  g.fillCircle(cx + 5, cy - 3, 10);

  g.fillStyle(0x45b39d, 0.7);
  g.fillCircle(cx, cy + 8, 11);

  // Space flowers/stars
  g.fillStyle(0xffffff);
  drawStar(g, cx - 10, cy - 8, 4, 2, 4);
  drawStar(g, cx + 8, cy - 6, 4, 1.5, 4);
  drawStar(g, cx + 2, cy + 10, 4, 2, 4);

  // Sparkles
  g.fillStyle(0xabebc6);
  g.fillCircle(cx - 5, cy + 3, 2);
  g.fillCircle(cx + 12, cy + 5, 1.5);

  g.generateTexture('world_4', size, size);
  g.destroy();
}

function generateRobot(scene, size) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const cx = size / 2;
  const cy = size / 2;

  // Antenna
  g.fillStyle(0x5dade2);
  g.fillRect(cx - 1, cy - 20, 3, 8);
  g.fillCircle(cx, cy - 20, 3);

  // Head
  g.fillStyle(0x85c1e9);
  g.fillRoundedRect(cx - 12, cy - 12, 24, 20, 4);

  // Face plate
  g.fillStyle(0x2c3e50);
  g.fillRoundedRect(cx - 9, cy - 9, 18, 12, 2);

  // Eyes (glowing)
  g.fillStyle(0x5dade2);
  g.fillCircle(cx - 4, cy - 4, 3);
  g.fillCircle(cx + 4, cy - 4, 3);

  // Eye highlights
  g.fillStyle(0xffffff);
  g.fillCircle(cx - 5, cy - 5, 1);
  g.fillCircle(cx + 3, cy - 5, 1);

  // Mouth (smile)
  g.fillStyle(0x5dade2);
  g.fillRoundedRect(cx - 5, cy + 1, 10, 3, 1);

  // Body
  g.fillStyle(0x85c1e9);
  g.fillRoundedRect(cx - 10, cy + 10, 20, 12, 3);

  // Body details
  g.fillStyle(0x5dade2);
  g.fillCircle(cx, cy + 15, 3);

  g.generateTexture('world_5', size, size);
  g.destroy();
}

function generateBlackHole(scene, size) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const cx = size / 2;
  const cy = size / 2;

  // Outer glow rings
  g.fillStyle(0xff6b9d, 0.3);
  g.fillCircle(cx, cy, 20);

  g.fillStyle(0xc44569, 0.4);
  g.fillCircle(cx, cy, 15);

  g.fillStyle(0x6c2a4a, 0.6);
  g.fillCircle(cx, cy, 10);

  // Black center
  g.fillStyle(0x1a1a2e);
  g.fillCircle(cx, cy, 6);

  // Swirl lines
  g.lineStyle(2, 0xff6b9d, 0.7);
  g.beginPath();
  g.arc(cx, cy, 18, 0, Math.PI * 0.7);
  g.strokePath();

  g.lineStyle(2, 0xc44569, 0.6);
  g.beginPath();
  g.arc(cx, cy, 14, Math.PI, Math.PI * 1.6);
  g.strokePath();

  // Particles being pulled in
  g.fillStyle(0xffffff);
  g.fillCircle(cx + 16, cy - 8, 1.5);
  g.fillCircle(cx - 14, cy + 10, 1);
  g.fillCircle(cx + 8, cy + 16, 1);

  g.generateTexture('world_6', size, size);
  g.destroy();
}

function generateComet(scene, size) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const cx = size / 2 + 5;
  const cy = size / 2;

  // Comet tail (gradient effect with multiple shapes)
  g.fillStyle(0x74b9ff, 0.3);
  g.fillTriangle(cx - 8, cy, cx - 25, cy - 8, cx - 25, cy + 8);

  g.fillStyle(0xa0d8ef, 0.4);
  g.fillTriangle(cx - 6, cy, cx - 20, cy - 5, cx - 20, cy + 5);

  g.fillStyle(0xd4f1f9, 0.6);
  g.fillTriangle(cx - 4, cy, cx - 15, cy - 3, cx - 15, cy + 3);

  // Ice comet body
  g.fillStyle(0xe8f4f8);
  g.fillCircle(cx, cy, 10);

  // Ice highlights
  g.fillStyle(0xffffff);
  g.fillCircle(cx - 3, cy - 3, 4);

  // Ice cracks/details
  g.lineStyle(1, 0xa0d8ef);
  g.beginPath();
  g.moveTo(cx + 2, cy - 4);
  g.lineTo(cx + 6, cy + 2);
  g.strokePath();

  // Sparkles
  g.fillStyle(0xffffff);
  g.fillCircle(cx - 18, cy - 2, 1.5);
  g.fillCircle(cx - 22, cy + 4, 1);

  g.generateTexture('world_7', size, size);
  g.destroy();
}

function generateSupernova(scene, size) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const cx = size / 2;
  const cy = size / 2;

  // Explosion rays
  const rayCount = 8;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const innerR = 8;
    const outerR = 20;

    g.fillStyle(0xff7675, 0.6);
    g.beginPath();
    g.moveTo(cx + Math.cos(angle - 0.2) * innerR, cy + Math.sin(angle - 0.2) * innerR);
    g.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    g.lineTo(cx + Math.cos(angle + 0.2) * innerR, cy + Math.sin(angle + 0.2) * innerR);
    g.closePath();
    g.fillPath();
  }

  // Outer glow
  g.fillStyle(0xfab1a0, 0.5);
  g.fillCircle(cx, cy, 12);

  // Core
  g.fillStyle(0xffeaa7);
  g.fillCircle(cx, cy, 8);

  // Hot center
  g.fillStyle(0xffffff);
  g.fillCircle(cx, cy, 4);

  // Sparkle particles
  g.fillStyle(0xffffff);
  g.fillCircle(cx + 18, cy - 5, 1.5);
  g.fillCircle(cx - 16, cy + 8, 1);
  g.fillCircle(cx + 5, cy - 18, 1);
  g.fillCircle(cx - 8, cy + 17, 1.5);

  g.generateTexture('world_8', size, size);
  g.destroy();
}

function generateGalaxy(scene, size) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const cx = size / 2;
  const cy = size / 2;

  // Spiral arms
  g.lineStyle(4, 0xf7dc6f, 0.5);
  drawSpiral(g, cx, cy, 3, 18);

  g.lineStyle(3, 0xffeaa7, 0.6);
  drawSpiral(g, cx, cy, 3, 15, Math.PI);

  // Core glow
  g.fillStyle(0xffeaa7, 0.6);
  g.fillCircle(cx, cy, 8);

  g.fillStyle(0xf7dc6f);
  g.fillCircle(cx, cy, 5);

  // Bright center
  g.fillStyle(0xffffff);
  g.fillCircle(cx, cy, 2);

  // Stars in galaxy
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx + 12, cy - 8, 1);
  g.fillCircle(cx - 10, cy - 10, 1.5);
  g.fillCircle(cx + 8, cy + 12, 1);
  g.fillCircle(cx - 14, cy + 5, 1);

  g.generateTexture('world_9', size, size);
  g.destroy();
}

function generatePortal(scene, size) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const cx = size / 2;
  const cy = size / 2;

  // Outer ring
  g.lineStyle(4, 0x82ccdd);
  g.strokeCircle(cx, cy, 16);

  // Inner rings (portal effect)
  g.lineStyle(3, 0x60a3bc);
  g.strokeCircle(cx, cy, 12);

  g.lineStyle(2, 0x3c6382);
  g.strokeCircle(cx, cy, 8);

  // Portal center (void)
  g.fillStyle(0x0a3d62);
  g.fillCircle(cx, cy, 6);

  // Swirl in center
  g.fillStyle(0x82ccdd, 0.5);
  g.fillCircle(cx - 2, cy - 2, 2);

  // Energy particles around portal
  g.fillStyle(0x82ccdd);
  g.fillCircle(cx + 18, cy, 2);
  g.fillCircle(cx - 18, cy, 2);
  g.fillCircle(cx, cy + 18, 2);
  g.fillCircle(cx, cy - 18, 2);

  // Sparkles
  g.fillStyle(0xffffff);
  g.fillCircle(cx + 14, cy - 10, 1);
  g.fillCircle(cx - 12, cy + 12, 1);

  g.generateTexture('world_10', size, size);
  g.destroy();
}

function generateCosmos(scene, size) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const cx = size / 2;
  const cy = size / 2;

  // Infinity/cosmic symbol background
  g.fillStyle(0x2d2d44);
  g.fillCircle(cx, cy, 20);

  // Stars pattern (constellation-like)
  g.fillStyle(0xffeaa7);
  const starPositions = [
    [cx - 10, cy - 8], [cx + 10, cy - 8],
    [cx - 12, cy + 5], [cx + 12, cy + 5],
    [cx, cy - 12], [cx, cy + 12],
    [cx - 5, cy], [cx + 5, cy]
  ];

  starPositions.forEach(([x, y], i) => {
    const starSize = i < 4 ? 2.5 : 1.5;
    drawStar(g, x, y, 4, starSize, starSize / 2);
  });

  // Connect stars with faint lines
  g.lineStyle(1, 0xffeaa7, 0.3);
  g.beginPath();
  g.moveTo(cx - 10, cy - 8);
  g.lineTo(cx, cy - 12);
  g.lineTo(cx + 10, cy - 8);
  g.lineTo(cx + 12, cy + 5);
  g.lineTo(cx, cy + 12);
  g.lineTo(cx - 12, cy + 5);
  g.lineTo(cx - 10, cy - 8);
  g.strokePath();

  // Center glow
  g.fillStyle(0xffeaa7, 0.3);
  g.fillCircle(cx, cy, 6);

  g.generateTexture('world_11', size, size);
  g.destroy();
}

// Helper: Draw a star shape
function drawStar(g, cx, cy, points, outerR, innerR) {
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
}

// Helper: Draw a spiral
function drawSpiral(g, cx, cy, turns, maxR, startAngle = 0) {
  const steps = turns * 20;
  g.beginPath();
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const angle = startAngle + t * turns * Math.PI * 2;
    const r = t * maxR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.strokePath();
}
