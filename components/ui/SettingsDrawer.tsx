'use client'

import React, { useEffect, useState } from 'react'
import { X, Sun, Moon, RotateCcw, Check, Sparkles } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { ACCENT_SWATCHES, DEFAULT_ACCENT, DEFAULT_THEME } from '@/lib/theme'
import { PillButton } from '@/components/ui/PillButton'
import { KpiCard } from '@/components/ui/KpiCard'
import { Gauge } from '@/components/ui/Gauge'

export function SettingsDrawer() {
  const {
    theme,
    accent,
    setTheme,
    setAccent,
    resetToDefault,
    isSettingsOpen,
    closeSettings,
  } = useTheme()

  const [customHex, setCustomHex] = useState(accent)

  useEffect(() => {
    setCustomHex(accent)
  }, [accent])

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

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Appearance & Portal Settings"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={closeSettings}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-[var(--card)] text-[var(--text)] shadow-2xl transition-transform animate-in slide-in-from-right duration-250 border-l border-[var(--border)] overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, var(--g1) 0%, var(--g1b) 100%)' }}
            >
              <Sparkles size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-heading)]">Portal Appearance</h2>
              <p className="text-xs text-[var(--mute)]">Customize theme and accent colors</p>
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
          {/* Section 1: Mode (Light / Dark) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--mute)]">
              Interface Theme
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2.5 rounded-[18px] border p-3.5 text-sm font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-[var(--g1)] bg-[var(--g4)] text-[var(--g1)] shadow-sm'
                    : 'border-[var(--border)] bg-[var(--panel)] text-[var(--mute)] hover:text-[var(--text)]'
                }`}
              >
                <Sun size={17} />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2.5 rounded-[18px] border p-3.5 text-sm font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[var(--g1)] bg-[var(--g4)] text-[var(--g1)] shadow-sm'
                    : 'border-[var(--border)] bg-[var(--panel)] text-[var(--mute)] hover:text-[var(--text)]'
                }`}
              >
                <Moon size={17} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Section 2: Accent Swatches */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--mute)]">
                Brand Accent Swatches
              </label>
              <span className="text-[11px] font-mono font-medium text-[var(--mute)] uppercase">
                {accent}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2.5">
              {ACCENT_SWATCHES.map((swatch) => {
                const isSelected = accent.toLowerCase() === swatch.hex.toLowerCase()
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => {
                      setAccent(swatch.hex)
                      setCustomHex(swatch.hex)
                    }}
                    title={swatch.name}
                    className="group relative flex flex-col items-center gap-1.5 rounded-[16px] border border-[var(--border)] p-2 transition-all hover:bg-[var(--hover-bg)] cursor-pointer"
                  >
                    <div
                      className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-xs transition-transform group-hover:scale-110"
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isSelected && <Check size={14} className="text-white drop-shadow-sm" />}
                    </div>
                    <span className="text-[10px] font-medium text-[var(--mute)] truncate w-full text-center">
                      {swatch.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}

              {/* Custom Color Input */}
              <label className="group relative flex flex-col items-center gap-1.5 rounded-[16px] border border-[var(--border)] p-2 transition-all hover:bg-[var(--hover-bg)] cursor-pointer">
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
                    onChange={(e) => {
                      setCustomHex(e.target.value)
                      setAccent(e.target.value)
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Choose custom accent color"
                  />
                </div>
                <span className="text-[10px] font-medium text-[var(--mute)]">Custom</span>
              </label>
            </div>
          </div>

          {/* Section 3: Live Preview Demonstration */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--mute)]">
              Live Signature Visuals Preview
            </label>
            <div className="mt-3 space-y-3 rounded-[22px] border border-[var(--border)] bg-[var(--panel)] p-4">
              <KpiCard
                variant="hero"
                title="Active Curriculum"
                value="94.8%"
                subtitle="Attendance & delivery health"
                badge={{ text: 'Excellent' }}
              />

              <div className="flex items-center justify-between rounded-[18px] bg-[var(--card)] p-3 border border-[var(--card-border)]">
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

        {/* Drawer Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] p-5 bg-[var(--panel)]">
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
