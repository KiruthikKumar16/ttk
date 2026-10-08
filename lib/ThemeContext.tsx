'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import {
  type ThemeMode,
  DEFAULT_THEME,
  DEFAULT_ACCENT,
  DEFAULT_GRADIENT_CONFIG,
  type GradientConfig,
  getStoredTheme,
  getStoredAccent,
  getStoredGradientConfig,
  applyTheme,
} from '@/lib/theme'

interface ThemeContextValue {
  theme: ThemeMode
  accent: string
  gradientConfig: GradientConfig
  setTheme: (theme: ThemeMode) => void
  setAccent: (accent: string) => void
  setGradientConfig: (config: Partial<GradientConfig>) => void
  resetToDefault: () => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  toggleSettings: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  accent: DEFAULT_ACCENT,
  gradientConfig: DEFAULT_GRADIENT_CONFIG,
  setTheme: () => {},
  setAccent: () => {},
  setGradientConfig: () => {},
  resetToDefault: () => {},
  isSettingsOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
  toggleSettings: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(DEFAULT_THEME)
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT)
  const [gradientConfig, setGradientConfigState] = useState<GradientConfig>(DEFAULT_GRADIENT_CONFIG)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    // Read from localStorage on mount
    const savedTheme = getStoredTheme()
    const savedAccent = getStoredAccent()
    const savedGradient = getStoredGradientConfig()
    setThemeState(savedTheme)
    setAccentState(savedAccent)
    setGradientConfigState(savedGradient)
    applyTheme(savedTheme, savedAccent, savedGradient)
  }, [])

  const setTheme = (newTheme: ThemeMode) => {
    applyTheme(newTheme, accent, gradientConfig)
    startTransition(() => {
      setThemeState(newTheme)
    })
  }

  const setAccent = (newAccent: string) => {
    applyTheme(theme, newAccent, gradientConfig)
    startTransition(() => {
      setAccentState(newAccent)
    })
  }

  const setGradientConfig = (updated: Partial<GradientConfig>) => {
    setGradientConfigState((prev) => {
      const next = { ...prev, ...updated }
      applyTheme(theme, accent, next)
      return next
    })
  }

  const resetToDefault = () => {
    setThemeState(DEFAULT_THEME)
    setAccentState(DEFAULT_ACCENT)
    setGradientConfigState(DEFAULT_GRADIENT_CONFIG)
    applyTheme(DEFAULT_THEME, DEFAULT_ACCENT, DEFAULT_GRADIENT_CONFIG)
  }

  const openSettings = () => startTransition(() => setIsSettingsOpen(true))
  const closeSettings = () => startTransition(() => setIsSettingsOpen(false))
  const toggleSettings = () => startTransition(() => setIsSettingsOpen((prev) => !prev))

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accent,
        gradientConfig,
        setTheme,
        setAccent,
        setGradientConfig,
        resetToDefault,
        isSettingsOpen,
        openSettings,
        closeSettings,
        toggleSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
