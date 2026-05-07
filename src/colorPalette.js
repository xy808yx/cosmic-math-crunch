// UI chrome palette. The art layer (pet/ship/world renderers) keeps its own
// hand-tuned hex values; this file is for panels, buttons, dialogs, and
// status colors that recur across scenes.

export const COLORS = {
  bgDark: 0x07071a,     // deepest backdrop, behind panels
  bgPanel: 0x12122a,    // modal/card body
  bgTrack: 0x1a1a2e,    // button/bar/chip track

  accentTeal: 0x4ecdc4,   // primary CTA / progress / "go"
  accentPurple: 0xc77eff, // stardust + cosmetic-equipped
  accentWarm: 0xffd86b,   // star / earned-yellow

  success: 0x58d68d,    // correct, owned-state wash
  error: 0xff6b6b,      // wrong, danger
  warning: 0xf7dc6f,    // caution / streak chip
};
