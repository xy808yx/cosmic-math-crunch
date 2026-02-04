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
    const loadingText = this.add.text(200, 350, 'Loading...', {
      fontSize: '24px',
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
    const tileSize = 64;
    const padding = 4;
    const innerSize = tileSize - padding * 2;
    const cornerRadius = 10;

    for (let num = 1; num <= 12; num++) {
      const colorIndex = (num - 1) % TILE_COLORS.length;
      const color = Phaser.Display.Color.HexStringToColor(TILE_COLORS[colorIndex]);

      // Create a graphics object for the tile background only
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });

      // Solid color with clean design (3 operations only)
      const bgColor = color.color;
      const lightColor = Phaser.Display.Color.ValueToColor(bgColor).lighten(30).color;

      // 1. Drop shadow (solid black, 40% opacity)
      graphics.fillStyle(0x000000, 0.4);
      graphics.fillRoundedRect(padding + 2, padding + 3, innerSize, innerSize, cornerRadius);

      // 2. Solid color fill (no gradients)
      graphics.fillStyle(bgColor);
      graphics.fillRoundedRect(padding, padding, innerSize, innerSize, cornerRadius);

      // 3. Light border stroke for definition
      graphics.lineStyle(2, lightColor, 0.6);
      graphics.strokeRoundedRect(padding, padding, innerSize, innerSize, cornerRadius);

      // Generate background texture only
      graphics.generateTexture(`tile_bg_${num}`, tileSize, tileSize);
      graphics.destroy();
    }

    // Store tile colors for GameScene to use
    this.registry.set('tileColors', TILE_COLORS);

    // Generate selected tile overlay - clean double-border
    const selectGraphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Outer white ring
    selectGraphics.lineStyle(3, 0xffffff, 1);
    selectGraphics.strokeRoundedRect(2, 2, tileSize - 4, tileSize - 4, 10);

    // Inner teal ring
    selectGraphics.lineStyle(2, 0x4ecdc4, 1);
    selectGraphics.strokeRoundedRect(6, 6, tileSize - 12, tileSize - 12, 8);

    selectGraphics.generateTexture('tile_selected', tileSize, tileSize);
    selectGraphics.destroy();

    // Generate hint overlay - single yellow border
    const hintGraphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Single yellow border
    hintGraphics.lineStyle(3, 0xf7dc6f, 1);
    hintGraphics.strokeRoundedRect(2, 2, tileSize - 4, tileSize - 4, 10);

    hintGraphics.generateTexture('tile_hint', tileSize, tileSize);
    hintGraphics.destroy();
  }

  generateUIElements() {
    // Star icon
    const starGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    starGraphics.fillStyle(0xf7dc6f);
    this.drawStar(starGraphics, 16, 16, 5, 14, 7);
    starGraphics.generateTexture('star', 32, 32);
    starGraphics.destroy();

    // Empty star
    const emptyStarGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    emptyStarGraphics.lineStyle(2, 0xf7dc6f, 0.5);
    this.drawStarOutline(emptyStarGraphics, 16, 16, 5, 14, 7);
    emptyStarGraphics.generateTexture('star_empty', 32, 32);
    emptyStarGraphics.destroy();

    // Generate particle textures
    this.generateParticleTextures();
  }

  generateParticleTextures() {
    // Spark particle (cross/plus shape for combos)
    const sparkGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    sparkGraphics.fillStyle(0xffffff);
    sparkGraphics.fillRect(6, 2, 4, 12); // Vertical bar
    sparkGraphics.fillRect(2, 6, 12, 4); // Horizontal bar
    sparkGraphics.generateTexture('particle_spark', 16, 16);
    sparkGraphics.destroy();

    // Soft glow particle (for ambient effects)
    const glowGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    glowGraphics.fillStyle(0xffffff, 0.3);
    glowGraphics.fillCircle(8, 8, 8);
    glowGraphics.fillStyle(0xffffff, 0.6);
    glowGraphics.fillCircle(8, 8, 5);
    glowGraphics.fillStyle(0xffffff, 0.9);
    glowGraphics.fillCircle(8, 8, 2);
    glowGraphics.generateTexture('particle_glow', 16, 16);
    glowGraphics.destroy();

    // Diamond particle (for special effects)
    const diamondGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    diamondGraphics.fillStyle(0xffffff);
    diamondGraphics.beginPath();
    diamondGraphics.moveTo(8, 0);
    diamondGraphics.lineTo(16, 8);
    diamondGraphics.lineTo(8, 16);
    diamondGraphics.lineTo(0, 8);
    diamondGraphics.closePath();
    diamondGraphics.fillPath();
    diamondGraphics.generateTexture('particle_diamond', 16, 16);
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
