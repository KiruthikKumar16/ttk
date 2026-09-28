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
import { ChevronDown, ChevronUp, Calendar, Filter, Search, User, List } from 'lucide-react'
import { format, parseISO } from 'date-fns'

type AttendanceRecord = {
  id: string
  studentId: number
  studentName: string
  courseId: string
  courseName: string
  sessionDate: string
  status: 'Present' | 'Absent' | 'Late' | 'Excused'
  markedBy: {
    id: string
    fullName: string
    role: string
  } | null
  createdAt: string
}

export function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    studentId: '',
    courseId: '',
    startDate: '',
    endDate: '',
    pageSize: 50,
    page: 1
  })
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Fetch attendance records
  const fetchAttendance = async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (filters.studentId) queryParams.append('studentId', filters.studentId)
      if (filters.courseId) queryParams.append('courseId', filters.courseId)
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)
      queryParams.append('pageSize', String(filters.pageSize))
      queryParams.append('page', String(filters.page))

      const response = await fetch(`/api/attendance?${queryParams.toString()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch attendance records')
      }
      const data = await response.json()
      setAttendanceRecords(data.data)
      setTotalCount(data.totalCount || 0)
      setHasMore(data.hasMore || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchAttendance()
  }, [filters.studentId, filters.courseId, filters.startDate, filters.endDate, filters.pageSize, filters.page])

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }))
  }

  const handleLoadMore = () => {
    setFilters(prev => ({
      ...prev,
      page: prev.page + 1
    }))
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'PP')
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    switch (status) {
      case 'Present': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Present</span>
      case 'Absent': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Absent</span>
      case 'Late': return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Late</span>
      case 'Excused': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Excused</span>
      default: return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{status}</span>
    }
  }

  if (loading) return <div className="p-6">Loading attendance records...</div>
  if (error) return <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded">Error: {error}</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance Records</h1>
          <p className="text-sm text-muted-foreground">
            Track student attendance across courses and sessions
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}>
            <RefreshCw size={16} className="mr-2" /> Refresh
          </Button>
          {/* Button to mark new attendance would go here, likely linking to student/detail or course views */}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Student ID</label>
          <Input
            value={filters.studentId}
            onChange={(e) => handleFiltersChange({ studentId: e.target.value })}
            placeholder="Enter student ID"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Course ID</label>
          <Input
            value={filters.courseId}
            onChange={(e) => handleFiltersChange({ courseId: e.target.value })}
            placeholder="Enter course ID"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Start Date</label>
          <Input
            value={filters.startDate}
            onChange={(e) => handleFiltersChange({ startDate: e.target.value })}
            placeholder="YYYY-MM-DD"
            type="date"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">End Date</label>
          <Input
            value={filters.endDate}
            onChange={(e) => handleFiltersChange({ endDate: e.target.value })}
            placeholder="YYYY-MM-DD"
            type="date"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Showing {attendanceRecords.length} of {totalCount} attendance records
        </div>
        {hasMore && (
          <Button variant="outline" onClick={handleLoadMore} className="text-sm">
            Load More
          </Button>
        )}
      </div>

      {/* Attendance Records Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Date</TableHead>
              <TableHead className="w-20">Student</TableHead>
              <TableHead className="w-20">Course</TableHead>
              <TableHead className="w-16">Status</TableHead>
              <TableHead className="w-20">Marked By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{formatDate(record.sessionDate)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                      {record.studentName.split(' ').map(x => x[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium">{record.studentName}</div>
                      <div className="text-xs text-muted-foreground">TAI-{record.studentId}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                      {record.courseName.split(' ').map(x => x[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium">{record.courseName}</div>
                      <div className="text-xs text-muted-foreground">{record.courseId}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
                <TableCell>
                  {record.markedBy ? (
                    <div className="text-sm space-y-1">
                      <div className="font-medium">{record.markedBy.fullName}</div>
                      <div className="text-xs text-muted-foreground">{record.markedBy.role}</div>
                    </div>
                  ) : (
                    <span className="text-muted-italic">System</span>
                  )}
                </TableCell>
                <TableCell className="text-sm space-x-2">
                  {/* In a full implementation, these would link to edit views or show details */}
                  <Button variant="ghost" size="icon" title="View details">
                    <Eye size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {attendanceRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No attendance records match the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Helper icon components (since lucide-icons might not have all these, using alternatives)
const RefreshCw = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 17.36 5.74M13.26 4.74a3 3 0 0 1 4.24 0l1.46 1.46a3 3 0 0 1 0 4.24l-1.46 1.46a3 3 0 0 1-4.24 0" />
  </svg>
)

const Eye = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
