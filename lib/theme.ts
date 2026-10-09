export type ThemeMode = 'light' | 'dark'

export interface AccentSwatch {
  name: string
  hex: string
}

export const DEFAULT_THEME: ThemeMode = 'light'
export const DEFAULT_ACCENT = '#1f7d52'

export const ACCENT_SWATCHES: AccentSwatch[] = [
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Pine Green', hex: '#1f7d52' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Ocean Blue', hex: '#0284c7' },
  { name: 'Royal Indigo', hex: '#4f46e5' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Crimson Rose', hex: '#e11d48' },
]

export type GradientDirectionPreset = '135deg' | '45deg' | '180deg' | '90deg' | 'radial' | 'mesh'
export type GradientStyle = 'linear' | 'radial' | 'mesh'
export type GlassmorphismLevel = 'subtle' | 'balanced' | 'deep'

export interface GradientConfig {
  angle: number // 0 to 360 degrees
  directionPreset: GradientDirectionPreset
  intensity: number // 10 to 100 percentage
  style: GradientStyle
  glassPop: GlassmorphismLevel
  glassOpacity: number // 50 to 95 percentage
  glassBlur: number // 8 to 32 px
}

export const DEFAULT_GRADIENT_CONFIG: GradientConfig = {
  angle: 135,
  directionPreset: '135deg',
  intensity: 48,
  style: 'linear',
  glassPop: 'balanced',
  glassOpacity: 74,
  glassBlur: 18,
}

export interface Palette {
  g1: string
  g2: string
  g3: string
  g4: string
  g5: string
  g1b: string
  g2b: string
}

const rgbCache = new Map<string, [number, number, number]>()

export function hexToRgb(hex: string): [number, number, number] {
  const cached = rgbCache.get(hex)
  if (cached) return cached

  let clean = hex.replace(/^#/, '')
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const num = parseInt(clean, 16) || 0
  const res: [number, number, number] = [(num >> 16) & 255, (num >> 8) & 255, num & 255]
  rgbCache.set(hex, res)
  return res
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
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

export function hslToHex(h: number, s: number, l: number): string {
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

const paletteCache = new Map<string, Palette>()

export function generatePalette(baseHex: string): Palette {
  const lower = baseHex.toLowerCase()
  const cached = paletteCache.get(lower)
  if (cached) return cached

  // Default pine #1f7d52 overrides for exact match
  if (lower === '#1f7d52') {
    const p: Palette = {
      g1: '#1f7d52',
      g2: '#279664',
      g3: '#34ad77',
      g4: '#e8f5ee',
      g5: '#c2e5d3',
      g1b: '#155a3a',
      g2b: '#0d3b25',
    }
    paletteCache.set(lower, p)
    return p
  }

  const [r, g, b] = hexToRgb(baseHex)
  const [h, s, l] = rgbToHsl(r, g, b)

  const g1 = baseHex
  const g2 = hslToHex(h, Math.min(100, s + 5), Math.min(90, l + 8))
  const g3 = hslToHex(h, Math.min(100, s + 10), Math.min(92, l + 16))
  const g4 = hslToHex(h, Math.min(70, s), 94)
  const g5 = hslToHex(h, Math.min(70, s), 84)
  const g1b = hslToHex(h, s, Math.max(10, l - 9))
  const g2b = hslToHex(h, s, Math.max(6, l - 17))

  const res: Palette = { g1, g2, g3, g4, g5, g1b, g2b }
  paletteCache.set(lower, res)
  return res
}

export function computeCanvasGradient(accentHex: string, theme: ThemeMode, config: GradientConfig): string {
  const [r, g, b] = hexToRgb(accentHex)
  const palette = generatePalette(accentHex)
  const [r2, g2, b2] = hexToRgb(palette.g2)
  const k = Math.min(1, Math.max(0.1, config.intensity / 100))

  if (theme === 'dark') {
    if (config.style === 'radial' || config.directionPreset === 'radial') {
      return `radial-gradient(circle at 85% 15%, rgba(${r}, ${g}, ${b}, ${(0.42 * k).toFixed(3)}) 0%, rgba(${r}, ${g}, ${b}, ${(0.14 * k).toFixed(3)}) 50%, #090e0c 90%)`
    }
    if (config.style === 'mesh' || config.directionPreset === 'mesh') {
      return `radial-gradient(at 88% 12%, rgba(${r}, ${g}, ${b}, ${(0.44 * k).toFixed(3)}) 0px, transparent 55%), radial-gradient(at 12% 88%, rgba(${r2}, ${g2}, ${b2}, ${(0.22 * k).toFixed(3)}) 0px, transparent 50%), linear-gradient(${config.angle}deg, #090e0c 0%, rgba(${r}, ${g}, ${b}, ${(0.16 * k).toFixed(3)}) 100%)`
    }
    // linear
    return `linear-gradient(${config.angle}deg, #090e0c 0%, rgba(${r}, ${g}, ${b}, ${(0.14 * k).toFixed(3)}) 42%, rgba(${r}, ${g}, ${b}, ${(0.42 * k).toFixed(3)}) 100%)`
  }

  // Light mode
  if (config.style === 'radial' || config.directionPreset === 'radial') {
    return `radial-gradient(circle at 85% 15%, rgba(${r}, ${g}, ${b}, ${(0.48 * k).toFixed(3)}) 0%, rgba(${r}, ${g}, ${b}, ${(0.14 * k).toFixed(3)}) 48%, rgba(255, 255, 255, 0.98) 85%)`
  }
  if (config.style === 'mesh' || config.directionPreset === 'mesh') {
    return `radial-gradient(at 90% 12%, rgba(${r}, ${g}, ${b}, ${(0.50 * k).toFixed(3)}) 0px, transparent 55%), radial-gradient(at 10% 88%, rgba(${r2}, ${g2}, ${b2}, ${(0.26 * k).toFixed(3)}) 0px, transparent 50%), linear-gradient(${config.angle}deg, rgba(255, 255, 255, 0.98) 0%, rgba(${r}, ${g}, ${b}, ${(0.18 * k).toFixed(3)}) 100%)`
  }
  // linear
  return `linear-gradient(${config.angle}deg, rgba(255, 255, 255, 0.98) 0%, rgba(${r}, ${g}, ${b}, ${(0.10 * k).toFixed(3)}) 38%, rgba(${r}, ${g}, ${b}, ${(0.46 * k).toFixed(3)}) 100%)`
}

export function computeGlassmorphismTokens(theme: ThemeMode, config: GradientConfig) {
  const alpha = Math.min(0.96, Math.max(0.4, config.glassOpacity / 100))
  const blurPx = `${config.glassBlur}px`

  if (theme === 'dark') {
    const darkAlpha = Math.max(0.45, alpha - 0.1)
    const shadow =
      config.glassPop === 'deep'
        ? '0 24px 52px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.16)'
        : config.glassPop === 'subtle'
          ? '0 8px 24px -4px rgba(0, 0, 0, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)'
          : '0 16px 36px -8px rgba(0, 0, 0, 0.55), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)'
    const border =
      config.glassPop === 'deep'
        ? 'rgba(255, 255, 255, 0.16)'
        : config.glassPop === 'subtle'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.12)'

    return {
      cardBg: `rgba(18, 28, 22, ${darkAlpha.toFixed(2)})`,
      cardBlur: blurPx,
      cardBorder: border,
      cardShadow: shadow,
      sidebarGlassBg: 'rgba(14, 23, 19, 0.75)',
      topbarGlassBg: 'rgba(14, 23, 19, 0.75)',
      canvasColor: '#090e0c',
    }
  }

  // Light mode — Clean match between sidebar and topbar
  const shadow =
    config.glassPop === 'deep'
      ? '0 24px 50px -10px rgba(15, 23, 42, 0.12), 0 4px 14px -2px rgba(15, 23, 42, 0.05), inset 0 1.5px 2px 0 rgba(255, 255, 255, 1)'
      : config.glassPop === 'subtle'
        ? '0 8px 24px -4px rgba(15, 23, 42, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.7)'
        : '0 14px 34px -8px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.03), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95)'
  const border =
    config.glassPop === 'deep'
      ? 'rgba(255, 255, 255, 0.92)'
      : config.glassPop === 'subtle'
        ? 'rgba(255, 255, 255, 0.6)'
        : 'rgba(255, 255, 255, 0.76)'

  return {
    cardBg: `rgba(255, 255, 255, ${alpha.toFixed(2)})`,
    cardBlur: blurPx,
    cardBorder: border,
    cardShadow: shadow,
    sidebarGlassBg: 'rgba(255, 255, 255, 0.78)',
    topbarGlassBg: 'rgba(255, 255, 255, 0.78)',
    canvasColor: '#ffffff',
  }
}

const STORAGE_THEME_KEY = 'thoorigai_theme'
const STORAGE_ACCENT_KEY = 'thoorigai_accent'
const STORAGE_GRADIENT_KEY = 'thoorigai_gradient_config'

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

export function getStoredGradientConfig(): GradientConfig {
  if (typeof window === 'undefined') return DEFAULT_GRADIENT_CONFIG
  try {
    const val = localStorage.getItem(STORAGE_GRADIENT_KEY)
    if (val) {
      const parsed = JSON.parse(val)
      return { ...DEFAULT_GRADIENT_CONFIG, ...parsed }
    }
  } catch {
    // ignore
  }
  return DEFAULT_GRADIENT_CONFIG
}

let saveStorageTimeout: ReturnType<typeof setTimeout> | null = null

export function saveStorageImmediately(theme: ThemeMode, accentHex: string, gradientCfg: GradientConfig) {
  if (saveStorageTimeout) {
    clearTimeout(saveStorageTimeout)
    saveStorageTimeout = null
  }
  try {
    localStorage.setItem(STORAGE_THEME_KEY, theme)
    localStorage.setItem(STORAGE_ACCENT_KEY, accentHex)
    localStorage.setItem(STORAGE_GRADIENT_KEY, JSON.stringify(gradientCfg))
  } catch {
    // ignore
  }
}

export function debouncedSaveStorage(theme: ThemeMode, accentHex: string, gradientCfg: GradientConfig) {
  if (saveStorageTimeout) clearTimeout(saveStorageTimeout)
  saveStorageTimeout = setTimeout(() => {
    saveStorageImmediately(theme, accentHex, gradientCfg)
  }, 200)
}

/**
 * Fast direct updater for gradient changes during slider dragging.
 * Skips recalculating palette, sets only --bg-canvas-gradient on DOM, and debounces storage.
 */
export function applyGradientOnly(accentHex: string, theme: ThemeMode, config: GradientConfig) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const canvasGradient = computeCanvasGradient(accentHex, theme, config)
  root.style.setProperty('--bg-canvas-gradient', canvasGradient)
  debouncedSaveStorage(theme, accentHex, config)
}

/**
 * Fast direct updater for glassmorphism pop/opacity/blur slider changes.
 */
export function applyGlassmorphismOnly(theme: ThemeMode, accentHex: string, config: GradientConfig) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const glass = computeGlassmorphismTokens(theme, config)
  root.style.setProperty('--card-glass-bg', glass.cardBg)
  root.style.setProperty('--card-glass-blur', glass.cardBlur)
  root.style.setProperty('--card-glass-border', glass.cardBorder)
  root.style.setProperty('--card-glass-shadow', glass.cardShadow)
  root.style.setProperty('--sidebar-glass-bg', glass.sidebarGlassBg)
  root.style.setProperty('--topbar-glass-bg', glass.topbarGlassBg)
  root.style.setProperty('--card', glass.cardBg)
  root.style.setProperty('--panel', glass.cardBg)
  root.style.setProperty('--card-border', glass.cardBorder)
  root.style.setProperty('--shadow-card', glass.cardShadow)
  debouncedSaveStorage(theme, accentHex, config)
}

export function applyTheme(theme: ThemeMode, accentHex: string, config?: GradientConfig) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  const gradientCfg = config ?? getStoredGradientConfig()

  // 1. Set theme attribute only if changed to avoid full DOM style tree invalidation
  if (root.getAttribute('data-theme') !== theme) {
    root.setAttribute('data-theme', theme)
  }

  // 2. Compute palette & apply CSS variables
  const palette = generatePalette(accentHex)
  root.style.setProperty('--g1', palette.g1)
  root.style.setProperty('--g2', palette.g2)
  root.style.setProperty('--g3', palette.g3)
  root.style.setProperty('--g4', palette.g4)
  root.style.setProperty('--g5', palette.g5)
  root.style.setProperty('--g1b', palette.g1b)
  root.style.setProperty('--g2b', palette.g2b)

  // Map all semantic variables to the selected color palette (no extra greens, ambers, reds)
  root.style.setProperty('--success', palette.g1)
  root.style.setProperty('--success-bg', palette.g4)
  root.style.setProperty('--warning', palette.g1b)
  root.style.setProperty('--warning-bg', palette.g4)
  root.style.setProperty('--danger', palette.g1b)
  root.style.setProperty('--danger-bg', palette.g4)
  root.style.setProperty('--info', palette.g1)
  root.style.setProperty('--info-bg', palette.g4)
  root.style.setProperty('--amber-bg', palette.g4)
  root.style.setProperty('--highlight-bg', palette.g4)
  root.style.setProperty('--highlight-border', palette.g5)
  root.style.setProperty('--highlight-text', palette.g1b)
  root.style.setProperty('--highlight-icon', palette.g1)

  // 3. Compute and apply gradient & glassmorphism tokens
  const canvasGradient = computeCanvasGradient(accentHex, theme, gradientCfg)
  const glass = computeGlassmorphismTokens(theme, gradientCfg)

  root.style.setProperty('--bg-canvas-gradient', canvasGradient)
  root.style.setProperty('--bg-canvas-color', glass.canvasColor)
  root.style.setProperty('--card-glass-bg', glass.cardBg)
  root.style.setProperty('--card-glass-blur', glass.cardBlur)
  root.style.setProperty('--card-glass-border', glass.cardBorder)
  root.style.setProperty('--card-glass-shadow', glass.cardShadow)
  root.style.setProperty('--sidebar-glass-bg', glass.sidebarGlassBg)
  root.style.setProperty('--topbar-glass-bg', glass.topbarGlassBg)

  // Map to core card and panel tokens so all components get glassmorphism immediately
  root.style.setProperty('--card', glass.cardBg)
  root.style.setProperty('--panel', glass.cardBg)
  root.style.setProperty('--card-border', glass.cardBorder)
  root.style.setProperty('--shadow-card', glass.cardShadow)
  root.style.setProperty('--canvas', 'transparent')

  // Clean modern radius tokens (no ballooned/tablet round edges)
  root.style.setProperty('--radius-shell', '0px')
  root.style.setProperty('--radius-panel', '12px')
  root.style.setProperty('--radius-card', '12px')
  root.style.setProperty('--radius', '10px')
  root.style.setProperty('--radius-lg', '12px')
  root.style.setProperty('--radius-xl', '14px')

  // Immediate persistence on explicit theme apply
  saveStorageImmediately(theme, accentHex, gradientCfg)
}
