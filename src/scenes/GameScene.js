import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import { WORLDS, getNumbersForWorld, getTargetsForWorld, progress } from '../GameData.js';
import { achievements } from '../AchievementManager.js';
import { PowerUpChargeTracker } from '../PowerUpManager.js';

const TILE_SIZE = 64;
const BOARD_OFFSET_X = 40;
const BOARD_OFFSET_Y = 180;

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    // Game state
    this.board = [];
    this.selectedTile = null;
    this.canSelect = true;
    this.isProcessing = false;

    // Get world/level from registry
    this.worldId = this.registry.get('currentWorldId') || 1;
    this.currentLevel = this.registry.get('currentLevel') || 1;
    this.world = WORLDS[this.worldId - 1];

    // Get failure count for progressive support (Section 4.2)
    this.failureCount = progress.getLevelFailures(this.worldId, this.currentLevel);

    // Get difficulty settings - defaults match LevelSelectScene formula
    const difficulty = this.registry.get('levelDifficulty') || {
      moves: 15 + Math.floor(this.currentLevel / 3),
      targetScore: 400 + this.currentLevel * 50,
      boardSize: this.currentLevel > 8 ? 6 : 5
    };

    // Apply progressive difficulty reduction for 4+ failures
    let moves = difficulty.moves;
    let targetScore = difficulty.targetScore;
    if (this.failureCount >= 4) {
      moves += 5; // Extra moves
      targetScore = Math.round(targetScore * 0.8); // 20% lower target
    }

    this.boardSize = difficulty.boardSize;
    this.movesLeft = moves;
    this.targetScore = targetScore;
    this.score = 0;

    // Track if we should favor player (2+ failures)
    this.favorPlayer = this.failureCount >= 2;

    // Power-up system
    this.powerUpCharge = new PowerUpChargeTracker();
    this.lastMoveStartTime = 0;
    this.powerUpPending = null; // For power-ups that need tile selection

    // Get world-specific numbers and targets
    this.availableNumbers = getNumbersForWorld(this.worldId);
    this.targetProducts = this.buildTargetQueue();
    this.currentTargetIndex = 0;
    this.targetProduct = this.targetProducts[0];
  }

  // Build target queue mixing priority facts with regular facts (Section 4.3)
  buildTargetQueue() {
    const regularTargets = getTargetsForWorld(this.worldId);

    // Get priority facts that are due for review
    const priorityTargets = progress.getPriorityTargetsForWorld(this.worldId);

    // Mix priority targets into the queue (every 3rd target)
    const mixedQueue = [];
    let priorityIndex = 0;

    for (let i = 0; i < regularTargets.length; i++) {
      // Insert priority target every 3rd position
      if (i > 0 && i % 3 === 0 && priorityIndex < priorityTargets.length) {
        mixedQueue.push(priorityTargets[priorityIndex]);
        priorityIndex++;
      }
      mixedQueue.push(regularTargets[i]);
    }

    return mixedQueue;
  }

  create() {
    // Initialize and start audio
    audio.init();
    audio.startMusic();

    // World-themed background
    this.add.rectangle(200, 350, 400, 700, this.world.color);

    // Stars with twinkling effect
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, 400);
      const y = Phaser.Math.Between(0, 700);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.5));

      // Subtle twinkle animation
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: Phaser.Math.FloatBetween(0.1, 0.6) },
        duration: Phaser.Math.Between(1500, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Create board background panel
    this.createBoardBackground();

    // Create the game board
    this.createBoard();

    // Create particle emitter for effects
    this.createParticles();

    // Set up input
    this.input.on('gameobjectdown', this.onTileClick, this);

    // Emit initial state to UI
    this.updateUI();

    // Set new target
    this.setNewTarget();

    // Show hint after 3+ failures (progressive support)
    if (this.failureCount >= 3) {
      this.time.delayedCall(1500, () => this.showHintForValidMove());
    }
  }

  createBoard() {
    this.board = [];
    this.tileSprites = [];

    // Center the board based on size
    const boardWidth = this.boardSize * TILE_SIZE;
    const offsetX = (400 - boardWidth) / 2;

    for (let row = 0; row < this.boardSize; row++) {
      this.board[row] = [];
      this.tileSprites[row] = [];

      for (let col = 0; col < this.boardSize; col++) {
        const num = this.getRandomNumber();
        this.board[row][col] = num;

        const x = offsetX + col * TILE_SIZE + TILE_SIZE / 2;
        const y = BOARD_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2;

        const tile = this.createTile(x, y, num, row, col);

        // Add entrance animation
        tile.setScale(0);
        this.tweens.add({
          targets: tile,
          scale: 1,
          duration: 200,
          delay: (row * this.boardSize + col) * 30,
          ease: 'Back.easeOut'
        });

        this.tileSprites[row][col] = tile;
      }
    }

    // Store offset for later use
    this.boardOffsetX = offsetX;
  }

  createBoardBackground() {
    // Calculate board dimensions
    const boardWidth = this.boardSize * TILE_SIZE + 24;
    const boardHeight = this.boardSize * TILE_SIZE + 24;
    const boardCenterX = 200;
    const boardCenterY = BOARD_OFFSET_Y + (this.boardSize * TILE_SIZE) / 2;

    // Drop shadow
    this.add.rectangle(boardCenterX + 4, boardCenterY + 4, boardWidth, boardHeight, 0x000000, 0.35)
      .setOrigin(0.5);

    // Main board background
    const boardBg = this.add.rectangle(boardCenterX, boardCenterY, boardWidth, boardHeight, 0x1a1a2e, 0.85)
      .setOrigin(0.5);

    // Border with world accent color
    boardBg.setStrokeStyle(2, this.world.accentColor, 0.6);

    // Inner panel (slightly darker)
    this.add.rectangle(boardCenterX, boardCenterY, boardWidth - 12, boardHeight - 12, 0x0f0f1e, 0.5)
      .setOrigin(0.5);

    // Top highlight strip
    this.add.rectangle(boardCenterX, boardCenterY - boardHeight / 2 + 6, boardWidth - 20, 3, this.world.accentColor, 0.3)
      .setOrigin(0.5);

    // Subtle grid lines (very faint)
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, this.world.accentColor, 0.08);

    const startX = (400 - this.boardSize * TILE_SIZE) / 2;
    for (let i = 1; i < this.boardSize; i++) {
      // Vertical lines
      const vx = startX + i * TILE_SIZE;
      gridGraphics.lineBetween(vx, BOARD_OFFSET_Y, vx, BOARD_OFFSET_Y + this.boardSize * TILE_SIZE);

      // Horizontal lines
      const hy = BOARD_OFFSET_Y + i * TILE_SIZE;
      gridGraphics.lineBetween(startX, hy, startX + this.boardSize * TILE_SIZE, hy);
    }
  }

  createTile(x, y, num, row, col) {
    // Create a container with background and text
    const container = this.add.container(x, y);

    // Add background
    const bg = this.add.image(0, 0, `tile_bg_${num}`);
    container.add(bg);

    // Add number text on top
    const text = this.add.text(0, 0, num.toString(), {
      fontSize: num >= 10 ? '26px' : '30px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    container.add(text);

    // Make interactive and store data
    container.setSize(TILE_SIZE, TILE_SIZE);
    container.setInteractive();
    container.setData('row', row);
    container.setData('col', col);
    container.setData('value', num);
    container.setData('text', text);
    container.setData('bg', bg);

    return container;
  }

  getRandomNumber() {
    // Weighted selection - include factors of current targets more often
    const weights = [];
    for (const num of this.availableNumbers) {
      // Higher weight for factors of target product
      if (this.targetProduct % num === 0 && num <= this.targetProduct) {
        // After 2+ failures, heavily favor factors (progressive support)
        const multiplier = this.favorPlayer ? 4 : 2;
        for (let i = 0; i < multiplier; i++) {
          weights.push(num);
        }
      } else {
        weights.push(num);
      }
    }
    return Phaser.Utils.Array.GetRandom(weights);
  }

  createParticles() {
    // Main match particles (stars with multi-color tints)
    this.matchParticles = this.add.particles(0, 0, 'star', {
      speed: { min: 80, max: 180 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
      lifespan: { min: 400, max: 650 },
      gravityY: 180,
      tint: [0xf7dc6f, 0xff6b9d, 0x4ecdc4, 0xa29bfe],
      emitting: false
    });

    // Glow particles (soft ambient effect)
    this.glowParticles = this.add.particles(0, 0, 'particle_glow', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 400,
      gravityY: -30,
      emitting: false
    });

    // Spark particles (for combos)
    this.sparkParticles = this.add.particles(0, 0, 'particle_spark', {
      speed: { min: 150, max: 280 },
      scale: { start: 0.7, end: 0.1 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
      lifespan: 450,
      gravityY: 50,
      tint: this.world.accentColor,
      emitting: false
    });

    // Diamond particles (for special effects)
    this.diamondParticles = this.add.particles(0, 0, 'particle_diamond', {
      speed: { min: 100, max: 200 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
      lifespan: 500,
      gravityY: 100,
      emitting: false
    });
  }

  setNewTarget() {
    // Cycle through target products
    this.targetProduct = this.targetProducts[this.currentTargetIndex % this.targetProducts.length];
    this.currentTargetIndex++;

    // Find factors for hint display
    this.currentFactors = this.findFactors(this.targetProduct);

    // Update UI
    this.events.emit('targetChanged', this.targetProduct, this.currentFactors);

    // Ensure at least one valid move exists
    this.ensureValidMove();
  }

  findFactors(n) {
    const factors = [];
    for (let i = 1; i <= n; i++) {
      if (n % i === 0) {
        factors.push(i);
      }
    }
    return factors;
  }

  onTileClick(pointer, tile) {
    if (!this.canSelect || this.isProcessing) return;

    const row = tile.getData('row');
    const col = tile.getData('col');
    const value = tile.getData('value');

    if (this.selectedTile === null) {
      // First selection - start timing for power-up speed bonus
      this.lastMoveStartTime = Date.now();
      audio.playSelect();
      this.selectedTile = { row, col, tile, value };
      this.showSelection(tile);
    } else if (this.selectedTile.row === row && this.selectedTile.col === col) {
      // Clicked same tile - deselect
      audio.playSelect();
      this.hideSelection(this.selectedTile.tile);
      this.selectedTile = null;
    } else if (this.isAdjacent(this.selectedTile.row, this.selectedTile.col, row, col)) {
      // Adjacent tile - try swap
      audio.playSwap();
      this.trySwap(this.selectedTile.row, this.selectedTile.col, row, col);
    } else {
      // Non-adjacent - switch selection
      audio.playSelect();
      this.hideSelection(this.selectedTile.tile);
      this.selectedTile = { row, col, tile, value };
      this.showSelection(tile);
    }
  }

  showSelection(tile) {
    if (tile.selectionSprite) return;

    const x = tile.x;
    const y = tile.y;
    const selection = this.add.image(x, y, 'tile_selected');
    tile.selectionSprite = selection;

    // Scale entrance
    selection.setScale(0.8);
    selection.setAlpha(0.5);

    this.tweens.add({
      targets: selection,
      scale: 1,
      alpha: 1,
      duration: 150,
      ease: 'Back.easeOut'
    });

    // Pulse animation with scale
    this.tweens.add({
      targets: selection,
      scale: { from: 0.95, to: 1.08 },
      alpha: { from: 0.85, to: 1 },
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 150
    });

    // Subtle rotation wobble
    this.tweens.add({
      targets: selection,
      angle: { from: -2, to: 2 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  hideSelection(tile) {
    if (tile.selectionSprite) {
      tile.selectionSprite.destroy();
      tile.selectionSprite = null;
    }
  }

  isAdjacent(row1, col1, row2, col2) {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  async trySwap(row1, col1, row2, col2) {
    this.canSelect = false;
    this.isProcessing = true;
    this.hideSelection(this.selectedTile.tile);

    const tile1 = this.tileSprites[row1][col1];
    const tile2 = this.tileSprites[row2][col2];
    const val1 = this.board[row1][col1];
    const val2 = this.board[row2][col2];

    // Animate swap
    await this.animateSwap(tile1, tile2);

    // Check if this creates a valid match (factors multiply to target)
    const matches = this.findMatches(row1, col1, row2, col2, val1, val2);

    if (matches.length > 0) {
      // Valid match!
      this.swapValues(row1, col1, row2, col2);

      // Record correct fact attempt for spaced repetition (Section 4.3)
      progress.recordFactAttempt(val1, val2, true);

      await this.processMatches(matches);

      // Use a move
      this.movesLeft--;
      this.updateUI();

      // Check win/lose first - don't set new target if level is complete
      if (this.score >= this.targetScore) {
        this.checkLevelState();
      } else {
        // Only set new target if game continues
        this.setNewTarget();
        this.checkLevelState();
      }
    } else {
      // Invalid swap - animate back
      await this.animateSwap(tile1, tile2);

      // Record wrong fact attempt for spaced repetition (Section 4.3)
      // Find what factors would have been correct for this target
      this.recordWrongAttemptForTarget();

      // Wrong answer - costs a move per spec
      this.movesLeft--;
      this.updateUI();

      // Play wrong sound
      audio.playWrong();

      // Track for spaced repetition (emit event)
      this.events.emit('wrongAnswer', this.targetProduct);

      // Track achievement
      achievements.recordWrongAnswer();

      // Update power-up charge (resets streak)
      this.powerUpCharge.onWrongAnswer();
      this.events.emit('powerUpUpdate', {
        charge: this.powerUpCharge.getChargePercent(),
        isReady: this.powerUpCharge.isReady,
        streak: this.powerUpCharge.streakCount
      });

      this.checkLevelState();
    }

    this.selectedTile = null;
    this.canSelect = true;
    this.isProcessing = false;
  }

  findMatches(row1, col1, row2, col2, val1, val2) {
    const matches = [];

    // Check if the two swapped tiles multiply to target
    // Use == to handle potential string/number type issues
    if (val1 * val2 == this.targetProduct) {
      matches.push(
        { row: row1, col: col1 },
        { row: row2, col: col2 }
      );
    }

    // Also check for 3+ in a row of same number (traditional match-3)
    // This adds bonus points but doesn't require target matching
    const horizontalMatches = this.findLineMatches(row1, col1, 0, 1);
    const verticalMatches = this.findLineMatches(row1, col1, 1, 0);

    if (horizontalMatches.length >= 3) matches.push(...horizontalMatches);
    if (verticalMatches.length >= 3) matches.push(...verticalMatches);

    return matches;
  }

  findLineMatches(row, col, rowDir, colDir) {
    const value = this.board[row][col];
    const matches = [{ row, col }];

    // Check in positive direction
    let r = row + rowDir;
    let c = col + colDir;
    while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === value) {
      matches.push({ row: r, col: c });
      r += rowDir;
      c += colDir;
    }

    // Check in negative direction
    r = row - rowDir;
    c = col - colDir;
    while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === value) {
      matches.push({ row: r, col: c });
      r -= rowDir;
      c -= colDir;
    }

    return matches;
  }

  swapValues(row1, col1, row2, col2) {
    // Swap in board array
    const temp = this.board[row1][col1];
    this.board[row1][col1] = this.board[row2][col2];
    this.board[row2][col2] = temp;

    // Swap sprite references
    const tempSprite = this.tileSprites[row1][col1];
    this.tileSprites[row1][col1] = this.tileSprites[row2][col2];
    this.tileSprites[row2][col2] = tempSprite;

    // Update sprite data
    this.tileSprites[row1][col1].setData('row', row1).setData('col', col1);
    this.tileSprites[row2][col2].setData('row', row2).setData('col', col2);
  }

  animateSwap(tile1, tile2) {
    return new Promise(resolve => {
      const x1 = tile1.x, y1 = tile1.y;
      const x2 = tile2.x, y2 = tile2.y;
      const duration = 180;

      // Tile 1 animation with arc and scale
      this.tweens.add({
        targets: tile1,
        x: x2,
        y: y2,
        duration: duration,
        ease: 'Power2.easeInOut'
      });

      // Scale pop for tile 1
      this.tweens.add({
        targets: tile1,
        scale: 1.15,
        duration: duration / 2,
        yoyo: true,
        ease: 'Quad.easeOut'
      });

      // Tile 2 animation with arc and scale
      this.tweens.add({
        targets: tile2,
        x: x1,
        y: y1,
        duration: duration,
        ease: 'Power2.easeInOut',
        onComplete: resolve
      });

      // Scale pop for tile 2
      this.tweens.add({
        targets: tile2,
        scale: 1.15,
        duration: duration / 2,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    });
  }

  async processMatches(matches) {
    // Remove duplicates
    const uniqueMatches = [];
    const seen = new Set();
    for (const m of matches) {
      const key = `${m.row},${m.col}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMatches.push(m);
      }
    }

    // Calculate score (check for multiplier power-up)
    let matchScore = uniqueMatches.length * 50;
    if (this.powerUpCharge.consumeMultiplier()) {
      matchScore *= 2;
      this.showPowerUpMessage('2x BONUS!');
    }
    this.score += matchScore;

    // Play match sound (bigger sound for more matches)
    if (uniqueMatches.length > 2) {
      audio.playCombo(uniqueMatches.length - 2);
    } else {
      audio.playMatch();
    }

    // Screen shake for big matches (3+ tiles)
    if (uniqueMatches.length >= 3) {
      const intensity = Math.min(uniqueMatches.length * 2, 10);
      this.cameras.main.shake(200, intensity / 1000);
    }

    // Show score popup
    this.showScorePopup(uniqueMatches, matchScore);

    // Particle effects
    for (const m of uniqueMatches) {
      const tile = this.tileSprites[m.row][m.col];
      this.matchParticles.emitParticleAt(tile.x, tile.y, 8);
      this.glowParticles.emitParticleAt(tile.x, tile.y, 4);
    }

    // Combo burst for 3+ matches
    if (uniqueMatches.length >= 3) {
      // Calculate center of matched tiles
      const cx = uniqueMatches.reduce((sum, m) => sum + this.tileSprites[m.row][m.col].x, 0) / uniqueMatches.length;
      const cy = uniqueMatches.reduce((sum, m) => sum + this.tileSprites[m.row][m.col].y, 0) / uniqueMatches.length;

      // Burst of spark particles
      this.sparkParticles.emitParticleAt(cx, cy, uniqueMatches.length * 4);
      this.diamondParticles.emitParticleAt(cx, cy, uniqueMatches.length * 2);
    }

    // Animate matched tiles out
    await this.animateMatchedTiles(uniqueMatches);

    // Clear matched positions
    for (const m of uniqueMatches) {
      this.board[m.row][m.col] = null;
    }

    // Drop tiles and fill
    await this.dropAndFill();

    // Emit correct answer event
    this.events.emit('correctAnswer', this.targetProduct);

    // Track achievement
    achievements.recordCorrectAnswer();

    // Update power-up charge based on speed and streak
    const answerTimeMs = Date.now() - this.lastMoveStartTime;
    const chargeResult = this.powerUpCharge.onCorrectAnswer(answerTimeMs);
    this.events.emit('powerUpUpdate', {
      charge: this.powerUpCharge.getChargePercent(),
      isReady: this.powerUpCharge.isReady,
      streak: this.powerUpCharge.streakCount
    });

    // Show hints if hint helper is active
    if (this.powerUpCharge.areHintsActive()) {
      this.time.delayedCall(500, () => this.showHintForValidMove());
    }
  }

  showScorePopup(matches, score) {
    // Find center of matches
    let cx = 0, cy = 0;
    for (const m of matches) {
      const tile = this.tileSprites[m.row][m.col];
      cx += tile.x;
      cy += tile.y;
    }
    cx /= matches.length;
    cy /= matches.length;

    const popup = this.add.text(cx, cy, `+${score}`, {
      fontSize: '36px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 5
    }).setOrigin(0.5).setScale(0);

    // Pop-in animation
    this.tweens.add({
      targets: popup,
      scale: 1.3,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Float up and fade out
        this.tweens.add({
          targets: popup,
          y: cy - 60,
          scale: 0.9,
          alpha: 0,
          duration: 650,
          ease: 'Quad.easeOut',
          onComplete: () => popup.destroy()
        });
      }
    });
  }

  animateMatchedTiles(matches) {
    return new Promise(resolve => {
      let completed = 0;
      const total = matches.length;

      for (const m of matches) {
        const tile = this.tileSprites[m.row][m.col];

        this.tweens.add({
          targets: tile,
          scale: 0,
          alpha: 0,
          duration: 200,
          ease: 'Back.easeIn',
          onComplete: () => {
            tile.destroy();
            completed++;
            if (completed === total) resolve();
          }
        });
      }
    });
  }

  async dropAndFill() {
    // Play drop sound
    audio.playDrop(3);

    // Process column by column
    for (let col = 0; col < this.boardSize; col++) {
      // Find empty spaces and drop tiles
      let writeRow = this.boardSize - 1;

      for (let row = this.boardSize - 1; row >= 0; row--) {
        if (this.board[row][col] !== null) {
          if (row !== writeRow) {
            // Move this tile down
            this.board[writeRow][col] = this.board[row][col];
            this.board[row][col] = null;

            const tile = this.tileSprites[row][col];
            this.tileSprites[writeRow][col] = tile;
            this.tileSprites[row][col] = null;

            tile.setData('row', writeRow);

            const newY = BOARD_OFFSET_Y + writeRow * TILE_SIZE + TILE_SIZE / 2;
            this.tweens.add({
              targets: tile,
              y: newY,
              duration: 150,
              ease: 'Bounce.easeOut'
            });
          }
          writeRow--;
        }
      }

      // Fill empty spaces at top
      for (let row = writeRow; row >= 0; row--) {
        const num = this.getRandomNumber();
        this.board[row][col] = num;

        const x = this.boardOffsetX + col * TILE_SIZE + TILE_SIZE / 2;
        const startY = BOARD_OFFSET_Y - TILE_SIZE;
        const endY = BOARD_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2;

        const tile = this.createTile(x, startY, num, row, col);
        this.tileSprites[row][col] = tile;

        this.tweens.add({
          targets: tile,
          y: endY,
          duration: 200 + (writeRow - row) * 50,
          ease: 'Bounce.easeOut'
        });
      }
    }

    // Wait for animations
    await new Promise(resolve => this.time.delayedCall(400, resolve));

    // Ensure there's still a valid move after new tiles dropped
    this.ensureValidMove();
  }

  updateUI() {
    this.events.emit('updateUI', {
      score: this.score,
      targetScore: this.targetScore,
      movesLeft: this.movesLeft,
      level: this.currentLevel
    });
  }

  checkLevelState() {
    if (this.score >= this.targetScore) {
      // Level complete!
      this.canSelect = false;

      // Calculate stars based on moves remaining (percentage-based for longer levels)
      const startingMoves = this.registry.get('levelDifficulty')?.moves || 40;
      const movesUsedPercent = (startingMoves - this.movesLeft) / startingMoves;
      let stars = 1;
      if (movesUsedPercent <= 0.5) stars = 3;  // Used 50% or less of moves
      else if (movesUsedPercent <= 0.75) stars = 2;  // Used 75% or less of moves

      // Save progress and clear failures
      progress.completeLevel(this.worldId, this.currentLevel, stars);
      progress.clearLevelFailures(this.worldId, this.currentLevel);

      // Track achievements
      achievements.recordLevelComplete(
        this.worldId,
        this.currentLevel,
        stars,
        this.movesLeft,
        this.failureCount,
        progress
      );

      // Check table mastery achievements
      for (const table of this.world.tables) {
        const mastery = progress.getTableMastery(table);
        achievements.checkTableMastery(table, mastery, progress);
      }

      this.time.delayedCall(500, () => {
        this.events.emit('levelComplete', {
          score: this.score,
          movesLeft: this.movesLeft,
          stars: stars,
          worldId: this.worldId,
          level: this.currentLevel
        });
      });
    } else if (this.movesLeft <= 0) {
      // Out of moves - record failure
      this.canSelect = false;
      const failures = progress.recordLevelFailure(this.worldId, this.currentLevel);

      this.time.delayedCall(500, () => {
        this.events.emit('levelFailed', {
          score: this.score,
          targetScore: this.targetScore,
          failures: failures
        });
      });
    }
  }

  // Find and highlight a valid move (progressive support - 3+ failures)
  showHintForValidMove() {
    const validMove = this.findValidMove();
    if (!validMove) return;

    // Highlight both tiles
    const tile1 = this.tileSprites[validMove.row1][validMove.col1];
    const tile2 = this.tileSprites[validMove.row2][validMove.col2];

    // Add pulsing hint overlay
    const hint1 = this.add.image(tile1.x, tile1.y, 'tile_hint');
    const hint2 = this.add.image(tile2.x, tile2.y, 'tile_hint');

    // Pulse animation
    this.tweens.add({
      targets: [hint1, hint2],
      alpha: { from: 1, to: 0.3 },
      duration: 600,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        hint1.destroy();
        hint2.destroy();
      }
    });
  }

  findValidMove() {
    // Search for adjacent pairs that multiply to target
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const val = this.board[row][col];

        // Check right neighbor
        if (col < this.boardSize - 1) {
          const rightVal = this.board[row][col + 1];
          if (val * rightVal === this.targetProduct) {
            return { row1: row, col1: col, row2: row, col2: col + 1 };
          }
        }

        // Check bottom neighbor
        if (row < this.boardSize - 1) {
          const bottomVal = this.board[row + 1][col];
          if (val * bottomVal === this.targetProduct) {
            return { row1: row, col1: col, row2: row + 1, col2: col };
          }
        }
      }
    }
    return null;
  }

  // Ensure at least one valid move exists on the board
  ensureValidMove() {
    if (this.findValidMove()) return; // Already have a valid move

    // No valid move - place factors of target on two adjacent tiles
    const target = this.targetProduct;

    // Find a good factor pair (not 1 x n if possible)
    let factor1 = 1, factor2 = target;
    for (let i = 2; i <= Math.sqrt(target); i++) {
      if (target % i === 0) {
        factor1 = i;
        factor2 = target / i;
        break;
      }
    }

    // Pick a random position and place factors adjacently
    const row = Phaser.Math.Between(0, this.boardSize - 1);
    const col = Phaser.Math.Between(0, this.boardSize - 2); // Leave room for adjacent

    // Update first tile
    this.updateTileValue(row, col, factor1);

    // Update second tile
    this.updateTileValue(row, col + 1, factor2);
  }

  // Helper to update a tile's value and visuals
  updateTileValue(row, col, newValue) {
    // Update board data
    this.board[row][col] = newValue;

    const tile = this.tileSprites[row][col];
    if (!tile) return;

    // Update stored value
    tile.setData('value', newValue);

    // Update text
    const text = tile.getData('text');
    if (text) {
      text.setText(newValue.toString());
      text.setFontSize(newValue >= 10 ? '26px' : '30px');
    }

    // Update background texture
    const bg = tile.getData('bg');
    if (bg) {
      bg.setTexture(`tile_bg_${newValue}`);
    }
  }

  // Record a wrong attempt for spaced repetition (Section 4.3)
  // Find the smallest factor pair for this target and mark it as needing review
  recordWrongAttemptForTarget() {
    const target = this.targetProduct;
    // Find smallest factor pair (e.g., for 12: 3x4 not 2x6 or 1x12)
    for (let i = 2; i <= Math.sqrt(target); i++) {
      if (target % i === 0) {
        progress.recordFactAttempt(i, target / i, false);
        return;
      }
    }
    // Fallback for primes or edge cases
    progress.recordFactAttempt(1, target, false);
  }

  // Called by UI to restart level
  restartLevel() {
    this.scene.restart();
  }

  // Called by UI to go to next level or back to level select
  nextLevel() {
    // Go back to level select to choose next level
    audio.stopMusic();
    this.scene.stop('UIScene');
    this.scene.stop('GameScene');
    this.scene.start('LevelSelectScene');
  }

  // Called by UI to go back to world map
  goToWorldMap() {
    audio.stopMusic();
    this.scene.stop('UIScene');
    this.scene.stop('GameScene');
    this.scene.start('WorldMapScene');
  }

  // Apply power-up effect
  async applyPowerUpEffect(powerUp) {
    if (!powerUp) return;

    this.canSelect = false;
    this.isProcessing = true;

    switch (powerUp.effect) {
      case 'clear_row':
        await this.powerUpClearRow();
        break;
      case 'clear_match':
        await this.powerUpClearMatch();
        break;
      case 'clear_area':
        await this.powerUpClearArea();
        break;
      case 'double_points':
        this.powerUpCharge.activateMultiplier();
        this.showPowerUpMessage('2x Points Active!');
        break;
      case 'clear_factors':
        await this.powerUpClearFactors();
        break;
      case 'clear_number':
        await this.powerUpClearNumber();
        break;
      case 'wild':
        // Wild card requires tile selection - set pending
        this.powerUpPending = 'wild';
        this.showPowerUpMessage('Tap a tile to change it!');
        break;
      case 'show_hints':
        this.powerUpCharge.activateHints();
        this.showPowerUpMessage('Hints active for 3 turns!');
        this.showHintForValidMove();
        break;
      default:
        break;
    }

    this.canSelect = true;
    this.isProcessing = false;
  }

  showPowerUpMessage(message) {
    const popup = this.add.text(200, 350, message, {
      fontSize: '24px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: 300,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => popup.destroy()
    });
  }

  // Clear a random row (Shooting Star)
  async powerUpClearRow() {
    const row = Phaser.Math.Between(0, this.boardSize - 1);
    const matches = [];

    for (let col = 0; col < this.boardSize; col++) {
      matches.push({ row, col });
    }

    audio.playCombo(3);

    // Add score
    this.score += matches.length * 30;
    this.showScorePopup(matches, matches.length * 30);

    // Animate and clear
    await this.animateMatchedTiles(matches);
    for (const m of matches) {
      this.board[m.row][m.col] = null;
    }
    await this.dropAndFill();

    this.updateUI();
    this.checkLevelState();
  }

  // Clear a random matching pair (Companion Zap)
  async powerUpClearMatch() {
    const validMove = this.findValidMove();
    if (!validMove) {
      this.showPowerUpMessage('No matches found!');
      return;
    }

    const matches = [
      { row: validMove.row1, col: validMove.col1 },
      { row: validMove.row2, col: validMove.col2 }
    ];

    audio.playMatch();

    // Add score
    this.score += 100;
    this.showScorePopup(matches, 100);

    // Animate and clear
    await this.animateMatchedTiles(matches);
    for (const m of matches) {
      this.board[m.row][m.col] = null;
    }
    await this.dropAndFill();

    this.updateUI();
    this.setNewTarget();
    this.checkLevelState();
  }

  // Clear 3x3 area around center (Black Hole)
  async powerUpClearArea() {
    // Clear center of board for now (could make this targeted)
    const centerRow = Math.floor(this.boardSize / 2);
    const centerCol = Math.floor(this.boardSize / 2);
    const matches = [];

    for (let r = centerRow - 1; r <= centerRow + 1; r++) {
      for (let c = centerCol - 1; c <= centerCol + 1; c++) {
        if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
          matches.push({ row: r, col: c });
        }
      }
    }

    // Screen shake
    this.cameras.main.shake(300, 0.01);
    audio.playCombo(4);

    // Add score
    this.score += matches.length * 25;
    this.showScorePopup(matches, matches.length * 25);

    // Animate and clear
    await this.animateMatchedTiles(matches);
    for (const m of matches) {
      this.board[m.row][m.col] = null;
    }
    await this.dropAndFill();

    this.updateUI();
    this.checkLevelState();
  }

  // Clear all factors of target (Factor Bomb)
  async powerUpClearFactors() {
    const factors = this.findFactors(this.targetProduct);
    const matches = [];

    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if (factors.includes(this.board[row][col])) {
          matches.push({ row, col });
        }
      }
    }

    if (matches.length === 0) {
      this.showPowerUpMessage('No factors found!');
      return;
    }

    audio.playCombo(Math.min(matches.length, 5));

    // Add score
    this.score += matches.length * 20;
    this.showScorePopup(matches, matches.length * 20);

    // Animate and clear
    await this.animateMatchedTiles(matches);
    for (const m of matches) {
      this.board[m.row][m.col] = null;
    }
    await this.dropAndFill();

    this.updateUI();
    this.checkLevelState();
  }

  // Clear all tiles of one number (Supernova)
  async powerUpClearNumber() {
    // Find most common number on board
    const counts = {};
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const val = this.board[row][col];
        counts[val] = (counts[val] || 0) + 1;
      }
    }

    let maxNum = null;
    let maxCount = 0;
    for (const [num, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxNum = parseInt(num);
      }
    }

    const matches = [];
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if (this.board[row][col] === maxNum) {
          matches.push({ row, col });
        }
      }
    }

    audio.playCombo(Math.min(matches.length, 5));

    // Add score
    this.score += matches.length * 25;
    this.showScorePopup(matches, matches.length * 25);

    // Animate and clear
    await this.animateMatchedTiles(matches);
    for (const m of matches) {
      this.board[m.row][m.col] = null;
    }
    await this.dropAndFill();

    this.updateUI();
    this.checkLevelState();
  }
}
