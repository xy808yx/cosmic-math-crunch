// Procedural audio using Web Audio API
// No external files needed - generates all sounds programmatically

export class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.enabled = true;

    // Will be initialized on first user interaction
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();

      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.context.destination);

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

  // Timer tick (fires once per second under 5s remaining)
  playTick() {
    this.playTone(1200, 0.06, 'square', 0.18);
  }

  // Round-over fanfare (timed sprint complete)
  playRoundComplete() {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    const melody = [
      { freq: 523, time: 0, dur: 0.18 },     // C5
      { freq: 659, time: 0.18, dur: 0.18 },  // E5
      { freq: 784, time: 0.36, dur: 0.18 },  // G5
      { freq: 1047, time: 0.54, dur: 0.45 }  // C6
    ];

    melody.forEach(note => {
      this.playTone(note.freq, note.dur, 'sine', 0.35, note.time);
      this.playTone(note.freq * 1.25, note.dur, 'sine', 0.18, note.time);
    });
  }

  toggleEnabled() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// Singleton instance
export const audio = new AudioManager();
