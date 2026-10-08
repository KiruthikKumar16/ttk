'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  QrCode,
  FileSpreadsheet,
  Download,
  CalendarDays,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ClipboardList,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { CourseCategory } from '@/lib/types'
import { CategoryBadge } from '@/components/CategoryBadge'
import { GoogleFormsImportModal } from './GoogleFormsImportModal'
import { ClassroomQRModal } from './ClassroomQRModal'
import { KpiCard } from '@/components/ui/KpiCard'

export type Assessment = {
  id: string
  courseId: string
  courseName: string
  title: string
  maxScore: number
  assessmentDate: string
  formUrl?: string | null
  sheetUrl?: string | null
  createdBy: {
    id: string
    fullName: string
    role: string
  } | null
  createdAt: string
}

type AssessmentResult = {
  id: string
  studentId: number
  studentName: string
  score: number
  remarks: string | null
  gradedBy: {
    id: string
    fullName: string
    role: string
  } | null
  gradedAt: string
}

export type Course = {
  id: string
  name: string
  categoryId?: string | null
  categoryName?: string | null
}

function formatDate(dateString: string) {
  try {
    const parts = dateString.split('-').map(Number)
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date(parts[0], parts[1] - 1, parts[2])
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
    return format(parseISO(dateString), 'MMM d, yyyy')
  } catch {
    return dateString
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return (name.slice(0, 2) || 'ST').toUpperCase()
}

export function Assessments({
  initialAssessments = [],
  initialCourses = [],
  categories = [],
  initialTotalCount = 0,
  initialPage = 1,
  initialPageSize = 25,
  initialCourseId = '',
  initialSearch = '',
  initialDataLoaded = false,
}: {
  initialAssessments?: Assessment[]
  initialCourses?: Course[]
  categories?: CourseCategory[]
  initialTotalCount?: number
  initialPage?: number
  initialPageSize?: number
  initialCourseId?: string
  initialSearch?: string
  initialDataLoaded?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments)
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([])
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [deleteResultId, setDeleteResultId] = useState<string | null>(null)
  const [editingResult, setEditingResult] = useState(false)
  const [notice, setNotice] = useState('')
  const [activeTab, setActiveTab] = useState<'library' | 'create'>('library')

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null)

  // Creation form
  const [newAssessment, setNewAssessment] = useState({
    courseId: '',
    title: '',
    maxScore: '30',
    assessmentDate: new Date().toISOString().slice(0, 10),
    formUrl: '',
    sheetUrl: '',
  })

  // Individual result form
  const [newResult, setNewResult] = useState({
    studentId: '',
    score: '',
    remarks: '',
  })

  const [bulkScores, setBulkScores] = useState<Record<string, string>>({})
  const [resultsSearch, setResultsSearch] = useState('')
  const [resultsFilter, setResultsFilter] = useState<'all' | 'graded' | 'unmarked'>('all')

  const [assessmentFilters, setAssessmentFilters] = useState({
    courseId: initialCourseId,
    pageSize: initialPageSize,
    page: initialPage,
  })
  const [assessmentTotalCount, setAssessmentTotalCount] = useState(initialTotalCount)
  const [assessmentHasMore, setAssessmentHasMore] = useState(initialTotalCount > initialPage * initialPageSize)

  const selectedAssessment = useMemo(() => {
    return assessments.find((a) => a.id === selectedAssessmentId) || null
  }, [assessments, selectedAssessmentId])

  // KPIs
  const kpis = useMemo(() => {
    const total = assessments.length
    const withGoogleForms = assessments.filter((a) => !!a.formUrl).length
    const uniqueCourses = new Set(assessments.map((a) => a.courseId)).size
    return {
      total,
      withGoogleForms,
      uniqueCourses,
    }
  }, [assessments])

  // Fetch courses for the dropdown
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses?page=1&pageSize=100')
      if (!response.ok) throw new Error('Failed to fetch courses')
      const data = await response.json()
      setCourses(data.data || [])
    } catch {
      // Non-fatal fallback
    }
  }

  // Fetch assessments
  const fetchAssessments = async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (assessmentFilters.courseId) queryParams.append('courseId', assessmentFilters.courseId)
      queryParams.append('pageSize', String(assessmentFilters.pageSize))
      queryParams.append('page', String(assessmentFilters.page))

      const response = await fetch(`/api/assessments?${queryParams.toString()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch assessments')
      }
      const data = await response.json()
      setAssessments(data.data || [])
      setAssessmentTotalCount(data.totalCount || 0)
      setAssessmentHasMore(data.hasMore || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Fetch students for selected course
  const fetchStudentsForCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/students?course=${courseId}&page=1&pageSize=100`)
      if (!response.ok) throw new Error('Failed to fetch students')
      const data = await response.json()
      setStudents(data.data || [])
    } catch {
      setStudents([])
    }
  }

  // Fetch results for an assessment
  const fetchAssessmentResults = async (assessmentId: string) => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/results?page=1&pageSize=100`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch assessment results')
      }
      const data = await response.json()
      const list: AssessmentResult[] = data.data || []
      setAssessmentResults(list)

      // Initialize bulk scores mapping
      const initialBulk: Record<string, string> = {}
      for (const item of list) {
        initialBulk[String(item.studentId)] = String(item.score)
      }
      setBulkScores(initialBulk)
    } catch {
      setAssessmentResults([])
    }
  }

  // Initial fetch
  useEffect(() => {
    if (!initialDataLoaded) {
      void fetchCourses()
      void fetchAssessments()
    }
  }, [initialDataLoaded])

  // When selected assessment changes, fetch results and students
  useEffect(() => {
    if (selectedAssessmentId) {
      const target = assessments.find((a) => a.id === selectedAssessmentId)
      if (target) {
        void fetchStudentsForCourse(target.courseId)
        void fetchAssessmentResults(selectedAssessmentId)
      }
    } else {
      setAssessmentResults([])
      setStudents([])
      setBulkScores({})
    }
  }, [selectedAssessmentId, assessments])

  const handleAssessmentFiltersChange = (newFilters: Partial<typeof assessmentFilters>) => {
    const next = {
      ...assessmentFilters,
      ...newFilters,
      page: 1,
    }
    setAssessmentFilters(next)
    const params = new URLSearchParams()
    if (next.courseId) params.set('courseId', next.courseId)
    if (initialSearch) params.set('search', initialSearch)
    params.set('page', String(next.page))
    params.set('pageSize', String(next.pageSize))
    router.push(`${pathname}?${params}`)
  }

  const handleLoadMoreAssessments = () => {
    const nextPage = assessmentFilters.page + 1
    const params = new URLSearchParams()
    if (assessmentFilters.courseId) params.set('courseId', assessmentFilters.courseId)
    if (initialSearch) params.set('search', initialSearch)
    params.set('page', String(nextPage))
    params.set('pageSize', String(assessmentFilters.pageSize))
    router.push(`${pathname}?${params}`)
  }

  const handleNewAssessmentChange = (field: keyof typeof newAssessment, value: string) => {
    setNewAssessment((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNewResultChange = (field: keyof typeof newResult, value: string) => {
    setNewResult((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCreateAssessment = async () => {
    if (!newAssessment.courseId || !newAssessment.title || !newAssessment.maxScore || !newAssessment.assessmentDate) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: newAssessment.courseId,
          title: newAssessment.title,
          maxScore: parseFloat(newAssessment.maxScore),
          assessmentDate: newAssessment.assessmentDate,
          formUrl: newAssessment.formUrl || null,
          sheetUrl: newAssessment.sheetUrl || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create assessment')
      }

      const data = await response.json()
      setAssessments([data.data, ...assessments])
      setNewAssessment({
        courseId: '',
        title: '',
        maxScore: '30',
        assessmentDate: new Date().toISOString().slice(0, 10),
        formUrl: '',
        sheetUrl: '',
      })
      setActiveTab('library')
      setNotice('Assessment created successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating assessment')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateResult = async () => {
    if (!newResult.studentId || !newResult.score || !selectedAssessmentId) {
      setError('Please fill in all required result fields.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/assessments/${selectedAssessmentId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: parseInt(newResult.studentId, 10),
          score: parseFloat(newResult.score),
          remarks: newResult.remarks || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save result')
      }

      await fetchAssessmentResults(selectedAssessmentId)
      setNewResult({ studentId: '', score: '', remarks: '' })
      setEditingResult(false)
      setNotice('Result saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving result')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBulkScores = async () => {
    if (!selectedAssessmentId) return

    const entries = Object.entries(bulkScores)
      .filter(([_, score]) => score.trim() !== '')
      .map(([studentId, score]) => ({
        studentId: parseInt(studentId, 10),
        score: parseFloat(score),
      }))

    if (entries.length === 0) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/assessments/${selectedAssessmentId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: entries }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save bulk scores')
      }

      await fetchAssessmentResults(selectedAssessmentId)
      setNotice(`Saved ${entries.length} scores successfully.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bulk scores')
    } finally {
      setLoading(false)
    }
  }

  const removeResult = async () => {
    if (!deleteResultId || !selectedAssessmentId) return

    try {
      const response = await fetch(
        `/api/assessments/${selectedAssessmentId}/results?resultId=${encodeURIComponent(deleteResultId)}`,
        {
          method: 'DELETE',
        },
      )
      if (!response.ok) throw new Error('Failed to delete result')

      setAssessmentResults((prev) => prev.filter((r) => r.id !== deleteResultId))
      setDeleteResultId(null)
      setNotice('Assessment result deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete result')
    }
  }

  const exportResults = () => {
    if (assessmentResults.length === 0) return
    const maxScore = selectedAssessment?.maxScore || 100
    const headers = ['Student ID', 'Student Name', 'Score', 'Max Score', 'Percentage', 'Remarks', 'Graded At']
    const rows = assessmentResults.map((r) => [
      r.studentId,
      `"${r.studentName.replace(/"/g, '""')}"`,
      r.score,
      maxScore,
      `${((r.score / maxScore) * 100).toFixed(1)}%`,
      `"${(r.remarks || '').replace(/"/g, '""')}"`,
      r.gradedAt,
    ])
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `assessment-results-${selectedAssessmentId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyLink = async (formUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(formUrl)
      setCopiedFormId(id)
      setTimeout(() => setCopiedFormId(null), 2000)
    } catch {
      // Fallback
    }
  }

  // Filtered assessment results in Grading Studio
  const filteredStudents = useMemo(() => {
    let list = students
    if (resultsFilter === 'graded') {
      const gradedIds = new Set(assessmentResults.map((r) => r.studentId))
      list = list.filter((s) => gradedIds.has(s.register_id))
    } else if (resultsFilter === 'unmarked') {
      const gradedIds = new Set(assessmentResults.map((r) => r.studentId))
      list = list.filter((s) => !gradedIds.has(s.register_id))
    }
    if (!resultsSearch.trim()) return list
    const q = resultsSearch.toLowerCase().trim()
    return list.filter((s) => s.name.toLowerCase().includes(q) || String(s.register_id).includes(q))
  }, [students, resultsFilter, resultsSearch, assessmentResults])

  return (
    <div className="space-y-6">
      {/* 1. Page Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1">
            ACADEMIC EVALUATIONS & QUIZZES
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-heading)]">Assessments</h1>
          <p className="text-sm text-[var(--mute)] mt-1">
            Create evaluations, distribute Google Forms quizzes, and import graded responses in seconds.
          </p>
        </div>

        {selectedAssessmentId ? (
          <Button
            variant="outline"
            onClick={() => setSelectedAssessmentId(null)}
            className="btn-secondary self-start md:self-auto cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Back to Assessments</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 p-1 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'library' ? 'text-white shadow-md' : 'text-[var(--mute)] hover:text-[var(--text)]'
              }`}
              style={{
                background: activeTab === 'library' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
              }}
            >
              <ClipboardList size={14} />
              <span>Catalog & Library</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'create' ? 'text-white shadow-md' : 'text-[var(--mute)] hover:text-[var(--text)]'
              }`}
              style={{
                background: activeTab === 'create' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
              }}
            >
              <Plus size={14} />
              <span>Create Assessment</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Tiles (shown in library/create views) */}
      {!selectedAssessmentId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Assessments"
            value={kpis.total}
            subtitle="Across active course batches"
            icon={<ClipboardList size={18} />}
          />
          <KpiCard
            title="Google Form Quizzes"
            value={kpis.withGoogleForms}
            subtitle="Live QR quiz integrations"
            icon={<FileSpreadsheet size={18} />}
            badge={{ text: 'Connected', variant: 'accent' }}
          />
          <KpiCard
            title="Batches Evaluated"
            value={kpis.uniqueCourses}
            subtitle="Programs with completed marks"
            icon={<GraduationCap size={18} />}
          />
          <KpiCard
            title="Grading Pipeline"
            value="Instant CSV"
            subtitle="Auto-score and sync responses"
            icon={<Award size={18} />}
            badge={{ text: 'Active', variant: 'success' }}
          />
        </div>
      )}

      {/* 2. Main Viewport */}
      {!selectedAssessmentId ? (
        <>
          {/* TAB 1: CREATE ASSESSMENT */}
          {activeTab === 'create' && (
            <section className="panel p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Sparkles size={12} />
                      New Evaluation
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Create Assessment / Quiz</h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Set up an evaluation and attach a Google Form link for automatic student quiz distribution.
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600 block">Quick Template Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { title: 'AWS Cloud — Week 3 Assessment', max: '30' },
                    { title: 'Full Stack — Module 2 Practical Exam', max: '50' },
                    { title: 'Python Fundamentals Weekly Quiz', max: '25' },
                    { title: 'Data Analytics Midterm Test', max: '100' },
                  ].map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => {
                        setNewAssessment((prev) => ({
                          ...prev,
                          title: preset.title,
                          maxScore: preset.max,
                        }))
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-xs text-slate-700 hover:text-indigo-800 font-medium transition-all cursor-pointer shadow-2xs"
                    >
                      + {preset.title} ({preset.max} pts)
                    </button>
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleCreateAssessment()
                }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Course Curriculum <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={newAssessment.courseId}
                      onValueChange={(value) => handleNewAssessmentChange('courseId', value as string)}
                      placeholder="Select a course batch"
                    >
                      <SelectTrigger className="min-h-11 rounded-xl text-sm">
                        <SelectValue placeholder="Select a course batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => {
                          const catCourses = courses.filter((c) => c.categoryId === cat.id)
                          if (!catCourses.length) return null
                          return (
                            <div key={cat.id}>
                              <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                {cat.name} ({cat.duration})
                              </div>
                              {catCourses.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </div>
                          )
                        })}
                        {courses.some((c) => !c.categoryId) && (
                          <div>
                            <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Other Curricula
                            </div>
                            {courses
                              .filter((c) => !c.categoryId)
                              .map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Assessment Title <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={newAssessment.title}
                      onChange={(e) => handleNewAssessmentChange('title', e.target.value)}
                      placeholder="e.g., AWS Cloud — Week 3 Assessment"
                      className="min-h-11 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Max Score (Total Points) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={newAssessment.maxScore}
                      onChange={(e) => handleNewAssessmentChange('maxScore', e.target.value)}
                      placeholder="e.g., 30"
                      type="number"
                      min={0}
                      step="0.01"
                      className="min-h-11 rounded-xl text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Assessment Date <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={newAssessment.assessmentDate}
                      onChange={(e) => handleNewAssessmentChange('assessmentDate', e.target.value)}
                      placeholder="YYYY-MM-DD"
                      type="date"
                      className="min-h-11 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Google Forms Integration Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-slate-50 border border-purple-200/80 space-y-4">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                    <FileSpreadsheet size={18} className="text-purple-700" />
                    <span>Google Forms &amp; Sheets Integration (Optional)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-purple-900 mb-1 block">
                        Google Form Student URL
                      </label>
                      <Input
                        value={newAssessment.formUrl}
                        onChange={(e) => handleNewAssessmentChange('formUrl', e.target.value)}
                        placeholder="https://docs.google.com/forms/d/e/.../viewform"
                        className="bg-white min-h-10 text-xs sm:text-sm rounded-xl border-purple-200"
                      />
                      <p className="text-[11px] text-purple-700/80 mt-1">
                        Students can scan a classroom QR code or click to open this quiz.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-purple-900 mb-1 block">
                        Google Sheets Response URL
                      </label>
                      <Input
                        value={newAssessment.sheetUrl}
                        onChange={(e) => handleNewAssessmentChange('sheetUrl', e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="bg-white min-h-10 text-xs sm:text-sm rounded-xl border-purple-200"
                      />
                      <p className="text-[11px] text-purple-700/80 mt-1">
                        One-click access to the live response sheet for grading and review.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('library')}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="btn-primary min-h-11 px-6 cursor-pointer">
                    {loading ? 'Creating...' : 'Create Assessment'}
                    <Plus size={16} className="ml-1.5" />
                  </Button>
                </div>
              </form>
            </section>
          )}

          {/* TAB 2: ASSESSMENTS LIBRARY */}
          {activeTab === 'library' && (
            <section className="panel p-6 sm:p-7 shadow-xs border border-slate-200/90 space-y-6">
              {/* Filter Toolbar */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-xl font-bold text-slate-900">Assessments Catalog</h2>
                  <p className="text-xs sm:text-sm text-slate-700">
                    Filter by curriculum or category tier to review student evaluations and launch quizzes.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="sr-only" htmlFor="category-tier-filter">
                      Category Tier Filter
                    </label>
                    <Select
                      value={selectedCategoryFilter}
                      onValueChange={(value) => {
                        const newCat = (value as string) || ''
                        setSelectedCategoryFilter(newCat)
                        if (newCat) {
                          const currentCrs = courses.find((c) => c.id === assessmentFilters.courseId)
                          if (currentCrs && currentCrs.categoryId !== newCat) {
                            handleAssessmentFiltersChange({ courseId: '' })
                          }
                        }
                      }}
                      placeholder="All Categories"
                    >
                      <SelectTrigger className="w-[180px] min-h-10 text-xs font-medium">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name} ({cat.duration})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="sr-only">Course Batch Filter</label>
                    <Select
                      value={assessmentFilters.courseId}
                      onValueChange={(value) => handleAssessmentFiltersChange({ courseId: value as string })}
                      placeholder="All Curricula"
                    >
                      <SelectTrigger className="w-[220px] min-h-10 text-xs font-medium">
                        <SelectValue placeholder="All Curricula" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Curricula</SelectItem>
                        {courses
                          .filter((c) => !selectedCategoryFilter || c.categoryId === selectedCategoryFilter)
                          .map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Assessment Table / Cards */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-slate-50/90 border-b border-slate-200">
                    <tr>
                      <th scope="col" className="p-4 font-bold text-slate-900 text-xs uppercase tracking-wider w-28">
                        Date
                      </th>
                      <th scope="col" className="p-4 font-bold text-slate-900 text-xs uppercase tracking-wider w-48">
                        Curriculum
                      </th>
                      <th scope="col" className="p-4 font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Assessment Title
                      </th>
                      <th
                        scope="col"
                        className="p-4 font-bold text-slate-900 text-xs uppercase tracking-wider w-24 text-center"
                      >
                        Max Score
                      </th>
                      <th scope="col" className="p-4 font-bold text-slate-900 text-xs uppercase tracking-wider w-36">
                        Google Form
                      </th>
                      <th
                        scope="col"
                        className="p-4 font-bold text-slate-900 text-xs uppercase tracking-wider text-right w-36"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessments.map((assessment) => (
                      <tr
                        key={assessment.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedAssessmentId(assessment.id)}
                      >
                        <td className="p-4 text-xs font-medium text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays size={13} className="text-slate-400" />
                            <span>{formatDate(assessment.assessmentDate)}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1">
                              {assessment.courseName}
                            </span>
                            {(() => {
                              const crs = courses.find(
                                (c) => c.id === assessment.courseId || c.name === assessment.courseName,
                              )
                              const catName = crs?.categoryName
                              if (!catName) return null
                              return <CategoryBadge categoryName={catName} />
                            })()}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm sm:text-base">
                              {assessment.title}
                            </span>
                            {assessment.createdBy && (
                              <p className="text-[11px] text-slate-700">
                                Created by {assessment.createdBy.fullName} ({assessment.createdBy.role})
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200/80">
                            {assessment.maxScore} pts
                          </span>
                        </td>

                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          {assessment.formUrl ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={assessment.formUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-all"
                                title="Open Google Form Quiz"
                              >
                                <FileSpreadsheet size={13} />
                                <span>Quiz</span>
                                <ExternalLink size={11} />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyLink(assessment.formUrl!, assessment.id)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-all"
                                title="Copy student quiz link"
                              >
                                {copiedFormId === assessment.id ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-700 italic">None linked</span>
                          )}
                        </td>

                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label={`View results for ${assessment.title}`}
                            onClick={() => setSelectedAssessmentId(assessment.id)}
                            className="text-xs font-semibold cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
                          >
                            <span>Open Studio</span>
                            <ArrowRight size={13} className="ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {assessments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-700 space-y-2">
                          <ClipboardList size={32} className="mx-auto text-slate-600" />
                          <p className="text-sm font-semibold text-slate-900">No assessments match current filters</p>
                          <p className="text-xs text-slate-700">
                            Create a new assessment above or choose another curriculum.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination / Load More */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <div className="text-xs text-slate-700">
                  Showing {assessments.length} of {assessmentTotalCount} assessments
                </div>
                {assessmentHasMore && (
                  <Button
                    variant="outline"
                    onClick={handleLoadMoreAssessments}
                    className="text-xs font-semibold cursor-pointer"
                  >
                    Load More Assessments
                  </Button>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        /* 3. GRADING & RESULTS STUDIO */
        <div className="space-y-6">
          {/* Assessment Hero Card */}
          <section className="panel p-6 sm:p-7 shadow-xs border border-slate-200/90 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs">
                    <GraduationCap size={13} />
                    {selectedAssessment?.courseName}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    Max Score: {selectedAssessment?.maxScore} pts
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium ml-1">
                    <CalendarDays size={14} className="text-slate-400" />
                    {formatDate(selectedAssessment?.assessmentDate || '')}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {selectedAssessment?.title}
                </h2>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedAssessment?.formUrl && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQRModalOpen(true)}
                      className="text-xs font-semibold cursor-pointer hover:bg-indigo-50 hover:text-indigo-700"
                      title="Project QR code for classroom"
                    >
                      <QrCode size={14} className="mr-1.5" />
                      Classroom QR
                    </Button>

                    <a
                      href={selectedAssessment.formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-300 text-purple-800 bg-purple-50 hover:bg-purple-100 shadow-2xs transition-all cursor-pointer"
                      title="Open Google Form Quiz"
                    >
                      <FileSpreadsheet size={14} className="text-purple-700" />
                      <span>Launch Form</span>
                      <ExternalLink size={12} />
                    </a>
                  </>
                )}

                {selectedAssessment?.sheetUrl && (
                  <a
                    href={selectedAssessment.sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 shadow-2xs transition-all cursor-pointer"
                    title="Open Google Sheets Response Table"
                  >
                    <ExternalLink size={14} />
                    <span>Response Sheet</span>
                  </a>
                )}

                {/* The Google Forms Import Button */}
                <Button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="btn-primary text-xs font-semibold px-4 cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet size={15} className="mr-1.5" />
                  Import Google Form Responses
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedAssessmentId) void fetchAssessmentResults(selectedAssessmentId)
                  }}
                  className="text-xs font-semibold cursor-pointer"
                  title="Refresh results"
                >
                  <RefreshCw size={14} />
                </Button>
              </div>
            </div>

            {/* Performance Distribution Strip */}
            {(() => {
              const maxScore = selectedAssessment?.maxScore ?? 0
              const bands = [
                { label: '0–49%', min: 0, max: 50, color: 'bg-rose-500' },
                { label: '50–69%', min: 50, max: 70, color: 'bg-amber-500' },
                { label: '70–84%', min: 70, max: 85, color: 'bg-indigo-500' },
                { label: '85–100%', min: 85, max: 101, color: 'bg-emerald-500' },
              ]
              const counts = bands.map(
                (band) =>
                  assessmentResults.filter((result) => {
                    const percent = maxScore > 0 ? (result.score / maxScore) * 100 : 0
                    return percent >= band.min && percent < band.max
                  }).length,
              )
              const maxCount = Math.max(1, ...counts)
              const gradedCount = assessmentResults.length
              const averageScore =
                gradedCount > 0
                  ? (assessmentResults.reduce((acc, r) => acc + r.score, 0) / gradedCount).toFixed(1)
                  : '0'
              const avgPct = maxScore > 0 ? ((Number(averageScore) / maxScore) * 100).toFixed(1) : '0'

              return (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-700">
                    <span className="font-bold uppercase tracking-wider text-slate-500">Grade Distribution</span>
                    <div className="flex items-center gap-3 font-semibold">
                      <span>
                        Graded:{' '}
                        <strong>
                          {gradedCount} / {students.length}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Class Average:{' '}
                        <strong className="text-indigo-600">
                          {averageScore} / {maxScore} ({avgPct}%)
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4">
                    {bands.map((band, index) => (
                      <div
                        key={band.label}
                        className="rounded-xl border border-slate-200/90 p-3 bg-slate-50/60 shadow-2xs"
                      >
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-600">{band.label}</span>
                          <strong className="font-bold text-slate-900">{counts[index]} students</strong>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-200/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${band.color}`}
                            style={{ width: `${(counts[index] / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </section>

          {/* Student Roster & Live Scoring Table */}
          <section className="panel p-6 sm:p-7 shadow-xs border border-slate-200/90 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <Input
                    type="text"
                    placeholder="Search student or ID..."
                    value={resultsSearch}
                    onChange={(e) => setResultsSearch(e.target.value)}
                    className="pl-8.5 py-1.5 text-xs w-full min-h-9 rounded-xl"
                  />
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setResultsFilter('all')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      resultsFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultsFilter('graded')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      resultsFilter === 'graded'
                        ? 'bg-white text-emerald-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Graded ({assessmentResults.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultsFilter('unmarked')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      resultsFilter === 'unmarked'
                        ? 'bg-white text-rose-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unmarked ({Math.max(0, students.length - assessmentResults.length)})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={assessmentResults.length === 0}
                  onClick={exportResults}
                  className="text-xs font-semibold cursor-pointer"
                >
                  <Download size={13} className="mr-1.5" />
                  Export CSV
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleSaveBulkScores()}
                  disabled={loading}
                  className="btn-primary text-xs font-semibold cursor-pointer shadow-sm"
                >
                  {loading ? 'Saving...' : 'Save All Scores'}
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
              <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/90 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="p-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">
                      Student
                    </th>
                    <th
                      scope="col"
                      className="p-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider w-40 text-center"
                    >
                      Score ({selectedAssessment?.maxScore} pts)
                    </th>
                    <th
                      scope="col"
                      className="p-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider w-28 text-center"
                    >
                      Percentage
                    </th>
                    <th scope="col" className="p-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">
                      Remarks / Notes
                    </th>
                    <th
                      scope="col"
                      className="p-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider w-20 text-center"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const existing = assessmentResults.find((r) => r.studentId === student.register_id)
                    const maxScore = selectedAssessment?.maxScore || 100
                    const currentScoreStr =
                      bulkScores[String(student.register_id)] ?? (existing ? String(existing.score) : '')
                    const numericScore = parseFloat(currentScoreStr)
                    const percentage =
                      !isNaN(numericScore) && maxScore > 0 ? ((numericScore / maxScore) * 100).toFixed(1) : null

                    return (
                      <tr key={student.register_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200/60 shadow-2xs">
                              {getInitials(student.name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/students/${student.register_id}`}
                                  className="font-semibold text-slate-900 hover:text-indigo-600 text-xs sm:text-sm hover:underline"
                                >
                                  {student.name}
                                </Link>
                                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  #{student.register_id}
                                </span>
                              </div>
                              {existing && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Graded: {formatDate(existing.gradedAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <Input
                              type="number"
                              min={0}
                              max={selectedAssessment?.maxScore}
                              step="0.01"
                              placeholder="Score"
                              value={currentScoreStr}
                              onChange={(e) => {
                                const val = e.target.value
                                setBulkScores((prev) => ({
                                  ...prev,
                                  [String(student.register_id)]: val,
                                }))
                              }}
                              className="w-24 text-center font-bold min-h-9 rounded-xl text-xs sm:text-sm"
                            />
                            <span className="text-xs text-slate-500">/ {selectedAssessment?.maxScore}</span>
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          {percentage !== null ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                Number(percentage) >= 70
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : Number(percentage) >= 50
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {percentage}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Pending</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span className="text-xs text-slate-600 line-clamp-1">{existing?.remarks || '-'}</span>
                        </td>

                        <td className="p-3.5 text-center">
                          {existing ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete result"
                              aria-label={`Delete result for ${student.name}`}
                              onClick={() => setDeleteResultId(existing.id)}
                              className="text-slate-500 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        No enrolled students match current query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Global Modals & Live Region */}
      <GoogleFormsImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        assessmentId={selectedAssessmentId || ''}
        assessmentTitle={selectedAssessment?.title || ''}
        maxScore={selectedAssessment?.maxScore || 100}
        enrolledStudents={students}
        existingResults={assessmentResults}
        onImportSuccess={() => {
          if (selectedAssessmentId) void fetchAssessmentResults(selectedAssessmentId)
          setNotice('Google Forms responses imported successfully.')
        }}
      />

      <ClassroomQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        formUrl={selectedAssessment?.formUrl || ''}
        title={selectedAssessment?.title || ''}
        courseName={selectedAssessment?.courseName || ''}
      />

      <p role="status" aria-live="polite" className="sr-only">
        {notice}
      </p>

      <ConfirmDialog
        isOpen={deleteResultId !== null}
        title="Delete assessment result?"
        description="This removes the recorded score for this student."
        confirmText="Delete result"
        destructive
        onCancel={() => setDeleteResultId(null)}
        onConfirm={() => void removeResult()}
      />
    </div>
  )
}
