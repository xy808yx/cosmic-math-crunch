import Phaser from 'phaser';
import { generateWorldIcons } from '../WorldArt.js';

// Steven Universe inspired color palette
const PALETTE = {
  bg: '#12121f',
  pink: '#ff6b9d',
  teal: '#4ecdc4',
  purple: '#9b59b6',
  yellow: '#f7dc6f',
  orange: '#f39c12',
  blue: '#5dade2',
  green: '#58d68d',
  coral: '#ff7675',
  lavender: '#a29bfe',
  mint: '#81ecec'
};

const TILE_COLORS = [
  PALETTE.pink,
  PALETTE.teal,
  PALETTE.purple,
  PALETTE.yellow,
  PALETTE.orange,
  PALETTE.blue,
  PALETTE.green,
  PALETTE.coral,
  PALETTE.lavender,
  PALETTE.mint
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show loading text
    const loadingText = this.add.text(400, 700, 'Loading...', {
      fontSize: '48px',
      fill: '#fff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  create() {
    // Generate pixel art tiles for numbers 1-12
    this.generateNumberTiles();

    // Generate UI elements
    this.generateUIElements();

    // Generate world icons
    generateWorldIcons(this);

    // Check if tutorial was completed before
    const tutorialComplete = this.registry.get('tutorialComplete');

    if (tutorialComplete) {
      // Go to world map
      this.scene.start('WorldMapScene');
    } else {
      // Show tutorial first
      this.scene.start('TutorialScene');
    }
  }

  generateNumberTiles() {
    const tileSize = 128;
    const padding = 6;
    const innerSize = tileSize - padding * 2;
    const cornerRadius = 16;
    const bevelSize = 6;

    for (let num = 1; num <= 12; num++) {
      const colorIndex = (num - 1) % TILE_COLORS.length;
      const baseColor = Phaser.Display.Color.HexStringToColor(TILE_COLORS[colorIndex]);

      const graphics = this.make.graphics({ x: 0, y: 0, add: false });

      const bgColor = baseColor.color;
      const lightColor = Phaser.Display.Color.ValueToColor(bgColor).lighten(45).color;
      const midColor = Phaser.Display.Color.ValueToColor(bgColor).lighten(15).color;
      const darkColor = Phaser.Display.Color.ValueToColor(bgColor).darken(25).color;
      const shadowColor = Phaser.Display.Color.ValueToColor(bgColor).darken(45).color;

      // 1. Drop shadow (offset down-right)
      graphics.fillStyle(0x000000, 0.5);
      graphics.fillRoundedRect(padding + 4, padding + 4, innerSize, innerSize, cornerRadius);

      // 2. Bottom/Right dark edge (creates depth)
      graphics.fillStyle(shadowColor);
      graphics.fillRoundedRect(padding, padding, innerSize, innerSize, cornerRadius);

      // 3. Main tile body (slightly inset)
      graphics.fillStyle(bgColor);
      graphics.fillRoundedRect(padding, padding, innerSize - bevelSize/2, innerSize - bevelSize/2, cornerRadius);

      // 4. Top highlight band (lighter stripe at top)
      graphics.fillStyle(lightColor, 0.9);
      graphics.fillRoundedRect(padding + 4, padding + 4, innerSize - 12, bevelSize * 3, { tl: cornerRadius - 4, tr: cornerRadius - 4, bl: 8, br: 8 });

      // 5. Left edge highlight
      graphics.fillStyle(midColor, 0.7);
      graphics.fillRoundedRect(padding + 3, padding + 16, bevelSize, innerSize - 36, 4);

      // 6. Inner glow/shine (small bright spot)
      graphics.fillStyle(0xffffff, 0.3);
      graphics.fillCircle(padding + 28, padding + 24, 12);
      graphics.fillStyle(0xffffff, 0.15);
      graphics.fillCircle(padding + 32, padding + 28, 8);

      // 7. Bottom inner shadow for inset effect
      graphics.fillStyle(darkColor, 0.5);
      graphics.fillRoundedRect(padding + 8, padding + innerSize - 20, innerSize - 20, 12, { tl: 4, tr: 4, bl: cornerRadius - 8, br: cornerRadius - 8 });

      // 8. Crisp outer border
      graphics.lineStyle(2, darkColor, 0.8);
      graphics.strokeRoundedRect(padding + 1, padding + 1, innerSize - 2, innerSize - 2, cornerRadius - 1);

      graphics.generateTexture(`tile_bg_${num}`, tileSize, tileSize);
      graphics.destroy();
    }

    // Store tile colors for GameScene to use
    this.registry.set('tileColors', TILE_COLORS);

    // Generate selected tile overlay - glowing border effect
    const selectGraphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Outer glow
    selectGraphics.lineStyle(8, 0x4ecdc4, 0.4);
    selectGraphics.strokeRoundedRect(4, 4, tileSize - 8, tileSize - 8, 14);

    // Mid glow
    selectGraphics.lineStyle(5, 0x4ecdc4, 0.7);
    selectGraphics.strokeRoundedRect(6, 6, tileSize - 12, tileSize - 12, 12);

    // Inner bright ring
    selectGraphics.lineStyle(3, 0xffffff, 1);
    selectGraphics.strokeRoundedRect(8, 8, tileSize - 16, tileSize - 16, 10);

    selectGraphics.generateTexture('tile_selected', tileSize, tileSize);
    selectGraphics.destroy();

    // Generate hint overlay - pulsing yellow glow
    const hintGraphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Outer yellow glow
    hintGraphics.lineStyle(6, 0xf7dc6f, 0.5);
    hintGraphics.strokeRoundedRect(4, 4, tileSize - 8, tileSize - 8, 14);

    // Inner yellow ring
    hintGraphics.lineStyle(3, 0xf7dc6f, 1);
    hintGraphics.strokeRoundedRect(7, 7, tileSize - 14, tileSize - 14, 11);

    hintGraphics.generateTexture('tile_hint', tileSize, tileSize);
    hintGraphics.destroy();
  }

  generateUIElements() {
    // Star icon
    const starGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    starGraphics.fillStyle(0xf7dc6f);
    this.drawStar(starGraphics, 32, 32, 5, 28, 14);
    starGraphics.generateTexture('star', 64, 64);
    starGraphics.destroy();

    // Empty star
    const emptyStarGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    emptyStarGraphics.lineStyle(4, 0xf7dc6f, 0.5);
    this.drawStarOutline(emptyStarGraphics, 32, 32, 5, 28, 14);
    emptyStarGraphics.generateTexture('star_empty', 64, 64);
    emptyStarGraphics.destroy();

    // Generate particle textures
    this.generateParticleTextures();
  }

  generateParticleTextures() {
    // Spark particle (cross/plus shape for combos)
    const sparkGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    sparkGraphics.fillStyle(0xffffff);
    sparkGraphics.fillRect(12, 4, 8, 24); // Vertical bar
    sparkGraphics.fillRect(4, 12, 24, 8); // Horizontal bar
    sparkGraphics.generateTexture('particle_spark', 32, 32);
    sparkGraphics.destroy();

    // Soft glow particle (for ambient effects)
    const glowGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    glowGraphics.fillStyle(0xffffff, 0.3);
    glowGraphics.fillCircle(16, 16, 16);
    glowGraphics.fillStyle(0xffffff, 0.6);
    glowGraphics.fillCircle(16, 16, 10);
    glowGraphics.fillStyle(0xffffff, 0.9);
    glowGraphics.fillCircle(16, 16, 4);
    glowGraphics.generateTexture('particle_glow', 32, 32);
    glowGraphics.destroy();

    // Diamond particle (for special effects)
    const diamondGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    diamondGraphics.fillStyle(0xffffff);
    diamondGraphics.beginPath();
    diamondGraphics.moveTo(16, 0);
    diamondGraphics.lineTo(32, 16);
    diamondGraphics.lineTo(16, 32);
    diamondGraphics.lineTo(0, 16);
    diamondGraphics.closePath();
    diamondGraphics.fillPath();
    diamondGraphics.generateTexture('particle_diamond', 32, 32);
    diamondGraphics.destroy();
  }

  drawStar(graphics, cx, cy, points, outerRadius, innerRadius) {
    const step = Math.PI / points;
    graphics.beginPath();
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    }
    graphics.closePath();
    graphics.fillPath();
  }

  drawStarOutline(graphics, cx, cy, points, outerRadius, innerRadius) {
    const step = Math.PI / points;
    graphics.beginPath();
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    }
    graphics.closePath();
    graphics.strokePath();
  }
}
