'use client'

import { useState, useMemo } from 'react'
import {
  X,
  Upload,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Users,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { parseGoogleFormResponses, type ParsedScoreRow, type StudentOption } from '../utils/google-form-parser'

interface GoogleFormsImportModalProps {
  isOpen: boolean
  onClose: () => void
  assessmentId: string
  assessmentTitle: string
  maxScore: number
  enrolledStudents: StudentOption[]
  existingResults: { studentId: number; score: number }[]
  onImportSuccess: () => void
}

export function GoogleFormsImportModal({
  isOpen,
  onClose,
  assessmentId,
  assessmentTitle,
  maxScore,
  enrolledStudents,
  existingResults,
  onImportSuccess,
}: GoogleFormsImportModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload')
  const [pastedText, setPastedText] = useState('')
  const [fileName, setFileName] = useState('')
  const [rawContent, setRawContent] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedScoreRow[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const existingMap = useMemo(() => {
    return new Map(existingResults.map((r) => [r.studentId, r.score]))
  }, [existingResults])

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setErrorMessage('')
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = String(event.target?.result || '')
      setRawContent(text)
      const parsed = parseGoogleFormResponses(text, enrolledStudents, maxScore, existingMap)
      setParsedRows(parsed)
      if (parsed.length === 0) {
        setErrorMessage('No valid response rows with scores were found in this CSV. Please check the file.')
      }
    }
    reader.readAsText(file)
  }

  const handleProcessPastedText = () => {
    setErrorMessage('')
    if (!pastedText.trim()) {
      setErrorMessage('Please paste rows from your Google Sheet response table.')
      return
    }
    setRawContent(pastedText)
    const parsed = parseGoogleFormResponses(pastedText, enrolledStudents, maxScore, existingMap)
    setParsedRows(parsed)
    if (parsed.length === 0) {
      setErrorMessage('Could not recognize any valid score columns. Please make sure scores are included.')
    }
  }

  const handleManualStudentSelect = (rowIndex: number, studentId: number) => {
    const student = enrolledStudents.find((s) => s.register_id === studentId)
    if (!student) return

    setParsedRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== rowIndex) return row
        return {
          ...row,
          studentId: student.register_id,
          studentName: student.name,
          matched: true,
          matchType: 'manual',
          existingScore: existingMap.get(student.register_id) ?? null,
        }
      }),
    )
  }

  const matchedValidCount = parsedRows.filter((r) => r.matched && r.studentId !== null).length
  const unmatchedCount = parsedRows.filter((r) => !r.matched || r.studentId === null).length
  const updateExistingCount = parsedRows.filter((r) => r.matched && r.existingScore !== null).length

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => r.matched && r.studentId !== null)
    if (validRows.length === 0) {
      setErrorMessage('No matched students to import. Please assign students or check response format.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const payload = {
        results: validRows.map((r) => ({
          studentId: r.studentId!,
          score: r.score,
          remarks: `Imported from Google Forms (${r.rawScore})`,
        })),
      }

      const response = await fetch(`/api/assessments/${assessmentId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save imported assessment scores')
      }

      onImportSuccess()
      onClose()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to import scores')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
                <FileSpreadsheet size={13} />
                Google Forms Importer
              </span>
              <span className="text-xs text-white/80">Max Score: {maxScore} pts</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Import Google Form Responses</h2>
            <p className="text-xs text-white/80 line-clamp-1">{assessmentTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer text-white/90 hover:text-white"
            title="Close modal"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Method Selector Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'upload' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload size={14} />
              <span>Upload Google Forms CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'paste' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardPaste size={14} />
              <span>Paste from Google Sheet</span>
            </button>
          </div>

          {/* Tab 1: CSV Upload */}
          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 bg-slate-50/50 transition-all">
              <input
                id="csv-upload-input"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="csv-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                  <Upload size={22} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-800">
                    {fileName ? fileName : 'Click to upload Google Form responses .csv'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Downloaded from Google Forms (Responses &gt; Three dots &gt; Download responses .csv)
                  </p>
                </div>
                <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                  Browse file
                </span>
              </label>
            </div>
          )}

          {/* Tab 2: Paste Rows */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label htmlFor="paste-sheets-textarea" className="block text-xs font-semibold text-slate-700">
                Copy columns from Google Sheets (Student Name, Score, etc.) and paste here:
              </label>
              <textarea
                id="paste-sheets-textarea"
                rows={4}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Example:&#10;Asha	28 / 30&#10;Bala	24 / 30&#10;Kavya	30 / 30"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
              />
              <button
                type="button"
                onClick={handleProcessPastedText}
                className="btn-secondary text-xs font-semibold px-4 py-2 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles size={14} className="text-indigo-600" />
                <span>Parse Copied Table</span>
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed Results Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-4 pt-2">
              {/* Stats Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">Found {parsedRows.length} entries:</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    <CheckCircle2 size={12} /> {matchedValidCount} Matched
                  </span>
                  {updateExistingCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      {updateExistingCount} will update existing
                    </span>
                  )}
                  {unmatchedCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                      <AlertCircle size={12} /> {unmatchedCount} Unrecognized
                    </span>
                  )}
                </div>
              </div>

              {/* Matching Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-64 shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2.5">Google Form Respondent</th>
                      <th className="p-2.5">Extracted Score</th>
                      <th className="p-2.5">Mapped Enrolled Student</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-medium text-slate-900">
                          <div>{row.rawName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{row.rawScore}</div>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800">
                          {row.score} / {maxScore}{' '}
                          <span className="text-[11px] text-slate-500 font-normal">({row.percentage}%)</span>
                        </td>
                        <td className="p-2.5">
                          {row.matched && row.studentId !== null ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-indigo-700">{row.studentName}</span>
                              <span className="font-mono text-[11px] text-slate-400">#{row.studentId}</span>
                            </div>
                          ) : (
                            <select
                              aria-label={`Assign enrolled student for ${row.rawName}`}
                              className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white w-full max-w-xs font-medium cursor-pointer"
                              onChange={(e) => handleManualStudentSelect(index, parseInt(e.target.value, 10))}
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Select enrolled student...
                              </option>
                              {enrolledStudents.map((s) => (
                                <option key={s.register_id} value={s.register_id}>
                                  {s.name} (#{s.register_id})
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {row.matched ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Needs match
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting || matchedValidCount === 0}
            onClick={handleCommitImport}
            className="btn-primary min-h-10 px-5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving to Supabase…</span>
              </>
            ) : (
              <>
                <span>Save {matchedValidCount} Scores to Dashboard</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
