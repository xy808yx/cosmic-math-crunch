// Shared text style presets. Use `style('headline')` or `style('body', { fill: '#f00' })`.

export const FONT_STACK = '"Nunito", "ui-rounded", "Avenir Next", "Helvetica Neue", system-ui, -apple-system, Arial, sans-serif';

const PRESETS = {
  display: {
    fontFamily: FONT_STACK,
    fontSize: '54px',
    fontStyle: '900',
    fill: '#ffffff',
    stroke: '#0a0a1a',
    strokeThickness: 3
  },
  headline: {
    fontFamily: FONT_STACK,
    fontSize: '40px',
    fontStyle: '800',
    fill: '#ffffff'
  },
  subhead: {
    fontFamily: FONT_STACK,
    fontSize: '34px',
    fontStyle: '700',
    fill: '#ffffff'
  },
  body: {
    fontFamily: FONT_STACK,
    fontSize: '28px',
    fontStyle: '500',
    fill: '#cfcfe0'
  },
  caption: {
    fontFamily: FONT_STACK,
    fontSize: '22px',
    fontStyle: '500',
    fill: '#8888a0'
  },
  // Big problem digits e.g. "7 × 8"
  problem: {
    fontFamily: FONT_STACK,
    fontSize: '92px',
    fontStyle: '900',
    fill: '#ffffff',
    stroke: '#0a0a1a',
    strokeThickness: 4
  },
  // User input (typed answer)
  answer: {
    fontFamily: FONT_STACK,
    fontSize: '110px',
    fontStyle: '900',
    fill: '#f7dc6f'
  },
  // Number pad digits
  pad: {
    fontFamily: FONT_STACK,
    fontSize: '54px',
    fontStyle: '800',
    fill: '#ffffff'
  },
  // Score, streak, timer numbers
  stat: {
    fontFamily: FONT_STACK,
    fontSize: '36px',
    fontStyle: '900',
    fill: '#ffffff'
  },
  statLabel: {
    fontFamily: FONT_STACK,
    fontSize: '22px',
    fontStyle: '700',
    fill: '#8888a0'
  }
};

export function style(name, overrides = {}) {
  return { ...PRESETS[name], ...overrides };
}
