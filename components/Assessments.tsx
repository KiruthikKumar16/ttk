'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table } from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table-header'
import { TableBody } from '@/components/ui/table-body'
import { TableRow } from '@/components/ui/table-row'
import { TableCell } from '@/components/ui/table-cell'
import { TableHead } from '@/components/ui/table-head'
import { ChevronDown, ChevronUp, Calendar, Filter, Search, User, List, Edit, Trash2, Plus, Check, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'

type Assessment = {
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

type Course = {
  id: string
  name: string
}

export function Assessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<any[]>([]) // We'll fetch students for the selected course when needed
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [newAssessment, setNewAssessment] = useState({
    courseId: '',
    title: '',
    maxScore: '',
    assessmentDate: ''
  })
  const [newResult, setNewResult] = useState({
    studentId: '',
    score: '',
    remarks: ''
  })
  const [assessmentFilters, setAssessmentFilters] = useState({
    courseId: '',
    limit: 50,
    offset: 0
  })
  const [assessmentTotalCount, setAssessmentTotalCount] = useState(0)
  const [assessmentHasMore, setAssessmentHasMore] = useState(false)

  // Fetch courses for the dropdown
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses?page=1&pageSize=1000')
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      const data = await response.json()
      setCourses(data.data || [])
    } catch (err) {
      console.error(err)
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
      queryParams.append('limit', String(assessmentFilters.limit))
      queryParams.append('offset', String(assessmentFilters.offset))

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
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch students for a given course (used when selecting an assessment to enter results)
  const fetchStudentsForCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/students?course=${courseId}&page=1&pageSize=1000`)
      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }
      const data = await response.json()
      setStudents(data.data || [])
    } catch (err) {
      console.error(err)
      setStudents([])
    }
  }

  // Fetch results for a given assessment
  const fetchAssessmentResults = async (assessmentId: string) => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/results?page=1&pageSize=1000`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch assessment results')
      }
      const data = await response.json()
      setAssessmentResults(data.data || [])
    } catch (err) {
      console.error(err)
      setAssessmentResults([])
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCourses()
    fetchAssessments()
  }, [])

  // Refetch assessments when filters change
  useEffect(() => {
    fetchAssessments()
  }, [assessmentFilters.courseId, assessmentFilters.limit, assessmentFilters.offset])

  // When selected assessment changes, fetch its results and students for its course
  useEffect(() => {
    if (selectedAssessmentId) {
      // We need to get the course ID of the selected assessment to fetch students
      const selectedAssessment = assessments.find(a => a.id === selectedAssessmentId)
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
    setAssessmentFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0 // Reset to first page when filters change
    }))
  }

  const handleLoadMoreAssessments = () => {
    setAssessmentFilters(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }))
  }

  const handleNewAssessmentChange = (field: keyof typeof newAssessment, value: string) => {
    setNewAssessment(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNewResultChange = (field: keyof typeof newResult, value: string) => {
    setNewResult(prev => ({
      ...prev,
      [field]: value
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
          assessmentDate: newAssessment.assessmentDate
        })
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
        assessmentDate: ''
      })
      await fetchAssessments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error(err)
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
          remarks: newResult.remarks
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save assessment result')
      }

      // Clear the form and refresh results
      setNewResult({
        studentId: '',
        score: '',
        remarks: ''
      })
      await fetchAssessmentResults(selectedAssessmentId!)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error(err)
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
          <p className="text-sm text-muted-foreground">
            Create and manage assessments for courses
          </p>
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
            <form onSubmit={(e) => {
              e.preventDefault()
              handleCreateAssessment()
            }} className="space-y-4">
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
                      {courses.map(course => (
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
                    min="0"
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
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Course</label>
                  <Select
                    value={assessmentFilters.courseId}
                    onValueChange={(value) => handleAssessmentFiltersChange({ courseId: value as string })}
                    placeholder="All courses"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All courses</SelectItem>
                      {courses.map(course => (
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
                    <TableRow key={assessment.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleSelectAssessment(assessment.id)}>
                      <TableCell>{formatDate(assessment.assessmentDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                            {assessment.courseName.split(' ').map(x => x[0]).join('')}
                          </div>
                          <div className="text-xs font-medium">{assessment.courseName}</div>
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
                        <Button variant="ghost" size="icon" title="View Results">
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
              <p className="text-sm text-muted-foreground">
                Enter and view results for the selected assessment
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setSelectedAssessmentId(null)}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Assessments
              </Button>
              <Button variant="outline" onClick={() => {
                // Refresh results
                if (selectedAssessmentId) {
                  fetchAssessmentResults(selectedAssessmentId)
                }
              }}>
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
                <p className="text-lg font-semibold">{assessments.find(a => a.id === selectedAssessmentId)?.title || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Course</p>
                <p className="text-lg font-semibold">{assessments.find(a => a.id === selectedAssessmentId)?.courseName || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Score</p>
                <p className="text-lg font-semibold">{assessments.find(a => a.id === selectedAssessmentId)?.maxScore || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p className="text-lg font-semibold">{formatDate(assessments.find(a => a.id === selectedAssessmentId)?.assessmentDate || '')}</p>
              </div>
            </div>
          </div>

          {/* New Result Form */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Enter Result for Student</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleCreateResult()
            }} className="space-y-4">
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
                      {students.map(student => (
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
                    min="0"
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
                {loading ? 'Saving...' : 'Save Result'}
                <Plus size={16} className="mr-2" />
              </Button>
            </form>
          </div>

          {/* Results List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Results List</h2>
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
                    const assessment = assessments.find(a => a.id === selectedAssessmentId)
                    const maxScore = assessment?.maxScore || 0
                    const percentage = maxScore > 0 ? ((result.score / maxScore) * 100).toFixed(1) + '%' : '0%'
                    return (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                              {result.studentName.split(' ').map(x => x[0]).join('')}
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
                          <Button variant="ghost" size="icon" title="Edit">
                            <Edit size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete" className="ml-2">
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
    </div>
  )
}

// Helper icon components (since lucide-icons might not have all these, using alternatives)
const ArrowLeft = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg size={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
)

const RefreshCw = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg size={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 17.36 5.74M13.26 4.74a3 3 0 0 1 4.24 0l1.46 1.46a3 3 0 0 1 0 4.24l-1.46 1.46a3 3 0 0 1-4.24 0" />
  </svg>
)