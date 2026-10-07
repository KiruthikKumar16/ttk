// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_THEME,
  DEFAULT_ACCENT,
  ACCENT_SWATCHES,
  generatePalette,
  getStoredTheme,
  getStoredAccent,
  applyTheme,
} from './theme'

describe('Theme utilities', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.cssText = ''
  })

  it('exports valid constants and accent swatches', () => {
    expect(DEFAULT_THEME).toBe('light')
    expect(DEFAULT_ACCENT).toBe('#1f7d52')
    expect(ACCENT_SWATCHES.length).toBeGreaterThan(0)
    expect(ACCENT_SWATCHES.some((s) => s.hex === DEFAULT_ACCENT)).toBe(true)
  })

  it('generates exact default palette for pine green #1f7d52', () => {
    const palette = generatePalette('#1f7d52')
    expect(palette.g1).toBe('#1f7d52')
    expect(palette.g2).toBe('#279664')
    expect(palette.g3).toBe('#34ad77')
    expect(palette.g4).toBe('#e8f5ee')
    expect(palette.g5).toBe('#c2e5d3')
    expect(palette.g1b).toBe('#155a3a')
    expect(palette.g2b).toBe('#0d3b25')
  })

  it('generates harmonic palette for custom 6-digit and 3-digit hex codes', () => {
    const p1 = generatePalette('#4f46e5')
    expect(p1.g1).toBe('#4f46e5')
    expect(p1.g2).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(p1.g3).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(p1.g4).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(p1.g5).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(p1.g1b).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(p1.g2b).toMatch(/^#[0-9a-fA-F]{6}$/)

    const p2 = generatePalette('#f00')
    expect(p2.g1).toBe('#f00')
    expect(p2.g2).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('reads stored theme with fallbacks', () => {
    expect(getStoredTheme()).toBe('light')

    localStorage.setItem('thoorigai_theme', 'dark')
    expect(getStoredTheme()).toBe('dark')

    localStorage.setItem('thoorigai_theme', 'invalid-theme')
    expect(getStoredTheme()).toBe('light')

    // test localStorage error handling
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('Access denied')
    })
    expect(getStoredTheme()).toBe('light')
  })

  it('reads stored accent with validation', () => {
    expect(getStoredAccent()).toBe('#1f7d52')

    localStorage.setItem('thoorigai_accent', '#059669')
    expect(getStoredAccent()).toBe('#059669')

    localStorage.setItem('thoorigai_accent', 'not-a-color')
    expect(getStoredAccent()).toBe('#1f7d52')

    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('Access denied')
    })
    expect(getStoredAccent()).toBe('#1f7d52')
  })

  it('applies theme and CSS variables to documentElement', () => {
    applyTheme('dark', '#4f46e5')

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.style.getPropertyValue('--g1')).toBe('#4f46e5')
    expect(document.documentElement.style.getPropertyValue('--g2')).toBeTruthy()
    expect(document.documentElement.style.getPropertyValue('--g3')).toBeTruthy()
    expect(document.documentElement.style.getPropertyValue('--g4')).toBeTruthy()
    expect(document.documentElement.style.getPropertyValue('--g5')).toBeTruthy()
    expect(document.documentElement.style.getPropertyValue('--g1b')).toBeTruthy()
    expect(document.documentElement.style.getPropertyValue('--g2b')).toBeTruthy()

    expect(localStorage.getItem('thoorigai_theme')).toBe('dark')
    expect(localStorage.getItem('thoorigai_accent')).toBe('#4f46e5')
  })
})
