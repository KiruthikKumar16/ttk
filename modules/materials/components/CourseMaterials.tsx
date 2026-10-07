'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Folder,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Presentation,
  FileArchive,
  FileCode,
  File,
  Search,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Download,
  ExternalLink,
  Trash2,
  Eye,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Filter,
  Sparkles,
  Layers,
  Clock,
  User,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { CourseMaterial } from '@/modules/materials/types'

interface CourseMaterialsProps {
  courseId: string
  courseName?: string
  initialMaterials?: CourseMaterial[]
  serverLoaded?: boolean
  canUpload?: boolean
}

type FolderCategory = 'all' | 'pdf' | 'image' | 'presentation' | 'document' | 'zip'

export function CourseMaterials({
  courseId,
  courseName = 'Course',
  initialMaterials = [],
  serverLoaded = false,
  canUpload = true,
}: CourseMaterialsProps) {
  const router = useRouter()
  const [materials, setMaterials] = useState<CourseMaterial[]>(initialMaterials)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Android Tablet File Manager Controls
  const [search, setSearch] = useState('')
  const [activeFolder, setActiveFolder] = useState<FolderCategory>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [newMaterial, setNewMaterial] = useState<{
    title: string
    type: string
    file: File | null
  }>({
    title: '',
    type: 'pdf',
    file: null,
  })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteTitle, setDeleteTitle] = useState<string | null>(null)

  // Fetch course materials for the given course
  const fetchMaterials = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/course-materials?courseId=${encodeURIComponent(courseId)}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch course materials')
      }
      const data = await response.json()
      setMaterials(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!serverLoaded) fetchMaterials()
  }, [courseId, serverLoaded])

  // Count files by type
  const counts = useMemo(() => {
    const res = {
      all: materials.length,
      pdf: 0,
      image: 0,
      presentation: 0,
      document: 0,
      zip: 0,
    }
    materials.forEach((m) => {
      const t = m.type.toLowerCase()
      if (t.includes('pdf')) res.pdf++
      else if (t.includes('image') || t.includes('png') || t.includes('jpg')) res.image++
      else if (t.includes('presentation') || t.includes('ppt')) res.presentation++
      else if (t.includes('document') || t.includes('doc')) res.document++
      else if (t.includes('zip') || t.includes('archive')) res.zip++
      else res.document++
    })
    return res
  }, [materials])

  // Filtered materials based on active folder tab and search query
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const t = item.type.toLowerCase()
      let matchesFolder = true
      if (activeFolder === 'pdf') matchesFolder = t.includes('pdf')
      else if (activeFolder === 'image') matchesFolder = t.includes('image') || t.includes('png') || t.includes('jpg')
      else if (activeFolder === 'presentation') matchesFolder = t.includes('presentation') || t.includes('ppt')
      else if (activeFolder === 'document') matchesFolder = t.includes('document') || t.includes('doc')
      else if (activeFolder === 'zip') matchesFolder = t.includes('zip') || t.includes('archive')

      const matchesSearch =
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.storagePath.toLowerCase().includes(search.toLowerCase()) ||
        (item.uploadedBy?.fullName && item.uploadedBy.fullName.toLowerCase().includes(search.toLowerCase()))

      return matchesFolder && matchesSearch
    })
  }, [materials, activeFolder, search])

  // Helper to format date
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'MMM d, yyyy')
    } catch {
      return dateString
    }
  }

  // Helper for file type styling & icon
  const getFileTypeTheme = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('pdf')) {
      return {
        label: 'PDF Document',
        tag: 'PDF',
        heroBg: 'bg-gradient-to-br from-rose-50 to-red-100/60 border-b border-rose-200/80',
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
        iconBg: 'bg-rose-600 text-white',
        icon: FileText,
      }
    }
    if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg')) {
      return {
        label: 'Image / Diagram',
        tag: 'IMG',
        heroBg: 'bg-gradient-to-br from-emerald-50 to-teal-100/60 border-b border-emerald-200/80',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        iconBg: 'bg-emerald-600 text-white',
        icon: ImageIcon,
      }
    }
    if (t.includes('presentation') || t.includes('ppt')) {
      return {
        label: 'Presentation Slide',
        tag: 'PPT',
        heroBg: 'bg-gradient-to-br from-amber-50 to-orange-100/60 border-b border-amber-200/80',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        iconBg: 'bg-amber-600 text-white',
        icon: Presentation,
      }
    }
    if (t.includes('zip') || t.includes('archive')) {
      return {
        label: 'Project Archive',
        tag: 'ZIP',
        heroBg: 'bg-gradient-to-br from-purple-50 to-violet-100/60 border-b border-purple-200/80',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        iconBg: 'bg-purple-600 text-white',
        icon: FileArchive,
      }
    }
    return {
      label: 'Document / Guide',
      tag: 'DOC',
      heroBg: 'bg-gradient-to-br from-blue-50 to-indigo-100/60 border-b border-blue-200/80',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
      icon: FileText,
    }
  }

  // Handle file selection and auto-detect type/title
  const handleSelectFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError('File must be 20 MB or smaller.')
      return
    }

    let detectedType = 'pdf'
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
      detectedType = 'image'
    } else if (ext === 'pptx' || ext === 'ppt') {
      detectedType = 'presentation'
    } else if (ext === 'docx' || ext === 'doc' || ext === 'txt') {
      detectedType = 'document'
    } else if (ext === 'zip') {
      detectedType = 'zip'
    }

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    setNewMaterial((prev) => ({
      ...prev,
      file,
      type: detectedType,
      title: prev.title.trim() ? prev.title : cleanTitle,
    }))
    setError(null)
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMaterial.file) {
      setError('Please select or drop a file to upload.')
      return
    }
    if (!newMaterial.title.trim()) {
      setError('Please provide a title for the material.')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', newMaterial.file)
      formData.append('courseId', courseId)
      formData.append('title', newMaterial.title.trim())
      formData.append('type', newMaterial.type)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/course-materials')
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            try {
              const errResp = JSON.parse(xhr.responseText)
              reject(new Error(errResp.error || 'Upload failed. Check format and permissions.'))
            } catch {
              reject(new Error('Upload failed. Check format and permissions.'))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload.'))
        xhr.send(formData)
      })

      // Reset and close
      setNewMaterial({ title: '', type: 'pdf', file: null })
      setUploadModalOpen(false)
      setSuccessMessage('Course material uploaded successfully.')
      setTimeout(() => setSuccessMessage(null), 3500)

      if (serverLoaded) {
        router.refresh()
      } else {
        await fetchMaterials()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return
    const idToDelete = deleteId
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/course-materials?id=${encodeURIComponent(idToDelete)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Could not delete course material.')
      setMaterials((prev) => prev.filter((m) => m.id !== idToDelete))
      setDeleteId(null)
      setDeleteTitle(null)
      setSuccessMessage('Course material deleted.')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete material.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Android Tablet File Manager Header Bar */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb row */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5 font-medium">
            <Link href="/courses" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
              <ArrowLeft size={13} />
              Courses
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-semibold">{courseName}</span>
            <span>/</span>
            <span className="text-blue-600 font-medium">Curriculum Files</span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-xs"
              style={{ background: 'var(--g4)', color: 'var(--g1)' }}
            >
              <FolderOpen size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[var(--text-heading)] tracking-tight leading-none flex items-center gap-2.5">
                {courseName} Materials
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--g4)] text-[var(--g1)] font-bold border border-[var(--g3)]">
                  {materials.length} {materials.length === 1 ? 'file' : 'files'}
                </span>
              </h1>
              <p className="text-xs text-[var(--mute)] mt-1">
                Syllabus, presentation slide decks, worksheets, and downloadable references
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls: Search, View Mode, Upload Action */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Real-time Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-[var(--border)] rounded-full text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] bg-[var(--card)] placeholder:text-[var(--mute)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--text)] p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[var(--card)] p-1 rounded-full border border-[var(--border)] shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 px-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-[var(--g1)] text-white shadow-xs'
                  : 'text-[var(--mute)] hover:text-[var(--text)]'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 px-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-[var(--g1)] text-white shadow-xs'
                  : 'text-[var(--mute)] hover:text-[var(--text)]'
              }`}
              title="List View"
            >
              <ListIcon size={14} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {/* Upload Button */}
          {canUpload && (
            <button type="button" onClick={() => setUploadModalOpen(true)} className="btn-primary">
              <UploadCloud size={14} />
              <span>Upload Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Feedback */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Folder Tabs Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar p-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-xs">
        <button
          type="button"
          onClick={() => setActiveFolder('all')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFolder === 'all' ? 'text-white shadow-xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
          }`}
          style={{
            background: activeFolder === 'all' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
          }}
        >
          <Folder size={14} />
          <span>All Resources</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeFolder === 'all' ? 'bg-white/20 text-white' : 'bg-[var(--panel)] text-[var(--mute)]'
            }`}
          >
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFolder('pdf')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFolder === 'pdf' ? 'text-white shadow-xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
          }`}
          style={{
            background: activeFolder === 'pdf' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
          }}
        >
          <FileText size={14} />
          <span>PDF Documents</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeFolder === 'pdf' ? 'bg-white/20 text-white' : 'bg-[var(--panel)] text-[var(--mute)]'
            }`}
          >
            {counts.pdf}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFolder('presentation')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFolder === 'presentation' ? 'text-white shadow-xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
          }`}
          style={{
            background:
              activeFolder === 'presentation' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
          }}
        >
          <Presentation size={14} />
          <span>Presentations & Slides</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeFolder === 'presentation' ? 'bg-white/20 text-white' : 'bg-[var(--panel)] text-[var(--mute)]'
            }`}
          >
            {counts.presentation}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFolder('image')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFolder === 'image' ? 'text-white shadow-xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
          }`}
          style={{
            background: activeFolder === 'image' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
          }}
        >
          <ImageIcon size={14} />
          <span>Images & Diagrams</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeFolder === 'image' ? 'bg-white/20 text-white' : 'bg-[var(--panel)] text-[var(--mute)]'
            }`}
          >
            {counts.image}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFolder('document')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFolder === 'document' ? 'text-white shadow-xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
          }`}
          style={{
            background: activeFolder === 'document' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
          }}
        >
          <FileText size={14} />
          <span>Docs & Guides</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeFolder === 'document' ? 'bg-white/20 text-white' : 'bg-[var(--panel)] text-[var(--mute)]'
            }`}
          >
            {counts.document}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFolder('zip')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFolder === 'zip' ? 'text-white shadow-xs' : 'text-[var(--mute)] hover:text-[var(--text)]'
          }`}
          style={{
            background: activeFolder === 'zip' ? 'linear-gradient(135deg, var(--g1), var(--g1b))' : 'transparent',
          }}
        >
          <FileArchive size={14} />
          <span>Archives & Code</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeFolder === 'zip' ? 'bg-white/20 text-white' : 'bg-[var(--panel)] text-[var(--mute)]'
            }`}
          >
            {counts.zip}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-[var(--card)] border border-dashed border-[var(--border)] rounded-[22px] p-12 text-center shadow-xs">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3"
            style={{ background: 'var(--panel)', color: 'var(--g1)' }}
          >
            <FolderOpen size={28} />
          </div>
          <h3 className="text-base font-bold text-[var(--text)] mb-1">
            {search ? 'No materials match your search' : 'No materials in this folder'}
          </h3>
          <p className="text-xs text-[var(--mute)] max-w-sm mx-auto mb-4">
            {search
              ? `No curriculum files matching "${search}" were found. Try clearing your search term.`
              : `Upload syllabus documents, lesson slides, and reference files for ${courseName}.`}
          </p>
          {canUpload && (
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }}
            >
              <UploadCloud size={14} className="mr-0.5" />
              Upload First File
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* File Manager: Grid / Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMaterials.map((material) => {
            const theme = getFileTypeTheme(material.type)
            const Icon = theme.icon

            return (
              <div
                key={material.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-[22px] overflow-hidden shadow-xs hover:border-[var(--g1)] transition-all group flex flex-col justify-between"
              >
                {/* Visual Banner Header */}
                <div className={`p-4 relative ${theme.heroBg} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center shadow-xs`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${theme.badge}`}
                      >
                        {theme.tag}
                      </span>
                      <div className="text-[11px] text-[var(--mute)] font-medium mt-0.5">{theme.label}</div>
                    </div>
                  </div>

                  {material.signedUrl && (
                    <a
                      href={material.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full bg-white/80 hover:bg-white text-[var(--text)] shadow-2xs transition-colors"
                      title="Open in new window"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="font-bold text-[var(--text)] text-sm line-clamp-2 leading-snug transition-colors"
                      title={material.title}
                    >
                      {material.title}
                    </h3>
                    <p className="text-[11px] text-[var(--mute)] font-mono mt-1 truncate" title={material.storagePath}>
                      {material.storagePath.split('/').pop() || material.storagePath}
                    </p>
                  </div>

                  {/* Uploader & Date Metadata */}
                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--mute)]">
                    <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                      <div className="w-5 h-5 rounded-full bg-[var(--panel)] text-[var(--text)] flex items-center justify-center text-[10px] font-bold shrink-0">
                        {material.uploadedBy?.fullName?.[0] || 'U'}
                      </div>
                      <span className="truncate text-[var(--text)] font-semibold">
                        {material.uploadedBy?.fullName || 'Staff'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[var(--mute)] shrink-0">
                      <Clock size={11} />
                      <span>{formatDate(material.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions Toolbar */}
                <div className="px-4 py-2.5 bg-[var(--panel)] border-t border-[var(--border)] flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {material.signedUrl ? (
                      <>
                        <a
                          href={material.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-[var(--text)] bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--panel)] transition-colors shadow-2xs"
                        >
                          <Eye size={13} className="text-[var(--mute)]" />
                          View
                        </a>
                        <a
                          href={material.signedUrl}
                          download
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs transition-opacity hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }}
                        >
                          <Download size={13} />
                          Download
                        </a>
                      </>
                    ) : (
                      <span className="text-[11px] text-[var(--mute)] italic">Cloud link pending</span>
                    )}
                  </div>

                  {canUpload && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteId(material.id)
                        setDeleteTitle(material.title)
                      }}
                      className="p-1.5 rounded-full text-[var(--mute)] hover:text-[#b53c37] hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete material"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* File Manager: List View */
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[22px] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--panel)] border-b border-[var(--border)] text-[var(--mute)] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Category Type</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4">Date Added</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredMaterials.map((material) => {
                const theme = getFileTypeTheme(material.type)
                const Icon = theme.icon

                return (
                  <tr key={material.id} className="hover:bg-[var(--panel)] transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${theme.iconBg} flex items-center justify-center shrink-0`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <span className="font-bold text-[var(--text)] group-hover:text-[var(--g1)] transition-colors block text-sm">
                            {material.title}
                          </span>
                          <span className="text-[11px] text-[var(--mute)] font-mono block">
                            {material.storagePath.split('/').pop() || material.storagePath}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${theme.badge}`}
                      >
                        {theme.tag}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text)]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[var(--panel)] text-[var(--text)] flex items-center justify-center text-[10px] font-bold">
                          {material.uploadedBy?.fullName?.[0] || 'S'}
                        </div>
                        <span className="font-medium">{material.uploadedBy?.fullName || 'Staff Member'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[var(--mute)] whitespace-nowrap">{formatDate(material.createdAt)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {material.signedUrl ? (
                          <>
                            <a
                              href={material.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-full text-[var(--mute)] hover:text-[var(--text)] hover:bg-[var(--panel)] transition-colors"
                              title="View"
                            >
                              <Eye size={15} />
                            </a>
                            <a
                              href={material.signedUrl}
                              download
                              className="p-1.5 rounded-full text-[var(--g1)] hover:bg-[var(--panel)] transition-colors"
                              title="Download"
                            >
                              <Download size={15} />
                            </a>
                          </>
                        ) : null}
                        {canUpload && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteId(material.id)
                              setDeleteTitle(material.title)
                            }}
                            className="p-1.5 rounded-full text-[var(--mute)] hover:text-[#b53c37] hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Material Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[var(--card)] rounded-[26px] shadow-xl border border-[var(--border)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                  style={{ background: 'var(--panel)', color: 'var(--g1)' }}
                >
                  <UploadCloud size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text)]">Upload Learning Material</h3>
                  <p className="text-xs text-[var(--mute)]">Adding resource for {courseName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                disabled={uploading}
                className="text-[var(--mute)] hover:text-[var(--text)] p-1.5 rounded-full hover:bg-[var(--panel)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOver(false)
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleSelectFile(e.dataTransfer.files[0])
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[22px] p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-[var(--g1)] bg-[var(--panel)]'
                    : newMaterial.file
                      ? 'border-[#1b7a4b] bg-emerald-500/10'
                      : 'border-[var(--border)] hover:border-[var(--g1)] bg-[var(--panel)]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSelectFile(e.target.files[0])
                    }
                  }}
                />

                {newMaterial.file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-[#1b7a4b] flex items-center justify-center mb-2">
                      <Check size={20} />
                    </div>
                    <span className="text-sm font-bold text-[var(--text)] truncate max-w-xs block">
                      {newMaterial.file.name}
                    </span>
                    <span className="text-xs text-[var(--mute)] mt-0.5">
                      {(newMaterial.file.size / (1024 * 1024)).toFixed(2)} MB · Click to change file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                      style={{ background: 'var(--card)', color: 'var(--g1)' }}
                    >
                      <UploadCloud size={22} />
                    </div>
                    <p className="text-sm font-semibold text-[var(--text)]">
                      Drag and drop your file here, or{' '}
                      <span style={{ color: 'var(--g1)' }} className="underline">
                        browse
                      </span>
                    </p>
                    <p className="text-xs text-[var(--mute)] mt-1">
                      Supports PDF documents, PNG, and JPEG files up to 20 MB
                    </p>
                  </div>
                )}
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Material Title <span className="text-[#b53c37]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 3: React State Management Guide"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-full text-sm bg-[var(--card)] text-[var(--text)] placeholder-[var(--mute)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)]"
                />
              </div>

              {/* Type Category */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Resource Category <span className="text-[#b53c37]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewMaterial((prev) => ({ ...prev, type: 'pdf' }))}
                    className={`p-2.5 rounded-full border text-left text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newMaterial.type === 'pdf'
                        ? 'border-transparent text-white font-bold'
                        : 'border-[var(--border)] text-[var(--text)] bg-[var(--panel)]'
                    }`}
                    style={
                      newMaterial.type === 'pdf' ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' } : {}
                    }
                  >
                    <FileText size={16} />
                    <span>PDF Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMaterial((prev) => ({ ...prev, type: 'image' }))}
                    className={`p-2.5 rounded-full border text-left text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newMaterial.type === 'image'
                        ? 'border-transparent text-white font-bold'
                        : 'border-[var(--border)] text-[var(--text)] bg-[var(--panel)]'
                    }`}
                    style={
                      newMaterial.type === 'image'
                        ? { background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }
                        : {}
                    }
                  >
                    <ImageIcon size={16} />
                    <span>Diagram / Image</span>
                  </button>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-[var(--mute)] font-medium">
                    <span>Uploading file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[var(--panel)] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-150"
                      style={{
                        width: `${uploadProgress}%`,
                        background: 'linear-gradient(90deg, var(--g1), var(--g1b))',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={uploading}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--text)] bg-[var(--panel)] hover:bg-[var(--card)] border border-[var(--border)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !newMaterial.file}
                  className="px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, var(--g1), var(--g1b))' }}
                >
                  {uploading ? `Uploading ${uploadProgress}%` : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title={`Delete "${deleteTitle || 'Course Material'}"?`}
        description="Are you sure you want to delete this file? It will be removed from the course curriculum and storage."
        confirmText="Delete Material"
        destructive
        onConfirm={handleDeleteConfirmed}
        onCancel={() => {
          setDeleteId(null)
          setDeleteTitle(null)
        }}
      />
    </div>
  )
}
