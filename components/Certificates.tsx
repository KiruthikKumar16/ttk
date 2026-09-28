import { useMemo, useState } from 'react'
import { FileCheck2, History, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CertificateRecord, Student } from '@/lib/types'
import { Status } from '@/components/Status'
import { CertificatePrint } from '@/components/CertificatePrint'


export function Certificates({
  students,
  certificates,
  onCertificate,
}: {
  students: Student[]
  certificates?: CertificateRecord[]
  onCertificate: (s: Student) => void
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Eligible')
  const [tab, setTab] = useState<'eligibility' | 'issued'>('eligibility')
  const [showPreview, setShowPreview] = useState(false)
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null)
  const [showCertificatePreview, setShowCertificatePreview] = useState(false)
  const [previewCertificate, setPreviewCertificate] = useState<CertificateRecord | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter(s => {
      const eligible = s.status === 'Fully Paid'
      const matchText =
        !q ||
        s.name.toLowerCase().includes(q) ||
        String(s.registerId).includes(q) ||
        s.course.toLowerCase().includes(q)
      const matchFilter =
        filter === 'All students' ||
        (filter === 'Eligible' && eligible) ||
        (filter === 'Pending fees' && !eligible)
      return matchText && matchFilter
    })
  }, [students, query, filter])

  const filteredIssued = useMemo(() => {
    const q = query.trim().toLowerCase()
    const issued = certificates ?? []
    if (!q) return issued
    return issued.filter(c => {
      return (
        c.studentName.toLowerCase().includes(q) ||
        c.certificateId.toLowerCase().includes(q) ||
        String(c.studentRegisterId).includes(q) ||
        c.courseName.toLowerCase().includes(q)
      )
    })
  }, [certificates, query])

  const eligibleCount = students.filter(s => s.status === 'Fully Paid').length
  const issuedCount = (certificates ?? []).length

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">COMPLETION RECORDS</p>
          <h1>Certificates</h1>
          <p className="subcopy">Generate the official ThoorigAI completion certificate for students with cleared fees.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>{tab === 'eligibility' ? 'Student Eligibility' : 'Issued Certificates'}</h2>
            <p>
              {tab === 'eligibility'
                ? 'Review and generate completion certificates for eligible students'
                : 'Previously issued completion certificates — searchable audit trail'}
            </p>
          </div>
          <div className="tabs-inline">
            <button
              className={'tab-inline ' + (tab === 'eligibility' ? 'active' : '')}
              onClick={() => setTab('eligibility')}
            >
              <FileCheck2 size={14} className="mr-2" /> Eligibility ({eligibleCount})
            </button>
            <button
              className={'tab-inline ' + (tab === 'issued' ? 'active' : '')}
              onClick={() => setTab('issued')}
            >
              <History size={14} className="mr-2" /> Issued ({issuedCount})
            </button>
          </div>
        </div>

        <div className="toolbar">
          <div className="filter-search filter-search-wide">
            <Search size={16} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={
                tab === 'eligibility'
                  ? 'Search by name, register ID or course'
                  : 'Search by certificate ID, name or register ID'
              }
            />
          </div>
          {tab === 'eligibility' && (
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option>Eligible</option>
              <option>Pending fees</option>
              <option>All students</option>
            </select>
          )}
        </div>

        <div className="data-wrap">
          {tab === 'eligibility' ? (
            <table>
              <thead>
                <tr>
                  <th>Register ID</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Batch start</th>
                  <th>Eligibility</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
                      No students match this search.
                    </td>
                  </tr>
                ) : (
                  filtered.map(s => {
                    const eligible = s.status === 'Fully Paid'
                    const issuedCountForStudent = (certificates ?? []).filter(
                      c => c.studentRegisterId === s.registerId
                    ).length
                    return (
                      <tr
                        key={s.registerId}
                        className={eligible ? 'clickable-row' : undefined}
                        onClick={() => eligible && onCertificate(s)}
                      >
                        <td className="mono">TAI-{s.registerId}</td>
                        <td>
                          <div className="student-cell">
                            <div className="mini-avatar">{s.name.split(' ').map(x => x[0]).join('')}</div>
                            <div>
                              <strong>{s.name}</strong>
                              <small>{s.phone}</small>
                            </div>
                          </div>
                        </td>
                        <td>{s.course}</td>
                        <td>{s.batch}</td>
                        <td>
                          {eligible ? (
                            <span className="status status-paid">
                              <span className="status-dot" />
                              Eligible
                              {issuedCountForStudent > 0 && (
                                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.75 }}>
                                  · {issuedCountForStudent} issued
                                </span>
                              )}
                            </span>
                          ) : (
                            <Status status={s.status} />
                          )}
                        </td>
                        <td className="align-right">
                          <Button
                            variant={eligible ? 'default' : 'ghost'}
                            size="sm"
                            className="btn-compact"
                            disabled={!eligible}
                            onClick={e => {
                              e.stopPropagation()
                              if (eligible) {
                                setPreviewStudent(s)
                                setShowPreview(true)
                              }
                            }}
                          >
                            <FileCheck2 size={14} className="mr-1" />
                            Preview
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Issue Date</th>
                  <th>Signatories</th>
                  <th>Skills</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssued.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
                      {issuedCount === 0
                        ? 'No certificates issued yet. Generate one from the Eligibility tab.'
                        : 'No certificates match this search.'}
                    </td>
                  </tr>
                ) : (
                  filteredIssued.map(c => (
                    <tr key={c.id ?? c.certificateId}>
                      <td className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                        {c.certificateId}
                      </td>
                      <td>
                        <div className="student-cell">
                          <div className="mini-avatar">{c.studentName.split(' ').map(x => x[0]).join('')}</div>
                          <div>
                            <strong>{c.studentName}</strong>
                            <small style={{ fontFamily: 'var(--font-mono)', opacity: 0.75 }}>
                              TAI-{c.studentRegisterId}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{c.courseName}</td>
                      <td>{c.issueDate}</td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <div>
                            <strong>Dir:</strong> {c.directorName || '—'}
                          </div>
                          <div style={{ opacity: 0.8 }}>
                            <strong>Trn:</strong> {c.trainerName || '—'}
                          </div>
                        </div>
                      </td>
                      <td>
                        {c.skills && c.skills.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {c.skills.slice(0, 3).map(sk => (
                              <span
                                key={sk}
                                style={{
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  background: '#f3f4f6',
                                  color: '#374151',
                                }}
                              >
                                {sk}
                              </span>
                            ))}
                            {c.skills.length > 3 && (
                              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                                +{c.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                      <td className="actions-column">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewCertificate(c)
                            setShowCertificatePreview(true)
                          }}
                        >
                          <Printer size={14} /> Print
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="table-summary">
          {tab === 'eligibility' ? (
            <>
              Showing <strong>{filtered.length}</strong> students &middot; <strong>{eligibleCount}</strong> ready for certificate
            </>
          ) : (
            <>
              Showing <strong>{filteredIssued.length}</strong> of <strong>{issuedCount}</strong> issued certificate records
            </>
          )}
        </div>
      </section>
      {/* Certificate Preview Modal */}
      {(showPreview && previewStudent) || (showCertificatePreview && previewCertificate) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-[1100px] max-h-[90vh] overflow-y-auto">
            {/* Certificate Preview Content */}
            <div className="certificate-preview-container w-full h-full">
              <div className="certificate-preview-content">
                {/* Use the CertificatePrint component for exact design match */}
                <CertificatePrint
                  student={previewStudent ?? (previewCertificate! as any)}
                  onBack={() => {
                    setShowPreview(false)
                    setPreviewStudent(null)
                    setShowCertificatePreview(false)
                    setPreviewCertificate(null)
                  }}
                  certificateRecord={previewCertificate}
                />
              </div>
            </div>
            {/* Close Button (in case CertificatePrint doesn't show its own) */}
            <button
              onClick={() => {
                setShowPreview(false)
                setPreviewStudent(null)
                setShowCertificatePreview(false)
                setPreviewCertificate(null)
              }}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white/100 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black/80 hover:text-black" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {/* Action Buttons */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
              {showPreview && previewStudent ? (
                <>
                  <button
                    onClick={() => {
                      onCertificate(previewStudent!)
                      setShowPreview(false)
                      setPreviewStudent(null)
                    }}
                    className="px-4 py-2 bg-navy/90 text-white rounded hover:bg-navy/100 transition-colors"
                  >
                    Generate Certificate
                  </button>
                  <button
                    onClick={() => {
                      setShowPreview(false)
                      setPreviewStudent(null)
                    }}
                    className="px-4 py-2 bg-white/90 text-navy/90 rounded hover:bg-white/100 transition-colors border border-navy/20"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowCertificatePreview(false)
                      setPreviewCertificate(null)
                    }}
                    className="px-4 py-2 bg-white/90 text-navy/90 rounded hover:bg-white/100 transition-colors border border-navy/20"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}