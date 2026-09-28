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
import { ChevronDown, ChevronUp, Calendar, Filter, Search, User, List, Edit, Trash2, Plus, Check, X, Paperclip, FileText } from 'lucide-react'
import { format, parseISO } from 'date-fns'

type CourseMaterial = {
  id: string
  courseId: string
  courseName: string
  title: string
  type: string
  storagePath: string
  uploadedBy: {
    id: string
    fullName: string
    role: string
  } | null
  createdAt: string
  signedUrl: string | null
}

export function CourseMaterials({ courseId }: { courseId: string }) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: '',
    file: null as File | null
  })
  const [uploading, setUploading] = useState(false)

  // Fetch course materials for the given course
  const fetchMaterials = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/course-materials?courseId=${courseId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch course materials')
      }
      const data = await response.json()
      setMaterials(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchMaterials()
  }, [courseId])

  const handleNewMaterialChange = (field: keyof typeof newMaterial, value: any) => {
    setNewMaterial(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleNewMaterialChange('file', e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMaterial.title || !newMaterial.type || !newMaterial.file) {
      setError('Please fill in all fields and select a file.')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', newMaterial.file)
      formData.append('courseId', courseId)
      formData.append('title', newMaterial.title)
      formData.append('type', newMaterial.type)

      const response = await fetch('/api/course-materials', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload course material')
      }

      // Clear the form and refresh the list
      setNewMaterial({
        title: '',
        type: '',
        file: null
      })
      await fetchMaterials()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course material? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Note: We don't have a DELETE endpoint for course materials yet.
      // We would need to create one. For now, we'll just show a message.
      // In a real implementation, we would call a DELETE endpoint.
      setError('Delete functionality not yet implemented.')
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error(err)
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold">Course Materials</h1>
          <p className="text-sm text-muted-foreground">
            Upload and manage learning resources for this course
          </p>
        </div>
        <Button variant="outline" onClick={() => {
          // This would ideally go back to the course list, but we don't have a callback.
          // We'll just reset the state or rely on the parent to handle navigation.
          // For now, we'll just show an alert.
          alert('Use the course list to navigate back.')
        }}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Courses
        </Button>
      </div>

      {/* Upload Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Upload New Material</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={newMaterial.title}
                onChange={(e) => handleNewMaterialChange('title', e.target.value)}
                placeholder="Enter material title"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={newMaterial.type}
                onValueChange={(value) => handleNewMaterialChange('type', value as string)}
                placeholder="Select material type"
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="presentation">Presentation (PPT/PPTX)</SelectItem>
                  <SelectItem value="document">Document (DOC/DOCX)</SelectItem>
                  <SelectItem value="spreadsheet">Spreadsheet (XLS/XLSX)</SelectItem>
                  <SelectItem value="zip">Archive (ZIP)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium mb-2 block">File</label>
            <input
              type="file"
              onChange={handleFileChange}
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
            />
            {newMaterial.file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {newMaterial.file.name}
              </p>
            )}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button variant="default" type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Material'}
            <Plus size={16} className="mr-2" />
          </Button>
        </form>
      </div>

      {/* Materials List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Materials List</h2>
        {materials.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            No course materials have been uploaded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Title</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-20">Uploaded By</TableHead>
                  <TableHead className="w-20">Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                          {material.title.split(' ').map(x => x[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium">{material.title}</div>
                          <div className="text-xs text-muted-foreground">{material.type.toUpperCase()}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{material.type.toUpperCase()}</TableCell>
                    <TableCell>
                      {material.uploadedBy ? (
                        <div className="text-sm space-y-1">
                          <div className="font-medium">{material.uploadedBy.fullName}</div>
                          <div className="text-xs text-muted-foreground">{material.uploadedBy.role}</div>
                        </div>
                      ) : (
                        <span className="text-muted-italic">System</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(material.createdAt)}</TableCell>
                    <TableCell className="text-sm space-x-2">
                      {material.signedUrl ? (
                        <>
                          <Button variant="ghost" size="icon" title="View">
                            <Eye size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" title="Download">
                            <Download size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete" className="ml-2">
                            <Trash2 size={14} />
                          </Button>
                        </>
                      ) : (
                        <span className="text-muted-italic">No URL available</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper icon components (since lucide-icons might not have all these, using alternatives)
const ArrowLeft = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg size={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
)

const Eye = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg size={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const Download = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg size={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
)
