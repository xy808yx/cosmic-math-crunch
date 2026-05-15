// Dad's Garage exploration scene.

import Phaser from 'phaser';
import { progress, findWorld } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { music } from '../MusicManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { style } from '../textStyles.js';
import { createButton } from '../buttonHelper.js';
import { createModal } from '../modalHelper.js';
import { companion, drawCompanion } from '../CompanionManager.js';
import { cosmetics } from '../CosmeticManager.js';
import { GARAGE_ITEMS, DAILY_NOTES } from '../content/dadGarage.js';

const W = 1080;
const H = 1920;

export class HiddenWorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HiddenWorldScene' });
  }

  init(data) {
    this.hiddenWorldId = data?.worldId
      || this.registry.get('hiddenWorldId')
      || 16;
    this.world = findWorld(this.hiddenWorldId);
  }

  create() {
    audio.init();
    music.pause();

    if (!this.world || this.world.kind !== 'exploration') {
      // Defensive: this scene only handles exploration now. Anything else
      // (legacy Glitch entry, missing world) bounces back to the map.
      this.scene.start('WorldMapScene');
      return;
    }

    this.createGarageExploration();
    music.ensurePlaying(this, 'dadsGarage');

    new TransitionManager(this).fadeIn(300);
  }

  // ============================================================
  // DAD'S GARAGE — non-combat exploration with cameo bubbles
  // ============================================================
  createGarageExploration() {
    this.drawGarageBackdrop();

    this.add.text(W / 2, 160, "DAD'S GARAGE", style('display', {
      fontSize: '64px',
      fill: '#ffd86b',
      stroke: '#0a0a1a',
      strokeThickness: 5
    })).setOrigin(0.5).setDepth(5);

    // Whiteboard with today's note + pet companion (added before item loop so
    // they sit at the right depth).
    this.createWhiteboard();
    this.createGaragePet();

    // Bubble text lives in src/content/dadGarage.js.
    const bubbleFor = id => (GARAGE_ITEMS.find(i => i.id === id)?.bubble) || '';
    const items = [
      { id: 'freezer',  x: 175,    y: 580,  hitW: 240, hitH: 180, draw: drawChestFreezer, label: 'Chest freezer' },
      { id: 'rack',     x: 470,    y: 580,  hitW: 240, hitH: 320, draw: drawStorageRack,  label: 'Pantry rack' },
      { id: 'bins',     x: 690,    y: 600,  hitW: 200, hitH: 200, draw: drawStorageBins,  label: 'Storage bins' },
      { id: 'squat',    x: 940,    y: 600,  hitW: 220, hitH: 280, draw: drawSquatRack,    label: 'Squat rack' },
      { id: 'laptop',   x: 215,    y: 950,  hitW: 240, hitH: 200, draw: drawMacBook,      label: 'Laptop' },
      { id: 'printer',  x: 470,    y: 950,  hitW: 200, hitH: 200, draw: drawBambuA1,      label: '3D printer' },
      { id: 'stroller', x: 760,    y: 950,  hitW: 280, hitH: 260, draw: drawUppababyVista,label: 'Stroller' },
      { id: 'bikes',    x: 250,    y: 1280, hitW: 360, hitH: 220, draw: drawKidsBikes,    label: "Kids' bikes" },
      { id: 'ebike',    x: 760,    y: 1280, hitW: 360, hitH: 240, draw: drawRadPower,     label: 'Ebike' },
      { id: 'shoes',    x: W / 2,  y: 1560, hitW: 760, hitH: 200, draw: drawShoeRack,     label: 'Running shoes' }
    ].map(it => ({ ...it, bubble: bubbleFor(it.id) }));

    for (const item of items) {
      const node = this.add.container(item.x, item.y).setDepth(8);
      const g = this.add.graphics();
      item.draw(g);
      node.add(g);
      this.tweens.add({
        targets: node,
        scale: { from: 1, to: 1.04 },
        duration: 1400 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.add.text(item.x, item.y + item.hitH / 2 + 16, item.label, style('caption', {
        fontSize: '20px',
        fill: '#ffd86b',
        stroke: '#0a0a1a',
        strokeThickness: 2
      })).setOrigin(0.5).setDepth(8);

      const hit = this.add.rectangle(item.x, item.y, item.hitW, item.hitH, 0, 0)
        .setInteractive({ useHandCursor: true }).setDepth(9);

      hit.on('pointerdown', () => {
        audio.playClick?.();
        if (item.id === 'bins' && !progress.isHiddenWorldCleared(16)) {
          this.showUnlockCelebration();
          return;
        }
        this.showBubble(item.x, item.y, item.bubble);
      });
    }

    const leaveBtn = createButton(this, {
      x: W - 130, y: 100, label: 'Leave',
      width: 200, height: 80,
      color: 0x9a9aae,
      textOverrides: { fontSize: '24px', fill: '#ffffff' },
      onClick: () => {
        music.ensurePlaying(this, 'homeTheme');
        this.scene.start('WorldMapScene');
      }
    });
    leaveBtn.setDepth(15);
  }

  drawGarageBackdrop() {
    this.cameras.main.setBackgroundColor('#1a1410');

    const bg = this.add.graphics().setDepth(0);

    // Back wall — pale beige drywall with subtle vertical seam
    const wallTop = 0;
    const wallBottom = 1080;
    bg.fillStyle(0x6e6056, 1);
    bg.fillRect(0, wallTop, W, wallBottom - wallTop);
    // Vertical drywall seams
    bg.fillStyle(0x000000, 0.10);
    for (const sx of [180, 540, 900]) bg.fillRect(sx, wallTop, 2, wallBottom);
    // Subtle pegboard panel center-back
    bg.fillStyle(0x55473d, 1);
    bg.fillRoundedRect(330, 380, 420, 220, 8);
    bg.fillStyle(0x000000, 0.4);
    for (let py = 400; py < 580; py += 22) {
      for (let px = 350; px < 750; px += 22) bg.fillCircle(px, py, 2.5);
    }

    // Fluorescent strip light (top-center)
    bg.fillStyle(0xffffff, 0.95);
    bg.fillRoundedRect(W / 2 - 200, 320, 400, 22, 6);
    bg.fillStyle(0xffe6a8, 0.18);
    bg.fillEllipse(W / 2, 360, 560, 70);

    // Chicken coop heat lamp — hangs from ceiling on left, casts soft red glow
    // Hanging cord from ceiling
    bg.fillStyle(0x1a1a1f, 1);
    bg.fillRect(178, 0, 3, 220);
    // Hook clamp at top of cord
    bg.fillStyle(0x8a8a96, 1);
    bg.fillRoundedRect(166, 218, 28, 18, 4);
    bg.fillStyle(0x5a5a64, 1);
    bg.fillRect(172, 224, 16, 8);
    // Bracket arm down to dome
    bg.fillStyle(0x9a9aaa, 1);
    bg.fillRect(178, 236, 4, 32);
    // METAL DOME REFLECTOR — silver downward cone
    bg.fillStyle(0xb0b0bc, 1);
    bg.fillTriangle(118, 360, 242, 360, 180, 268);
    // Dome interior shading (darker hollow look)
    bg.fillStyle(0x4a4a52, 1);
    bg.fillTriangle(130, 355, 230, 355, 180, 280);
    // Dome rim band (thicker at the opening)
    bg.fillStyle(0x8a8a96, 1);
    bg.fillRect(118, 356, 124, 8);
    bg.fillStyle(0x5a5a64, 1);
    bg.fillRect(118, 364, 124, 4);
    // Highlight along left side of cone (3D feel)
    bg.fillStyle(0xe0e0e8, 1);
    bg.fillTriangle(118, 360, 138, 354, 180, 272);
    // RED INFRARED BULB peeking out below the dome
    bg.fillStyle(0x6a0a0a, 1);
    bg.fillCircle(180, 376, 19);
    bg.fillStyle(0xd13b3b, 1);
    bg.fillCircle(180, 374, 15);
    // Bulb hot core
    bg.fillStyle(0xff5a3a, 0.95);
    bg.fillCircle(180, 372, 9);
    bg.fillStyle(0xfff5d8, 0.85);
    bg.fillCircle(177, 369, 3.5);
    // Red glow spill on wall + nearby air
    bg.fillStyle(0xff3a2a, 0.14);
    bg.fillEllipse(180, 430, 340, 260);
    bg.fillStyle(0xff5a3a, 0.07);
    bg.fillEllipse(180, 540, 560, 480);

    // Floor — polished concrete with warm spill from the strip light above
    bg.fillStyle(0x5a5460, 1);
    bg.fillRect(0, wallBottom, W, H - wallBottom);
    // Lighter top of floor (back) fading to darker front
    bg.fillStyle(0x6a6470, 0.55);
    bg.fillRect(0, wallBottom, W, 220);
    bg.fillStyle(0x4a444d, 0.55);
    bg.fillRect(0, H - 300, W, 300);
    // Floor seam/expansion lines
    bg.lineStyle(2, 0x3a3438, 1);
    bg.lineBetween(0, wallBottom, W, wallBottom);
    bg.lineStyle(1, 0x756e7c, 0.7);
    bg.lineBetween(0, 1420, W, 1420);
    bg.lineBetween(0, 1700, W, 1700);
    // Warm lamp spill on floor center
    bg.fillStyle(0xffe6a8, 0.08);
    bg.fillEllipse(W / 2, 1280, W * 1.3, 800);
  }

  showBubble(x, y, text) {
    if (this._bubble) this._bubble.destroy();
    const bubble = this.add.container(W / 2, 420).setDepth(20);
    const bg = this.add.graphics();
    bg.fillStyle(0xfff5d8, 0.98);
    bg.fillRoundedRect(-440, -90, 880, 180, 24);
    bg.lineStyle(3, 0x2a1f12, 1);
    bg.strokeRoundedRect(-440, -90, 880, 180, 24);
    bubble.add(bg);
    const t = this.add.text(0, 0, text, style('body', {
      fontSize: '30px',
      fill: '#2a1f12',
      align: 'center',
      wordWrap: { width: 820 }
    })).setOrigin(0.5);
    bubble.add(t);
    bubble.alpha = 0;
    bubble.setScale(0.9);
    this.tweens.add({
      targets: bubble,
      alpha: 1,
      scale: 1,
      duration: 240,
      ease: 'Back.easeOut'
    });
    this._bubble = bubble;
    // Auto-fade after a while
    this.time.delayedCall(4500, () => {
      if (this._bubble === bubble) {
        this.tweens.add({
          targets: bubble,
          alpha: 0,
          duration: 400,
          onComplete: () => bubble.destroy()
        });
        this._bubble = null;
      }
    });
  }

  showUnlockCelebration() {
    progress.clearHiddenWorld(16);
    cosmetics.addAndEquip('acc_dad_glasses');
    audio.playMatch?.();

    const { card } = createModal(this, {
      width: 880, height: 660,
      accentColor: 0xffd86b,
      showCloseHint: false
    });
    card.add(this.add.text(0, -220, 'YOU FOUND IT!', style('display', {
      fontSize: '60px',
      fill: '#ffd86b',
      stroke: '#0a0a1a',
      strokeThickness: 5
    })).setOrigin(0.5));
    card.add(this.add.text(0, -130, 'Tucked away in the storage bins.', style('caption', {
      fontSize: '24px',
      fill: '#cfcfe0',
      align: 'center'
    })).setOrigin(0.5));

    // Show the pet wearing the freshly-equipped glasses.
    const previewPet = drawCompanion(this, 0, 20, { scale: 1.4 });
    card.add(previewPet);

    card.add(this.add.text(0, 150, "Unlocked: Dad's Glasses", style('subhead', {
      fontSize: '32px',
      fill: '#ffd86b',
      align: 'center'
    })).setOrigin(0.5));

    card.add(createButton(this, {
      x: 0, y: 240, width: 320, height: 92,
      label: 'Sweet',
      color: 0xffd86b,
      textOverrides: { fontSize: '28px', fill: '#0a0a1a', fontStyle: '900' },
      onClick: () => {
        music.ensurePlaying(this, 'homeTheme');
        this.scene.start('WorldMapScene');
      }
    }));
    return card;
  }

  // ----------------------------------------------------------
  // GARAGE EXTRAS — whiteboard + pet companion + leave handling
  // ----------------------------------------------------------
  createWhiteboard() {
    // Pull today's note; mark as claimed if it's a new day.
    const { isNewDay, message } = progress.claimDailyDadNoteIfDue(DAILY_NOTES);
    let stardustAwarded = false;
    if (isNewDay) {
      progress.economy.stardust = (progress.economy.stardust || 0) + 10;
      progress.save();
      stardustAwarded = true;
    }

    // Whiteboard frame, mounted on the wall above the pegboard.
    const wb = this.add.container(W / 2, 268).setDepth(3);
    const frame = this.add.graphics();
    // Outer frame
    frame.fillStyle(0x2a2620, 1);
    frame.fillRoundedRect(-220, -60, 440, 120, 6);
    // White marker board
    frame.fillStyle(0xfafaf0, 1);
    frame.fillRoundedRect(-212, -52, 424, 104, 4);
    // Marker tray
    frame.fillStyle(0x4a3f30, 1);
    frame.fillRoundedRect(-220, 56, 440, 8, 2);
    frame.fillStyle(0xff5b6e, 1);
    frame.fillCircle(-160, 60, 5);
    frame.fillStyle(0x39ff14, 1);
    frame.fillCircle(-130, 60, 5);
    wb.add(frame);

    // The day's message, hand-lettered feel.
    const noteText = this.add.text(0, 0, message, style('body', {
      fontSize: '20px',
      fill: '#2a1f12',
      align: 'center',
      wordWrap: { width: 400 },
      fontStyle: 'italic'
    })).setOrigin(0.5);
    wb.add(noteText);

    // "NEW +10 ⭐" badge if this is a fresh claim — fades on tap.
    let badge = null;
    if (stardustAwarded) {
      badge = this.add.container(208, -52);
      const badgeBg = this.add.graphics();
      badgeBg.fillStyle(0xffd86b, 1);
      badgeBg.fillRoundedRect(-44, -22, 88, 44, 8);
      badgeBg.lineStyle(2, 0x2a1f12, 1);
      badgeBg.strokeRoundedRect(-44, -22, 88, 44, 8);
      badge.add(badgeBg);
      badge.add(this.add.text(0, -4, 'NEW', style('caption', {
        fontSize: '14px',
        fill: '#2a1f12',
        fontStyle: '900'
      })).setOrigin(0.5));
      badge.add(this.add.text(0, 10, '+10 ⭐', style('caption', {
        fontSize: '12px',
        fill: '#2a1f12'
      })).setOrigin(0.5));
      wb.add(badge);
      this.tweens.add({
        targets: badge,
        scale: { from: 1, to: 1.08 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const hit = this.add.rectangle(W / 2, 268, 460, 130, 0, 0)
      .setInteractive({ useHandCursor: true }).setDepth(4);
    hit.on('pointerdown', () => {
      audio.playClick?.();
      if (badge) {
        this.tweens.add({
          targets: badge,
          alpha: 0, scale: 0.6, duration: 350,
          onComplete: () => badge.destroy()
        });
        badge = null;
      }
      this.showDailyNotePopup(message);
    });
  }

  showDailyNotePopup(message) {
    const { card } = createModal(this, {
      width: 920, height: 1000,
      accentColor: 0xffd86b,
      radius: 28, strokeWidth: 4,
      overlayAlpha: 0.85,
      closeOnCardTap: true
    });

    card.add(this.add.text(0, -380, "DAD'S NOTE", style('display', {
      fontSize: '52px',
      fill: '#ffd86b',
      stroke: '#0a0a1a',
      strokeThickness: 5
    })).setOrigin(0.5));

    const board = this.add.graphics();
    board.fillStyle(0x2a2620, 1);
    board.fillRoundedRect(-380, -280, 760, 560, 10);
    board.fillStyle(0xfafaf0, 1);
    board.fillRoundedRect(-368, -268, 736, 536, 6);
    card.add(board);

    card.add(this.add.text(0, 0, message, style('body', {
      fontSize: '52px',
      fill: '#2a1f12',
      align: 'center',
      wordWrap: { width: 680 },
      fontStyle: 'italic',
      lineSpacing: 12
    })).setOrigin(0.5));
  }

  createGaragePet() {
    if (!companion.hasStarter()) return;
    const spots = [
      { x: 940, y: 520 },   // perched above squat rack
      { x: 180, y: 460 },   // under the heat lamp
      { x: 215, y: 880 },   // on the laptop
      { x: 470, y: 1170 }   // beside the bikes
    ];
    let idx = Math.floor(Math.random() * spots.length);
    const start = spots[idx];

    const petContainer = this.add.container(start.x, start.y).setDepth(11);
    petContainer.add(drawCompanion(this, 0, 0, { scale: 1.1 }));

    // Subtle idle bob
    this.tweens.add({
      targets: petContainer,
      y: start.y - 8,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Tap → chirp + heart particle
    const hit = this.add.rectangle(0, 0, 130, 130, 0, 0)
      .setInteractive({ useHandCursor: true });
    petContainer.add(hit);
    hit.on('pointerdown', () => {
      audio.playPetChirp?.();
      const heart = this.add.text(petContainer.x + 40, petContainer.y - 40, '♥', style('display', {
        fontSize: '36px',
        fill: '#ff9ec7'
      })).setOrigin(0.5).setDepth(20);
      this.tweens.add({
        targets: heart,
        y: heart.y - 50, alpha: 0,
        duration: 700,
        onComplete: () => heart.destroy()
      });
    });

    // Wander to a new spot every ~15s.
    this.time.addEvent({
      delay: 15000,
      loop: true,
      callback: () => {
        let next = idx;
        while (next === idx) next = Math.floor(Math.random() * spots.length);
        idx = next;
        const target = spots[idx];
        // Quick hop fade
        this.tweens.add({
          targets: petContainer,
          alpha: 0,
          scale: 0.7,
          duration: 240,
          onComplete: () => {
            petContainer.x = target.x;
            petContainer.y = target.y;
            this.tweens.add({
              targets: petContainer,
              alpha: 1, scale: 1, duration: 240, ease: 'Back.easeOut'
            });
          }
        });
      }
    });
  }
}

// ============================================================
// GLITCH PLANET HELPERS — drawn on the world map only.
// ============================================================

// Single-tint ghost sphere (used for RGB channel split).
function drawGlitchPlanetSphere(g, R, { tint, alpha, offsetX = 0 }) {
  g.fillStyle(tint, alpha);
  g.fillCircle(offsetX, 0, R);
}

// Main planet body — green/magenta continents over a dark base.
function drawGlitchPlanetBody(g, R) {
  // Base dark sphere
  g.fillStyle(0x180020, 1);
  g.fillCircle(0, 0, R);
  // Sphere shading — darker lower-right crescent
  g.fillStyle(0x000000, 0.45);
  g.fillCircle(R * 0.25, R * 0.25, R * 0.95);
  // "Continents" — irregular blobs in green
  g.fillStyle(0x39ff14, 0.92);
  for (const [bx, by, br] of [
    [-R * 0.35, -R * 0.2, R * 0.36],
    [R * 0.15, -R * 0.45, R * 0.22],
    [R * 0.05, R * 0.25, R * 0.30],
    [-R * 0.6, R * 0.1, R * 0.18]
  ]) {
    drawClippedBlob(g, bx, by, br, R);
  }
  // Magenta corruption bands (horizontal stripes within sphere)
  g.fillStyle(0xff00ff, 0.65);
  for (const by of [-R * 0.55, -R * 0.15, R * 0.18, R * 0.45]) {
    const halfW = Math.sqrt(Math.max(0, R * R - by * by));
    g.fillRect(-halfW, by, halfW * 2, 6);
  }
  // Random bright pixel noise inside sphere
  g.fillStyle(0xffffff, 0.85);
  for (let i = 0; i < 36; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * R * 0.95;
    g.fillRect(Math.cos(a) * r, Math.sin(a) * r, 2, 2);
  }
  // Sphere highlight (upper-left)
  g.fillStyle(0xffffff, 0.18);
  g.fillEllipse(-R * 0.35, -R * 0.4, R * 0.7, R * 0.35);
  // Outer ring outline
  g.lineStyle(2, 0x39ff14, 0.6);
  g.strokeCircle(0, 0, R);
}

// Draws an irregular green continent blob, clipped to fit visually inside the
// planet disc (cheap: blob made of 3 overlapping circles).
function drawClippedBlob(g, cx, cy, br, R) {
  if (Math.hypot(cx, cy) + br > R + 4) return; // skip if mostly outside
  g.fillCircle(cx, cy, br);
  g.fillCircle(cx + br * 0.5, cy + br * 0.2, br * 0.7);
  g.fillCircle(cx - br * 0.4, cy + br * 0.3, br * 0.6);
}

// Small glitch planet — used on the world map node. Returns a Phaser graphics
// container drawn at (x, y). `R` is the planet radius. Calm + stable when
// the boss has been defeated, glitchy when not.
export function drawGlitchPlanetNode(scene, x, y, R) {
  const c = scene.add.container(x, y);
  const cleared = progress.isHiddenWorldCleared(15);

  // Red + blue ghosts (much smaller offset post-clear — world has stabilized)
  const ghostOffset = cleared ? 1 : 3;
  const ghostAlpha = cleared ? 0.22 : 0.5;
  const red = scene.add.graphics();
  drawGlitchPlanetSphere(red, R, { tint: 0xff2244, alpha: ghostAlpha, offsetX: -ghostOffset });
  c.add(red);
  const blue = scene.add.graphics();
  drawGlitchPlanetSphere(blue, R, { tint: 0x2a8aff, alpha: ghostAlpha, offsetX: ghostOffset });
  c.add(blue);

  // Main body
  const body = scene.add.graphics();
  drawGlitchPlanetBody(body, R);
  c.add(body);

  // Static horizontal tear bands — fewer and dimmer when cleared
  const tears = scene.add.graphics();
  c.add(tears);
  const tearCount = cleared ? 1 : 3;
  const dotCount = cleared ? 2 : 5;
  const tearAlpha = cleared ? 0.35 : 0.7;
  const redraw = () => {
    tears.clear();
    for (let i = 0; i < tearCount; i++) {
      const ty = (Math.random() - 0.5) * R * 1.4;
      const halfW = Math.sqrt(Math.max(0, R * R - ty * ty));
      tears.fillStyle(i % 2 ? 0xff00ff : 0x39ff14, tearAlpha);
      tears.fillRect(-halfW, ty, halfW * 2, 2);
    }
    for (let i = 0; i < dotCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * R * 0.8;
      tears.fillStyle(Math.random() < 0.5 ? 0xfff700 : 0x00f0ff, 0.9);
      tears.fillRect(Math.cos(ang) * r, Math.sin(ang) * r, 4, 4);
    }
  };
  redraw();

  // Outer glow halo
  const halo = scene.add.graphics();
  if (cleared) {
    halo.fillStyle(0x39ff14, 0.20);
    halo.fillCircle(0, 0, R + 14);
    halo.fillStyle(0x39ff14, 0.10);
    halo.fillCircle(0, 0, R + 26);
  } else {
    halo.fillStyle(0x39ff14, 0.12);
    halo.fillCircle(0, 0, R + 12);
    halo.fillStyle(0xff00ff, 0.08);
    halo.fillCircle(0, 0, R + 22);
  }
  c.addAt(halo, 0);

  // Flicker tick — slow + subtle when cleared, frantic when not
  scene.time.addEvent({
    delay: cleared ? 720 : 280,
    loop: true,
    callback: () => {
      redraw();
      const jx = (Math.random() - 0.5) * (cleared ? 1.5 : 4);
      red.x = -ghostOffset + jx;
      blue.x = ghostOffset - jx;
    }
  });

  // Stabilized checkmark badge — small green check at the corner.
  if (cleared) {
    const badge = scene.add.graphics();
    badge.fillStyle(0x0a0a1a, 1);
    badge.fillCircle(R * 0.72, -R * 0.72, R * 0.28);
    badge.lineStyle(2, 0x39ff14, 1);
    badge.strokeCircle(R * 0.72, -R * 0.72, R * 0.28);
    badge.lineStyle(3, 0x39ff14, 1);
    badge.beginPath();
    badge.moveTo(R * 0.72 - R * 0.13, -R * 0.72);
    badge.lineTo(R * 0.72 - R * 0.03, -R * 0.62);
    badge.lineTo(R * 0.72 + R * 0.15, -R * 0.85);
    badge.strokePath();
    c.add(badge);
  }

  return c;
}

// Small garage-door node icon for the world map (W16 hidden world).
// White panelled door, dark frame, warm window strip at the top. Once the
// garage has been visited and completed, the window glows brighter and a
// tiny chimney wisp marks the place as "active".
export function drawGarageNode(scene, x, y, R) {
  const c = scene.add.container(x, y);
  const cleared = progress.isHiddenWorldCleared(16);

  // Soft warm halo — brighter post-clear so the garage clearly looks "lived in"
  const halo = scene.add.graphics();
  halo.fillStyle(0xffe6a8, cleared ? 0.26 : 0.14);
  halo.fillCircle(0, 0, R + (cleared ? 18 : 14));
  c.add(halo);
  // Concrete pad / floor strip
  const pad = scene.add.graphics();
  pad.fillStyle(0x2a2a30, 1);
  pad.fillRoundedRect(-R - 4, R - 8, (R + 4) * 2, 14, 4);
  c.add(pad);
  // Garage door frame (dark)
  const door = scene.add.graphics();
  door.fillStyle(0x2a2620, 1);
  door.fillRoundedRect(-R - 2, -R - 2, (R + 2) * 2, (R + 2) * 2, 6);
  // Door body — white
  door.fillStyle(0xf2efe6, 1);
  door.fillRoundedRect(-R + 4, -R + 4, (R - 4) * 2, (R - 4) * 2, 4);
  // Subtle top highlight on the door
  door.fillStyle(0xffffff, 0.45);
  door.fillRoundedRect(-R + 6, -R + 6, (R - 4) * 2 - 4, 6, 3);
  // Horizontal panel seams (light grey)
  for (let i = 1; i < 4; i++) {
    const py = -R + 4 + i * ((R - 4) * 2) / 4;
    door.lineStyle(2, 0xbab2a2, 1);
    door.lineBetween(-R + 4, py, R - 4, py);
  }
  // Vertical center seam
  door.lineStyle(2, 0xbab2a2, 0.6);
  door.lineBetween(0, -R + 4, 0, R - 4);
  // Handle
  door.fillStyle(0x2a2a30, 1);
  door.fillRoundedRect(-6, R - 12, 12, 6, 2);
  c.add(door);
  // Warm window strip at top — gives the "lit garage at night" feel
  const glow = scene.add.graphics();
  glow.fillStyle(cleared ? 0xfff3b8 : 0xffc864, cleared ? 1 : 0.85);
  glow.fillRoundedRect(-R + 12, -R + 10, (R - 12) * 2, 7, 2);
  c.add(glow);

  // Cleared: tiny smoke wisp from a chimney at top-right, gentle pulse on window
  if (cleared) {
    const wisp = scene.add.graphics();
    wisp.fillStyle(0xeaf6ff, 0.5);
    wisp.fillCircle(R * 0.55, -R - 8, 3);
    wisp.fillStyle(0xeaf6ff, 0.32);
    wisp.fillCircle(R * 0.6, -R - 16, 4);
    wisp.fillStyle(0xeaf6ff, 0.16);
    wisp.fillCircle(R * 0.5, -R - 24, 5);
    c.add(wisp);
    scene.tweens.add({
      targets: wisp,
      y: -8,
      alpha: { from: 1, to: 0.4 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    scene.tweens.add({
      targets: glow,
      alpha: { from: 1, to: 0.7 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  return c;
}

// ============================================================
// GARAGE ITEM RENDERERS — each draws centered on (0,0)
// ============================================================

// 1. Chest freezer — wide white horizontal box with raised lid + handle.
function drawChestFreezer(g) {
  // Ground shadow
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(0, 90, 250, 18);
  // Body (lower box)
  g.fillStyle(0xeae6db, 1);
  g.fillRoundedRect(-115, -20, 230, 110, 8);
  // Body bottom shadow band (depth)
  g.fillStyle(0xb8b0a0, 1);
  g.fillRect(-115, 80, 230, 12);
  // Lid (sitting on top, slightly taller and with depth)
  g.fillStyle(0xfbf8ee, 1);
  g.fillRoundedRect(-118, -68, 236, 56, 8);
  // Lid front face (light shadow under lid)
  g.fillStyle(0x000000, 0.18);
  g.fillRect(-115, -16, 230, 6);
  // Lid top highlight
  g.fillStyle(0xffffff, 0.4);
  g.fillRoundedRect(-110, -66, 220, 10, 6);
  // Lid handle — full-width bar
  g.fillStyle(0xc0b8a8, 1);
  g.fillRoundedRect(-70, -32, 140, 12, 6);
  g.fillStyle(0x9a9080, 1);
  g.fillRoundedRect(-66, -28, 132, 4, 2);
  // Snowflake badge on body
  g.fillStyle(0x6db4d0, 1);
  const sx = 0, sy = 30;
  g.fillRect(sx - 14, sy - 1, 28, 2);
  g.fillRect(sx - 1, sy - 14, 2, 28);
  g.lineStyle(2, 0x6db4d0, 1);
  g.lineBetween(sx - 10, sy - 10, sx + 10, sy + 10);
  g.lineBetween(sx - 10, sy + 10, sx + 10, sy - 10);
  // Brand strip
  g.fillStyle(0x4a4a4a, 1);
  g.fillRoundedRect(-26, 58, 52, 8, 2);
  // Side vents (right end)
  g.lineStyle(1, 0xb8b0a0, 0.9);
  for (let i = 0; i < 4; i++) g.lineBetween(85, 30 + i * 8, 105, 30 + i * 8);
}

// 2. Wire pantry rack — vertical 4-shelf with boxes/cans/bottles.
function drawStorageRack(g) {
  g.fillStyle(0x000000, 0.5);
  g.fillEllipse(0, 150, 230, 14);
  // Frame uprights
  g.fillStyle(0x2a2a30, 1);
  g.fillRect(-110, -140, 8, 290);
  g.fillRect(102, -140, 8, 290);
  // 4 wire shelves
  const shelfYs = [-140, -60, 20, 100];
  for (const y of shelfYs) {
    g.fillStyle(0x2a2a30, 1);
    g.fillRect(-110, y, 220, 6);
    // Wire crosshatch hint
    g.lineStyle(1, 0x444450, 1);
    for (let x = -100; x < 100; x += 14) g.lineBetween(x, y, x, y + 6);
  }
  // Top shelf: SNACKS — chip bag, cookie box, cracker box, granola bar box
  // Chip bag (orange mylar with crimp top)
  g.fillStyle(0xff8a3d, 1);
  g.fillRoundedRect(-100, -140 - 50, 44, 50, 4);
  g.fillStyle(0xc25a20, 1);
  g.fillRect(-100, -140 - 50, 44, 5);
  g.fillRect(-100, -140 - 8, 44, 5);
  // Chip oval label
  g.fillStyle(0xfff5d8, 1);
  g.fillEllipse(-78, -140 - 25, 28, 14);
  g.fillStyle(0xd13b3b, 1);
  g.fillRect(-90, -140 - 28, 24, 4);
  // Tiny chip visual
  g.fillStyle(0xfbd087, 1);
  g.fillTriangle(-82, -140 - 20, -74, -140 - 20, -78, -140 - 14);
  // Cookie box (blue with cookie circle)
  g.fillStyle(0x4a7ad6, 1);
  g.fillRoundedRect(-50, -140 - 44, 40, 44, 3);
  g.fillStyle(0xc88a52, 1);
  g.fillCircle(-30, -140 - 30, 10);
  g.fillStyle(0x6e4a28, 1);
  g.fillCircle(-32, -140 - 32, 1.5);
  g.fillCircle(-26, -140 - 28, 1.5);
  g.fillCircle(-29, -140 - 26, 1.5);
  g.fillStyle(0xffd84a, 1);
  g.fillRect(-48, -140 - 14, 36, 5);
  // Cracker box (red with cracker peek)
  g.fillStyle(0xd13b3b, 1);
  g.fillRoundedRect(0, -140 - 50, 42, 50, 3);
  g.fillStyle(0xfbd087, 1);
  g.fillRoundedRect(8, -140 - 38, 28, 14, 3);
  g.fillStyle(0x8a4a1c, 0.6);
  for (let i = 0; i < 4; i++) g.fillCircle(12 + i * 6, -140 - 31, 1.2);
  g.fillStyle(0xfff5d8, 1);
  g.fillRect(4, -140 - 16, 34, 6);
  // Granola/snack bar box (teal with bars visible)
  g.fillStyle(0x4ecdc4, 1);
  g.fillRoundedRect(50, -140 - 46, 50, 46, 3);
  g.fillStyle(0xfff5d8, 1);
  g.fillRect(54, -140 - 44, 42, 6);
  g.fillStyle(0xc48a3c, 1);
  g.fillRoundedRect(56, -140 - 34, 38, 6, 2);
  g.fillRoundedRect(56, -140 - 24, 38, 6, 2);
  g.fillRoundedRect(56, -140 - 14, 38, 6, 2);
  // Bar oat speckles
  g.fillStyle(0x6e4a28, 0.8);
  for (let i = 0; i < 4; i++) {
    g.fillCircle(60 + i * 9, -140 - 31, 0.9);
    g.fillCircle(60 + i * 9, -140 - 21, 0.9);
  }
  // 2nd shelf: cans
  for (let i = 0; i < 6; i++) {
    g.fillStyle(i % 2 === 0 ? 0xd13b3b : 0x4a90c2, 1);
    g.fillRoundedRect(-100 + i * 32, -60 - 38, 26, 38, 3);
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(-100 + i * 32, -60 - 24, 26, 4);
  }
  // 3rd shelf: pretzel bag + laundry pods jug + detergent bottle
  // Pretzel bag (yellow w/ pretzel shapes)
  g.fillStyle(0xfbd34a, 1);
  g.fillRoundedRect(-100, 20 - 60, 48, 60, 6);
  g.fillStyle(0xb47020, 1);
  g.fillCircle(-86, 20 - 32, 6);
  g.fillCircle(-72, 20 - 36, 5);
  g.fillCircle(-78, 20 - 22, 5);
  // Pretzel bag label
  g.fillStyle(0xd13b3b, 1);
  g.fillRect(-96, 20 - 52, 40, 8);
  // Laundry pods
  g.fillStyle(0xff8ec7, 1);
  g.fillRoundedRect(-44, 20 - 50, 44, 50, 6);
  g.fillStyle(0xffffff, 0.7);
  g.fillRoundedRect(-40, 20 - 38, 36, 12, 3);
  // Detergent
  g.fillStyle(0x4a7ad6, 1);
  g.fillRoundedRect(8, 20 - 64, 42, 64, 6);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(14, 20 - 58, 30, 12, 3);
  // 4th shelf: paper towels roll + bin
  g.fillStyle(0xfff5d8, 1);
  g.fillRoundedRect(-95, 100 - 50, 50, 50, 8);
  g.lineStyle(1, 0xd0c8b0, 1);
  for (let i = 0; i < 5; i++) g.strokeRoundedRect(-95 + i * 2, 100 - 50, 50, 50, 8);
  g.fillStyle(0x5a5a64, 1);
  g.fillRoundedRect(-10, 100 - 44, 70, 44, 4);
}

// 3. Black storage bins with yellow lids — stacked 2-high.
function drawStorageBins(g) {
  g.fillStyle(0x000000, 0.5);
  g.fillEllipse(0, 100, 240, 14);
  // Bottom bin
  g.fillStyle(0x1a1a1f, 1);
  g.fillRoundedRect(-100, 0, 200, 100, 8);
  // Bottom bin lid
  g.fillStyle(0xffd84a, 1);
  g.fillRoundedRect(-104, -8, 208, 18, 6);
  g.fillStyle(0xc9a830, 1);
  g.fillRect(-104, 8, 208, 4);
  // Bottom bin handle/label
  g.fillStyle(0x3a3a44, 1);
  g.fillRoundedRect(-30, 40, 60, 24, 4);
  // Top bin
  g.fillStyle(0x1a1a1f, 1);
  g.fillRoundedRect(-90, -90, 180, 80, 8);
  // Top bin lid
  g.fillStyle(0xffd84a, 1);
  g.fillRoundedRect(-94, -98, 188, 16, 6);
  g.fillStyle(0xc9a830, 1);
  g.fillRect(-94, -84, 188, 4);
  // Lid latches
  g.fillStyle(0x1a1a1f, 1);
  g.fillRect(-80, -96, 10, 10);
  g.fillRect(70, -96, 10, 10);
}

// 4. Black squat rack — uprights + barbell + plates + safeties.
function drawSquatRack(g) {
  g.fillStyle(0x000000, 0.5);
  g.fillEllipse(0, 130, 180, 14);
  // Base
  g.fillStyle(0x14141a, 1);
  g.fillRect(-70, 110, 140, 16);
  // Uprights
  g.fillStyle(0x14141a, 1);
  g.fillRect(-60, -130, 18, 240);
  g.fillRect(42, -130, 18, 240);
  // J-hooks
  g.fillStyle(0x222230, 1);
  g.fillRect(-66, -30, 22, 8);
  g.fillRect(44, -30, 22, 8);
  // Cross-brace
  g.fillStyle(0x14141a, 1);
  g.fillRect(-60, -130, 120, 12);
  // Barbell
  g.fillStyle(0x6a6a76, 1);
  g.fillRect(-90, -22, 180, 6);
  // Sleeve collars
  g.fillStyle(0x9a9aaa, 1);
  g.fillRect(-92, -24, 12, 10);
  g.fillRect(80, -24, 12, 10);
  // Plates: red 25kg both sides
  g.fillStyle(0xd13b3b, 1);
  g.fillCircle(-92, -19, 30);
  g.fillCircle(92, -19, 30);
  g.fillStyle(0x0a0a1a, 1);
  g.fillCircle(-92, -19, 7);
  g.fillCircle(92, -19, 7);
  // Plate edge highlight
  g.lineStyle(2, 0xffffff, 0.25);
  g.strokeCircle(-92, -19, 30);
  g.strokeCircle(92, -19, 30);
  // Safety pin
  g.fillStyle(0x222230, 1);
  g.fillRect(-60, 60, 120, 6);
}

// 5. Silver MacBook Pro — open laptop, glowing apple.
function drawMacBook(g) {
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(0, 80, 220, 14);
  // Base (closed half)
  g.fillStyle(0xb8b8c0, 1);
  g.fillRoundedRect(-110, 50, 220, 18, 6);
  g.fillStyle(0x8a8a90, 1);
  g.fillRect(-110, 62, 220, 6);
  // Lid (back, taller portion)
  g.fillStyle(0xcdcdd4, 1);
  g.fillRoundedRect(-104, -90, 208, 145, 8);
  // Screen bezel
  g.fillStyle(0x14141a, 1);
  g.fillRoundedRect(-94, -82, 188, 130, 4);
  // Wallpaper — soft starfield gradient
  g.fillStyle(0x1d2c54, 1);
  g.fillRoundedRect(-90, -78, 180, 122, 3);
  g.fillStyle(0x4a3a8c, 0.6);
  g.fillCircle(-30, -10, 80);
  g.fillStyle(0xffffff, 0.85);
  for (const [sx, sy, sr] of [[-60, -50, 1.6], [40, -30, 1.4], [60, 20, 1.2], [-30, 30, 1], [10, -60, 1.4]]) {
    g.fillCircle(sx, sy, sr);
  }
  // Hinge shadow line
  g.fillStyle(0x000000, 0.3);
  g.fillRect(-104, 50, 208, 3);
  // Apple logo (glowing)
  g.fillStyle(0xffffff, 0.85);
  const ax = 0, ay = -20;
  g.fillCircle(ax, ay, 8);
  g.fillCircle(ax + 4, ay - 4, 5);
  g.fillStyle(0x14141a, 1);
  g.fillRect(ax + 1, ay - 12, 4, 4);
}

// 6. Bambu Lab A1 mini — small white cuboid printer with bed + gantry.
function drawBambuA1(g) {
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(0, 95, 160, 12);
  // Base / housing
  g.fillStyle(0xf2f2f2, 1);
  g.fillRoundedRect(-78, -90, 156, 180, 8);
  // Base plinth (darker)
  g.fillStyle(0x1f1f24, 1);
  g.fillRoundedRect(-80, 50, 160, 40, 6);
  // LCD touchscreen on plinth
  g.fillStyle(0x3aa7ff, 1);
  g.fillRoundedRect(-30, 58, 60, 26, 3);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(-22, 64, 24, 3);
  g.fillRect(-22, 70, 38, 3);
  g.fillRect(-22, 76, 18, 3);
  // Build plate
  g.fillStyle(0x4a90c2, 1);
  g.fillRoundedRect(-58, 26, 116, 16, 3);
  // Print bed grid hint
  g.lineStyle(1, 0xffffff, 0.4);
  for (let i = 0; i < 4; i++) g.lineBetween(-58 + i * 30, 26, -58 + i * 30, 42);
  // Gantry rails (top horizontal)
  g.fillStyle(0x2a2a30, 1);
  g.fillRect(-70, -64, 140, 6);
  // Vertical gantry rail (Z-axis on right)
  g.fillRect(58, -64, 6, 90);
  // Print head — small block on gantry
  g.fillStyle(0xfbbf24, 1);
  g.fillRoundedRect(-20, -58, 40, 28, 3);
  // Nozzle tip
  g.fillStyle(0x14141a, 1);
  g.fillTriangle(-2, -30, 2, -30, 0, -22);
  // Filament spool (top-left small)
  g.fillStyle(0x2a2a30, 1);
  g.fillCircle(-50, -80, 14);
  g.fillStyle(0xff6b3d, 1);
  g.fillCircle(-50, -80, 10);
  g.fillStyle(0x2a2a30, 1);
  g.fillCircle(-50, -80, 3);
  // Brand mark
  g.fillStyle(0x39c97d, 1);
  g.fillCircle(-58, 80, 5);
}

// 7. Premium bassinet stroller — side profile. Tan bassinet with black hood,
// chrome-accent A-frame, big rear wheel + smaller front wheel.
function drawUppababyVista(g) {
  // Ground shadow
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(0, 120, 290, 16);

  // FRAME — rear-tilted A with chrome highlights
  g.lineStyle(9, 0x14141a, 1);
  g.lineBetween(-100, 100, -10, -50);   // rear strut
  g.lineBetween(90, 95, 30, -50);       // front strut
  g.lineBetween(-100, 100, 90, 95);     // lower cross brace
  // Chrome sheen on each tube
  g.lineStyle(2, 0xb0b0bc, 0.6);
  g.lineBetween(-95, 95, -8, -46);
  g.lineBetween(87, 92, 32, -46);
  // Frame joint pivots (silver pucks)
  g.fillStyle(0xcdcdd4, 1);
  g.fillCircle(-10, -50, 6);
  g.fillCircle(30, -50, 6);
  g.fillStyle(0x2a2a32, 1);
  g.fillCircle(-10, -50, 2.5);
  g.fillCircle(30, -50, 2.5);

  // Handle bar diagonal — extends up-back from rear strut top
  g.lineStyle(10, 0x14141a, 1);
  g.lineBetween(-10, -50, -55, -90);
  // Leather grip wrap (UPPAbaby signature)
  g.fillStyle(0x6e4a28, 1);
  g.fillRoundedRect(-78, -98, 36, 14, 6);
  // Stitching detail on grip
  g.lineStyle(1, 0xc09060, 0.8);
  g.lineBetween(-75, -94, -45, -94);
  g.lineBetween(-75, -90, -45, -90);

  // BASSINET — tan curved pod with leather accent strip
  // Body
  g.fillStyle(0xb88f5c, 1);
  g.fillRoundedRect(-70, -50, 130, 50, 16);
  // Soften bottom curve (subtle wider ellipse blends into rounded rect)
  g.fillEllipse(-5, -2, 130, 14);
  // Top rim (lighter cream band)
  g.fillStyle(0xd4b58a, 1);
  g.fillRoundedRect(-70, -54, 130, 12, 8);
  // Rim top highlight
  g.fillStyle(0xefd1a8, 0.85);
  g.fillRoundedRect(-66, -52, 122, 3, 2);
  // Leather accent strip (signature horizontal band)
  g.fillStyle(0x4a3018, 1);
  g.fillRoundedRect(-58, -18, 110, 8, 3);
  // Strip stitching
  g.lineStyle(1, 0xc09060, 0.7);
  g.lineBetween(-54, -14, 48, -14);
  // Small leather label patch
  g.fillStyle(0x8a5828, 1);
  g.fillRoundedRect(20, -8, 22, 6, 2);

  // HOOD — smooth black dome over rear half of bassinet
  g.fillStyle(0x14141a, 1);
  g.beginPath();
  g.arc(-30, -50, 48, Math.PI, Math.PI * 2);
  g.fillPath();
  // Hood rib stitches (concentric arcs)
  g.lineStyle(2, 0x2a2a32, 1);
  for (const r of [40, 30, 20]) {
    g.beginPath();
    g.arc(-30, -50, r, Math.PI, Math.PI * 2);
    g.strokePath();
  }
  // Hood subtle top sheen
  g.fillStyle(0xffffff, 0.10);
  g.fillEllipse(-30, -90, 40, 6);
  // Peek-a-boo window (small mesh panel at top)
  g.fillStyle(0x4a6a7a, 0.8);
  g.fillRoundedRect(-40, -94, 20, 7, 2);
  g.lineStyle(1, 0x8a9aa6, 0.5);
  g.lineBetween(-38, -91, -22, -91);

  // WHEELS — big rear, smaller front, with chrome rims
  // Rear wheel
  g.fillStyle(0x14141a, 1);
  g.fillCircle(-100, 100, 28);
  g.lineStyle(2, 0x3a3a44, 1);
  g.strokeCircle(-100, 100, 28);
  // Chrome rim ring
  g.fillStyle(0xcdcdd4, 1);
  g.fillCircle(-100, 100, 11);
  g.fillStyle(0x14141a, 1);
  g.fillCircle(-100, 100, 3.5);
  // Spokes (chrome)
  g.lineStyle(2, 0xcdcdd4, 0.95);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.lineBetween(-100, 100, -100 + Math.cos(a) * 24, 100 + Math.sin(a) * 24);
  }
  // Front wheel
  g.fillStyle(0x14141a, 1);
  g.fillCircle(90, 95, 22);
  g.lineStyle(2, 0x3a3a44, 1);
  g.strokeCircle(90, 95, 22);
  g.fillStyle(0xcdcdd4, 1);
  g.fillCircle(90, 95, 9);
  g.fillStyle(0x14141a, 1);
  g.fillCircle(90, 95, 3);
  g.lineStyle(2, 0xcdcdd4, 0.95);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.lineBetween(90, 95, 90 + Math.cos(a) * 18, 95 + Math.sin(a) * 18);
  }
}

// 8. Three kids' bicycles, scaled and tilted slightly.
function drawKidsBikes(g) {
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(0, 100, 320, 14);
  drawSmallBike(g, -120, 30, 0x4ecdc4, 0.85);
  drawSmallBike(g, 0, 40, 0xff6b3d, 1.0);
  drawSmallBike(g, 130, 50, 0xf0abfc, 1.15);
}

function drawSmallBike(g, ox, oy, color, scale) {
  const s = scale;
  // Wheels
  g.fillStyle(0x14141a, 1);
  g.fillCircle(ox - 32 * s, oy, 22 * s);
  g.fillCircle(ox + 32 * s, oy, 22 * s);
  g.fillStyle(0x6a6a76, 1);
  g.fillCircle(ox - 32 * s, oy, 6 * s);
  g.fillCircle(ox + 32 * s, oy, 6 * s);
  // Spokes (cheap radial)
  g.lineStyle(1, 0x9a9aaa, 0.9);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    g.lineBetween(ox - 32 * s, oy, ox - 32 * s + Math.cos(ang) * 18 * s, oy + Math.sin(ang) * 18 * s);
    g.lineBetween(ox + 32 * s, oy, ox + 32 * s + Math.cos(ang) * 18 * s, oy + Math.sin(ang) * 18 * s);
  }
  // Frame — triangle + seat post
  g.lineStyle(6 * s, color, 1);
  g.lineBetween(ox - 32 * s, oy, ox, oy - 26 * s);
  g.lineBetween(ox, oy - 26 * s, ox + 32 * s, oy);
  g.lineBetween(ox, oy - 26 * s, ox - 14 * s, oy - 4 * s);
  g.lineBetween(ox - 14 * s, oy - 4 * s, ox - 32 * s, oy);
  // Seat
  g.fillStyle(0x14141a, 1);
  g.fillRoundedRect(ox - 10 * s, oy - 32 * s, 22 * s, 6 * s, 2);
  // Handlebars
  g.lineStyle(4 * s, 0x14141a, 1);
  g.lineBetween(ox + 24 * s, oy - 20 * s, ox + 40 * s, oy - 26 * s);
  // Training wheel for smallest
  if (scale < 0.9) {
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(ox + 36 * s, oy + 18 * s, 10 * s);
  }
}

// 9. Fat-tire ebike with rear-mounted orange child seat — side profile.
function drawRadPower(g) {
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(0, 100, 340, 14);
  // Wheels — fat tires
  g.fillStyle(0x14141a, 1);
  g.fillCircle(-110, 50, 50);
  g.fillCircle(110, 50, 50);
  // Tread ring (lighter)
  g.lineStyle(3, 0x3a3a44, 1);
  g.strokeCircle(-110, 50, 50);
  g.strokeCircle(110, 50, 50);
  // Rims
  g.fillStyle(0x6a6a76, 1);
  g.fillCircle(-110, 50, 30);
  g.fillCircle(110, 50, 30);
  g.fillStyle(0x14141a, 1);
  g.fillCircle(-110, 50, 6);
  g.fillCircle(110, 50, 6);
  // Spokes
  g.lineStyle(2, 0x9a9aaa, 0.9);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    g.lineBetween(-110, 50, -110 + Math.cos(ang) * 28, 50 + Math.sin(ang) * 28);
    g.lineBetween(110, 50, 110 + Math.cos(ang) * 28, 50 + Math.sin(ang) * 28);
  }
  // Frame — step-through-ish with battery in downtube
  g.lineStyle(14, 0x1f1f26, 1);
  g.lineBetween(-110, 50, -40, -10);   // seat tube
  g.lineBetween(-110, 50, 80, 0);      // downtube
  g.lineBetween(80, 0, 110, 50);       // chainstay
  g.lineBetween(-40, -10, 80, 0);      // top tube
  // Battery slab
  g.fillStyle(0x2a2a32, 1);
  g.fillRoundedRect(-95, 8, 150, 22, 4);
  // Battery LEDs
  g.fillStyle(0x39ff14, 1);
  for (let i = 0; i < 4; i++) g.fillCircle(-70 + i * 14, 19, 2.5);
  // Seat
  g.fillStyle(0x14141a, 1);
  g.fillRoundedRect(-58, -22, 38, 8, 3);
  // Handlebars + stem
  g.lineStyle(8, 0x14141a, 1);
  g.lineBetween(80, 0, 100, -40);
  g.lineBetween(85, -42, 125, -32);
  // Headlight
  g.fillStyle(0xfff3a0, 1);
  g.fillCircle(108, -10, 6);
  // Orange accent plate on downtube
  g.fillStyle(0xff6b00, 1);
  g.fillRoundedRect(-10, 12, 28, 14, 3);

  // ===== REAR RACK + ORANGE INFANT SEAT =====
  // Rack tube frame (black) — top rail above rear wheel, two support arms
  g.lineStyle(5, 0x14141a, 1);
  g.lineBetween(-48, -30, -152, -30);   // top rail
  g.lineBetween(-50, -28, -58, -20);    // front arm (to seat post)
  g.lineBetween(-148, -28, -110, 30);   // rear arm (to wheel hub)
  g.lineBetween(-130, -30, -110, 30);   // secondary diagonal brace

  // Cushion base
  g.fillStyle(0xff8a3d, 1);
  g.fillRoundedRect(-150, -52, 84, 24, 9);
  // Cushion top highlight
  g.fillStyle(0xffaf68, 0.8);
  g.fillRoundedRect(-146, -50, 74, 5, 3);
  // Cushion bottom shadow
  g.fillStyle(0x000000, 0.22);
  g.fillRoundedRect(-148, -32, 80, 4, 2);

  // High backrest (rear of seat)
  g.fillStyle(0xff8a3d, 1);
  g.fillRoundedRect(-152, -94, 26, 46, 11);
  // Headrest cap (slightly flared top)
  g.fillRoundedRect(-156, -98, 34, 12, 7);
  // Backrest highlight
  g.fillStyle(0xffaf68, 0.85);
  g.fillRoundedRect(-150, -92, 8, 40, 4);
  // Backrest shadow on the right edge (depth)
  g.fillStyle(0x000000, 0.18);
  g.fillRoundedRect(-132, -90, 4, 40, 2);

  // Side wing (visible side bolster)
  g.fillStyle(0xff7020, 1);
  g.fillRoundedRect(-148, -50, 10, 22, 4);
  g.fillRoundedRect(-78, -50, 10, 22, 4);

  // Safety harness bar (U-shape arching over child)
  g.lineStyle(4, 0x14141a, 1);
  g.lineBetween(-150, -42, -138, -60);
  g.lineBetween(-138, -60, -82, -60);
  g.lineBetween(-82, -60, -70, -42);
  // Buckle in center
  g.fillStyle(0xfbbf24, 1);
  g.fillRoundedRect(-115, -64, 16, 9, 2);
  g.fillStyle(0x14141a, 1);
  g.fillCircle(-107, -59, 2);

  // Small footrest peg hanging below seat
  g.fillStyle(0x14141a, 1);
  g.fillRoundedRect(-92, -10, 14, 5, 2);
}

// 10. Shoe rack with three chunky cute runners side-by-side.
function drawShoeRack(g) {
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(0, 78, 700, 12);
  // Rack shelf
  g.fillStyle(0x3a2f24, 1);
  g.fillRoundedRect(-340, 38, 680, 18, 4);
  g.fillStyle(0x2a2218, 1);
  g.fillRect(-340, 52, 680, 4);
  // Three runners — cream upper with different accent pops
  drawCuteShoe(g, -210, 14, 0xfff5e6, 0xff66aa); // pink
  drawCuteShoe(g, 0, 14, 0xfff5e6, 0x4ecdc4);    // teal
  drawCuteShoe(g, 210, 14, 0xfff5e6, 0xff8a3d);  // orange
}

// Side-profile chunky runner: stacked sole, puffy upper, big toe box,
// tongue + heel pull, lace bow. Designed to read as cute, not technical.
function drawCuteShoe(g, ox, oy, upperColor, accent) {
  // Soft ground shadow
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(ox + 4, oy + 28, 160, 10);

  // OUTSOLE — rubber, slightly tan
  g.fillStyle(0xd0c8b6, 1);
  g.fillRoundedRect(ox - 75, oy + 12, 162, 14, 7);
  // Toe rocker bump
  g.fillCircle(ox + 82, oy + 16, 10);

  // MIDSOLE — chunky white foam
  g.fillStyle(0xfdfaf2, 1);
  g.fillRoundedRect(ox - 75, oy - 4, 162, 20, 12);
  // Toe spring (curls up)
  g.fillCircle(ox + 82, oy + 6, 14);
  // Heel block (taller wedge)
  g.fillRoundedRect(ox - 78, oy - 14, 40, 30, 12);

  // Midsole top sheen
  g.fillStyle(0xffffff, 0.8);
  g.fillRoundedRect(ox - 70, oy - 3, 152, 3, 2);
  // Midsole bottom shadow
  g.fillStyle(0x000000, 0.12);
  g.fillRoundedRect(ox - 70, oy + 13, 152, 3, 2);

  // Plate accent stripe through sole
  g.fillStyle(accent, 1);
  g.fillRoundedRect(ox - 75, oy + 8, 162, 5, 2);

  // UPPER — puffy rounded mound
  g.fillStyle(upperColor, 1);
  // Main body ellipse
  g.fillEllipse(ox - 6, oy - 18, 138, 38);
  // Toe dome (round, cute)
  g.fillCircle(ox + 58, oy - 8, 22);
  // Heel cup
  g.fillCircle(ox - 62, oy - 12, 18);

  // Upper bottom shadow band (where it meets sole)
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(ox - 6, oy - 2, 134, 5);
  // Upper top highlight
  g.fillStyle(0xffffff, 0.45);
  g.fillEllipse(ox - 10, oy - 30, 92, 6);

  // Tongue (poking up at ankle)
  g.fillStyle(upperColor, 1);
  g.fillRoundedRect(ox - 24, oy - 40, 28, 20, 9);
  // Tongue base shadow
  g.fillStyle(0x000000, 0.18);
  g.fillRoundedRect(ox - 24, oy - 24, 28, 4, 2);
  // Tongue logo tab
  g.fillStyle(accent, 1);
  g.fillRoundedRect(ox - 18, oy - 36, 16, 7, 2);

  // Curved side swoosh
  g.lineStyle(8, accent, 1);
  g.beginPath();
  g.moveTo(ox - 38, oy - 4);
  g.lineTo(ox + 18, oy - 18);
  g.lineTo(ox + 48, oy - 10);
  g.strokePath();
  // Swoosh inner sheen
  g.lineStyle(2.5, 0xffffff, 0.55);
  g.beginPath();
  g.moveTo(ox - 32, oy - 8);
  g.lineTo(ox + 14, oy - 18);
  g.strokePath();

  // Eyelets
  g.fillStyle(0x14141a, 0.9);
  for (let i = 0; i < 4; i++) g.fillCircle(ox - 8 + i * 9, oy - 30, 1.8);
  // Short lace runs between eyelets
  g.lineStyle(2.2, 0xfff8e0, 1);
  for (let i = 0; i < 3; i++) {
    g.lineBetween(ox - 8 + i * 9, oy - 30, ox + 1 + i * 9, oy - 28);
  }
  // Cute lace bow loops
  g.fillStyle(0xfff8e0, 1);
  g.fillCircle(ox - 11, oy - 40, 3.5);
  g.fillCircle(ox - 3, oy - 40, 3.5);
  g.fillStyle(accent, 0.6);
  g.fillCircle(ox - 11, oy - 40, 1.4);
  g.fillCircle(ox - 3, oy - 40, 1.4);

  // Heel pull tab
  g.fillStyle(accent, 1);
  g.fillRoundedRect(ox - 84, oy - 26, 10, 14, 3);
}
