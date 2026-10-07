export type ThemeMode = 'light' | 'dark'

export interface AccentSwatch {
  name: string
  hex: string
}

export const DEFAULT_THEME: ThemeMode = 'light'
export const DEFAULT_ACCENT = '#1f7d52'

export const ACCENT_SWATCHES: AccentSwatch[] = [
  { name: 'Pine Green', hex: '#1f7d52' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Ocean Blue', hex: '#0284c7' },
  { name: 'Royal Indigo', hex: '#4f46e5' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Crimson Rose', hex: '#e11d48' },
]

export interface Palette {
  g1: string
  g2: string
  g3: string
  g4: string
  g5: string
  g1b: string
  g2b: string
}

function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace(/^#/, '')
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const num = parseInt(clean, 16) || 0
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function generatePalette(baseHex: string): Palette {
  const [r, g, b] = hexToRgb(baseHex)
  const [h, s, l] = rgbToHsl(r, g, b)

  // Default pine #1f7d52 overrides for exact match
  if (baseHex.toLowerCase() === '#1f7d52') {
    return {
      g1: '#1f7d52',
      g2: '#279664',
      g3: '#34ad77',
      g4: '#e8f5ee',
      g5: '#c2e5d3',
      g1b: '#155a3a',
      g2b: '#0d3b25',
    }
  }

  const g1 = baseHex
  const g2 = hslToHex(h, Math.min(100, s + 5), Math.min(90, l + 8))
  const g3 = hslToHex(h, Math.min(100, s + 10), Math.min(92, l + 16))
  const g4 = hslToHex(h, Math.min(70, s), 94)
  const g5 = hslToHex(h, Math.min(70, s), 84)
  const g1b = hslToHex(h, s, Math.max(10, l - 9))
  const g2b = hslToHex(h, s, Math.max(6, l - 17))

  return { g1, g2, g3, g4, g5, g1b, g2b }
}

const STORAGE_THEME_KEY = 'thoorigai_theme'
const STORAGE_ACCENT_KEY = 'thoorigai_accent'

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const val = localStorage.getItem(STORAGE_THEME_KEY)
    if (val === 'dark' || val === 'light') return val
  } catch {
    // ignore
  }
  return DEFAULT_THEME
}

export function getStoredAccent(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT
  try {
    const val = localStorage.getItem(STORAGE_ACCENT_KEY)
    if (val && /^#[0-9a-fA-F]{6}$/.test(val)) return val
  } catch {
    // ignore
  }
  return DEFAULT_ACCENT
}

export function applyTheme(theme: ThemeMode, accentHex: string) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  // 1. Set theme attribute
  root.setAttribute('data-theme', theme)

  // 2. Compute palette & apply CSS variables
  const palette = generatePalette(accentHex)
  root.style.setProperty('--g1', palette.g1)
  root.style.setProperty('--g2', palette.g2)
  root.style.setProperty('--g3', palette.g3)
  root.style.setProperty('--g4', palette.g4)
  root.style.setProperty('--g5', palette.g5)
  root.style.setProperty('--g1b', palette.g1b)
  root.style.setProperty('--g2b', palette.g2b)

  // 3. Persist to localStorage safely
  try {
    localStorage.setItem(STORAGE_THEME_KEY, theme)
    localStorage.setItem(STORAGE_ACCENT_KEY, accentHex)
  } catch {
    // ignore storage quota / disabled exceptions
  }
}
