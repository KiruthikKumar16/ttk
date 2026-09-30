'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Clock,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  BookOpen,
  ArrowRight,
  Sparkles,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { CourseCategory } from '@/lib/types'

const PRESET_DURATIONS = ['4 weeks', '6 weeks', '8 weeks', '12 weeks', '16 weeks', '1.5 Months', '3 Months', '6 Months']

export function CourseCategoriesManager({
  initialCategories,
  canManage = true,
}: {
  initialCategories: CourseCategory[]
  canManage?: boolean
}) {
  const router = useRouter()
  const [categories, setCategories] = useState<CourseCategory[]>(initialCategories)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null)

  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<CourseCategory | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openAddModal = () => {
    setEditingCategory(null)
    setName('')
    setDuration('6 weeks')
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (cat: CourseCategory) => {
    setEditingCategory(cat)
    setName(cat.name)
    setDuration(cat.duration)
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCategory(null)
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError('Category name is required.')
      return
    }
    if (!duration.trim()) {
      setFormError('Default duration is required.')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      if (editingCategory) {
        const res = await fetch('/api/course-categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCategory.id,
            name: name.trim(),
            duration: duration.trim(),
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error?.message || body.error || 'Failed to update category.')
        }
        const updated = await res.json()
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id
              ? { ...c, name: updated.name, duration: updated.duration }
              : c,
          ),
        )
      } else {
        const res = await fetch('/api/course-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            duration: duration.trim(),
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error?.message || body.error || 'Failed to create category.')
        }
        const created = await res.json()
        setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      }
      closeModal()
      router.refresh()
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/course-categories?id=${encodeURIComponent(categoryToDelete.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error?.message || body.error || 'Failed to delete category.')
      }
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id))
      setConfirmOpen(false)
      setCategoryToDelete(null)
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to delete category.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              Configured Categories ({categories.length})
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Organize courses by standard duration tiers. Selecting a category when creating a course will auto-fill its duration.
            </p>
          </div>
          {canManage && (
            <Button onClick={openAddModal} className="flex items-center gap-2">
              <Plus size={16} />
              Add Category
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const isInternship = cat.name.toLowerCase().includes('internship')
            const isElite = cat.name.toLowerCase().includes('elite')
            const isEssential = cat.name.toLowerCase().includes('essential')
            const iconBg = isInternship
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : isElite
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : isEssential
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'

            return (
              <div
                key={cat.id}
                className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${iconBg}`}>
                        {isInternship ? <FolderOpen size={18} /> : isElite ? <Sparkles size={18} /> : <BookOpen size={18} />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base">{cat.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                          <Clock size={13} className="text-gray-400" />
                          <span>Standard: <strong className="text-gray-700 font-medium">{cat.duration}</strong></span>
                        </div>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryToDelete(cat)
                            setConfirmOpen(true)
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Assigned courses: <span className="font-semibold text-gray-900">{cat.courseCount ?? 0}</span>
                    </span>
                    <Link
                      href={`/courses?categoryId=${encodeURIComponent(cat.id)}`}
                      className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      View courses
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {categories.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <BookOpen size={36} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No course categories found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Create categories such as Essential (6 weeks) and Elite (12 weeks) to organize your courses and quick-sort them in the course catalog.
            </p>
            {canManage && (
              <Button onClick={openAddModal} className="mt-4">
                <Plus size={16} className="mr-1.5" />
                Add Category
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Create Course Category'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure the category name and standard course duration.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Essential or Elite"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standard Duration <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6 weeks or 12 weeks"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-gray-400 self-center mr-1">Quick pick:</span>
                  {PRESET_DURATIONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDuration(preset)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                        duration === preset
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-800">
                💡 When a staff or admin selects this category when adding or editing a course, the duration will automatically prefill to <strong>{duration || 'the duration set here'}</strong>.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title={`Delete Category "${categoryToDelete?.name}"?`}
        description="Are you sure you want to delete this category? Any courses currently linked to this category will become uncategorized. The courses themselves will not be deleted."
        confirmText={deleting ? 'Deleting...' : 'Delete Category'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false)
          setCategoryToDelete(null)
        }}
      />
    </>
  )
}
