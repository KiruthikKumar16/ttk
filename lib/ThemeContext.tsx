'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { type ThemeMode, DEFAULT_THEME, DEFAULT_ACCENT, getStoredTheme, getStoredAccent, applyTheme } from '@/lib/theme'

interface ThemeContextValue {
  theme: ThemeMode
  accent: string
  setTheme: (theme: ThemeMode) => void
  setAccent: (accent: string) => void
  resetToDefault: () => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  toggleSettings: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  accent: DEFAULT_ACCENT,
  setTheme: () => {},
  setAccent: () => {},
  resetToDefault: () => {},
  isSettingsOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
  toggleSettings: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(DEFAULT_THEME)
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    // Read from localStorage on mount
    const savedTheme = getStoredTheme()
    const savedAccent = getStoredAccent()
    setThemeState(savedTheme)
    setAccentState(savedAccent)
    applyTheme(savedTheme, savedAccent)
  }, [])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    applyTheme(newTheme, accent)
  }

  const setAccent = (newAccent: string) => {
    setAccentState(newAccent)
    applyTheme(theme, newAccent)
  }

  const resetToDefault = () => {
    setThemeState(DEFAULT_THEME)
    setAccentState(DEFAULT_ACCENT)
    applyTheme(DEFAULT_THEME, DEFAULT_ACCENT)
  }

  const openSettings = () => startTransition(() => setIsSettingsOpen(true))
  const closeSettings = () => startTransition(() => setIsSettingsOpen(false))
  const toggleSettings = () => startTransition(() => setIsSettingsOpen((prev) => !prev))

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accent,
        setTheme,
        setAccent,
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
