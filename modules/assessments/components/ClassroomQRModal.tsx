'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, ExternalLink, QrCode, Smartphone } from 'lucide-react'
import QRCode from 'qrcode'

interface ClassroomQRModalProps {
  isOpen: boolean
  onClose: () => void
  formUrl: string
  title: string
  courseName: string
}

export function ClassroomQRModal({ isOpen, onClose, formUrl, title, courseName }: ClassroomQRModalProps) {
  const [copied, setCopied] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState<string>('')

  useEffect(() => {
    if (!formUrl) return
    let isMounted = true
    QRCode.toDataURL(formUrl, { width: 300, margin: 2, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (isMounted) setQrImageUrl(url)
      })
      .catch(() => {
        if (isMounted) {
          setQrImageUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=15&data=${encodeURIComponent(formUrl)}`,
          )
        }
      })
    return () => {
      isMounted = false
    }
  }, [formUrl])

  if (!isOpen || !formUrl) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-center p-6 space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          title="Close modal"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="space-y-1 pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <QrCode size={13} />
            Classroom Live Projector
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 pt-1 line-clamp-2">{title}</h2>
          <p className="text-xs text-slate-500 font-medium">{courseName}</p>
        </div>

        {/* QR Code Container */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 inline-block shadow-inner">
          <img
            src={qrImageUrl}
            alt={`QR code for ${title}`}
            width={240}
            height={240}
            className="mx-auto rounded-xl shadow-2xs"
          />
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium">
          <Smartphone size={14} className="text-indigo-600" />
          <span>Ask students to scan using their phone camera to start the quiz.</span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-slate-500" />
                <span>Copy Student Link</span>
              </>
            )}
          </button>

          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full py-2.5 px-4 rounded-xl text-xs font-semibold shadow-2xs inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open Form</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
