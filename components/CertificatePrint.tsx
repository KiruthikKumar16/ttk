import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Student } from '@/lib/types'
import { certificateSkills } from '@/lib/constants'
import { useEffect, useRef, useState } from 'react'

export function CertificatePrint({ student, onBack }: { student: Student; onBack: () => void }) {
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const certId = `TAI-${new Date().getFullYear()}-${String(student.registerId).padStart(4, '0')}`;
  
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
          <div className="preview-meta-item"><span>Certificate ID</span><strong>{certId}</strong></div>
        </div>
        <div className="preview-actions">
          <Button variant="default" style={{ width: '100%' }} onClick={() => window.print()}>
            <Printer size={16} className="mr-2" /> Print / Save as PDF
          </Button>
        </div>
      </aside>
      <main className="preview-document-container" ref={containerRef} style={{ '--scale': scale } as React.CSSProperties}>
        <div className="preview-scaler-wrapper">
          <div className="preview-scaler-content">
            <article className="ttk-certificate">
              {/* Corner Triangles */}
              <div className="corner-tri tl" />
              <div className="corner-tri tr" />
              <div className="corner-tri bl" />
              <div className="corner-tri br" />

              {/* Corner Gold Accents */}
              <div className="corner-gold tl" />
              <div className="corner-gold tr" />
              <div className="corner-gold bl" />
              <div className="corner-gold br" />

              {/* Decorative Frames */}
              <div className="frame-border" />
              <div className="frame-gold" />

              {/* Certificate Content */}
              <div className="cert-inner">
                {/* Brand Header */}
                <div className="cert-brand-name">
                  THOORIGAI <span>INFOTECH</span>
                </div>
                <div className="cert-brand-sub">
                  Institute of Advanced Technology & Skill Development
                </div>

                {/* Certificate Title */}
                <h1 className="cert-title">
                  Certificate of Achievement
                </h1>
                <div className="cert-divider">
                  <div className="ln" />
                  <span className="star">✦</span>
                  <div className="ln" />
                </div>

                {/* Recipient */}
                <p className="cert-lead">This certificate is proudly presented to</p>
                <div className="cert-name">{student.name}</div>
                <div className="cert-name-rule" />

                {/* Body Details */}
                <p className="cert-body-text">
                  for successfully completing the <b>{student.course}</b> Program at <b>ThoorigAI Infotech</b>,
                  commencing from <b>{student.batch}</b> through <b>{issueDate}</b>.
                </p>

                <p className="cert-note">
                  During this intensive curriculum, the candidate demonstrated exceptional proficiency and commitment across:
                </p>

                <ul className="cert-skills">
                  {certificateSkills.map(skill => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>

                {/* Footer Section */}
                <div className="cert-footer-strip">
                  <div className="cert-id-row">
                    <div className="cert-id-block">
                      <div className="lbl">Certificate ID</div>
                      <div className="val">{certId}</div>
                    </div>
                    <div className="cert-id-block" style={{ textAlign: 'right' }}>
                      <div className="lbl">Date Issued</div>
                      <div className="val">{issueDate}</div>
                    </div>
                  </div>

                  <div className="cert-sig-row">
                    <div className="cert-sig-block">
                      <div className="cert-sig-mark">Ananya Krishnan</div>
                      <div className="cert-sig-line" />
                      <div className="cert-sig-name">Ananya Krishnan</div>
                      <div className="cert-sig-role">Director</div>
                    </div>

                    <div className="cert-seal">
                      <span className="seal-star">★</span>
                      <span className="seal-text">Certified</span>
                    </div>

                    <div className="cert-sig-block">
                      <div className="cert-sig-mark">R. Thoorigai</div>
                      <div className="cert-sig-line" />
                      <div className="cert-sig-name">R. Thoorigai</div>
                      <div className="cert-sig-role">Program Head</div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}