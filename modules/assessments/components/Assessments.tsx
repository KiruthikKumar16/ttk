'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table } from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table-header'
import { TableBody } from '@/components/ui/table-body'
import { TableRow } from '@/components/ui/table-row'
import { TableCell } from '@/components/ui/table-cell'
import { TableHead } from '@/components/ui/table-head'
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  Search,
  User,
  List,
  Edit,
  Trash2,
  Plus,
  Check,
  X,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { CourseCategory } from '@/lib/types'
import { CategoryBadge } from '@/components/CategoryBadge'

export type Assessment = {
  id: string
  courseId: string
  courseName: string
  title: string
  maxScore: number
  assessmentDate: string
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
  const [students, setStudents] = useState<any[]>([]) // We'll fetch students for the selected course when needed
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [deleteResultId, setDeleteResultId] = useState<string | null>(null)
  const [editingResult, setEditingResult] = useState(false)
  const [notice, setNotice] = useState('')
  const [newAssessment, setNewAssessment] = useState({
    courseId: '',
    title: '',
    maxScore: '',
    assessmentDate: '',
  })
  const [newResult, setNewResult] = useState({
    studentId: '',
    score: '',
    remarks: '',
  })
  const [bulkScores, setBulkScores] = useState<Record<string, string>>({})
  const [assessmentFilters, setAssessmentFilters] = useState({
    courseId: initialCourseId,
    pageSize: initialPageSize,
    page: initialPage,
  })
  const [assessmentTotalCount, setAssessmentTotalCount] = useState(initialTotalCount)
  const [assessmentHasMore, setAssessmentHasMore] = useState(initialTotalCount > initialPage * initialPageSize)

  // Fetch courses for the dropdown
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses?page=1&pageSize=100')
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      const data = await response.json()
      setCourses(data.data || [])
    } catch (err) {
      console.error('Assessment request failed.')
      // Non-fatal: we can still proceed without courses, but the form will be empty
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
      console.error('Assessment request failed.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch students for a given course (used when selecting an assessment to enter results)
  const fetchStudentsForCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/students?course=${courseId}&page=1&pageSize=100`)
      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }
      const data = await response.json()
      setStudents(data.data || [])
    } catch (err) {
      console.error('Assessment request failed.')
      setStudents([])
    }
  }

  // Fetch results for a given assessment
  const fetchAssessmentResults = async (assessmentId: string) => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/results?page=1&pageSize=100`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch assessment results')
      }
      const data = await response.json()
      setAssessmentResults(data.data || [])
    } catch (err) {
      console.error('Assessment request failed.')
      setAssessmentResults([])
    }
  }

  // Initial fetch
  useEffect(() => {
    if (!initialDataLoaded) {
      fetchCourses()
      fetchAssessments()
    }
  }, [initialDataLoaded])

  // When selected assessment changes, fetch its results and students for its course
  useEffect(() => {
    if (selectedAssessmentId) {
      // We need to get the course ID of the selected assessment to fetch students
      const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId)
      if (selectedAssessment) {
        fetchStudentsForCourse(selectedAssessment.courseId)
        fetchAssessmentResults(selectedAssessmentId)
      }
    } else {
      setAssessmentResults([])
      setStudents([])
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
    // Basic validation
    if (!newAssessment.courseId || !newAssessment.title || !newAssessment.maxScore || !newAssessment.assessmentDate) {
      setError('Please fill in all fields')
      return
    }

    const maxScoreNum = parseFloat(newAssessment.maxScore)
    if (isNaN(maxScoreNum) || maxScoreNum < 0) {
      setError('Max score must be a non-negative number')
      return
    }

    // We'll create the assessment via the API
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: newAssessment.courseId,
          title: newAssessment.title,
          maxScore: maxScoreNum,
          assessmentDate: newAssessment.assessmentDate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create assessment')
      }

      // Clear the form and refresh assessments
      setNewAssessment({
        courseId: '',
        title: '',
        maxScore: '',
        assessmentDate: '',
      })
      await fetchAssessments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Assessment request failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateResult = async () => {
    // Basic validation
    if (!newResult.studentId || !newResult.score) {
      setError('Please fill in student and score')
      return
    }

    const scoreNum = parseFloat(newResult.score)
    if (isNaN(scoreNum) || scoreNum < 0) {
      setError('Score must be a non-negative number')
      return
    }

    // We'll create the result via the API
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/assessments/${selectedAssessmentId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: parseInt(newResult.studentId, 10),
          score: scoreNum,
          remarks: newResult.remarks,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save assessment result')
      }

      // Clear the form and refresh results
      setNewResult({
        studentId: '',
        score: '',
        remarks: '',
      })
      setEditingResult(false)
      setNotice(editingResult ? 'Result updated.' : 'Result saved.')
      await fetchAssessmentResults(selectedAssessmentId!)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Assessment request failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBulkScores = async () => {
    const entries = Object.entries(bulkScores).filter(([, score]) => score.trim() !== '')
    const assessment = assessments.find((item) => item.id === selectedAssessmentId)
    if (!selectedAssessmentId || !assessment || entries.length === 0) {
      setError('Enter at least one score before saving the table.')
      return
    }
    const results = entries.map(([studentId, score]) => ({ studentId: Number(studentId), score: Number(score) }))
    if (
      results.some((result) => !Number.isFinite(result.score) || result.score < 0 || result.score > assessment.maxScore)
    ) {
      setError(`Scores must be between 0 and ${assessment.maxScore}.`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/assessments/${selectedAssessmentId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error?.message ?? data?.error ?? 'Unable to save the bulk scores.')
      }
      setBulkScores({})
      await fetchAssessmentResults(selectedAssessmentId)
      setNotice(`Saved ${results.length} scores.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save the bulk scores.')
    } finally {
      setLoading(false)
    }
  }

  const exportResults = () => {
    const assessment = assessments.find((item) => item.id === selectedAssessmentId)
    if (!assessment || assessmentResults.length === 0) return
    const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
    const rows = [
      ['Student', 'Register ID', 'Score', 'Maximum score', 'Percentage', 'Remarks'],
      ...assessmentResults.map((result) => [
        result.studentName,
        result.studentId,
        result.score,
        assessment.maxScore,
        assessment.maxScore > 0 ? ((result.score / assessment.maxScore) * 100).toFixed(1) : '0.0',
        result.remarks ?? '',
      ]),
    ]
    const blob = new Blob([rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `assessment-${assessment.id}-results.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const removeResult = async () => {
    if (!selectedAssessmentId || !deleteResultId) return
    setLoading(true)
    try {
      const response = await fetch(
        `/api/assessments/${selectedAssessmentId}/results?resultId=${encodeURIComponent(deleteResultId)}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } },
      )
      if (!response.ok) throw new Error('Could not delete this result. Please retry.')
      setAssessmentResults((current) => current.filter((result) => result.id !== deleteResultId))
      setDeleteResultId(null)
      setNotice('Result deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this result.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAssessment = (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'PP')
    } catch {
      return dateString
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded">Error: {error}</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Assessments</h1>
          <p className="text-sm text-muted-foreground">Create and manage assessments for courses</p>
        </div>
        <Button variant="outline" onClick={() => setSelectedAssessmentId(null)}>
          <Plus size={16} className="mr-2" />
          New Assessment
        </Button>
      </div>

      {!selectedAssessmentId ? (
        // Assessment list and creation form
        <>
          {/* New Assessment Form */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Create New Assessment</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateAssessment()
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Course</label>
                  <Select
                    value={newAssessment.courseId}
                    onValueChange={(value) => handleNewAssessmentChange('courseId', value as string)}
                    placeholder="Select a course"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={newAssessment.title}
                    onChange={(e) => handleNewAssessmentChange('title', e.target.value)}
                    placeholder="Enter assessment title"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Score</label>
                  <Input
                    value={newAssessment.maxScore}
                    onChange={(e) => handleNewAssessmentChange('maxScore', e.target.value)}
                    placeholder="Enter max score (e.g., 100)"
                    type="number"
                    min={0}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Assessment Date</label>
                  <Input
                    value={newAssessment.assessmentDate}
                    onChange={(e) => handleNewAssessmentChange('assessmentDate', e.target.value)}
                    placeholder="YYYY-MM-DD"
                    type="date"
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button variant="default" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Assessment'}
                <Plus size={16} className="mr-2" />
              </Button>
            </form>
          </div>

          {/* Assessments List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Assessments List</h2>
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Category Tier</label>
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
                    placeholder="All categories"
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} ({cat.duration})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Course</label>
                  <Select
                    value={assessmentFilters.courseId}
                    onValueChange={(value) => handleAssessmentFiltersChange({ courseId: value as string })}
                    placeholder="All courses"
                  >
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="All courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All courses</SelectItem>
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

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Date</TableHead>
                    <TableHead className="w-20">Course</TableHead>
                    <TableHead className="w-36">Title</TableHead>
                    <TableHead className="w-16">Max Score</TableHead>
                    <TableHead className="w-20">Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow
                      key={assessment.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSelectAssessment(assessment.id)}
                    >
                      <TableCell>{formatDate(assessment.assessmentDate)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <strong className="text-xs font-semibold text-slate-900">{assessment.courseName}</strong>
                          {(() => {
                            const crs = courses.find(
                              (c) => c.id === assessment.courseId || c.name === assessment.courseName,
                            )
                            const catName = crs?.categoryName
                            if (!catName) return null
                            return <CategoryBadge categoryName={catName} />
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="text-left">{assessment.title}</TableCell>
                      <TableCell className="text-right">{assessment.maxScore}</TableCell>
                      <TableCell>
                        {assessment.createdBy ? (
                          <div className="text-sm space-y-1">
                            <div className="font-medium">{assessment.createdBy.fullName}</div>
                            <div className="text-xs text-muted-foreground">{assessment.createdBy.role}</div>
                          </div>
                        ) : (
                          <span className="text-muted-italic">System</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="View Results"
                          aria-label={`View results for ${assessment.title}`}
                          onClick={() => handleSelectAssessment(assessment.id)}
                        >
                          <List size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {assessments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No assessments match the current filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {assessments.length} of {assessmentTotalCount} assessments
              </div>
              {assessmentHasMore && (
                <Button variant="outline" onClick={handleLoadMoreAssessments} className="text-sm">
                  Load More
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        // Assessment Results View
        <>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold">Assessment Results</h1>
              <p className="text-sm text-muted-foreground">Enter and view results for the selected assessment</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setSelectedAssessmentId(null)}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Assessments
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Refresh results
                  if (selectedAssessmentId) {
                    fetchAssessmentResults(selectedAssessmentId)
                  }
                }}
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Assessment Info */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Assessment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Title</p>
                <p className="text-lg font-semibold">
                  {assessments.find((a) => a.id === selectedAssessmentId)?.title || ''}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Course</p>
                <p className="text-lg font-semibold">
                  {assessments.find((a) => a.id === selectedAssessmentId)?.courseName || ''}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Score</p>
                <p className="text-lg font-semibold">
                  {assessments.find((a) => a.id === selectedAssessmentId)?.maxScore || ''}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p className="text-lg font-semibold">
                  {formatDate(assessments.find((a) => a.id === selectedAssessmentId)?.assessmentDate || '')}
                </p>
              </div>
            </div>
          </div>

          {/* New Result Form */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">{editingResult ? 'Edit result' : 'Enter Result for Student'}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateResult()
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Student</label>
                  <Select
                    value={newResult.studentId}
                    onValueChange={(value) => handleNewResultChange('studentId', value as string)}
                    placeholder="Select a student"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.register_id} value={student.register_id.toString()}>
                          {student.name} (TAI-{student.register_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Score</label>
                  <Input
                    value={newResult.score}
                    onChange={(e) => handleNewResultChange('score', e.target.value)}
                    placeholder="Enter score"
                    type="number"
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium mb-2 block">Remarks (optional)</label>
                <Input
                  value={newResult.remarks}
                  onChange={(e) => handleNewResultChange('remarks', e.target.value)}
                  placeholder="Enter any remarks"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button variant="default" type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingResult ? 'Update Result' : 'Save Result'}
                <Plus size={16} className="mr-2" />
              </Button>
            </form>
          </div>

          <section className="bg-white p-6 rounded-lg shadow mb-6" aria-labelledby="bulk-score-heading">
            <h2 id="bulk-score-heading" className="text-xl font-bold mb-2">
              Bulk score entry
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Enter scores for any students below. Existing scores for those students will be updated together.
            </p>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrolled students were found for this course.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Enter assessment scores for enrolled students</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="p-2">
                          Student
                        </th>
                        <th scope="col" className="p-2">
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.register_id} className="border-t">
                          <th scope="row" className="p-2 font-medium">
                            {student.name}
                            <span className="ml-2 text-xs text-muted-foreground">#{student.register_id}</span>
                          </th>
                          <td className="p-2">
                            <label className="sr-only" htmlFor={`bulk-score-${student.register_id}`}>
                              Score for {student.name}
                            </label>
                            <Input
                              id={`bulk-score-${student.register_id}`}
                              type="number"
                              min={0}
                              max={assessments.find((a) => a.id === selectedAssessmentId)?.maxScore}
                              step="0.01"
                              inputMode="decimal"
                              value={bulkScores[String(student.register_id)] ?? ''}
                              onChange={(event) =>
                                setBulkScores((current) => ({
                                  ...current,
                                  [String(student.register_id)]: event.target.value,
                                }))
                              }
                              className="max-w-40"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button
                  type="button"
                  className="mt-4 min-h-10"
                  disabled={loading || Object.values(bulkScores).every((score) => score.trim() === '')}
                  onClick={() => void handleSaveBulkScores()}
                >
                  {loading ? 'Saving scores…' : 'Save all scores'}
                </Button>
              </>
            )}
          </section>

          {(() => {
            const maxScore = assessments.find((item) => item.id === selectedAssessmentId)?.maxScore ?? 0
            const bands = [
              { label: '0–49%', min: 0, max: 50 },
              { label: '50–69%', min: 50, max: 70 },
              { label: '70–84%', min: 70, max: 85 },
              { label: '85–100%', min: 85, max: 101 },
            ]
            const counts = bands.map(
              (band) =>
                assessmentResults.filter((result) => {
                  const percent = maxScore > 0 ? (result.score / maxScore) * 100 : 0
                  return percent >= band.min && percent < band.max
                }).length,
            )
            const maxCount = Math.max(1, ...counts)
            return (
              <section className="bg-white p-6 rounded-lg shadow mb-6" aria-labelledby="grade-distribution-heading">
                <h2 id="grade-distribution-heading" className="text-xl font-bold mb-4">
                  Grade distribution
                </h2>
                {assessmentResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Scores will appear here after grading.</p>
                ) : (
                  <div
                    role="img"
                    aria-label={`Grade distribution across ${assessmentResults.length} results`}
                    className="grid gap-3 sm:grid-cols-4"
                  >
                    {bands.map((band, index) => (
                      <div key={band.label} className="rounded border p-3">
                        <div className="flex justify-between text-sm">
                          <span>{band.label}</span>
                          <strong>{counts[index]}</strong>
                        </div>
                        <div className="mt-2 h-2 rounded bg-muted">
                          <div
                            className="h-2 rounded bg-primary"
                            style={{ width: `${(counts[index] / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })()}

          {/* Results List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Results List</h2>
              <Button type="button" variant="outline" disabled={assessmentResults.length === 0} onClick={exportResults}>
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Student</TableHead>
                    <TableHead className="w-20">Score</TableHead>
                    <TableHead className="w-20">Max Score</TableHead>
                    <TableHead className="w-20">Percentage</TableHead>
                    <TableHead className="w-20">Remarks</TableHead>
                    <TableHead className="w-20">Graded By</TableHead>
                    <TableHead className="w-20">Graded At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentResults.map((result) => {
                    const assessment = assessments.find((a) => a.id === selectedAssessmentId)
                    const maxScore = assessment?.maxScore || 0
                    const percentage = maxScore > 0 ? ((result.score / maxScore) * 100).toFixed(1) + '%' : '0%'
                    return (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                              {result.studentName
                                .split(' ')
                                .map((x) => x[0])
                                .join('')}
                            </div>
                            <div>
                              <div className="font-medium">{result.studentName}</div>
                              <div className="text-xs text-muted-foreground">TAI-{result.studentId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{result.score}</TableCell>
                        <TableCell className="text-right">{maxScore}</TableCell>
                        <TableCell className="text-right">{percentage}</TableCell>
                        <TableCell>{result.remarks ?? '-'}</TableCell>
                        <TableCell>
                          {result.gradedBy ? (
                            <div className="text-sm space-y-1">
                              <div className="font-medium">{result.gradedBy.fullName}</div>
                              <div className="text-xs text-muted-foreground">{result.gradedBy.role}</div>
                            </div>
                          ) : (
                            <span className="text-muted-italic">System</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(result.gradedAt)}</TableCell>
                        <TableCell className="text-sm space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            aria-label={`Edit result for ${result.studentName}`}
                            onClick={() => {
                              setNewResult({
                                studentId: String(result.studentId),
                                score: String(result.score),
                                remarks: result.remarks ?? '',
                              })
                              setEditingResult(true)
                              document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            aria-label={`Delete result for ${result.studentName}`}
                            className="ml-2"
                            onClick={() => setDeleteResultId(result.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {assessmentResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No results have been entered for this assessment yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
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

// Helper icon components (since lucide-icons might not have all these, using alternatives)
const ArrowLeft = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
)

const RefreshCw = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 17.36 5.74M13.26 4.74a3 3 0 0 1 4.24 0l1.46 1.46a3 3 0 0 1 0 4.24l-1.46 1.46a3 3 0 0 1-4.24 0" />
  </svg>
)
