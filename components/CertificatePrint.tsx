import { ArrowLeft, Bell, CheckCircle2, FileCheck2, Printer, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Student } from '@/lib/types'
import { certificateSkills } from '@/lib/constants' // We'll create this constants file
import { amountInWords, money } from '@/lib/formatters'

import { useEffect, useRef, useState } from 'react'

export function CertificatePrint({ student, onBack }: { student: Student; onBack: () => void }) {
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  
  const containerRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleX = width / 794;
        const scaleY = height / 1123;
        setScale(Math.min(scaleX, scaleY));
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="preview-layout">
      <aside className="preview-sidebar">
        <div className="preview-sidebar-header">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
          <h2>Certificate Details</h2>
        </div>
        <div className="preview-meta">
          <div className="preview-meta-item"><span>Student Name</span><strong>{student.name}</strong></div>
          <div className="preview-meta-item"><span>Course</span><strong>{student.course}</strong></div>
          <div className="preview-meta-item"><span>Batch</span><strong>{student.batch}</strong></div>
          <div className="preview-meta-item"><span>Issue Date</span><strong>{issueDate}</strong></div>
          <div className="preview-meta-item"><span>Certificate ID</span><strong>TAI-{new Date().getFullYear()}-{String(student.registerId).padStart(4, '0')}</strong></div>
        </div>
        <div className="preview-actions">
          <Button variant="default" style={{width: '100%'}} onClick={() => window.print()}>
            <Printer size={16} className="mr-2" /> Print / Save as PDF
          </Button>
        </div>
      </aside>
      <main className="preview-document-container" ref={containerRef} style={{ '--scale': scale } as React.CSSProperties}>
        <div className="preview-scaler-wrapper">
          <div className="preview-scaler-content">
            <article className="ttk-certificate">
        <div className="ttk-cert-corner ttk-corner-tl" />
        <div className="ttk-cert-corner ttk-corner-tr" />
        <div className="ttk-cert-corner ttk-corner-bl" />
        <div className="ttk-cert-corner ttk-corner-br" />
        <div className="ttk-cert-frame">
          <header className="ttk-cert-header">
            <div className="ttk-cert-logo">TAI</div>
            <div className="ttk-cert-brand">THOORIGAI <span>INFOTECH</span></div>
            <p>CERTIFICATE OF COMPLETION</p>
            <h1>Certificate of Achievement</h1>
            <div className="ttk-cert-divider">✦</div>
          </header>
          <main className="ttk-cert-body">
            <p>This certificate is proudly presented to</p>
            <h2>{student.name}</h2>
            <div className="ttk-name-rule" />
            <p>for successfully completing the <strong>{student.course}</strong> Program at <strong>ThoorigAI Infotech</strong>, from <strong>{student.batch}</strong> to <strong>{issueDate}</strong>.</p>
            <p className="ttk-cert-note">During the course, the candidate demonstrated dedication, professionalism, and technical proficiency in:</p>
            <ul>{certificateSkills.map(skill => <li key={skill}>{skill}</li>)}</ul>
          </main>
          <footer className="ttk-cert-footer">
            <div className="ttk-cert-id">
              <span>Certificate ID</span>
              <strong>TAI-{new Date().getFullYear()}-{String(student.registerId).padStart(4, '0')}</strong>
            </div>
            <div className="ttk-qr-code">
              <div>QR Code</div>
              <small>Scan to verify</small>
            </div>
            <div className="ttk-signature">
              <span className="ttk-signature-script">Ananya Krishnan</span>
              <div>Director</div>
            </div>
            <div className="ttk-seal">★<small>CERTIFIED</small></div>
            <div className="ttk-signature">
              <span className="ttk-signature-script">R. Thoorigai</span>
              <div>Trainer</div>
            </div>
            <div className="ttk-cert-id ttk-cert-date">
              <span>Date Issued</span>
              <strong>{issueDate}</strong>
            </div>
          </footer>
        </div>
      </article>
          </div>
        </div>
      </main>
    </div>
  );
}