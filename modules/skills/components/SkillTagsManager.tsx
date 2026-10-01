'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, Sparkles, AlertCircle } from 'lucide-react'
import type { SkillTag } from '@/modules/skills/types'
import { Button } from '@/components/ui/button'

export function SkillTagsManager({
  initialSkills = [],
  onSkillsChange,
  isModal = false,
  onClose,
}: {
  initialSkills?: SkillTag[]
  onSkillsChange?: (skills: SkillTag[]) => void
  isModal?: boolean
  onClose?: () => void
}) {
  const [skills, setSkills] = useState<SkillTag[]>(initialSkills)
  const [newSkillName, setNewSkillName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newSkillName.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || 'Failed to create skill')
      }
      const created = json.data as SkillTag
      const updated = [...skills, created]
      setSkills(updated)
      setNewSkillName('')
      onSkillsChange?.(updated)
    } catch (err: any) {
      setError(err.message || 'Failed to add skill')
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (skill: SkillTag) => {
    setEditingId(skill.id)
    setEditingName(skill.name)
    setError(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleSaveEdit = async (id: string) => {
    const trimmed = editingName.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/skills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: trimmed }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || 'Failed to update skill')
      }
      const updatedItem = json.data as SkillTag
      const updated = skills.map((s) => (s.id === id ? updatedItem : s))
      setSkills(updated)
      setEditingId(null)
      setEditingName('')
      onSkillsChange?.(updated)
    } catch (err: any) {
      setError(err.message || 'Failed to update skill')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the skill "${name}"?`)) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/skills?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error?.message || json.message || 'Failed to delete skill')
      }
      const updated = skills.filter((s) => s.id !== id)
      setSkills(updated)
      onSkillsChange?.(updated)
    } catch (err: any) {
      setError(err.message || 'Failed to delete skill')
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <div className="space-y-6">
      {/* Header if not in modal */}
      {!isModal && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900">Knowledge & Skill Tags Configuration</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure and organize the skills and domain tags available when registering new academy learners.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add New Skill Input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Enter new skill name (e.g. Docker, TypeScript, Next.js)"
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          disabled={loading}
          className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-2xs"
        />
        <Button
          type="submit"
          disabled={loading || !newSkillName.trim()}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs"
        >
          <Plus size={14} className="mr-1" />
          Add Skill
        </Button>
      </form>

      {/* Skills List Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
        <div className="p-3 px-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Configured Skills ({skills.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Evenly distributed across 2 rows on registration form
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
          {skills.map((skill, index) => {
            const isEditing = editingId === skill.id
            return (
              <div
                key={skill.id}
                className="p-3 px-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-5 text-[11px] font-mono text-slate-400">
                    {index + 1}.
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(skill.id)
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      autoFocus
                      disabled={loading}
                      className="flex-1 max-w-sm px-2.5 py-1 text-xs rounded border border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-slate-900 truncate">
                        {skill.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Tag
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(skill.id)}
                        disabled={loading || !editingName.trim()}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="Save changes"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(skill)}
                        disabled={loading}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Edit skill name"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(skill.id, skill.name)}
                        disabled={loading}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete skill"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {skills.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No skills configured yet. Add your first skill using the input above.
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Configure Knowledge & Skill Tags</h2>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="p-5 overflow-y-auto flex-1">{content}</div>
          <div className="p-3 px-5 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button size="sm" onClick={onClose} className="text-xs bg-slate-800 text-white hover:bg-slate-900">
              Done
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return content
}
