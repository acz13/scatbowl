import seedrandom from 'seedrandom'

export const COLORS = {
  teal: {
    standard: '1abc9c',
    dark: '11806a'
  },
  green: {
    standard: '2ecc71',
    dark: '1f8b4d'
  },
  blue: {
    standard: '3498db',
    dark: '206694'
  },
  purple: {
    standard: '9b59b6',
    dark: '71368a'
  },
  pink: {
    standard: 'e91e63',
    dark: 'ad1457'
  },
  yellow: {
    standard: 'f1c40f',
    dark: 'c27c0e'
  },
  orange: {
    standard: 'e67e22',
    dark: 'a84300'
  },
  red: {
    standard: 'ed2939',
    dark: 'ab0e1b'
  }
}

export const COLOR_NAMES = Object.keys(COLORS)

export function getColor (seed) {
  console.log(`getting color for ${seed}`)
  return COLOR_NAMES[Math.floor(seedrandom(seed)() * COLOR_NAMES.length)]
}
