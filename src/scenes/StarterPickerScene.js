import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import { SPECIES, companion, drawCompanion } from '../CompanionManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';

const W = 800;
const H = 1400;

export class StarterPickerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StarterPickerScene' });
  }

  create() {
    audio.init();

    createStarfield(this, { accentStrength: 0 });

    // Title block
    this.add.text(W / 2, 140, 'Pick Your Companion', style('display', {
      fontSize: '54px'
    })).setOrigin(0.5).setDepth(10);

    this.add.text(W / 2, 200, 'Three cosmic eggs await. Choose one to hatch.', style('body', {
      fontSize: '24px',
      fill: '#cfcfe0'
    })).setOrigin(0.5).setDepth(10);

    this.selectedId = null;
    this.cards = {};

    const ids = ['ember', 'tide', 'sprout'];
    const cardW = 220;
    const cardH = 720;
    const gap = 30;
    const startX = W / 2 - (cardW * 1.5 + gap);

    ids.forEach((id, i) => {
      const cx = startX + i * (cardW + gap) + cardW / 2;
      const cy = 730;
      this.cards[id] = this.createCard(id, cx, cy, cardW, cardH);
    });

    // Confirm button at bottom
    this.confirmBtn = createButton(this, {
      x: W / 2,
      y: 1300,
      label: 'Hatch your egg',
      width: 380,
      height: 90,
      color: 0x4a4a6a,
      onClick: () => this.confirm()
    });
    this.confirmBtn.setDepth(20);

    new TransitionManager(this).fadeIn(300);
  }

  createCard(id, cx, cy, cw, ch) {
    const species = SPECIES[id];
    const card = this.add.container(cx, cy).setDepth(8);

    const glow = this.add.graphics();
    glow.fillStyle(species.color, 0.18);
    glow.fillRoundedRect(-cw / 2 - 6, -ch / 2 - 6, cw + 12, ch + 12, 22);
    card.add(glow);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.95);
    bg.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 18);
    bg.lineStyle(3, species.color, 0.6);
    bg.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 18);
    card.add(bg);
    card.bg = bg;
    card.glow = glow;
    card.cw = cw;
    card.ch = ch;
    card.color = species.color;

    // Egg preview
    const pet = drawCompanion(this, 0, -ch / 2 + 160, {
      speciesId: id,
      stage: 'egg',
      preview: true,
      scale: 1.1
    });
    card.add(pet);

    // Name
    card.add(this.add.text(0, -ch / 2 + 290, species.name, style('headline', {
      fontSize: '38px',
      fill: '#' + species.color.toString(16).padStart(6, '0')
    })).setOrigin(0.5));

    // Tagline
    card.add(this.add.text(0, -ch / 2 + 340, species.tagline, style('caption', {
      fontSize: '18px',
      fill: '#cfcfe0',
      align: 'center',
      wordWrap: { width: cw - 30 }
    })).setOrigin(0.5));

    // Lore
    card.add(this.add.text(0, -ch / 2 + 460, species.lore, style('body', {
      fontSize: '18px',
      fill: '#a8a8c0',
      align: 'center',
      wordWrap: { width: cw - 36 }
    })).setOrigin(0.5));

    // Hit area
    const hit = this.add.rectangle(0, 0, cw, ch, 0x000000, 0).setInteractive({ useHandCursor: true });
    card.add(hit);

    hit.on('pointerover', () => {
      this.tweens.add({ targets: card, scaleX: 1.04, scaleY: 1.04, duration: 120 });
    });
    hit.on('pointerout', () => {
      if (this.selectedId !== id) {
        this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 120 });
      }
    });
    hit.on('pointerdown', () => {
      audio.playClick();
      this.select(id);
    });

    return card;
  }

  select(id) {
    this.selectedId = id;
    Object.entries(this.cards).forEach(([cid, card]) => {
      const isSelected = cid === id;
      card.bg.clear();
      card.bg.fillStyle(0x12122a, 0.95);
      card.bg.fillRoundedRect(-card.cw / 2, -card.ch / 2, card.cw, card.ch, 18);
      card.bg.lineStyle(isSelected ? 5 : 3, card.color, isSelected ? 1 : 0.6);
      card.bg.strokeRoundedRect(-card.cw / 2, -card.ch / 2, card.cw, card.ch, 18);
      this.tweens.add({
        targets: card,
        scaleX: isSelected ? 1.06 : 1,
        scaleY: isSelected ? 1.06 : 1,
        duration: 160,
        ease: 'Back.easeOut'
      });
    });

    // Re-create the confirm button so its color matches the new selection.
    this.confirmBtn.destroy();
    this.confirmBtn = createButton(this, {
      x: W / 2,
      y: 1300,
      label: `Pick ${SPECIES[id].name}`,
      width: 380,
      height: 90,
      color: SPECIES[id].color,
      onClick: () => this.confirm()
    });
    this.confirmBtn.setDepth(20);
  }

  confirm() {
    if (!this.selectedId) return;
    audio.playLevelComplete?.();
    companion.pickStarter(this.selectedId);
    new TransitionManager(this).fadeToScene('WorldMapScene', {}, 400);
  }
}
