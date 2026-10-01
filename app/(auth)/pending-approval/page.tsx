'use client'

import Image from 'next/image'
import Link from 'next/link'
import { brand } from '@/lib/brand'
import { Clock, ShieldAlert, ArrowRight } from 'lucide-react'

export default function PendingApprovalPage() {
  return (
    <main className="login-page">
      <section className="login-card text-center" aria-labelledby="pending-title">
        <Image
          className="login-logo"
          src={brand.logoPath}
          alt={`${brand.shortName} logo`}
          width={76}
          height={76}
          sizes="76px"
          priority
        />
        <p className="login-brand">{brand.displayName}</p>

        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto my-4 shadow-xs">
          <Clock size={28} />
        </div>

        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider mb-2">
          Approval Required
        </span>

        <h1 id="pending-title" className="text-xl font-bold text-slate-900 mb-2">
          Account Pending Authorization
        </h1>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Your account has been registered, but has not yet been approved by an academy administrator. For security and
          privacy reasons, access to classroom data and students is restricted until verified.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 mb-6 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <ShieldAlert size={14} className="text-amber-600" />
            <span>How to get authorized:</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Administrators receive real-time alerts when new access requests are filed. If your request is urgent,
            contact your branch director or department supervisor to expedite role activation.
          </p>
        </div>

        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          Return to Sign In <ArrowRight size={14} />
        </Link>
      </section>
    </main>
  )
}
