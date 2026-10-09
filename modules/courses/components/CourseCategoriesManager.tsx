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
  Layers,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { CourseCategory } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { PillButton } from '@/components/ui/PillButton'
import { Tag } from '@/components/ui/Tag'
import { EmptyState } from '@/components/ui/EmptyState'

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
          prev.map((c) => (c.id === editingCategory.id ? { ...c, name: updated.name, duration: updated.duration } : c)),
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
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--ink)]">
            Configured Categories ({categories.length})
          </h2>
          <p className="text-xs text-[var(--mute)] mt-1">
            Organize courses by standard duration tiers. Selecting a category when creating a course will auto-fill its
            duration.
          </p>
        </div>
        {canManage && (
          <PillButton variant="primary" onClick={openAddModal} icon={<Plus size={15} />}>
            Add Category
          </PillButton>
        )}
      </div>

      {/* Category cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const isInternship = cat.name.toLowerCase().includes('internship')
          const isElite = cat.name.toLowerCase().includes('elite')

          return (
            <Card key={cat.id} className="p-5 flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--panel)] border border-[var(--border)] text-[var(--g1)] flex items-center justify-center font-bold text-sm shrink-0">
                      {isInternship ? (
                        <FolderOpen size={18} />
                      ) : isElite ? (
                        <Sparkles size={18} />
                      ) : (
                        <BookOpen size={18} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--ink)] text-sm">{cat.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--mute)] mt-0.5">
                        <Clock size={12} className="text-[var(--mute)]" />
                        <span>
                          Standard: <strong className="text-[var(--ink)] font-semibold">{cat.duration}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--panel)] rounded-full transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryToDelete(cat)
                          setConfirmOpen(true)
                        }}
                        className="p-1.5 text-[var(--mute)] hover:text-[#b53c37] hover:bg-[var(--panel)] rounded-full transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <span className="text-[var(--mute)]">
                    Assigned courses: <span className="font-bold text-[var(--ink)]">{cat.courseCount ?? 0}</span>
                  </span>
                  <Link
                    href={`/courses?categoryId=${encodeURIComponent(cat.id)}`}
                    className="text-[var(--g1)] font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    View courses
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {categories.length === 0 && (
        <EmptyState
          icon={<Layers size={28} />}
          title="No course categories found"
          description="Create categories such as Essential (6 weeks) and Elite (12 weeks) to organize your courses and quick-sort them in the course catalog."
          actionLabel={canManage ? 'Add Category' : undefined}
          onAction={canManage ? openAddModal : undefined}
          actionIcon={<Plus size={15} />}
        />
      )}

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] rounded-[26px] shadow-2xl border border-[var(--border)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--panel)]">
              <div>
                <h2 className="text-base font-bold text-[var(--ink)]">
                  {editingCategory ? 'Edit Category' : 'Create Course Category'}
                </h2>
                <p className="text-xs text-[var(--mute)] mt-0.5">
                  Configure the category name and standard course duration.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-[var(--mute)] hover:text-[var(--ink)] p-1 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-[rgba(181,60,55,0.08)] border border-[rgba(181,60,55,0.25)] text-xs text-[#b53c37] flex items-center gap-2 font-medium">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                  Category Name <span className="text-[#b53c37]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Essential or Elite"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                  Standard Duration <span className="text-[#b53c37]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6 weeks or 12 weeks"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors"
                />
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-[var(--mute)] self-center mr-1">Quick pick:</span>
                  {PRESET_DURATIONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDuration(preset)}
                      className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer font-medium ${
                        duration === preset
                          ? 'border-[var(--g1)] bg-[var(--g1)] text-white'
                          : 'border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] hover:border-[var(--g1)]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-[var(--panel)] border border-[var(--border)] rounded-2xl text-xs text-[var(--mute)]">
                💡 When a staff or admin selects this category when adding or editing a course, the duration will
                automatically prefill to{' '}
                <strong className="text-[var(--ink)]">{duration || 'the duration set here'}</strong>.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <PillButton type="button" variant="secondary" onClick={closeModal} disabled={submitting}>
                  Cancel
                </PillButton>
                <PillButton type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </PillButton>
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
    </div>
  )
}
