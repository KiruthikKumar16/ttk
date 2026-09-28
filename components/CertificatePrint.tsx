'use client'

import { ArrowLeft, CheckCircle2, Printer, RefreshCw, Save as SaveIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CertificateRecord, Student } from '@/lib/types'
import { useEffect, useRef, useState, cloneElement } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { brand } from '@/lib/brand'

const CERT_W = 620
const CERT_H = 877

const DEFAULT_SKILLS = [
  'Project Development',
  'Data Analysis',
  'Team Collaboration',
  'Problem Solving',
]

function todayISO() {
  const today = new Date()
  return (
    today.getFullYear() +
    '-' +
    String(today.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(today.getDate()).padStart(2, '0')
  )
}

function fmtDate(v: string) {
  if (!v) return '—'
  const d = new Date(v + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function genCertId() {
  const y = new Date().getFullYear()
  const n = Math.floor(1 + Math.random() * 9998).toString().padStart(4, '0')
  return `TAI-${y}-${n}`
}

function parseBatchToISO(batch: string) {
  if (!batch) return ''
  const d = new Date(batch)
  if (!isNaN(d.getTime())) {
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    )
  }
  return ''
}

type CertFormState = {
  studentName: string
  courseName: string
  startDate: string
  endDate: string
  issueDate: string
  certId: string
  skills: string
  director: string
  trainer: string
}

export function CertificatePrint({
  student,
  onBack,
  className,
  certificateRecord
}: {
  student: Student;
  onBack: () => void;
  className?: string;
  certificateRecord?: CertificateRecord
}) {
  const [form, setForm] = useState<CertFormState>(() => {
    // If we have certificate record data (for viewing existing certificates), use it
    if (certificateRecord) {
      return {
        studentName: certificateRecord.studentName,
        courseName: certificateRecord.courseName,
        startDate: certificateRecord.startDate ?? parseBatchToISO(student.batch),
        endDate: certificateRecord.endDate ?? todayISO(),
        issueDate: certificateRecord.issueDate ?? todayISO(),
        certId: certificateRecord.certificateId ?? `TAI-${new Date().getFullYear()}-${String(student.registerId).padStart(4, '0')}`,
        skills: certificateRecord.skills ? certificateRecord.skills.join('\n') : DEFAULT_SKILLS.join('\n'),
        director: certificateRecord.directorName ?? 'Dr. K. Subramanian',
        trainer: certificateRecord.trainerName ?? 'A. Ravichandran',
      }
    }

    // Otherwise, use student data for preview mode
    return {
      studentName: student.name,
      courseName: student.course,
      startDate: parseBatchToISO(student.batch),
      endDate: todayISO(),
      issueDate: todayISO(),
      certId: `TAI-${new Date().getFullYear()}-${String(student.registerId).padStart(4, '0')}`,
      skills: DEFAULT_SKILLS.join('\n'),
      director: 'Dr. K. Subramanian',
      trainer: 'A. Ravichandran',
    }
  })

  // Add print styles when component mounts
  useEffect(() => {
    // Create style element for print media
    const style = document.createElement('style')
    style.textContent = `
      .cert-print-root { display: none; }
      @media print {
        @page { size: A4 portrait; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        body > *:not(.cert-print-root) { display: none !important; }
        .cert-print-root {
          display: flex; align-items: center; justify-content: center;
          position: fixed; top: 0; left: 0;
          width: 210mm; height: 297mm; overflow: hidden; background: #fffdf8;
        }
        .cert-print-root .ttk-certificate {
          width: 620px; height: 877px; margin: 0;
          transform: scale(min(calc(210mm / 620px), calc(297mm / 877px)));
          transform-origin: center center;
          box-shadow: none;
        }
        .cert-print-root, .cert-print-root * {
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const skillsArray = form.skills
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  const containerRef = useRef<HTMLElement>(null)
  const [scale, setScale] = useState(1)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const scaleX = width / CERT_W
        const scaleY = height / CERT_H
        setScale(Math.min(scaleX, scaleY, 1))
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Generate QR code when verification code changes
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Use certificateRecord verification_code if available (for viewing existing certificates)
        // Otherwise use form.verification_code (for preview mode, which will be undefined)
        const verificationCode = certificateRecord?.verificationCode
        if (verificationCode) {
          const verificationUrl = `${brand.verifyBaseUrl}/verify/${verificationCode}`
          const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 120,
            margin: 1,
          })
          setQrCode(qrCodeDataUrl)
        } else {
          setQrCode(null)
        }
      } catch (err) {
        console.error('Failed to generate QR code:', err)
        setQrCode(null)
      }
    }

    generateQRCode()
  }, [certificateRecord?.verificationCode])

  const set = <K extends keyof CertFormState>(key: K, value: CertFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const regenId = () => set('certId', genCertId())

  const resetForm = () => {
    setForm({
      studentName: '',
      courseName: '',
      startDate: '',
      endDate: '',
      issueDate: todayISO(),
      certId: genCertId(),
      skills: '',
      director: '',
      trainer: '',
    })
    setSaveStatus('idle')
    setSaveError(null)
  }

  const persistCertificate = async () => {
    try {
      setSaveStatus('saving')
      setSaveError(null)
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: form.certId,
          studentRowId: student.id ?? null,
          studentRegisterId: student.registerId,
          courseName: form.courseName,
          studentName: form.studentName,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          issueDate: form.issueDate,
          skills: skillsArray,
          directorName: form.director || null,
          trainerName: form.trainer || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed to save certificate' }))
        throw new Error(body.error || `Request failed (${res.status})`)
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 4000)
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const certificate = (
            <article className="ttk-certificate">
              <div className="corner-tri tl" />
              <div className="corner-tri tr" />
              <div className="corner-tri bl" />
              <div className="corner-tri br" />
              <div className="corner-gold tl" />
              <div className="corner-gold tr" />
              <div className="corner-gold bl" />
              <div className="corner-gold br" />
              <div className="frame-border" />
              <div className="frame-gold" />

              <div className="cert-inner">
                <div className="cert-logo">
                  <img src={brand.logoPath} alt={brand.shortName} />
                </div>

                <div className="cert-title">
                  CERTIFICATE OF<br />COMPLETION
                </div>
                <div className="divider">
                  <span className="ln" />
                  <span className="star">★</span>
                  <span className="ln" />
                </div>

                <div className="cert-lead">This is to certify that</div>
                <div className="cert-name">{form.studentName || 'Student Name'}</div>
                <div className="cert-name-rule" />

                <div className="cert-body">
                  has successfully completed the{' '}
                  <b>{form.courseName || 'Course Name'}</b> Program at{' '}
                  <b>{brand.legalName}</b>, from{' '}
                  <b>{fmtDate(form.startDate)}</b> to{' '}
                  <b>{fmtDate(form.endDate)}</b>.
                </div>

                <div className="cert-note">
                  During the Course, the candidate demonstrated dedication, professionalism, and
                  technical proficiency in:
                </div>
                <ul className="skills-list">
                  {skillsArray.length > 0 ? (
                    skillsArray.map((skill, i) => <li key={i}>{skill}</li>)
                  ) : (
                    DEFAULT_SKILLS.map((skill) => <li key={skill}>{skill}</li>)
                  )}
                </ul>

                <div className="cert-footer-strip">
                  <div className="idrow">
                    <div className="id-block">
                      <div className="lbl">Certificate ID</div>
                      <div className="val">{form.certId || genCertId()}</div>
                    </div>
                    <div className="id-block" style={{ textAlign: 'right' }}>
                      <div className="lbl">Date Issued</div>
                      <div className="val">{fmtDate(form.issueDate)}</div>
                    </div>
                  </div>

                  {/* Verification QR Code */}
                  {certificateRecord?.verificationCode ? (
                    <div className="verification-section">
                      <div className="lbl">Verify Certificate</div>
                      <div className="qr-code-container">
                        {qrCode ? <img src={qrCode} alt="Verify certificate" className="qr-code" /> : null}
                      </div>
                      <div className="verification-url">
                        {brand.verifyBaseUrl}/verify/{certificateRecord?.verificationCode || 'CODE'}
                      </div>
                    </div>
                  ) : null}

                  <div className="sig-row">
                    <div className="sig-block">
                      <div className="sig-mark" />
                      <div className="sig-line" />
                      <div className="sig-name">
                        {form.director || 'Director'}
                      </div>
                      <div className="sig-role">Director</div>
                    </div>

                    <div className="seal">
                      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="46" fill="#0e1c3d" />
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#d4af37" strokeWidth="3" />
                        <circle cx="50" cy="50" r="36" fill="none" stroke="#d4af37" strokeWidth="1" />
                        <polygon
                          points="50,28 54,40 66,40 56,48 60,60 50,52 40,60 44,48 34,40 46,40"
                          fill="#d4af37"
                        />
                        <text
                          x="50"
                          y="82"
                          textAnchor="middle"
                          fill="#f2d375"
                          fontSize="7"
                          fontFamily="Poppins,sans-serif"
                          letterSpacing="1"
                        >
                          CERTIFIED
                        </text>
                      </svg>
                    </div>

                    <div className="sig-block">
                      <div className="sig-mark" />
                      <div className="sig-line" />
                      <div className="sig-name">
                        {form.trainer || 'Trainer'}
                      </div>
                      <div className="sig-role">Trainer</div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
  )

  return (
    <>
    <div className={className ? `preview-page ${className}` : 'preview-page'}>
      <div className="back-row">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
      </div>
      <div className="preview-layout">
        <aside className="edit-sidebar edit-sidebar-light">
          <div className="edit-sidebar-header edit-sidebar-header-light">
            <h2 className="edit-form-heading">Certificate Details</h2>
            <p className="edit-form-sub">
              Fill in the fields below — the certificate on the right updates instantly.
            </p>
          </div>

        <div className="edit-sidebar-body">
          <div className="edit-section">
            <div className="edit-section-title">Recipient</div>
            <label className="edit-label">
              Student Name
              <span className="edit-req">*</span>
              <input
                type="text"
                placeholder="e.g., Priya Ramesh"
                value={form.studentName}
                onChange={(e) => set('studentName', e.target.value)}
                className="edit-input edit-input-light"
              />
            </label>
          </div>

          <div className="edit-section">
            <div className="edit-section-title">Course</div>
            <label className="edit-label">
              Course Name
              <span className="edit-req">*</span>
              <input
                type="text"
                placeholder="e.g., Digital Marketing"
                value={form.courseName}
                onChange={(e) => set('courseName', e.target.value)}
                className="edit-input edit-input-light"
              />
            </label>
            <div className="edit-row2">
              <label className="edit-label">
                Start Date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                  className="edit-input edit-input-light"
                />
              </label>
              <label className="edit-label">
                End Date
                <span className="edit-req">*</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                  className="edit-input edit-input-light"
                />
              </label>
            </div>
          </div>

          <div className="edit-section">
            <div className="edit-section-title">Issuance</div>
            <label className="edit-label">
              Certificate Issued Date
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => set('issueDate', e.target.value)}
                className="edit-input edit-input-light"
              />
            </label>
            <label className="edit-label">
              Certificate ID
              <div className="edit-id-field">
                <input
                  type="text"
                  value={form.certId}
                  onChange={(e) => set('certId', e.target.value)}
                  className="edit-input edit-input-light"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={regenId}
                  className="edit-id-regen"
                  title="Regenerate ID"
                >
                  ↻
                </button>
              </div>
            </label>
          </div>

          <div className="edit-section">
            <div className="edit-section-title">Skills Highlighted</div>
            <label className="edit-label">
              One per line
              <textarea
                rows={4}
                value={form.skills}
                onChange={(e) => set('skills', e.target.value)}
                className="edit-input edit-input-light"
                placeholder="Project Development&#10;Data Analysis&#10;Team Collaboration&#10;Problem Solving"
              />
            </label>
          </div>

          <div className="edit-section">
            <div className="edit-section-title">Signatories</div>
            <div className="edit-row2">
              <label className="edit-label">
                Director
                <input
                  type="text"
                  value={form.director}
                  onChange={(e) => set('director', e.target.value)}
                  placeholder="Dr. K. Subramanian"
                  className="edit-input edit-input-light"
                />
              </label>
              <label className="edit-label">
                Trainer
                <input
                  type="text"
                  value={form.trainer}
                  onChange={(e) => set('trainer', e.target.value)}
                  placeholder="A. Ravichandran"
                  className="edit-input edit-input-light"
                />
              </label>
            </div>
          </div>

        </div>

        <div className="edit-sidebar-actions">
          {saveStatus === 'saved' && (
            <div className="edit-status edit-status-success">
              <CheckCircle2 size={14} className="mr-2" /> Certificate saved to records.
            </div>
          )}
          {saveStatus === 'error' && saveError && (
            <div className="edit-status edit-status-error">
              Save failed: {saveError}
            </div>
          )}
          <div className="edit-actions-row">
            <Button
              variant="default"
              className="edit-btn edit-btn-cert-primary"
              onClick={persistCertificate}
              disabled={saveStatus === 'saving'}
            >
              <SaveIcon size={16} className="mr-2" />
              {saveStatus === 'saving' ? 'Saving…' : 'Save Certificate'}
            </Button>
            <Button
              variant="default"
              className="edit-btn"
              onClick={() => window.print()}
            >
              <Printer size={16} className="mr-2" /> Print
            </Button>
            <Button
              variant="ghost"
              className="edit-btn edit-btn-cert-reset"
              onClick={resetForm}
              disabled={saveStatus === 'saving'}
            >
              <RefreshCw size={16} className="mr-2" /> Reset Form
            </Button>
          </div>
        </div>
      </aside>

      <main
        className="preview-document-container"
        ref={containerRef}
        style={{ '--scale': scale } as React.CSSProperties}
      >
        <div className="preview-scaler-wrapper ttk-cert-scale">
          <div className="preview-scaler-content ttk-cert-scale">
            {cloneElement(certificate)}
          </div>
        </div>
      </main>
      </div>
    </div>
    {typeof document !== 'undefined' &&
      createPortal(<div className="cert-print-root">{cloneElement(certificate)}</div>, document.body)}
    </>
  )
}
