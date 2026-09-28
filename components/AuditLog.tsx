'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table } from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table-header'
import { TableBody } from '@/components/ui/table-body'
import { TableRow } from '@/components/ui/table-row'
import { TableCell } from '@/components/ui/table-cell'
import { TableHead } from '@/components/ui/table-head'
import { ChevronDown, Calendar, Filter, Search, User, Trash2, Edit, List, RefreshCw } from 'lucide-react'
import { format, parseISO } from 'date-fns'

type AuditLogEntry = {
  id: number
  table_name: string
  record_id: string
  action: 'insert' | 'update' | 'delete'
  changed_by: {
    id: string
    role: string
    full_name: string | null
  } | null
  changed_at: string
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
}

export function AuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    studentId: '',
    paymentId: '',
    tableName: '',
    action: '',
    pageSize: 50,
    page: 1
  })
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (filters.studentId) queryParams.append('studentId', filters.studentId)
      if (filters.paymentId) queryParams.append('paymentId', filters.paymentId)
      if (filters.tableName) queryParams.append('tableName', filters.tableName)
      if (filters.action) queryParams.append('action', filters.action)
      queryParams.append('pageSize', String(filters.pageSize))
      queryParams.append('page', String(filters.page))

      const response = await fetch(`/api/audit?${queryParams.toString()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch audit logs')
      }
      const data = await response.json()
      setAuditLogs(data.data)
      setTotalCount(data.count || 0)
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
    fetchAuditLogs()
  }, [filters.studentId, filters.paymentId, filters.tableName, filters.action, filters.pageSize, filters.page])

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

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'PPp')
    } catch {
      return dateString
    }
  }

  const getActionBadge = (action: 'insert' | 'update' | 'delete') => {
    switch (action) {
      case 'insert': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">INSERT</span>
      case 'update': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">UPDATE</span>
      case 'delete': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">DELETE</span>
      default: return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{action}</span>
    }
  }

  if (loading) return <div className="p-6">Loading audit logs...</div>
  if (error) return <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded">Error: {error}</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Track changes to payments and student records
          </p>
        </div>
        <Button variant="outline" onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}>
          <RefreshCw size={16} className="mr-2" /> Refresh
        </Button>
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
          <label className="text-sm font-medium mb-2 block">Payment ID</label>
          <Input
            value={filters.paymentId}
            onChange={(e) => handleFiltersChange({ paymentId: e.target.value })}
            placeholder="Enter payment ID"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Table Name</label>
          <Select
            value={filters.tableName}
            onValueChange={(value) => handleFiltersChange({ tableName: value as string })}
            placeholder="All tables"
          >
            <SelectTrigger>
              <SelectValue placeholder="All tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All tables</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
              <SelectItem value="students">Students</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Action</label>
          <Select
            value={filters.action}
            onValueChange={(value) => handleFiltersChange({ action: value as string })}
            placeholder="All actions"
          >
            <SelectTrigger>
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All actions</SelectItem>
              <SelectItem value="insert">Insert</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Showing {auditLogs.length} of {totalCount} audit log entries
        </div>
        {hasMore && (
          <Button variant="outline" onClick={handleLoadMore} className="text-sm">
            Load More
          </Button>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Timestamp</TableHead>
              <TableHead className="w-16">Table</TableHead>
              <TableHead className="w-16">Action</TableHead>
              <TableHead className="w-20">Record ID</TableHead>
              <TableHead className="w-20">Changed By</TableHead>
              <TableHead>Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{formatDateTime(log.changed_at)}</TableCell>
                <TableCell>
                  <span className="text-xs font-mono">{log.table_name}</span>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell className="text-xs font-mono truncate" title={log.record_id}>
                  {log.record_id}
                </TableCell>
                <TableCell>
                  {log.changed_by ? (
                    <>
                      <div className="font-medium">{log.changed_by.full_name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.changed_by.role}
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">System</span>
                  )}
                </TableCell>
                <TableCell>
                  {/* Show changes based on action */}
                  {log.action === 'insert' && log.new_values ? (
                    <div className="text-sm space-y-1">
                      <div className="text-green-600 font-medium">New Record:</div>
                      <div className="text-xs space-y-0.5">
                        {Object.entries(log.new_values).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium">{key}:</span>
                            <span className="text-xs">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                  </div>
                ) : log.action === 'delete' && log.old_values ? (
                    <div className="text-sm space-y-1">
                      <div className="text-red-600 font-medium">Deleted Record:</div>
                      <div className="text-xs space-y-0.5">
                        {Object.entries(log.old_values).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium">{key}:</span>
                            <span className="text-xs">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                  </div>
                ) : log.action === 'update' && log.old_values && log.new_values ? (
                    <div className="text-sm space-y-1">
                      <div className="font-medium">Changed Fields:</div>
                      <div className="text-xs space-y-0.5">
                        {Object.keys(log.new_values).filter(key =>
                          String(log.old_values?.[key]) !== String(log.new_values?.[key])
                        ).map((key) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="font-medium">{key}:</span>
                            <div className="flex space-x-2">
                              <span className="text-red-600 line-through">{String(log.old_values?.[key])}</span>
                              <span className="text-green-600">{String(log.new_values?.[key])}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-italic">No detailed changes available</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {auditLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No audit logs match the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
