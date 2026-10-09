'use client'

import React from 'react'
import Image from 'next/image'
import { brand } from '@/lib/brand'

interface AuthShellProps {
  children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-100 selection:bg-[#1f7d52] selection:text-white">
      {/* Background Ambient Mesh & Subtle Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(15, 23, 42, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: '#1f7d52' }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: '#34ad77' }}
        aria-hidden="true"
      />

      {/* Main Single Box Card */}
      <div className="w-full max-w-md rounded-[28px] sm:rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] relative z-10 transition-all">
        {/* Logo at Top */}
        <div className="flex justify-center mb-5">
          <Image
            src={brand.logoPath}
            alt={`${brand.shortName} logo`}
            width={112}
            height={112}
            priority
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
          />
        </div>

        {children}
      </div>
    </main>
  )
}


