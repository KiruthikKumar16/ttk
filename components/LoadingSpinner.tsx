'use client'

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useIsFetching } from '@tanstack/react-query'

function TopProgressBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFetching = useIsFetching()
  const [navigating, setNavigating] = useState(false)
  const [fetchCount, setFetchCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isActive = navigating || isFetching > 0 || fetchCount > 0

  // Finish progress to 100% and smoothly fade out
  const finishProgress = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current)
      safetyTimeoutRef.current = null
    }

    setProgress(100)
    finishTimeoutRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        setProgress(0)
        setNavigating(false)
      }, 300)
    }, 200)
  }, [])

  // Start or advance progress while loading
  const startProgress = useCallback(() => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)
    setVisible(true)
    setProgress((prev) => (prev === 0 ? 20 : prev))

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) return 88
          const step = Math.max(1, Math.floor((88 - prev) * 0.15))
          return prev + step
        })
      }, 200)
    }

    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
    safetyTimeoutRef.current = setTimeout(() => {
      finishProgress()
    }, 15000)
  }, [finishProgress])

  // Watch active state
  useEffect(() => {
    if (isActive) {
      startProgress()
    } else if (visible && progress > 0) {
      finishProgress()
    }
  }, [isActive, visible, progress, startProgress, finishProgress])

  // Route change complete
  useEffect(() => {
    setNavigating(false)
  }, [pathname, searchParams])

  // Intercept click on links to start navigation progress immediately
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as Element)?.closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href) return

      // Ignore external, target blank, downloads, hash links, or modifier keys
      if (
        target.target === '_blank' ||
        target.hasAttribute('download') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }

      try {
        const targetUrl = new URL(href, window.location.href)
        const currentUrl = new URL(window.location.href)
        if (
          targetUrl.origin === currentUrl.origin &&
          (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
        ) {
          setNavigating(true)
          startProgress()
        }
      } catch {
        // ignore invalid urls
      }
    }

    document.addEventListener('click', handleAnchorClick, { capture: true })
    return () => document.removeEventListener('click', handleAnchorClick, { capture: true })
  }, [startProgress])

  // Intercept global fetch to keep progress bar active until all API data is fetched
  useEffect(() => {
    if (typeof window === 'undefined') return
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || ''
      const isInternalApi = url.includes('/api/') || url.startsWith('/api/')

      if (isInternalApi) {
        setFetchCount((prev) => prev + 1)
      }

      try {
        return await originalFetch(...args)
      } finally {
        if (isInternalApi) {
          setFetchCount((prev) => Math.max(0, prev - 1))
        }
      }
    }

    const handleStart = () => {
      setNavigating(true)
      startProgress()
    }
    const handleStop = () => {
      setNavigating(false)
    }

    window.addEventListener('app:loading-start', handleStart)
    window.addEventListener('app:loading-stop', handleStop)

    return () => {
      window.fetch = originalFetch
      window.removeEventListener('app:loading-start', handleStart)
      window.removeEventListener('app:loading-stop', handleStop)
      if (timerRef.current) clearInterval(timerRef.current)
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
    }
  }, [startProgress])

  if (!visible && progress === 0) return null

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading progress"
      className="fixed top-0 left-0 right-0 z-[99999] h-[3px] pointer-events-none transition-opacity duration-300"
      style={{
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="h-full relative transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--g1, #1f7d52) 0%, var(--g2, #279664) 50%, var(--g3, #34ad77) 100%)',
          boxShadow: '0 0 10px var(--g1, #1f7d52), 0 0 5px var(--g3, #34ad77)',
        }}
      >
        {/* Glowing leading head */}
        <div
          className="absolute right-0 top-0 bottom-0 w-24 opacity-80"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 100%)',
            filter: 'blur(1px)',
          }}
        />
      </div>
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <Suspense fallback={null}>
      <TopProgressBarInner />
    </Suspense>
  )
}
