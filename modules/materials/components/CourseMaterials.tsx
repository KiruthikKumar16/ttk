'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  Paperclip,
  FileText,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { CourseMaterial } from '@/modules/materials/types'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useRouter } from 'next/navigation'

export function CourseMaterials({
  courseId,
  initialMaterials = [],
  serverLoaded = false,
  canUpload = true,
}: {
  courseId: string
  initialMaterials?: CourseMaterial[]
  serverLoaded?: boolean
  canUpload?: boolean
}) {
  const router = useRouter()
  const [materials, setMaterials] = useState<CourseMaterial[]>(initialMaterials)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: '',
    file: null as File | null,
  })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

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
      console.error('Course material request failed.')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (!serverLoaded) fetchMaterials()
  }, [courseId, serverLoaded])

  const handleNewMaterialChange = (field: keyof typeof newMaterial, value: any) => {
    setNewMaterial((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 20 * 1024 * 1024) {
        setError('File must be 20 MB or smaller.')
        e.target.value = ''
        return
      }
      if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
        setError('Choose a PDF, PNG, or JPEG file.')
        e.target.value = ''
        return
      }
      setError(null)
      setNewMaterial((current) => ({ ...current, file, type: file.type === 'application/pdf' ? 'pdf' : 'image' }))
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

      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.open('POST', '/api/course-materials')
        request.upload.onprogress = (event) => {
          if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100))
        }
        request.onerror = () => reject(new Error('Upload failed. Check your connection and retry.'))
        request.onload = () => {
          if (request.status >= 200 && request.status < 300) resolve()
          else reject(new Error('Upload failed. Check the file and your access, then retry.'))
        }
        request.send(formData)
      })

      // Clear the form and refresh the list
      setNewMaterial({
        title: '',
        type: '',
        file: null,
      })
      setUploadProgress(0)
      if (serverLoaded) router.refresh()
      else await fetchMaterials()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Course material request failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMaterial = async () => {
    if (!deleteId) return
    const id = deleteId
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/course-materials?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Could not delete this material. Please retry.')
      setMaterials((current) => current.filter((material) => material.id !== id))
      setDeleteId(null)
      setMessage('Course material deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Course material request failed.')
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
          <p className="text-sm text-muted-foreground">Upload and manage learning resources for this course</p>
        </div>
        <Link href="/courses" className="btn-secondary">
          <ArrowLeft size={16} className="mr-2" />
          Back to Courses
        </Link>
      </div>

      {/* Upload Form */}
      {canUpload && (
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
                    <SelectItem value="pdf">PDF document</SelectItem>
                    <SelectItem value="image">PNG or JPEG image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium mb-2 block">File</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={handleFileChange}
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              />
              {newMaterial.file && <p className="mt-2 text-sm text-gray-600">Selected: {newMaterial.file.name}</p>}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {uploading && (
              <div aria-live="polite">
                <label htmlFor="material-upload-progress" className="text-sm">
                  Upload progress: {uploadProgress}%
                </label>
                <progress id="material-upload-progress" value={uploadProgress} max={100} className="block w-full" />
              </div>
            )}
            <Button variant="default" type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Material'}
              <Plus size={16} className="mr-2" />
            </Button>
          </form>
        </div>
      )}

      {/* Materials List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Materials List</h2>
        {materials.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No course materials have been uploaded yet.</p>
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
                          {material.title
                            .split(' ')
                            .map((x) => x[0])
                            .join('')}
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
                          <a
                            href={material.signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`View ${material.title}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-muted"
                          >
                            <Eye size={14} />
                          </a>
                          <a
                            href={material.signedUrl}
                            download
                            aria-label={`Download ${material.title}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-muted"
                          >
                            <Download size={14} />
                          </a>
                          {canUpload && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              aria-label={`Delete ${material.title}`}
                              className="ml-2"
                              onClick={() => setDeleteId(material.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
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
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete course material?"
        description="This removes the file and its course listing."
        confirmText="Delete material"
        destructive
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void handleDeleteMaterial()}
      />
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  )
}

// Helper icon components (since lucide-icons might not have all these, using alternatives)
const ArrowLeft = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
)

const Eye = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const Download = ({ size, ...props }: { size: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
)
