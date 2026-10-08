'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  X,
  Sun,
  Moon,
  RotateCcw,
  Check,
  Sparkles,
  Layers,
  Compass,
  Flame,
} from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import {
  ACCENT_SWATCHES,
  type GradientDirectionPreset,
  type GradientStyle,
  type GlassmorphismLevel,
  applyGradientOnly,
  applyGlassmorphismOnly,
  applyTheme,
} from '@/lib/theme'
import { PillButton } from '@/components/ui/PillButton'
import { KpiCard } from '@/components/ui/KpiCard'
import { Gauge } from '@/components/ui/Gauge'

export function SettingsDrawer() {
  const {
    theme,
    accent,
    gradientConfig,
    setTheme,
    setAccent,
    setGradientConfig,
    resetToDefault,
    isSettingsOpen,
    closeSettings,
  } = useTheme()

  const [customHex, setCustomHex] = useState(accent)
  const [localAngle, setLocalAngle] = useState(gradientConfig.angle)
  const [localIntensity, setLocalIntensity] = useState(gradientConfig.intensity)
  const [localOpacity, setLocalOpacity] = useState(gradientConfig.glassOpacity)
  const [localBlur, setLocalBlur] = useState(gradientConfig.glassBlur)

  const isDark = theme === 'dark'

  // Direct DOM badge display refs for 60+ FPS slider updates without React re-renders
  const angleDisplayRef = useRef<HTMLSpanElement>(null)
  const intensityDisplayRef = useRef<HTMLSpanElement>(null)
  const opacityDisplayRef = useRef<HTMLSpanElement>(null)
  const blurDisplayRef = useRef<HTMLSpanElement>(null)

  // Slider input refs
  const angleInputRef = useRef<HTMLInputElement>(null)
  const intensityInputRef = useRef<HTMLInputElement>(null)
  const opacityInputRef = useRef<HTMLInputElement>(null)
  const blurInputRef = useRef<HTMLInputElement>(null)

  const rafRef = useRef<number | null>(null)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep latest config in ref for RAF callbacks
  const configRef = useRef(gradientConfig)
  useEffect(() => {
    configRef.current = gradientConfig
    setLocalAngle(gradientConfig.angle)
    setLocalIntensity(gradientConfig.intensity)
    setLocalOpacity(gradientConfig.glassOpacity)
    setLocalBlur(gradientConfig.glassBlur)

    if (angleDisplayRef.current) angleDisplayRef.current.textContent = `${gradientConfig.angle}°`
    if (intensityDisplayRef.current) intensityDisplayRef.current.textContent = `${gradientConfig.intensity}%`
    if (opacityDisplayRef.current) opacityDisplayRef.current.textContent = `${gradientConfig.glassOpacity}%`
    if (blurDisplayRef.current) blurDisplayRef.current.textContent = `${gradientConfig.glassBlur}px`

    if (angleInputRef.current) angleInputRef.current.value = String(gradientConfig.angle)
    if (intensityInputRef.current) intensityInputRef.current.value = String(gradientConfig.intensity)
    if (opacityInputRef.current) opacityInputRef.current.value = String(gradientConfig.glassOpacity)
    if (blurInputRef.current) blurInputRef.current.value = String(gradientConfig.glassBlur)
  }, [gradientConfig])

  const accentRef = useRef(accent)
  useEffect(() => {
    accentRef.current = accent
    setCustomHex(accent)
  }, [accent])

  const themeRef = useRef(theme)
  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  // ESC key handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        closeSettings()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isSettingsOpen, closeSettings])

  if (!isSettingsOpen) return null

  const startDrag = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('theme-dragging')
    }
  }

  const stopDrag = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-dragging')
    }
  }

  // --- High Performance 60 FPS Angle Slider ---
  const handleAngleInput = (e: React.FormEvent<HTMLInputElement>) => {
    startDrag()
    const val = Number((e.currentTarget as HTMLInputElement).value)
    if (angleDisplayRef.current) angleDisplayRef.current.textContent = `${val}°`

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const updated = {
        ...configRef.current,
        angle: val,
        directionPreset: '135deg' as const,
        style: 'linear' as const,
      }
      configRef.current = updated
      applyGradientOnly(accentRef.current, themeRef.current, updated)
    })
  }

  const handleAngleCommit = (e: React.FormEvent<HTMLInputElement> | React.PointerEvent<HTMLInputElement>) => {
    stopDrag()
    const val = Number((e.currentTarget as HTMLInputElement).value)
    setLocalAngle(val)
    setGradientConfig({ angle: val, directionPreset: '135deg', style: 'linear' })
  }

  // --- High Performance 60 FPS Intensity Slider ---
  const handleIntensityInput = (e: React.FormEvent<HTMLInputElement>) => {
    startDrag()
    const val = Number((e.currentTarget as HTMLInputElement).value)
    if (intensityDisplayRef.current) intensityDisplayRef.current.textContent = `${val}%`

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const updated = { ...configRef.current, intensity: val }
      configRef.current = updated
      applyGradientOnly(accentRef.current, themeRef.current, updated)
    })
  }

  const handleIntensityCommit = (e: React.FormEvent<HTMLInputElement> | React.PointerEvent<HTMLInputElement>) => {
    stopDrag()
    const val = Number((e.currentTarget as HTMLInputElement).value)
    setLocalIntensity(val)
    setGradientConfig({ intensity: val })
  }

  // --- High Performance 60 FPS Opacity Slider ---
  const handleOpacityInput = (e: React.FormEvent<HTMLInputElement>) => {
    startDrag()
    const val = Number((e.currentTarget as HTMLInputElement).value)
    if (opacityDisplayRef.current) opacityDisplayRef.current.textContent = `${val}%`

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const updated = { ...configRef.current, glassOpacity: val }
      configRef.current = updated
      applyGlassmorphismOnly(themeRef.current, accentRef.current, updated)
    })
  }

  const handleOpacityCommit = (e: React.FormEvent<HTMLInputElement> | React.PointerEvent<HTMLInputElement>) => {
    stopDrag()
    const val = Number((e.currentTarget as HTMLInputElement).value)
    setLocalOpacity(val)
    setGradientConfig({ glassOpacity: val })
  }

  // --- High Performance 60 FPS Blur Slider ---
  const handleBlurInput = (e: React.FormEvent<HTMLInputElement>) => {
    startDrag()
    const val = Number((e.currentTarget as HTMLInputElement).value)
    if (blurDisplayRef.current) blurDisplayRef.current.textContent = `${val}px`

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const updated = { ...configRef.current, glassBlur: val }
      configRef.current = updated
      applyGlassmorphismOnly(themeRef.current, accentRef.current, updated)
    })
  }

  const handleBlurCommit = (e: React.FormEvent<HTMLInputElement> | React.PointerEvent<HTMLInputElement>) => {
    stopDrag()
    const val = Number((e.currentTarget as HTMLInputElement).value)
    setLocalBlur(val)
    setGradientConfig({ glassBlur: val })
  }

  // --- Instant Swatch Selection ---
  const handleSwatchClick = (hex: string) => {
    setCustomHex(hex)
    accentRef.current = hex
    applyTheme(theme, hex, configRef.current)
    setAccent(hex)
  }

  const handleCustomColorInput = (newHex: string) => {
    setCustomHex(newHex)
    accentRef.current = newHex
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      applyTheme(themeRef.current, newHex, configRef.current)
    })
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      setAccent(newHex)
    }, 120)
  }

  const directionOptions: {
    label: string
    preset: GradientDirectionPreset
    angle: number
    style: GradientStyle
    icon: string
  }[] = [
    { label: 'Diagonal ↘', preset: '135deg', angle: 135, style: 'linear', icon: '↘' },
    { label: 'Vertical ↓', preset: '180deg', angle: 180, style: 'linear', icon: '↓' },
    { label: 'Horizontal →', preset: '90deg', angle: 90, style: 'linear', icon: '→' },
    { label: 'Ascending ↗', preset: '45deg', angle: 45, style: 'linear', icon: '↗' },
    { label: 'Spotlight ◉', preset: 'radial', angle: 135, style: 'radial', icon: '◉' },
    { label: 'Aurora ✦', preset: 'mesh', angle: 135, style: 'mesh', icon: '✦' },
  ]

  const intensityPresets = [
    { label: 'Soft', value: 24 },
    { label: 'Calm', value: 36 },
    { label: 'Balanced', value: 48 },
    { label: 'Vibrant', value: 72 },
    { label: 'Rich', value: 92 },
  ]

  const popLevels: { key: GlassmorphismLevel; label: string; desc: string }[] = [
    { key: 'subtle', label: 'Subtle Float', desc: 'Soft shadow & gentle blur' },
    { key: 'balanced', label: 'Balanced Pop', desc: 'Specular edge & rich depth' },
    { key: 'deep', label: 'Deep 3D Pop', desc: 'High contrast gloss & elevation' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Appearance & Portal Settings"
    >
      {/* Backdrop — High performance semi-transparent overlay (no full-screen GPU blur) */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity duration-200"
        onClick={closeSettings}
        aria-hidden="true"
      />

      {/* Drawer Panel — Solid opaque background respecting active theme */}
      <div
        className={`relative z-10 flex h-full w-full max-w-lg flex-col ${
          isDark ? 'bg-[#0e1713]' : 'bg-[#ffffff]'
        } text-[var(--text)] shadow-2xl transition-transform animate-in slide-in-from-right duration-250 border-l border-[var(--border)] overflow-y-auto`}
      >
        {/* Drawer Header — Solid opaque background respecting active theme */}
        <div
          className={`flex items-center justify-between border-b border-[var(--border)] px-6 py-5 sticky top-0 ${
            isDark ? 'bg-[#0e1713]' : 'bg-[#ffffff]'
          } z-30 shadow-[0_1px_4px_rgba(0,0,0,0.02)]`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--g1) 0%, var(--g1b) 100%)' }}
            >
              <Sparkles size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-heading)]">Portal Appearance & Theme</h2>
              <p className="text-xs text-[var(--mute)]">Canvas gradient & glassmorphism engine</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--mute)] hover:bg-[var(--hover-bg)] hover:text-[var(--text)] transition-colors cursor-pointer"
            aria-label="Close settings drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 space-y-7 p-6">
          {/* Section 1: Mode (Light / Dark) inside Card Container */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)]">
              Interface Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2.5 rounded-[14px] border p-3.5 text-sm font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-[var(--g1)] bg-[var(--g4)] text-[var(--g1)] shadow-xs font-bold'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--mute)] hover:text-[var(--text)]'
                }`}
              >
                <Sun size={17} />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2.5 rounded-[14px] border p-3.5 text-sm font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[var(--g1)] bg-[var(--g4)] text-[var(--g1)] shadow-xs font-bold'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--mute)] hover:text-[var(--text)]'
                }`}
              >
                <Moon size={17} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Section 2: Accent Swatches inside Card Container */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)]">
                Brand Accent Swatches
              </label>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--g1)] font-semibold uppercase">
                {accent}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {ACCENT_SWATCHES.map((swatch) => {
                const isSelected = accent.toLowerCase() === swatch.hex.toLowerCase()
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => handleSwatchClick(swatch.hex)}
                    title={swatch.name}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-[14px] border p-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--g1)] bg-[var(--g4)] text-[var(--g1)] font-bold shadow-xs'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--mute)] hover:text-[var(--text)] hover:border-[var(--border)]/80'
                    }`}
                  >
                    <div
                      className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-xs transition-transform group-hover:scale-110"
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isSelected && <Check size={14} className="text-white drop-shadow-sm" />}
                    </div>
                    <span className="text-[10px] font-medium truncate w-full text-center">
                      {swatch.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}

              {/* Custom Color Input */}
              <label className="group relative flex flex-col items-center gap-1.5 rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-2.5 transition-all hover:bg-[var(--hover-bg)] cursor-pointer">
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-xs transition-transform group-hover:scale-110 overflow-hidden"
                  style={{
                    background:
                      'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #FFFF00 60deg, #00FF00 120deg, #00FFFF 180deg, #0000FF 240deg, #FF00FF 300deg, #FF0000 360deg)',
                  }}
                >
                  <input
                    type="color"
                    value={customHex}
                    onPointerDown={startDrag}
                    onPointerUp={stopDrag}
                    onChange={(e) => handleCustomColorInput(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Choose custom accent color"
                  />
                </div>
                <span className="text-[10px] font-medium text-[var(--mute)]">Custom</span>
              </label>
            </div>
          </div>

          {/* Section 3: Canvas Gradient Engine */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-[var(--g1)]" />
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)]">
                  Canvas Gradient Engine
                </label>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--g1)] font-semibold">
                {gradientConfig.style === 'radial'
                  ? 'Radial Spotlight'
                  : gradientConfig.style === 'mesh'
                    ? 'Aurora Mesh'
                    : `${localAngle}° Linear`}
              </span>
            </div>

            {/* Direction Presets */}
            <div>
              <p className="text-[11px] font-medium text-[var(--mute)] mb-2.5">Gradient Direction & Style</p>
              <div className="grid grid-cols-3 gap-2">
                {directionOptions.map((opt) => {
                  const isActive =
                    gradientConfig.directionPreset === opt.preset ||
                    (opt.style === 'linear' &&
                      gradientConfig.style === 'linear' &&
                      gradientConfig.angle === opt.angle)
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...configRef.current,
                          directionPreset: opt.preset,
                          angle: opt.angle,
                          style: opt.style,
                        }
                        configRef.current = updated
                        setLocalAngle(opt.angle)
                        if (angleDisplayRef.current) angleDisplayRef.current.textContent = `${opt.angle}°`
                        if (angleInputRef.current) angleInputRef.current.value = String(opt.angle)
                        applyGradientOnly(accentRef.current, themeRef.current, updated)
                        setGradientConfig(updated)
                      }}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-[12px] border text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'border-[var(--g1)] bg-[var(--g4)] text-[var(--g1)] font-bold shadow-xs'
                          : 'border-[var(--border)] bg-[var(--card)]/60 text-[var(--mute)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span className="text-sm">{opt.icon}</span>
                      <span>{opt.label.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Angle Slider (Butter smooth 60 FPS) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[11px] font-medium text-[var(--mute)]">Angle Degree</span>
                <span ref={angleDisplayRef} className="font-mono text-xs font-bold text-[var(--text-heading)]">
                  {localAngle}°
                </span>
              </div>
              <input
                ref={angleInputRef}
                type="range"
                min="0"
                max="360"
                step="5"
                defaultValue={localAngle}
                onPointerDown={startDrag}
                onPointerUp={handleAngleCommit}
                onInput={handleAngleInput}
                onChange={handleAngleCommit}
                className="w-full accent-[var(--g1)] cursor-pointer"
              />
            </div>

            {/* Gradient Intensity (Butter smooth 60 FPS) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--mute)]">
                  <Flame size={13} className="text-[var(--g1)]" />
                  <span>Gradient Color Intensity</span>
                </div>
                <span ref={intensityDisplayRef} className="font-mono text-xs font-bold text-[var(--text-heading)]">
                  {localIntensity}%
                </span>
              </div>
              <input
                ref={intensityInputRef}
                type="range"
                min="10"
                max="100"
                step="2"
                defaultValue={localIntensity}
                onPointerDown={startDrag}
                onPointerUp={handleIntensityCommit}
                onInput={handleIntensityInput}
                onChange={handleIntensityCommit}
                className="w-full accent-[var(--g1)] cursor-pointer"
              />

              {/* Intensity Presets */}
              <div className="mt-2.5 flex items-center justify-between gap-1.5">
                {intensityPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const updated = { ...configRef.current, intensity: preset.value }
                      configRef.current = updated
                      setLocalIntensity(preset.value)
                      if (intensityDisplayRef.current) intensityDisplayRef.current.textContent = `${preset.value}%`
                      if (intensityInputRef.current) intensityInputRef.current.value = String(preset.value)
                      applyGradientOnly(accentRef.current, themeRef.current, updated)
                      setGradientConfig({ intensity: preset.value })
                    }}
                    className={`flex-1 py-1 rounded-[10px] text-[10px] font-bold border transition-all cursor-pointer ${
                      localIntensity === preset.value
                        ? 'border-[var(--g1)] bg-[var(--g4)] text-[var(--g1)]'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--mute)] hover:text-[var(--text)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Card Glassmorphism & Pop Engine */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[var(--g1)]" />
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)]">
                  Card Glassmorphism & Pop
                </label>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--g1)] font-semibold capitalize">
                {gradientConfig.glassPop}
              </span>
            </div>

            {/* Pop Levels */}
            <div className="space-y-2">
              {popLevels.map((lvl) => {
                const isActive = gradientConfig.glassPop === lvl.key
                return (
                  <button
                    key={lvl.key}
                    type="button"
                    onClick={() => {
                      const updated = { ...configRef.current, glassPop: lvl.key }
                      configRef.current = updated
                      applyGlassmorphismOnly(themeRef.current, accentRef.current, updated)
                      setGradientConfig({ glassPop: lvl.key })
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-[14px] border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-[var(--g1)] bg-[var(--g4)] text-[var(--g1)] shadow-xs'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:border-[var(--border)]/80'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{lvl.label}</div>
                      <div className="text-[11px] text-[var(--mute)]">{lvl.desc}</div>
                    </div>
                    {isActive && <Check size={16} className="text-[var(--g1)]" />}
                  </button>
                )
              })}
            </div>

            {/* Card Opacity Slider (Butter smooth 60 FPS) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[11px] font-medium text-[var(--mute)]">Glass Surface Opacity</span>
                <span ref={opacityDisplayRef} className="font-mono text-xs font-bold text-[var(--text-heading)]">
                  {localOpacity}%
                </span>
              </div>
              <input
                ref={opacityInputRef}
                type="range"
                min="50"
                max="95"
                step="1"
                defaultValue={localOpacity}
                onPointerDown={startDrag}
                onPointerUp={handleOpacityCommit}
                onInput={handleOpacityInput}
                onChange={handleOpacityCommit}
                className="w-full accent-[var(--g1)] cursor-pointer"
              />
            </div>

            {/* Blur Intensity Slider (Butter smooth 60 FPS) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[11px] font-medium text-[var(--mute)]">Backdrop Blur Strength</span>
                <span ref={blurDisplayRef} className="font-mono text-xs font-bold text-[var(--text-heading)]">
                  {localBlur}px
                </span>
              </div>
              <input
                ref={blurInputRef}
                type="range"
                min="8"
                max="32"
                step="2"
                defaultValue={localBlur}
                onPointerDown={startDrag}
                onPointerUp={handleBlurCommit}
                onInput={handleBlurInput}
                onChange={handleBlurCommit}
                className="w-full accent-[var(--g1)] cursor-pointer"
              />
            </div>
          </div>

          {/* Section 5: Live Signature Visuals Preview */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--g1)]" />
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)]">
                Live Signature Visuals Preview
              </label>
            </div>
            <div
              className="space-y-3 rounded-xl border border-[var(--border)] p-4 relative overflow-hidden shadow-sm"
              style={{
                background: 'var(--bg-canvas-gradient)',
                backgroundColor: 'var(--bg-canvas-color)',
              }}
            >
              {/* Glassmorphic KPI Card floating on the gradient */}
              <KpiCard
                title="Active Curriculum"
                value="94.8%"
                subtitle="Attendance & delivery health"
                badge={{ text: 'Excellent' }}
              />

              <div
                className="flex items-center justify-between rounded-[14px] p-3 border border-[var(--card-glass-border)]"
                style={{
                  background: 'var(--card-glass-bg)',
                  boxShadow: 'var(--card-glass-shadow)',
                }}
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[var(--text-heading)]">Pill Controls</span>
                  <p className="text-[11px] text-[var(--mute)]">Dynamic accent styling</p>
                </div>
                <PillButton size="sm">Primary Action</PillButton>
              </div>

              <div className="flex justify-center p-2">
                <Gauge value={85} size={110} strokeWidth={10} label="Curriculum Velocity" />
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer — Solid opaque background respecting active theme */}
        <div
          className={`flex items-center justify-between border-t border-[var(--border)] p-5 ${
            isDark ? 'bg-[#0e1713]' : 'bg-[#ffffff]'
          } sticky bottom-0 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]`}
        >
          <button
            type="button"
            onClick={resetToDefault}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--mute)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset to default</span>
          </button>

          <PillButton size="sm" onClick={closeSettings}>
            Done
          </PillButton>
        </div>
      </div>
    </div>
  )
}
