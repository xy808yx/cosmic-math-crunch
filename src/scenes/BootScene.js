import Phaser from 'phaser';
import { generateWorldIcons } from '../WorldArt.js';

// Steven Universe inspired color palette
const PALETTE = {
  bg: '#1a1a2e',
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

    for (let num = 1; num <= 12; num++) {
      const colorIndex = (num - 1) % TILE_COLORS.length;
      const color = Phaser.Display.Color.HexStringToColor(TILE_COLORS[colorIndex]);

      // Create a graphics object for the tile background only
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });

      // Draw rounded rectangle background with pixel art style
      const bgColor = color.color;
      const darkColor = Phaser.Display.Color.ValueToColor(bgColor).darken(20).color;
      const lightColor = Phaser.Display.Color.ValueToColor(bgColor).lighten(20).color;

      // Main tile body
      graphics.fillStyle(bgColor);
      graphics.fillRoundedRect(4, 4, tileSize - 8, tileSize - 8, 8);

      // Highlight (top-left)
      graphics.fillStyle(lightColor);
      graphics.fillRoundedRect(4, 4, tileSize - 8, 8, { tl: 8, tr: 8, bl: 0, br: 0 });

      // Shadow (bottom)
      graphics.fillStyle(darkColor);
      graphics.fillRoundedRect(4, tileSize - 16, tileSize - 8, 8, { tl: 0, tr: 0, bl: 8, br: 8 });

      // Generate background texture only
      graphics.generateTexture(`tile_bg_${num}`, tileSize, tileSize);
      graphics.destroy();
    }

    // Store tile colors for GameScene to use
    this.registry.set('tileColors', TILE_COLORS);

    // Generate selected tile overlay
    const selectGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    selectGraphics.lineStyle(4, 0xffffff, 1);
    selectGraphics.strokeRoundedRect(2, 2, tileSize - 4, tileSize - 4, 10);
    selectGraphics.generateTexture('tile_selected', tileSize, tileSize);
    selectGraphics.destroy();

    // Generate hint glow
    const hintGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    hintGraphics.lineStyle(4, 0xf7dc6f, 0.8);
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
