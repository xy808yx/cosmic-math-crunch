// Procedural audio using Web Audio API
// No external files needed - generates all sounds programmatically

export class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicPlaying = false;
    this.enabled = true;
    this.musicEnabled = false; // Music disabled by default - sound effects only

    // Will be initialized on first user interaction
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();

      // Master gain
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.context.destination);

      // Separate gains for music and SFX
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = 0.3;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.context.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  // Play a simple tone
  playTone(frequency, duration, type = 'sine', gainValue = 0.3, delay = 0) {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0, this.context.currentTime + delay);
    gain.gain.linearRampToValueAtTime(gainValue, this.context.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(this.context.currentTime + delay);
    osc.stop(this.context.currentTime + delay + duration);
  }

  // Tile select sound - soft blip
  playSelect() {
    this.playTone(600, 0.1, 'sine', 0.2);
  }

  // Tile swap sound - two quick tones
  playSwap() {
    this.playTone(400, 0.08, 'sine', 0.25);
    this.playTone(500, 0.08, 'sine', 0.25, 0.05);
  }

  // Correct match - happy ascending arpeggio
  playMatch() {
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.15, 'sine', 0.3, i * 0.08);
    });
  }

  // Big match/combo - more elaborate fanfare
  playCombo(comboLevel = 1) {
    const baseNotes = [523, 659, 784, 1047]; // C major going up
    const noteCount = Math.min(comboLevel + 2, baseNotes.length);

    for (let i = 0; i < noteCount; i++) {
      this.playTone(baseNotes[i], 0.2, 'sine', 0.35, i * 0.1);
    }
  }

  // Wrong answer - descending "bwah" sound
  playWrong() {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.context.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.3);
  }

  // Tiles dropping - cascading plinks
  playDrop(count = 1) {
    for (let i = 0; i < Math.min(count, 5); i++) {
      const freq = 800 - i * 80;
      this.playTone(freq, 0.1, 'sine', 0.15, i * 0.05);
    }
  }

  // Level complete - triumphant fanfare
  playLevelComplete() {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    // Fanfare melody: C-E-G-C (octave up)
    const melody = [
      { freq: 523, time: 0, dur: 0.15 },     // C5
      { freq: 659, time: 0.15, dur: 0.15 },  // E5
      { freq: 784, time: 0.3, dur: 0.15 },   // G5
      { freq: 1047, time: 0.45, dur: 0.4 },  // C6 (held)
    ];

    melody.forEach(note => {
      this.playTone(note.freq, note.dur, 'sine', 0.4, note.time);
      // Add harmony
      this.playTone(note.freq * 1.25, note.dur, 'sine', 0.2, note.time);
    });

    // Sparkle effect
    for (let i = 0; i < 8; i++) {
      const freq = 1200 + Math.random() * 800;
      this.playTone(freq, 0.1, 'sine', 0.15, 0.6 + i * 0.05);
    }
  }

  // Level failed - sad descending tones
  playLevelFailed() {
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.25, 'sine', 0.25, i * 0.2);
    });
  }

  // Button click
  playClick() {
    this.playTone(800, 0.05, 'sine', 0.2);
  }

  // Star earned
  playStar() {
    this.playTone(880, 0.1, 'sine', 0.3);
    this.playTone(1100, 0.15, 'sine', 0.3, 0.1);
  }

  // Start background music (simple looping pattern)
  startMusic() {
    if (!this.enabled || !this.initialized || !this.musicEnabled || this.musicPlaying) return;
    this.resume();

    this.musicPlaying = true;
    this.playMusicLoop();
  }

  playMusicLoop() {
    if (!this.musicPlaying || !this.musicEnabled) return;

    // Simple calming melody pattern
    const pattern = [
      { note: 262, dur: 0.4 },  // C4
      { note: 294, dur: 0.4 },  // D4
      { note: 330, dur: 0.4 },  // E4
      { note: 294, dur: 0.4 },  // D4
      { note: 262, dur: 0.4 },  // C4
      { note: 247, dur: 0.4 },  // B3
      { note: 262, dur: 0.8 },  // C4 (held)
      { note: 0, dur: 0.4 },    // rest
    ];

    let time = 0;
    pattern.forEach(note => {
      if (note.note > 0) {
        this.playMusicNote(note.note, note.dur, time);
      }
      time += note.dur;
    });

    // Loop
    this.musicTimeout = setTimeout(() => this.playMusicLoop(), time * 1000);
  }

  playMusicNote(frequency, duration, delay) {
    if (!this.enabled || !this.initialized) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;

    const startTime = this.context.currentTime + delay;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
    gain.gain.setValueAtTime(0.15, startTime + duration - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.musicEnabled;
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopMusic();
    }
    return this.enabled;
  }

  setVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }
}

// Singleton instance
export const audio = new AudioManager();
