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
import { RECESS_NOTES } from '../content/recessNotes.js';

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

    if (this.world.id === 18) {
      // Quilchena playground / Point Grey track — the "RECESS" hidden world.
      this.createPlaygroundExploration();
      music.fadeToTrack(this, music.resolveTrack(this, 'playgroundTheme', 'homeTheme'));
    } else {
      this.createGarageExploration();
      music.fadeToTrack(this, 'dadsGarage');
    }

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
      // Gentle "breathing" baseline so every object feels alive. The stroller
      // brings its own rocking motion instead (a scale + rock combo reads odd).
      if (item.id !== 'stroller') {
        this.tweens.add({
          targets: node,
          scale: { from: 1, to: 1.04 },
          duration: 1400 + Math.random() * 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
      // Distinctive idle animation for select objects (freezer lid opening,
      // the 3D printer printing, the laptop glowing, …). No-op for the rest.
      this.animateGarageItem(item.id, node);

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
        // Crossfade back to the host chapter's ambient (the map re-confirms it).
        const homeKey = this.world?.chapter === 2
          ? music.resolveTrack(this, 'innerSpaceHome', 'homeTheme')
          : 'homeTheme';
        music.fadeToTrack(this, homeKey);
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

    const { card, close } = createModal(this, {
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
      // Stay in the garage after finding the glasses — just dismiss the card.
      // The kid keeps exploring and leaves on their own via the Leave button.
      // Refresh the in-scene pet so it's wearing the freshly-equipped glasses.
      onClick: () => {
        this.refreshGaragePet();
        close();
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

    // "NEW +10 ✨" badge if this is a fresh claim — fades on tap.
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
      badge.add(this.add.text(0, 10, '+10 ✨', style('caption', {
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
        const fading = badge;
        badge = null;
        this.tweens.add({
          targets: fading,
          alpha: 0, scale: 0.6, duration: 350,
          onComplete: () => fading.destroy()
        });
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

    // Scale the type to the note length so long recess notes still fit the board
    // while short garage notes stay big and bold.
    const len = message ? message.length : 0;
    const fontSize = len > 190 ? 34 : len > 150 ? 38 : len > 110 ? 42 : len > 70 ? 48 : 52;
    card.add(this.add.text(0, 0, message, style('body', {
      fontSize: fontSize + 'px',
      fill: '#2a1f12',
      align: 'center',
      wordWrap: { width: 680 },
      fontStyle: 'italic',
      lineSpacing: Math.round(fontSize * 0.26)
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
    this._garagePetContainer = petContainer;
    this._garagePetSprite = drawCompanion(this, 0, 0, { scale: 1.1 });
    petContainer.add(this._garagePetSprite);

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

  // Redraw the in-scene garage pet so a cosmetic equipped mid-visit (e.g. Dad's
  // Glasses from the storage bins) shows up right away instead of next visit.
  // No-op when there's no starter pet (createGaragePet bailed).
  refreshGaragePet() {
    if (!this._garagePetContainer?.active || !this._garagePetSprite) return;
    this._garagePetSprite.destroy();
    this._garagePetSprite = drawCompanion(this, 0, 0, { scale: 1.1 });
    // addAt(…, 0) keeps the pet below the transparent tap hit-rect.
    this._garagePetContainer.addAt(this._garagePetSprite, 0);
  }

  // ----------------------------------------------------------
  // GARAGE IDLE ANIMATIONS — small bits of life on each object.
  // Routed by item id; objects with no entry just keep breathing.
  // ----------------------------------------------------------
  animateGarageItem(id, node) {
    switch (id) {
      case 'freezer':  return this._freezerLidOpen(node);
      case 'printer':  return this._printerPrinting(node);
      case 'laptop':   return this._laptopGlow(node);
      case 'stroller': return this._strollerRock(node);
      case 'ebike':    return this._ebikeCharging(node);
      case 'squat':    return this._squatRackReps(node);
    }
  }

  // Freezer: the lid cracks open every few seconds, a cold glow spills out and
  // a little frost mist drifts up, then it settles closed again.
  _freezerLidOpen(node) {
    // Cold interior glow — sits at the rim, hidden under the closed lid.
    const glow = this.add.graphics();
    glow.fillStyle(0xbfe9f5, 1);
    glow.fillRoundedRect(-104, -30, 208, 22, 7);
    glow.fillStyle(0xffffff, 0.7);
    glow.fillRect(-96, -26, 192, 6);
    glow.setAlpha(0);
    node.add(glow);

    // Lid as its own object so it can lift + tilt open.
    const lid = this.add.container(0, 0);
    const lg = this.add.graphics();
    drawFreezerLid(lg);
    lid.add(lg);
    node.add(lid);

    const close = () => {
      this.tweens.add({ targets: glow, alpha: 0, duration: 380, ease: 'Sine.easeIn' });
      this.tweens.add({
        targets: lid, y: 0, angle: 0, duration: 560, ease: 'Quad.easeIn',
        onComplete: () => this.time.delayedCall(3200 + Math.random() * 2600, open)
      });
    };
    const open = () => {
      if (!node.active) return;
      this.tweens.add({ targets: glow, alpha: 1, duration: 460, ease: 'Sine.easeOut' });
      this.tweens.add({
        targets: lid, y: -24, angle: -9, duration: 640, ease: 'Back.easeOut',
        onComplete: () => { this._freezerFrost(node); this.time.delayedCall(1300, close); }
      });
    };
    this.time.delayedCall(1400 + Math.random() * 2200, open);
  }

  // A few soft frost puffs rising out of the open freezer.
  _freezerFrost(node) {
    if (!node.active) return;
    for (let i = 0; i < 6; i++) {
      const puff = this.add.graphics();
      puff.fillStyle(0xeaf7fb, 0.85);
      puff.fillCircle(0, 0, 3 + Math.random() * 3);
      puff.x = (Math.random() - 0.5) * 130;
      puff.y = -20;
      node.add(puff);
      this.tweens.add({
        targets: puff,
        y: puff.y - 56 - Math.random() * 34,
        x: puff.x + (Math.random() - 0.5) * 44,
        alpha: 0,
        duration: 900 + Math.random() * 500,
        ease: 'Sine.easeOut',
        onComplete: () => puff.destroy()
      });
    }
  }

  // 3D printer: the print head sweeps along the gantry while a little toy
  // slowly prints up off the bed, then ejects and starts over.
  _printerPrinting(node) {
    const head = this.add.container(0, -44);
    const hg = this.add.graphics();
    drawPrinterHead(hg);
    head.add(hg);
    node.add(head);
    this.tweens.add({
      targets: head, x: { from: -44, to: 44 },
      duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Toy grows up from the build plate (base anchored at the bed, scaleY 0→1).
    const toy = this.add.container(0, 24);
    const tg = this.add.graphics();
    drawPrintedToy(tg);
    toy.add(tg);
    toy.scaleY = 0;
    node.add(toy);
    const grow = () => {
      if (!node.active) return;
      toy.scaleY = 0;
      toy.alpha = 1;
      this.tweens.add({
        targets: toy, scaleY: 1, duration: 5200, ease: 'Linear',
        onComplete: () => this.time.delayedCall(1400, () => {
          this.tweens.add({
            targets: toy, alpha: 0, duration: 420,
            onComplete: () => this.time.delayedCall(700, grow)
          });
        })
      });
    };
    grow();
  }

  // Laptop: the screen breathes a soft glow — Dad's game, still running.
  _laptopGlow(node) {
    const glow = this.add.graphics();
    glow.fillStyle(0x6fa8ff, 1);
    glow.fillRoundedRect(-90, -78, 180, 122, 3);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setAlpha(0.12);
    node.add(glow);
    this.tweens.add({
      targets: glow, alpha: { from: 0.10, to: 0.32 },
      duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  // Stroller: a gentle rock, like soothing a baby. (Pivots near the wheels.)
  _strollerRock(node) {
    this.tweens.add({
      targets: node, angle: { from: -2.4, to: 2.4 },
      duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  // Ebike: the battery LEDs sweep up like it's charging + the headlight twinkles.
  _ebikeCharging(node) {
    const leds = [];
    for (let i = 0; i < 4; i++) {
      const d = this.add.graphics();
      d.fillStyle(0x9dff6b, 1);
      d.fillCircle(-70 + i * 14, 19, 3.2);
      d.setAlpha(0.15);
      node.add(d);
      leds.push(d);
    }
    let lit = 0;
    this.time.addEvent({
      delay: 430, loop: true,
      callback: () => {
        leds.forEach((d, k) => this.tweens.add({
          targets: d, alpha: k <= lit ? 0.95 : 0.15, duration: 220
        }));
        lit = (lit + 1) % (leds.length + 1);
      }
    });

    const hl = this.add.graphics();
    hl.fillStyle(0xfff3a0, 1);
    hl.fillCircle(108, -10, 10);
    hl.setBlendMode(Phaser.BlendModes.ADD);
    hl.setAlpha(0.18);
    node.add(hl);
    this.tweens.add({
      targets: hl, alpha: { from: 0.16, to: 0.6 },
      duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  // Squat rack: the loaded barbell does slow, steady reps on the J-hooks.
  _squatRackReps(node) {
    const bar = this.add.container(0, 0);
    const bg = this.add.graphics();
    drawSquatBar(bg);
    bar.add(bg);
    node.add(bar);
    this.tweens.add({
      targets: bar, y: { from: 0, to: 16 },
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  // ============================================================
  // RECESS — Quilchena playground hidden inside "Inner Space".
  // A nostalgic real-world running track / playground, rendered
  // straight & cute. Same delightful trick as Dad's Garage.
  // ============================================================
  createPlaygroundExploration() {
    this.drawPlaygroundBackdrop();

    this.add.text(W / 2, 150, 'PLAYGROUND', style('display', {
      fontSize: '72px',
      fill: '#7ed957',
      stroke: '#0a2a12',
      strokeThickness: 6
    })).setOrigin(0.5).setDepth(5);

    // Companion pet standing on the woodchips, kept for the monkey-bar swing.
    this.createRecessPet();

    // Bubble copy lives inline — short, warm, kid-friendly.
    // Roomy 3-row layout across the woodchips; the running track is a separate
    // full-width band along the very bottom (added after this loop).
    const items = [
      { id: 'tower',   x: 250,  y: 900,  hitW: 320, hitH: 420, draw: drawPlayStructure, label: 'Play tower',
        bubble: "You can't catch me!" },
      { id: 'slide',   x: 470,  y: 980,  hitW: 270, hitH: 400, draw: drawWavySlide,     label: 'Big slide',
        bubble: 'Cheeeeoooh!' },
      { id: 'bars',    x: 840,  y: 920,  hitW: 360, hitH: 360, draw: drawMonkeyBars,    label: 'Monkey bars',
        bubble: 'Slow is smooth, smooth is fast.' },
      { id: 'wall',    x: 160,  y: 1330, hitW: 220, hitH: 280, draw: drawClimbingWall,  label: 'Climbing wall',
        bubble: 'Watch your step!' },
      { id: 'zipline', x: 490,  y: 1330, hitW: 280, hitH: 240, draw: drawZipLine,       label: 'Zip line',
        bubble: 'Yeeehawww!' },
      { id: 'tire',    x: 850,  y: 1330, hitW: 250, hitH: 380, draw: drawTireSwing,     label: 'Tire swing',
        bubble: 'Hold on tight!!' },
      { id: 'spinner', x: 230,  y: 1580, hitW: 170, hitH: 200, draw: drawSpinnerSeat,   label: 'Spinner',
        bubble: 'Dizzy!' }
    ];
    // (The soccer goal now lives on the turf field at the top, not the woodchips;
    //  the bottom row pairs the spinner with Dad's notes board.)

    for (const item of items) {
      const node = this.add.container(item.x, item.y).setDepth(8);
      const g = this.add.graphics();
      item.draw(g);
      node.add(g);
      // Stash each node so the spinner tap can rotate its own disc.
      this['_recessNode_' + item.id] = node;
      this.tweens.add({
        targets: node,
        scale: { from: 1, to: 1.03 },
        duration: 1500 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.add.text(item.x, item.y + item.hitH / 2 + 14, item.label, style('caption', {
        fontSize: '20px',
        fill: '#ffffff',
        stroke: '#1a3a18',
        strokeThickness: 3
      })).setOrigin(0.5).setDepth(8);

      const hit = this.add.rectangle(item.x, item.y, item.hitW, item.hitH, 0, 0)
        .setInteractive({ useHandCursor: true }).setDepth(9);

      hit.on('pointerdown', () => {
        audio.playClick?.();
        // The bars run their own unlock messaging; everyone else gets a bubble.
        if (item.id !== 'bars') this.showBubble(item.x, item.y, item.bubble);
        this.petInteract(item.id);
      });
    }

    // Dad's notes board on the woodchips — same daily mechanic as the garage
    // whiteboard (its own list + its own once-per-day stardust). Sits low enough
    // that it never overlaps the "Zip line" label in the row above.
    this.createRecessNoteBoard(560, 1592);

    // The running track spans the entire bottom of the screen (drawn in the
    // backdrop). One full-width hit zone lets the pet dash a lap.
    const trackTop = H - 178;
    this.add.text(W / 2, trackTop + 24, 'RUNNING TRACK', style('caption', {
      fontSize: '20px', fill: '#f4f8ff', stroke: '#173a63', strokeThickness: 3
    })).setOrigin(0.5).setDepth(9);
    const trackHit = this.add.rectangle(W / 2, (trackTop + H) / 2, W, H - trackTop, 0, 0)
      .setInteractive({ useHandCursor: true }).setDepth(9);
    trackHit.on('pointerdown', () => {
      audio.playClick?.();
      this.showBubble(W / 2, trackTop + 40, 'Super fast!');
      this.petRunTrack();
    });

    const leaveBtn = createButton(this, {
      x: W - 130, y: 100, label: 'Leave',
      width: 200, height: 80,
      color: 0x9a9aae,
      textOverrides: { fontSize: '24px', fill: '#ffffff' },
      onClick: () => {
        const homeKey = this.world?.chapter === 2
          ? music.resolveTrack(this, 'innerSpaceHome', 'homeTheme')
          : 'homeTheme';
        music.fadeToTrack(this, homeKey);
        this.scene.start('WorldMapScene');
      }
    });
    leaveBtn.setDepth(15);
  }

  drawPlaygroundBackdrop() {
    // Warm sky tone behind everything.
    this.cameras.main.setBackgroundColor('#bfe6ff');

    const bg = this.add.graphics().setDepth(0);

    // --- SKY GRADIENT (top → mid) ---
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const r = Math.round(0x9c + (0xdf - 0x9c) * t);
      const gg = Math.round(0xd8 + (0xf2 - 0xd8) * t);
      const b = Math.round(0xf6 + (0xff - 0xf6) * t);
      bg.fillStyle((r << 16) | (gg << 8) | b, 1);
      bg.fillRect(0, i * 28, W, 30);
    }
    // A couple of soft clouds.
    bg.fillStyle(0xffffff, 0.85);
    for (const [cx, cy, s] of [[220, 120, 1], [820, 180, 0.8], [560, 90, 0.6]]) {
      bg.fillEllipse(cx, cy, 130 * s, 46 * s);
      bg.fillEllipse(cx - 50 * s, cy + 8 * s, 80 * s, 36 * s);
      bg.fillEllipse(cx + 55 * s, cy + 10 * s, 90 * s, 38 * s);
    }

    // --- BACKGROUND BAND: school + conifers, all rooted on the turf horizon ---
    // drawConifer's trunk base sits at y + 28*scale; the turf rect (drawn after,
    // starting at y=470) must overlap each trunk foot so no tree floats — so we
    // aim every base a few px BELOW 470. The conifers flank the building (which
    // spans x≈260–860) on either side.
    drawConifer(bg, 70, 448, 1.0);    // trunk base ≈ 476 (into the turf)
    drawConifer(bg, 152, 454, 0.8);   // trunk base ≈ 476
    drawConifer(bg, 940, 451, 0.9);   // trunk base ≈ 476
    drawConifer(bg, 1016, 445, 1.1);  // trunk base ≈ 477
    // Cream Collegiate-Gothic Point Grey building with a corner spire tower.
    drawSchoolTowerBack(bg, 560, 300);

    // --- GREEN TURF FIELD with a soccer goal (≈ 470–632) ---
    bg.fillStyle(0x4faa46, 1);
    bg.fillRect(0, 470, W, 162);
    bg.fillStyle(0x57b94e, 0.6);
    bg.fillRect(0, 470, W, 56);
    bg.fillStyle(0x46a03e, 0.5);
    for (let sx = -40; sx < W; sx += 120) bg.fillRect(sx, 470, 56, 162);
    bg.lineStyle(4, 0xffffff, 0.45);
    bg.lineBetween(0, 556, W, 556);
    drawGoalBack(bg, 250, 556);
    // A soccer ball out on the field, in front of the goal.
    bg.fillStyle(0xffffff, 1); bg.fillCircle(392, 590, 11);
    bg.fillStyle(0x14142a, 1); bg.fillCircle(392, 590, 3.4);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; bg.fillCircle(392 + Math.cos(a) * 6.6, 590 + Math.sin(a) * 6.6, 2.2); }
    bg.lineStyle(1.5, 0x9aa0aa, 0.5); bg.strokeCircle(392, 590, 11);

    // Green chain-link fence between the field and the playground.
    drawFenceStrip(bg, 634, 24);

    // --- TAN WOODCHIP PLAY AREA (down to the running track) ---
    const chipTop = 662;
    const trackTop = H - 178;
    bg.fillStyle(0xc7a06a, 1);
    bg.fillRect(0, chipTop, W, trackTop - chipTop);
    bg.fillStyle(0xd8b67e, 0.5);
    bg.fillRect(0, chipTop, W, 150);
    bg.fillStyle(0x9c7a4c, 0.30);
    bg.fillRect(0, trackTop - 120, W, 120);
    for (let i = 0; i < 240; i++) {
      const cx = Math.random() * W;
      const cy = chipTop + 8 + Math.random() * (trackTop - chipTop - 16);
      const shade = Math.random();
      bg.fillStyle(shade < 0.5 ? 0xb38a52 : (shade < 0.8 ? 0xa97f48 : 0xddc294), 0.7);
      bg.fillRect(cx, cy, 5 + Math.random() * 7, 3);
    }
    // Railway-tie timber edge where the woodchips meet the track.
    bg.fillStyle(0x6e4a28, 1); bg.fillRect(0, trackTop - 14, W, 16);
    bg.fillStyle(0x855c34, 1); bg.fillRect(0, trackTop - 14, W, 5);
    bg.fillStyle(0x4a3018, 0.6);
    for (let px = 0; px < W; px += 150) bg.fillRect(px, trackTop - 14, 4, 16);

    // --- FULL-WIDTH BLUE RUNNING TRACK along the entire bottom ---
    drawRunningTrack(bg, trackTop);
  }

  // Companion pet on the woodchips; kept as `this._recessPet` for the swing.
  createRecessPet() {
    if (!companion.hasStarter()) return;
    this._recessPetHome = { x: 770, y: 1650 };
    const c = this.add.container(this._recessPetHome.x, this._recessPetHome.y).setDepth(11);
    this._recessPet = c;
    this._recessPetSprite = drawCompanion(this, 0, 0, { scale: 1.1 });
    c.add(this._recessPetSprite);

    this._recessPetBob = this.tweens.add({
      targets: c,
      y: this._recessPetHome.y - 8,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const hit = this.add.rectangle(0, 0, 130, 130, 0, 0)
      .setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => {
      audio.playPetChirp?.();
      const heart = this.add.text(c.x + 40, c.y - 40, '♥', style('display', {
        fontSize: '36px', fill: '#ff9ec7'
      })).setOrigin(0.5).setDepth(20);
      this.tweens.add({
        targets: heart, y: heart.y - 50, alpha: 0, duration: 700,
        onComplete: () => heart.destroy()
      });
    });
  }

  // Dad's notes board on the woodchips. Same daily mechanic as the garage
  // whiteboard, but its own list (RECESS_NOTES) and its own once-per-day claim:
  // one note per real day off a separate shuffled deck, +10 stardust the first
  // time it's tapped each day. A "NEW +10 ✨" badge marks a fresh claim.
  createRecessNoteBoard(x, y) {
    const { isNewDay, message } = progress.claimDailyDadNoteIfDue(RECESS_NOTES, 'recessNoteState');
    let awarded = false;
    if (isNewDay) {
      progress.economy.stardust = (progress.economy.stardust || 0) + 10;
      progress.save();
      awarded = true;
    }
    this._recessNoteMessage = message;

    const node = this.add.container(x, y).setDepth(8);
    const g = this.add.graphics();
    drawDadNotesBoard(g);
    node.add(g);
    this.tweens.add({
      targets: node, scale: { from: 1, to: 1.03 },
      duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Header + affordance lettered onto the parchment.
    node.add(this.add.text(0, -46, "DAD'S NOTES", style('caption', {
      fontSize: '22px', fill: '#2a1f12', fontStyle: '900'
    })).setOrigin(0.5));
    node.add(this.add.text(0, 8, 'Tap to read', style('caption', {
      fontSize: '18px', fill: '#6a5a44', fontStyle: 'italic'
    })).setOrigin(0.5));

    // Ground label, matching the other equipment.
    this.add.text(x, y + 132, "Dad's notes", style('caption', {
      fontSize: '20px', fill: '#ffffff', stroke: '#1a3a18', strokeThickness: 3
    })).setOrigin(0.5).setDepth(8);

    // NEW +10 ✨ badge on a fresh day; fades + stops bobbing on tap.
    let badge = null;
    let badgeTween = null;
    if (awarded) {
      badge = this.add.container(120, -72);
      const bg = this.add.graphics();
      bg.fillStyle(0xffd86b, 1); bg.fillRoundedRect(-50, -24, 100, 48, 9);
      bg.lineStyle(2, 0x2a1f12, 1); bg.strokeRoundedRect(-50, -24, 100, 48, 9);
      badge.add(bg);
      badge.add(this.add.text(0, -6, 'NEW', style('caption', { fontSize: '15px', fill: '#2a1f12', fontStyle: '900' })).setOrigin(0.5));
      badge.add(this.add.text(0, 11, '+10 ✨', style('caption', { fontSize: '13px', fill: '#2a1f12' })).setOrigin(0.5));
      node.add(badge);
      badgeTween = this.tweens.add({
        targets: badge, scale: { from: 1, to: 1.1 },
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    const hit = this.add.rectangle(x, y, 244, 230, 0, 0)
      .setInteractive({ useHandCursor: true }).setDepth(9);
    hit.on('pointerdown', () => {
      audio.playClick?.();
      if (badge) {
        const fading = badge; badge = null;
        badgeTween?.stop();
        this.tweens.add({ targets: fading, alpha: 0, scale: 0.6, duration: 350, onComplete: () => fading.destroy() });
      }
      this.showDailyNotePopup(this._recessNoteMessage);
    });
  }

  // ----- Pet interactions: the companion actually plays on each piece -----
  // One shared busy-guard so taps can't overlap mid-animation.
  _startPetAction() {
    if (this._petActive || !this._recessPet) return false;
    this._petActive = true;
    this._recessPetBob?.pause();
    this._recessPet.setScale(1);
    this._recessPet.angle = 0;
    return true;
  }

  _returnPetHome(onDone) {
    const pet = this._recessPet;
    const home = this._recessPetHome;
    this.tweens.add({
      targets: pet, x: home.x, y: home.y, angle: 0, duration: 440, ease: 'Quad.easeInOut',
      onComplete: () => {
        pet.angle = 0; pet.setScale(1);
        this._petActive = false;
        this._recessPetBob?.resume();
        onDone?.();
      }
    });
  }

  _petMoveTo(x, y, dur, cb, ease) {
    this.tweens.add({ targets: this._recessPet, x, y, duration: dur, ease: ease || 'Quad.easeInOut', onComplete: cb });
  }

  // Route an equipment tap to the matching pet activity (busy-guarded).
  petInteract(id) {
    if (!this._recessPet || this._petActive) return;
    switch (id) {
      case 'tower':   return this.petClimbTower();
      case 'slide':   return this.petSlide();
      case 'bars':    return this.handleMonkeyBars();
      case 'wall':    return this.petClimbWall();
      case 'zipline': return this.petZipLine();
      case 'tire':    return this.petTireSwing();
      case 'spinner': return this.petSpin();
    }
  }

  // Play tower (250,900): climb to the top deck, happy hop, climb down.
  petClimbTower() {
    if (!this._startPetAction()) return;
    const pet = this._recessPet;
    this._petMoveTo(262, 1120, 360, () => {
      this._petMoveTo(262, 778, 640, () => {
        this.tweens.add({ targets: pet, y: 752, duration: 220, yoyo: true, repeat: 1, ease: 'Sine.easeInOut',
          onComplete: () => this._returnPetHome() });
      }, 'Sine.easeInOut');
    });
  }

  // Big slide (470,980): climb the ladder, then ride the chute down.
  petSlide() {
    if (!this._startPetAction()) return;
    const pet = this._recessPet;
    this._petMoveTo(388, 1160, 320, () => {
      this._petMoveTo(402, 800, 520, () => {
        this.tweens.add({ targets: pet, x: 590, duration: 640, ease: 'Quad.easeIn',
          onUpdate: (tw) => { const p = tw.progress; pet.y = 805 + 318 * (p * p * (3 - 2 * p)); pet.angle = 12 * Math.sin(p * Math.PI); },
          onComplete: () => this._returnPetHome() });
      }, 'Sine.easeInOut');
    });
  }

  // Climbing wall (160,1330): scoot up the holds with a little side-to-side.
  petClimbWall() {
    if (!this._startPetAction()) return;
    const pet = this._recessPet;
    this._petMoveTo(160, 1478, 340, () => {
      this.tweens.add({ targets: pet, y: 1208, duration: 900, ease: 'Sine.easeInOut',
        onUpdate: (tw) => { pet.x = 160 + Math.sin(tw.progress * Math.PI * 5) * 12; },
        onComplete: () => this._returnPetHome() });
    });
  }

  // Zip line (490,1330): grab the handle and zoom along the rail.
  petZipLine() {
    if (!this._startPetAction()) return;
    const pet = this._recessPet;
    this._petMoveTo(380, 1300, 340, () => {
      this.tweens.add({ targets: pet, x: 604, duration: 950, ease: 'Sine.easeIn',
        onUpdate: (tw) => { const p = tw.progress; pet.y = 1300 + Math.sin(p * Math.PI) * 10; pet.angle = 6 * Math.sin(p * Math.PI * 3); },
        onComplete: () => this._returnPetHome() });
    });
  }

  // Tire swing (850,1330): hop in and swing back and forth.
  petTireSwing() {
    if (!this._startPetAction()) return;
    const pet = this._recessPet;
    this._petMoveTo(850, 1405, 360, () => {
      const drv = { p: 0 };
      this.tweens.add({ targets: drv, p: 1, duration: 1600, ease: 'Linear',
        onUpdate: () => { const s = Math.sin(drv.p * Math.PI * 4); pet.x = 850 + s * 80; pet.angle = s * 14; },
        onComplete: () => this._returnPetHome() });
    });
  }

  // Spinner (230,1580): stand on the seat and spin (the disc spins too).
  petSpin() {
    if (!this._startPetAction()) return;
    const pet = this._recessPet;
    const disc = this._recessNode_spinner;
    this._petMoveTo(230, 1542, 340, () => {
      if (disc) this.tweens.add({ targets: disc, angle: '+=720', duration: 900, ease: 'Cubic.easeOut' });
      this.tweens.add({ targets: pet, angle: '+=720', duration: 900, ease: 'Cubic.easeOut',
        onComplete: () => this._returnPetHome() });
    });
  }

  // Running track: a wide lap along the full-width band at the bottom.
  petRunTrack() {
    if (!this._startPetAction()) return;
    const pet = this._recessPet;
    const trackY = H - 84;
    const drv = { p: 0 };
    this.tweens.add({
      targets: drv, p: 1, duration: 1700, ease: 'Sine.easeInOut',
      onUpdate: () => {
        const a = drv.p * Math.PI * 2;
        pet.x = W / 2 + Math.cos(a - Math.PI / 2) * 400;
        pet.y = trackY + Math.sin(a - Math.PI / 2) * 26;
      },
      onComplete: () => this._returnPetHome()
    });
  }

  // Monkey bars (840,920) — the hidden gem. Pet swings across; first clear
  // pops the unlock, replays just say "Again!".
  handleMonkeyBars() {
    if (!this._startPetAction()) return;
    const firstTime = !progress.isHiddenWorldCleared(18);
    this._petMoveTo(700, 870, 360, () => {
      this.playMonkeyBarSwing(() => {
        this._returnPetHome(() => {
          if (firstTime) this.showRecessUnlock();
          else this.showBubble(840, 1110, 'Slow is smooth, smooth is fast.');
        });
      });
    });
  }

  // Hand-over-hand left→right along the bars (pet already at the start rung).
  playMonkeyBarSwing(onDone) {
    const pet = this._recessPet;
    const barY = 870, startX = 700, endX = 980, rungs = 6;
    pet.y = barY; pet.setScale(1);
    let i = 0;
    const stepX = (endX - startX) / rungs;
    const swingNext = () => {
      if (i >= rungs) { onDone?.(); return; }
      const nx = startX + stepX * (i + 1);
      this.tweens.add({
        targets: pet, x: nx, angle: { from: -8, to: 8 }, duration: 280, ease: 'Sine.easeInOut',
        onUpdate: (tw) => { pet.y = barY - Math.sin(tw.progress * Math.PI) * 26; },
        onComplete: () => { pet.angle = 0; i++; swingNext(); }
      });
    };
    swingNext();
  }

  // Found-it celebration — models on showUnlockCelebration.
  showRecessUnlock() {
    progress.clearHiddenWorld(18);
    cosmetics.addAndEquip('acc_dried_mango');
    audio.playMatch?.();

    const { card, close } = createModal(this, {
      width: 880, height: 660,
      accentColor: 0x7ed957,
      showCloseHint: false
    });
    card.add(this.add.text(0, -220, 'YOU FOUND IT!', style('display', {
      fontSize: '60px',
      fill: '#7ed957',
      stroke: '#0a2a12',
      strokeThickness: 5
    })).setOrigin(0.5));
    card.add(this.add.text(0, -130, 'You crossed the monkey bars!', style('caption', {
      fontSize: '24px',
      fill: '#cfcfe0',
      align: 'center'
    })).setOrigin(0.5));

    // Pet preview holding the freshly-equipped dried mango.
    const previewPet = drawCompanion(this, 0, 20, { scale: 1.4 });
    card.add(previewPet);

    card.add(this.add.text(0, 150, 'Unlocked: Dried Mango', style('subhead', {
      fontSize: '32px',
      fill: '#7ed957',
      align: 'center'
    })).setOrigin(0.5));

    card.add(createButton(this, {
      x: 0, y: 240, width: 320, height: 92,
      label: 'Awesome',
      color: 0x7ed957,
      textOverrides: { fontSize: '28px', fill: '#0a2a12', fontStyle: '900' },
      onClick: () => {
        this.refreshRecessPet();
        close();
      }
    }));
    return card;
  }

  // Redraw the in-scene pet so the just-equipped medal shows up immediately.
  refreshRecessPet() {
    if (!this._recessPet?.active || !this._recessPetSprite) return;
    this._recessPetSprite.destroy();
    this._recessPetSprite = drawCompanion(this, 0, 0, { scale: 1.1 });
    this._recessPet.addAt(this._recessPetSprite, 0);
  }


  // Woodchips tap → a few chips scatter up and settle back.
  scatterWoodchips(cx, cy) {
    for (let i = 0; i < 7; i++) {
      const chip = this.add.graphics().setDepth(10);
      const tone = Math.random() < 0.5 ? 0xb38a52 : 0xddc294;
      chip.fillStyle(tone, 1);
      chip.fillRect(-5, -2, 10, 4);
      chip.setPosition(cx + (Math.random() - 0.5) * 40, cy);
      chip.rotation = Math.random() * Math.PI;
      const dx = (Math.random() - 0.5) * 120;
      const up = 40 + Math.random() * 50;
      this.tweens.add({
        targets: chip,
        x: chip.x + dx,
        duration: 520,
        ease: 'Quad.easeOut',
        onUpdate: (tw) => {
          const p = tw.progress;
          chip.y = cy - Math.sin(p * Math.PI) * up;
          chip.rotation += 0.12;
        },
        onComplete: () => chip.destroy()
      });
    }
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
// RECESS — playground/track draw helpers (module-level, like the garage's).
// Backdrop helpers draw on the shared `bg` graphics in absolute coords;
// item helpers draw a fresh Graphics `g` centered at (0,0).
// ============================================================

// Evergreen conifer (background band). Brown trunk + 3 stacked green tiers.
function drawConifer(bg, x, y, s = 1) {
  const w = 56 * s;
  bg.fillStyle(0x6b4a2a, 1);
  bg.fillRect(x - 5 * s, y, 10 * s, 28 * s);
  bg.fillStyle(0x2f6e36, 1);
  bg.fillTriangle(x, y + 4 * s, x - w / 2, y + 4 * s, x, y - 40 * s);
  bg.fillTriangle(x, y + 4 * s, x + w / 2, y + 4 * s, x, y - 40 * s);
  bg.fillTriangle(x, y - 16 * s, x - w * 0.42, y - 16 * s, x, y - 64 * s);
  bg.fillTriangle(x, y - 16 * s, x + w * 0.42, y - 16 * s, x, y - 64 * s);
  bg.fillStyle(0x3a8044, 1);
  bg.fillTriangle(x, y - 34 * s, x - w * 0.3, y - 34 * s, x, y - 80 * s);
  bg.fillTriangle(x, y - 34 * s, x + w * 0.3, y - 34 * s, x, y - 80 * s);
}

// Warm Art-Deco / Collegiate school (Point Grey Secondary feel): warm buff stone
// with a cornice + base course, tall PAIRED windows in bays (not a factory grid),
// a projecting central entrance pavilion with a stepped Deco crown, a CLOCK, a
// grand doorway, and a FLAGPOLE + FLAG on top — the unmistakable "school" signals.
// No spire/cross (not a church), no smokestack fins (not a factory).
function drawSchoolTowerBack(bg, x, y) {
  const stone = 0xe3dac6, stoneShade = 0xd0c6ae, stoneDark = 0xbcb094, cornice = 0xf1ecdd;
  const glass = 0x6f93a8, glassDark = 0x46606e, glassHi = 0xbcd2dc, litGlass = 0xf6d98a;
  const door = 0x5b4632, surround = 0xece4d2, pole = 0x8a8f96, flagRed = 0xd14b3f;

  const base = y + 182;                                  // meets the turf line
  const bx0 = x - 322, bx1 = x + 322, roof = y + 48;     // wide main block
  const cx0 = x - 88, cx1 = x + 88, cRoof = y - 6;       // central pavilion (taller)

  // Rectangular window, warm-lit when `on`.
  const win = (cx, top, w, h, on) => {
    bg.fillStyle(glassDark, 1); bg.fillRect(cx - w / 2 - 1, top - 1, w + 2, h + 2);
    bg.fillStyle(on ? litGlass : glass, 1); bg.fillRect(cx - w / 2, top, w, h);
    bg.fillStyle(on ? 0xfff0c0 : glassHi, on ? 0.5 : 0.45); bg.fillRect(cx - w / 2 + 2, top + 2, 4, h - 4);
    bg.lineStyle(1.3, glassDark, 0.5); bg.lineBetween(cx, top, cx, top + h);
  };

  // ---- main block: warm stone, cornice, base course, raised end parapets ----
  bg.fillStyle(stone, 1); bg.fillRect(bx0, roof, bx1 - bx0, base - roof);
  bg.fillStyle(stoneDark, 1); bg.fillRect(bx0, base - 16, bx1 - bx0, 16);          // base course
  bg.fillStyle(cornice, 1); bg.fillRect(bx0 - 5, roof - 8, (bx1 - bx0) + 10, 8);   // cornice cap
  bg.fillStyle(stoneShade, 1); bg.fillRect(bx0, roof, bx1 - bx0, 3);               // under-cornice shadow
  bg.fillStyle(cornice, 1); bg.fillRect(bx0 - 2, roof - 16, 64, 10); bg.fillRect(bx1 - 62, roof - 16, 64, 10);
  bg.fillStyle(stone, 1);   bg.fillRect(bx0 + 2, roof - 8, 56, 8);  bg.fillRect(bx1 - 58, roof - 8, 56, 8);

  // ---- wing windows: tall pairs in bays, divided by slim pilasters ----
  const rows = [roof + 20, roof + 70];
  for (const [zs, ze] of [[bx0 + 14, cx0 - 14], [cx1 + 14, bx1 - 14]]) {
    const bays = 3, bw = (ze - zs) / bays;
    for (let b = 0; b <= bays; b++) { bg.fillStyle(stoneShade, 1); bg.fillRect(zs + bw * b - 3, roof, 6, (base - roof) - 16); }
    for (let b = 0; b < bays; b++) {
      const c = zs + bw * (b + 0.5);
      for (let r = 0; r < rows.length; r++) {
        const isLit = (b === 1 && r === 1);
        win(c - 13, rows[r], 18, 38, isLit);
        win(c + 13, rows[r], 18, 38, false);
      }
    }
  }

  // ---- central pavilion: projects + rises, with a stepped Deco crown ----
  bg.fillStyle(stone, 1);     bg.fillRect(cx0, cRoof, cx1 - cx0, base - cRoof);
  bg.fillStyle(0xeee6d4, 1);  bg.fillRect(cx0, cRoof, 6, base - cRoof);            // lit left edge
  bg.fillStyle(stoneShade, 1); bg.fillRect(cx1 - 6, cRoof, 6, base - cRoof);       // shaded right edge
  // stepped Art-Deco crown (flat steps — not a spire, not fins)
  bg.fillStyle(cornice, 1); bg.fillRect(cx0 + 6, cRoof - 8, (cx1 - cx0) - 12, 10);
  bg.fillStyle(stone, 1);   bg.fillRect(x - 50, cRoof - 18, 100, 12); bg.fillStyle(cornice, 1); bg.fillRect(x - 50, cRoof - 18, 100, 4);
  bg.fillStyle(stone, 1);   bg.fillRect(x - 26, cRoof - 26, 52, 10);  bg.fillStyle(cornice, 1); bg.fillRect(x - 26, cRoof - 26, 52, 4);
  // flagpole + flag (the clearest "school", never a factory)
  bg.fillStyle(pole, 1); bg.fillRect(x - 1.5, cRoof - 70, 3, 48);
  bg.fillStyle(flagRed, 1); bg.fillRect(x + 1.5, cRoof - 70, 34, 20);
  bg.fillStyle(stone, 1); bg.fillTriangle(x + 35, cRoof - 70, x + 35, cRoof - 50, x + 24, cRoof - 60); // swallowtail notch
  // clock on the pavilion face
  bg.fillStyle(0xf6f1e6, 1); bg.fillCircle(x, cRoof + 30, 17);
  bg.lineStyle(3, stoneDark, 1); bg.strokeCircle(x, cRoof + 30, 17);
  bg.lineStyle(2.5, glassDark, 1); bg.lineBetween(x, cRoof + 30, x, cRoof + 20); bg.lineBetween(x, cRoof + 30, x + 9, cRoof + 33);
  // three tall dignified windows
  for (const sx of [x - 46, x, x + 46]) win(sx, cRoof + 58, 22, 74, false);

  // ---- grand central entrance ----
  const dW = 70, dTop = base - 50;
  bg.fillStyle(surround, 1); bg.fillRect(x - dW / 2 - 7, dTop - 10, dW + 14, (base - 16) - (dTop - 10));   // stepped surround
  bg.fillStyle(stoneShade, 1); bg.fillRect(x - dW / 2 - 7, dTop - 10, dW + 14, 4);
  bg.fillStyle(door, 1); bg.fillRect(x - dW / 2, dTop, dW, (base - 16) - dTop);
  bg.fillStyle(0x4a3a2a, 1); bg.fillRect(x - 2, dTop, 4, (base - 16) - dTop);                              // double-door split
  bg.fillStyle(glassDark, 1); bg.fillRect(x - dW / 2 + 6, dTop + 5, dW - 12, 9);                           // transom
}

// Small white soccer goal sitting on the turf (background).
function drawGoalBack(bg, x, y) {
  bg.lineStyle(5, 0xffffff, 0.95);
  bg.strokeRect(x - 60, y - 56, 120, 56);
  bg.lineStyle(1.5, 0xffffff, 0.5);
  for (let gx = x - 54; gx < x + 60; gx += 14) bg.lineBetween(gx, y - 50, gx, y);
  for (let gy = y - 50; gy < y; gy += 12) bg.lineBetween(x - 56, gy, x + 56, gy);
}

// Green chain-link fence strip across the canvas at height `y`, thickness `h`.
function drawFenceStrip(bg, y, h) {
  bg.fillStyle(0x3a6b4a, 0.9);
  bg.fillRect(0, y, W, 4);
  bg.fillRect(0, y + h - 4, W, 4);
  bg.lineStyle(1.2, 0x6fa080, 0.5);
  for (let mx = -h; mx < W; mx += 16) {
    bg.lineBetween(mx, y, mx + h, y + h);
    bg.lineBetween(mx + h, y, mx, y + h);
  }
  bg.fillStyle(0x2f5a3e, 0.9);
  for (let px = 40; px < W; px += 200) bg.fillRect(px, y - 6, 6, h + 10);
}

// Composite play tower — red posts, decks, green peaked roof, yellow panel.
function drawPlayStructure(g) {
  g.fillStyle(0x000000, 0.18); g.fillEllipse(0, 200, 240, 30);
  g.fillStyle(0xd6342b, 1);
  for (const px of [-110, -40, 40, 110]) g.fillRect(px - 7, -150, 14, 350);
  g.fillStyle(0x2f6ea0, 1); g.fillRoundedRect(-120, 20, 240, 26, 6);
  g.fillStyle(0x3a8044, 1); g.fillRoundedRect(-120, -60, 240, 24, 6);
  g.fillStyle(0x3aa0c0, 1); g.fillRect(-120, -30, 8, 50); g.fillRect(112, -30, 8, 50);
  g.fillStyle(0x2f8a4a, 1); g.fillTriangle(0, -210, -90, -150, 90, -150);
  g.fillStyle(0x37a257, 1); g.fillTriangle(0, -196, -70, -152, 70, -152);
  g.fillStyle(0xf2c43a, 1); g.fillRoundedRect(-30, 70, 60, 84, 8);
  g.fillStyle(0x2f6ea0, 1); for (const hx of [-16, 0, 16]) g.fillCircle(hx, 112, 6);
}

// A nice, thick playground slide — red ladder/tower on the left, a smooth wide
// blue chute sweeping down to the right with raised side rails + a run-out lip.
function drawWavySlide(g) {
  g.fillStyle(0x000000, 0.16); g.fillEllipse(30, 188, 210, 26);
  // ladder / tower posts + rungs
  g.fillStyle(0xd6342b, 1);
  g.fillRect(-118, -176, 14, 366);
  g.fillRect(-78, -176, 14, 366);
  g.fillStyle(0xe85a52, 1);
  for (let ry = -150; ry < 170; ry += 40) g.fillRect(-118, ry, 54, 9);
  // top platform
  g.fillStyle(0x2f6ea0, 1); g.fillRoundedRect(-126, -198, 96, 22, 5);

  // smooth thick chute: parametric centerline → offset upper/lower edges
  const N = 26, half = 30;
  const cx = (t) => -70 + 168 * t;
  const cy = (t) => -176 + 330 * (t * t * (3 - 2 * t));      // smoothstep down
  const ang = (t) => Math.atan2(
    cy(Math.min(1, t + 0.001)) - cy(Math.max(0, t - 0.001)),
    cx(Math.min(1, t + 0.001)) - cx(Math.max(0, t - 0.001)));
  const edge = (off) => {
    const pts = [];
    for (let i = 0; i <= N; i++) { const t = i / N, a = ang(t); pts.push([cx(t) + Math.sin(a) * off, cy(t) - Math.cos(a) * off]); }
    return pts;
  };
  const upper = edge(half), lower = edge(-half), inner = edge(half * 0.4);
  const fillBetween = (a, b, color) => {
    g.fillStyle(color, 1);
    g.beginPath(); g.moveTo(a[0][0], a[0][1]);
    for (const p of a) g.lineTo(p[0], p[1]);
    for (let i = b.length - 1; i >= 0; i--) g.lineTo(b[i][0], b[i][1]);
    g.closePath(); g.fillPath();
  };
  fillBetween(upper, lower, 0x2f78c8);     // bed
  fillBetween(upper, inner, 0x6fb3ef);     // bright top surface
  // raised side rails
  g.lineStyle(8, 0x1f5a99, 1);
  g.beginPath(); g.moveTo(upper[0][0], upper[0][1]); for (const p of upper) g.lineTo(p[0], p[1]); g.strokePath();
  g.beginPath(); g.moveTo(lower[0][0], lower[0][1]); for (const p of lower) g.lineTo(p[0], p[1]); g.strokePath();
  // run-out lip
  g.fillStyle(0x2f6ea0, 1); g.fillRoundedRect(70, 150, 64, 16, 6);
}

// Tire swing — red A-frame with a black tire on chains (hole shows woodchips).
function drawTireSwing(g) {
  g.fillStyle(0x000000, 0.16); g.fillEllipse(0, 182, 150, 24);
  g.lineStyle(14, 0xd6342b, 1);
  g.lineBetween(-104, 176, -46, -148);     // splayed legs
  g.lineBetween(104, 176, 46, -148);
  g.lineStyle(15, 0xc02d24, 1);
  g.lineBetween(-58, -150, 58, -150);       // top bar
  g.lineStyle(4, 0x8a8a96, 1);              // chains
  g.lineBetween(-20, -146, -20, 34);
  g.lineBetween(20, -146, 20, 34);
  g.lineBetween(0, -146, 0, 30);
  g.fillStyle(0x17171c, 1); g.fillCircle(0, 82, 56);       // tire
  g.fillStyle(0xc7a06a, 1); g.fillCircle(0, 82, 28);       // hole → woodchips
  g.fillStyle(0x0d0d11, 1);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillCircle(Math.cos(a) * 47, 82 + Math.sin(a) * 47, 4.5); }
  g.lineStyle(3, 0x39393f, 1); g.strokeCircle(0, 82, 56); g.strokeCircle(0, 82, 28);
  g.fillStyle(0xffffff, 0.12); g.fillEllipse(-18, 64, 26, 12);
}

// Full-width blue running track band along the bottom (drawn on the backdrop).
function drawRunningTrack(bg, top) {
  const h = H - top;
  bg.fillStyle(0x2f78c8, 1); bg.fillRect(0, top, W, h);
  bg.fillStyle(0x3a86d8, 1); bg.fillRect(0, top, W, 24);
  bg.fillStyle(0x2769b0, 0.5); bg.fillRect(0, H - 38, W, 38);
  // lane lines
  bg.lineStyle(5, 0xf4f8ff, 0.9);
  for (let i = 1; i < 4; i++) bg.lineBetween(0, top + h * i / 4, W, top + h * i / 4);
  bg.lineStyle(6, 0xf4f8ff, 0.95); bg.lineBetween(0, top + 7, W, top + 7);
  // scattered autumn leaves
  for (const [lx, ly, lc] of [[260, top + 40, 0xd9772f], [620, top + 110, 0xc94f2a], [900, top + 60, 0xe0a23a], [990, top + 130, 0xd9772f], [380, top + 140, 0xe0a23a]]) {
    bg.fillStyle(lc, 0.9); bg.fillEllipse(lx, ly, 13, 8);
  }
}

// Yellow + blue wavy climbing wall with colorful holds, red frame posts.
function drawClimbingWall(g) {
  g.fillStyle(0x000000, 0.16); g.fillEllipse(0, 142, 150, 22);
  g.fillStyle(0xd6342b, 1); g.fillRect(-92, -130, 12, 272); g.fillRect(80, -130, 12, 272);
  g.fillStyle(0xf2c43a, 1); g.fillRoundedRect(-78, -120, 78, 250, 10);
  g.fillStyle(0x2f78c8, 1); g.fillRoundedRect(0, -120, 78, 250, 10);
  const holds = [[-50, -80, 0xff5b6e], [-20, -20, 0x39b54a], [-55, 40, 0x6a4ec0], [-25, 100, 0xff8b3d],
    [30, -70, 0xf2c43a], [55, -10, 0xff5b6e], [20, 60, 0xffffff], [50, 110, 0x39b54a]];
  for (const [hx, hy, hc] of holds) { g.fillStyle(hc, 1); g.fillCircle(hx, hy, 9); g.fillStyle(0xffffff, 0.5); g.fillCircle(hx - 2, hy - 2, 3); }
}

// Zip line / track ride — an overhead rail with a rolling trolley + a handle
// the kids grab and slide across.
function drawZipLine(g) {
  g.fillStyle(0x000000, 0.16); g.fillEllipse(0, 110, 220, 22);
  // two red end posts (right slightly taller — the cable rides downhill)
  g.fillStyle(0xd6342b, 1); g.fillRect(-128, -96, 14, 206); g.fillRect(114, -110, 14, 220);
  g.fillStyle(0xc02d24, 1); g.fillRect(-128, -96, 14, 30); g.fillRect(114, -110, 14, 30);
  // top rail / cable
  g.lineStyle(7, 0x7a828c, 1); g.lineBetween(-122, -86, 122, -100);
  g.lineStyle(2, 0xb6bcc4, 1); g.lineBetween(-122, -89, 122, -103);
  // trolley on the rail
  g.fillStyle(0x3a3f47, 1); g.fillRoundedRect(-28, -102, 56, 20, 5);
  g.fillStyle(0x9aa0aa, 1); g.fillCircle(-15, -84, 6); g.fillCircle(15, -84, 6);
  // ropes down to a grip handle
  g.lineStyle(5, 0x2f6ea0, 1); g.lineBetween(-13, -82, -16, 18); g.lineBetween(13, -82, 16, 18);
  // yellow grip bar
  g.fillStyle(0xf2c43a, 1); g.fillRoundedRect(-30, 14, 60, 18, 9);
  g.lineStyle(3, 0xd99a1f, 1); g.strokeRoundedRect(-30, 14, 60, 18, 9);
}

// Blue disc spinner-seat on a red post.
function drawSpinnerSeat(g) {
  g.fillStyle(0x000000, 0.16); g.fillEllipse(0, 95, 90, 18);
  g.fillStyle(0xd6342b, 1); g.fillRect(-8, -10, 16, 105);
  g.fillStyle(0x1f5a99, 1); g.fillEllipse(0, -10, 120, 20);
  g.fillStyle(0x2f78c8, 1); g.fillEllipse(0, -22, 120, 40);
  g.fillStyle(0x3a86d8, 1); g.fillEllipse(0, -28, 110, 30);
  g.fillStyle(0xffffff, 0.4); g.fillEllipse(-24, -32, 40, 12);
}

// Dad's notes board — a parchment notice board on two wooden posts. Headers and
// the "Tap to read" affordance are added as text by createRecessNoteBoard.
function drawDadNotesBoard(g) {
  // ground shadow
  g.fillStyle(0x000000, 0.16); g.fillEllipse(0, 124, 150, 22);
  // posts
  g.fillStyle(0x6e4a28, 1); g.fillRect(-70, 38, 15, 86); g.fillRect(55, 38, 15, 86);
  g.fillStyle(0x855c34, 1); g.fillRect(-70, 38, 5, 86); g.fillRect(55, 38, 5, 86);
  // dark wood frame
  g.fillStyle(0x5e3d22, 1); g.fillRoundedRect(-118, -96, 236, 146, 12);
  g.fillStyle(0x7a5230, 1); g.fillRoundedRect(-118, -96, 236, 9, 6);
  // parchment surface
  g.fillStyle(0xf5ecd6, 1); g.fillRoundedRect(-104, -82, 208, 118, 6);
  g.fillStyle(0xe9dcbd, 1); g.fillRect(-104, 22, 208, 14);
  // divider under the header
  g.fillStyle(0xcdbf9a, 1); g.fillRect(-84, -26, 168, 3);
  // two red thumbtacks
  for (const tx of [-84, 84]) {
    g.fillStyle(0xc23a3a, 1); g.fillCircle(tx, -68, 6);
    g.fillStyle(0xff9a9a, 0.85); g.fillCircle(tx - 2, -70, 2.2);
  }
}

// Monkey bars — the hidden gem. Horizontal overhead ladder on tall red posts.
function drawMonkeyBars(g) {
  g.fillStyle(0x000000, 0.18); g.fillEllipse(0, 172, 300, 28);
  g.fillStyle(0xd6342b, 1); g.fillRect(-160, -120, 16, 290); g.fillRect(144, -120, 16, 290);
  g.fillStyle(0xd6342b, 1); g.fillRect(-160, -120, 320, 14); g.fillRect(-160, -98, 320, 10);
  g.fillStyle(0xe85a52, 1);
  for (let rx = -140; rx <= 140; rx += 40) g.fillRect(rx - 5, -118, 10, 30);
  g.fillStyle(0xfff3b8, 0.9); g.fillCircle(0, -150, 4); g.fillCircle(70, -140, 3); g.fillCircle(-80, -138, 3);
}

// Small map icon for the "King Coli" germ boss — a round green germ head with
// a tiny gold crown and a smug face. Modelled on drawGarageNode's structure.
export function drawKingColiNode(scene, x, y, R) {
  const c = scene.add.container(x, y);

  // Soft sickly-green halo.
  const halo = scene.add.graphics();
  halo.fillStyle(0x8ddf5a, 0.18);
  halo.fillCircle(0, 0, R + 14);
  c.add(halo);

  const g = scene.add.graphics();
  // Germ body — round green blob with a few pseudopod bumps around the rim.
  g.fillStyle(0x5fae3a, 1);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    g.fillCircle(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9, R * 0.22);
  }
  g.fillStyle(0x6cc043, 1);
  g.fillCircle(0, 0, R * 0.92);
  // Shading crescent lower-right.
  g.fillStyle(0x3f8a28, 0.4);
  g.fillCircle(R * 0.2, R * 0.22, R * 0.85);
  // Belly highlight.
  g.fillStyle(0xa6e87a, 0.5);
  g.fillEllipse(-R * 0.3, -R * 0.32, R * 0.6, R * 0.34);
  // Little flagella tails.
  g.lineStyle(3, 0x4f9630, 1);
  g.lineBetween(-R * 0.7, R * 0.6, -R * 1.15, R * 0.95);
  g.lineBetween(R * 0.6, R * 0.7, R * 1.05, R * 1.05);
  c.add(g);

  // Smug face.
  const face = scene.add.graphics();
  face.fillStyle(0x0c2a08, 1);
  // Half-lidded eyes.
  face.fillEllipse(-R * 0.3, -R * 0.05, R * 0.22, R * 0.16);
  face.fillEllipse(R * 0.3, -R * 0.05, R * 0.22, R * 0.16);
  face.fillStyle(0x0c2a08, 1);
  face.lineStyle(3, 0x0c2a08, 1);
  // Smirk.
  face.beginPath();
  face.moveTo(-R * 0.28, R * 0.32);
  face.lineTo(R * 0.05, R * 0.42);
  face.lineTo(R * 0.34, R * 0.24);
  face.strokePath();
  c.add(face);

  // Tiny gold crown.
  const crown = scene.add.graphics();
  crown.fillStyle(0xffd24a, 1);
  const cw = R * 0.9, cy = -R * 0.78, ch = R * 0.42;
  crown.fillRect(-cw / 2, cy, cw, ch * 0.55);
  // Three points.
  crown.fillTriangle(-cw / 2, cy, -cw / 2 + cw / 3, cy, -cw / 2 + cw / 6, cy - ch * 0.7);
  crown.fillTriangle(-cw / 6, cy, cw / 6, cy, 0, cy - ch * 0.85);
  crown.fillTriangle(cw / 2 - cw / 3, cy, cw / 2, cy, cw / 2 - cw / 6, cy - ch * 0.7);
  // Jewels.
  crown.fillStyle(0xff5b6e, 1);
  crown.fillCircle(0, cy + ch * 0.28, R * 0.09);
  crown.fillStyle(0x4a90d9, 1);
  crown.fillCircle(-cw * 0.28, cy + ch * 0.28, R * 0.07);
  crown.fillCircle(cw * 0.28, cy + ch * 0.28, R * 0.07);
  // Crown shine.
  crown.fillStyle(0xfff0b0, 0.7);
  crown.fillRect(-cw / 2 + 2, cy + 2, cw - 4, 2);
  c.add(crown);

  return c;
}

// Small map icon evoking the playground / track — a blue running-track loop
// with a green infield and a tiny red slide. Returns the container.
export function drawPlaygroundNode(scene, x, y, R) {
  const c = scene.add.container(x, y);
  const cleared = progress.isHiddenWorldCleared(18);

  // Warm halo — brighter once "RECESS" has been found.
  const halo = scene.add.graphics();
  halo.fillStyle(0x7ed957, cleared ? 0.26 : 0.14);
  halo.fillCircle(0, 0, R + (cleared ? 16 : 12));
  c.add(halo);

  const g = scene.add.graphics();
  // Blue oval track.
  g.fillStyle(0x2f78c8, 1);
  g.fillEllipse(0, R * 0.12, R * 1.9, R * 1.4);
  // Green infield turf.
  g.fillStyle(0x57b94e, 1);
  g.fillEllipse(0, R * 0.12, R * 1.1, R * 0.7);
  // White lane line on the track.
  g.lineStyle(2, 0xf4f8ff, 0.9);
  g.strokeEllipse(0, R * 0.12, R * 1.5, R * 1.05);
  c.add(g);

  // A tiny red slide rising from the infield.
  const slide = scene.add.graphics();
  // Ladder posts.
  slide.fillStyle(0xe23b3b, 1);
  slide.fillRect(R * 0.45, -R * 0.55, R * 0.12, R * 0.85);
  slide.fillRect(R * 0.7, -R * 0.55, R * 0.12, R * 0.85);
  // Rungs.
  slide.fillStyle(0xc62f2f, 1);
  for (let i = 0; i < 3; i++) slide.fillRect(R * 0.45, -R * 0.4 + i * R * 0.22, R * 0.37, R * 0.06);
  // Blue slide chute curving down-left.
  slide.fillStyle(0x3a86d8, 1);
  slide.beginPath();
  slide.moveTo(R * 0.5, -R * 0.5);
  slide.lineTo(R * 0.62, -R * 0.5);
  slide.lineTo(-R * 0.5, R * 0.35);
  slide.lineTo(-R * 0.66, R * 0.22);
  slide.closePath();
  slide.fillPath();
  // Slide lip highlight.
  slide.fillStyle(0x9fd0ff, 0.8);
  slide.fillRect(-R * 0.66, R * 0.18, R * 0.18, R * 0.06);
  c.add(slide);

  // Cleared: small green check badge at the corner.
  if (cleared) {
    const badge = scene.add.graphics();
    badge.fillStyle(0x0a2a12, 1);
    badge.fillCircle(R * 0.78, -R * 0.78, R * 0.3);
    badge.lineStyle(3, 0x7ed957, 1);
    badge.beginPath();
    badge.moveTo(R * 0.78 - R * 0.14, -R * 0.78);
    badge.lineTo(R * 0.78 - R * 0.03, -R * 0.67);
    badge.lineTo(R * 0.78 + R * 0.16, -R * 0.92);
    badge.strokePath();
    c.add(badge);
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
  // NOTE: the lid is drawn separately (drawFreezerLid) so _freezerLidOpen can
  // lift it; the cold glow in the gap is built by the animator too.
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

// Freezer lid — its own piece so _freezerLidOpen can lift + tilt it open.
function drawFreezerLid(g) {
  // Lid slab
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
  // NOTE: the loaded barbell is drawn separately (drawSquatBar) so
  // _squatRackReps can rep it up and down on the J-hooks.
  // Safety pin
  g.fillStyle(0x222230, 1);
  g.fillRect(-60, 60, 120, 6);
}

// Loaded barbell for the squat rack — its own piece so it can do slow reps.
function drawSquatBar(g) {
  // Bar
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
  // NOTE: the print head + the toy on the bed are drawn separately
  // (drawPrinterHead / drawPrintedToy) so _printerPrinting can sweep + grow them.
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

// Print head block + nozzle, centered on its own origin so it can sweep the
// gantry. (Origin placed at gantry height by _printerPrinting.)
function drawPrinterHead(g) {
  g.fillStyle(0xfbbf24, 1);
  g.fillRoundedRect(-20, -14, 40, 28, 3);
  // Nozzle tip
  g.fillStyle(0x14141a, 1);
  g.fillTriangle(-2, 14, 2, 14, 0, 22);
}

// A little rocket toy, printed bottom-up: base sits at local y=0, nose at
// y=-40, so _printerPrinting can grow it with scaleY 0→1 off the bed.
function drawPrintedToy(g) {
  // Body
  g.fillStyle(0x4ecdc4, 1);
  g.fillRoundedRect(-9, -28, 18, 28, 5);
  // Nose cone
  g.fillStyle(0xff6b3d, 1);
  g.fillTriangle(-9, -26, 9, -26, 0, -40);
  // Window
  g.fillStyle(0xfff5d8, 1);
  g.fillCircle(0, -18, 4);
  // Fins
  g.fillStyle(0xff6b3d, 1);
  g.fillTriangle(-9, -6, -9, -18, -16, -2);
  g.fillTriangle(9, -6, 9, -18, 16, -2);
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
