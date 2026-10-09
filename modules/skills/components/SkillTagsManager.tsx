'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Search,
  LayoutGrid,
  List as ListIcon,
  Tag as TagIcon,
  Tags,
  Code,
  Layers,
  Wand2,
  FolderOpen,
  Cpu,
  Globe,
  Database,
  Terminal,
} from 'lucide-react'
import type { SkillTag } from '@/modules/skills/types'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card } from '@/components/ui/Card'
import { PillButton } from '@/components/ui/PillButton'
import { Tag } from '@/components/ui/Tag'
import { EmptyState } from '@/components/ui/EmptyState'

type SkillCategory = 'all' | 'frontend' | 'backend' | 'ai_data' | 'cloud_devops' | 'levels' | 'general'

interface DomainMeta {
  category: SkillCategory
  label: string
  tagVariant: 'accent' | 'success' | 'warning' | 'danger' | 'neutral'
  icon: typeof Code
}

function getSkillDomain(name: string): DomainMeta {
  const n = name.toLowerCase().trim()
  if (
    n.includes('react') ||
    n.includes('vue') ||
    n.includes('next') ||
    n.includes('angular') ||
    n.includes('html') ||
    n.includes('css') ||
    n.includes('script') ||
    n.includes('frontend') ||
    n.includes('web dev') ||
    n.includes('ui/ux') ||
    n.includes('figma') ||
    n.includes('tailwind')
  ) {
    return {
      category: 'frontend',
      label: 'Frontend & UI',
      tagVariant: 'accent',
      icon: Globe,
    }
  }
  if (
    n.includes('ai') ||
    n.includes('ml') ||
    n.includes('machine learning') ||
    n.includes('data') ||
    n.includes('deep learning') ||
    n.includes('pytorch') ||
    n.includes('tensorflow') ||
    n.includes('analytics') ||
    n.includes('nlp')
  ) {
    return {
      category: 'ai_data',
      label: 'AI & Data Science',
      tagVariant: 'accent',
      icon: Cpu,
    }
  }
  if (
    n.includes('docker') ||
    n.includes('k8s') ||
    n.includes('kubernetes') ||
    n.includes('aws') ||
    n.includes('cloud') ||
    n.includes('devops') ||
    n.includes('linux') ||
    n.includes('git') ||
    n.includes('ci/cd')
  ) {
    return {
      category: 'cloud_devops',
      label: 'Cloud & DevOps',
      tagVariant: 'accent',
      icon: Terminal,
    }
  }
  if (
    n.includes('student') ||
    n.includes('intern') ||
    n.includes('beginner') ||
    n.includes('job seeker') ||
    n.includes('fresher') ||
    n.includes('college') ||
    n.includes('level')
  ) {
    return {
      category: 'levels',
      label: 'Learner Cohort',
      tagVariant: 'neutral',
      icon: FolderOpen,
    }
  }
  if (
    n.includes('node') ||
    n.includes('python') ||
    n.includes('java') ||
    n.includes('sql') ||
    n.includes('postgres') ||
    n.includes('mongo') ||
    n.includes('backend') ||
    n.includes('api') ||
    n.includes('express') ||
    n.includes('database') ||
    n.includes('full stack')
  ) {
    return {
      category: 'backend',
      label: 'Backend & Data',
      tagVariant: 'accent',
      icon: Database,
    }
  }
  return {
    category: 'general',
    label: 'Core Competency',
    tagVariant: 'neutral',
    icon: Code,
  }
}

const POPULAR_PRESETS = [
  'TypeScript',
  'Next.js',
  'Tailwind CSS',
  'Node.js',
  'PostgreSQL',
  'Docker',
  'AWS',
  'Machine Learning',
  'Git & GitHub',
  'REST APIs',
  'Figma',
  'MongoDB',
]

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
  const [success, setSuccess] = useState<string | null>(null)

  // Filters & display
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<SkillCategory>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Confirm delete dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [skillToDelete, setSkillToDelete] = useState<SkillTag | null>(null)
  const [deleting, setDeleting] = useState(false)

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setError(msg)
      setTimeout(() => setError(null), 5000)
    } else {
      setSuccess(msg)
      setTimeout(() => setSuccess(null), 4000)
    }
  }

  const handleAdd = async (skillNameToAdd?: string) => {
    const raw = typeof skillNameToAdd === 'string' ? skillNameToAdd : newSkillName
    const trimmed = raw.trim()
    if (!trimmed) return

    // Duplicate check
    const existing = skills.find((s) => s.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      showNotification(`"${trimmed}" is already configured in skill tags.`, true)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error?.message || json.error || json.message || 'Failed to create skill')
      }
      const created = json.data as SkillTag
      const updated = [...skills, created]
      setSkills(updated)
      setNewSkillName('')
      onSkillsChange?.(updated)
      showNotification(`Skill tag "${created.name}" created successfully.`)
    } catch (err: any) {
      showNotification(err.message || 'Failed to add skill tag', true)
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
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error?.message || json.error || json.message || 'Failed to update skill')
      }
      const updatedItem = json.data as SkillTag
      const updated = skills.map((s) => (s.id === id ? updatedItem : s))
      setSkills(updated)
      setEditingId(null)
      setEditingName('')
      onSkillsChange?.(updated)
      showNotification(`Skill tag renamed to "${trimmed}".`)
    } catch (err: any) {
      showNotification(err.message || 'Failed to update skill tag', true)
    } finally {
      setLoading(false)
    }
  }

  const openDeleteDialog = (skill: SkillTag) => {
    setSkillToDelete(skill)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!skillToDelete) return

    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/skills?id=${encodeURIComponent(skillToDelete.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error?.message || json.error || json.message || 'Failed to delete skill')
      }
      const updated = skills.filter((s) => s.id !== skillToDelete.id)
      setSkills(updated)
      onSkillsChange?.(updated)
      showNotification(`Skill tag "${skillToDelete.name}" was removed.`)
      setDeleteConfirmOpen(false)
      setSkillToDelete(null)
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete skill tag', true)
    } finally {
      setDeleting(false)
    }
  }

  // Filter skills by search query and domain
  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      const matchesSearch = searchQuery.trim() === '' || s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      if (!matchesSearch) return false

      if (selectedDomain === 'all') return true
      const domain = getSkillDomain(s.name)
      return domain.category === selectedDomain
    })
  }, [skills, searchQuery, selectedDomain])

  // Count by domain category
  const domainCounts = useMemo(() => {
    const counts: Record<SkillCategory, number> = {
      all: skills.length,
      frontend: 0,
      backend: 0,
      ai_data: 0,
      cloud_devops: 0,
      levels: 0,
      general: 0,
    }
    skills.forEach((s) => {
      const d = getSkillDomain(s.name)
      counts[d.category]++
    })
    return counts
  }, [skills])

  // Presets not yet added
  const availablePresets = useMemo(() => {
    const existingNames = new Set(skills.map((s) => s.name.toLowerCase()))
    return POPULAR_PRESETS.filter((p) => !existingNames.has(p.toLowerCase()))
  }, [skills])

  const content = (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl border border-[var(--g5)] text-xs text-[var(--g1b)] flex items-center justify-between gap-2 shadow-2xs"
          style={{ background: 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)' }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[var(--g1)] shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 text-[var(--g1)] hover:opacity-75 rounded transition-opacity cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="p-3.5 rounded-2xl border border-[var(--g5)] text-xs text-[var(--g1b)] flex items-center justify-between gap-2 shadow-2xs"
          style={{ background: 'linear-gradient(135deg, var(--g4) 0%, var(--panel) 100%)' }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[var(--g1)] shrink-0" />
            <span className="font-medium">{success}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="p-1 text-[var(--g1)] hover:opacity-75 rounded transition-opacity cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* METRIC OVERVIEW CARDS (only on standalone page, not modal) */}
      {!isModal && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Skill Tags"
            value={skills.length}
            subtitle="Configured in academy catalog"
            icon={Tags}
          />
          <KpiCard
            title="Active Domains"
            value={Object.entries(domainCounts).filter(([k, v]) => k !== 'all' && v > 0).length}
            subtitle="Frontend, Backend, AI, DevOps"
            icon={Globe}
          />
          <KpiCard
            title="Suggested Presets"
            value={availablePresets.length}
            subtitle="Popular tech stack ready"
            icon={Wand2}
          />
          <KpiCard
            title="Learner Dossier"
            value="Synchronized"
            subtitle="Live in registration & profiles"
            icon={Check}
          />
        </div>
      )}

      {/* QUICK ADD & POPULAR PRESETS COMPONENT */}
      <Card className="p-5 space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
            <Sparkles size={14} className="text-[var(--g1)]" />
            Add Skill Tag
          </h3>
          <p className="text-xs text-[var(--mute)] mt-0.5">
            Enter any technology, domain, or learning level to append it to the master academy catalog.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAdd()
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <TagIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
            <input
              type="text"
              placeholder="e.g. Next.js, Docker, Kubernetes, Machine Learning, UI/UX..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              disabled={loading}
              className="w-full pl-9 pr-4 py-2.5 rounded-full text-xs text-[var(--ink)] bg-[var(--panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-colors placeholder:text-[var(--mute)]"
            />
          </div>
          <PillButton
            type="submit"
            variant="primary"
            disabled={loading || !newSkillName.trim()}
            icon={<Plus size={14} />}
          >
            {loading ? 'Adding...' : 'Add Tag'}
          </PillButton>
        </form>

        {/* 1-Click Recommended Presets */}
        {availablePresets.length > 0 && (
          <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-[var(--mute)] flex items-center gap-1 mr-1">
              <Wand2 size={12} className="text-[var(--g1)]" />
              Suggested:
            </span>
            {availablePresets.slice(0, 8).map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={loading}
                onClick={() => handleAdd(preset)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-[var(--panel)] hover:bg-[var(--card)] text-[var(--ink)] border border-[var(--border)] hover:border-[var(--g1)] transition-all cursor-pointer disabled:opacity-50"
                title={`Click to add ${preset}`}
              >
                <Plus size={11} className="text-[var(--mute)]" />
                {preset}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* TOOLBAR: SEARCH, DOMAIN FILTERS, & VIEW TOGGLE */}
      <div className="space-y-3">
        <Card className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search bar */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
              <input
                type="text"
                placeholder="Search skill tags by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <span className="text-xs text-[var(--mute)]">
                Showing <strong className="text-[var(--ink)]">{filteredSkills.length}</strong> of {skills.length}
              </span>

              {/* View Mode Switcher */}
              <div className="flex items-center p-1 rounded-full border border-[var(--border)] bg-[var(--panel)]">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[var(--card)] text-[var(--g1)] shadow-2xs font-bold'
                      : 'text-[var(--mute)] hover:text-[var(--ink)]'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[var(--card)] text-[var(--g1)] shadow-2xs font-bold'
                      : 'text-[var(--mute)] hover:text-[var(--ink)]'
                  }`}
                  title="Data Table View"
                >
                  <ListIcon size={14} />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              ['all', `All Domains (${domainCounts.all})`],
              ['frontend', `Frontend & UI (${domainCounts.frontend})`],
              ['backend', `Backend & Data (${domainCounts.backend})`],
              ['ai_data', `AI & Data Science (${domainCounts.ai_data})`],
              ['cloud_devops', `Cloud & DevOps (${domainCounts.cloud_devops})`],
              ['levels', `Learner Cohort (${domainCounts.levels})`],
            ] as const
          ).map(([cat, label]) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedDomain(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedDomain === cat
                  ? 'bg-[var(--g1)] text-white shadow-xs'
                  : 'bg-[var(--card)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--panel)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW: GRID MODE */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill, index) => {
            const isEditing = editingId === skill.id
            const domain = getSkillDomain(skill.name)
            const DomainIcon = domain.icon

            return (
              <Card key={skill.id} className="p-4 flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-[var(--panel)] border border-[var(--border)] text-[var(--g1)] flex items-center justify-center font-bold text-sm shrink-0">
                        <DomainIcon size={17} />
                      </div>

                      <div className="flex-1 min-w-0">
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
                            className="w-full px-2.5 py-1 text-xs rounded-full border border-[var(--g1)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] font-semibold text-[var(--ink)] bg-[var(--panel)]"
                          />
                        ) : (
                          <h4 className="font-bold text-[var(--ink)] text-sm tracking-tight truncate">{skill.name}</h4>
                        )}
                        <div className="mt-1">
                          <Tag variant={domain.tagVariant}>{domain.label}</Tag>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(skill.id)}
                            disabled={loading || !editingName.trim()}
                            className="p-1.5 text-[var(--g1)] hover:bg-[var(--panel)] rounded-full transition-colors cursor-pointer"
                            title="Save changes (Enter)"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={loading}
                            className="p-1.5 text-[var(--mute)] hover:bg-[var(--panel)] rounded-full transition-colors cursor-pointer"
                            title="Cancel (Esc)"
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
                            className="p-1.5 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--panel)] rounded-full transition-colors cursor-pointer"
                            title="Rename Skill Tag"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(skill)}
                            disabled={loading}
                            className="p-1.5 text-[var(--mute)] hover:text-[#b53c37] hover:bg-[var(--panel)] rounded-full transition-colors cursor-pointer"
                            title="Delete Skill Tag"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--mute)]">
                  <span className="font-mono text-[10px]">#Index: {index + 1}</span>
                  <span>
                    {skill.createdAt ? new Date(skill.createdAt).toLocaleDateString('en-IN') : 'Standard Tag'}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* VIEW: TABLE MODE */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--panel)] border-b border-[var(--border)] text-[var(--mute)] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="py-3 px-5 w-16">
                    #
                  </th>
                  <th scope="col" className="py-3 px-5">
                    Skill Tag
                  </th>
                  <th scope="col" className="py-3 px-5">
                    Domain Classification
                  </th>
                  <th scope="col" className="py-3 px-5">
                    Configured Date
                  </th>
                  <th scope="col" className="py-3 px-5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredSkills.map((skill, index) => {
                  const isEditing = editingId === skill.id
                  const domain = getSkillDomain(skill.name)
                  const DomainIcon = domain.icon

                  return (
                    <tr key={skill.id} className="hover:bg-[var(--panel)] transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-[var(--mute)]">{index + 1}</td>
                      <td className="py-3.5 px-5">
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
                            className="px-3 py-1 text-xs rounded-full border border-[var(--g1)] focus:outline-none focus:ring-2 focus:ring-[var(--g1)] font-medium text-[var(--ink)] bg-[var(--panel)]"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[var(--g1)]">
                              <DomainIcon size={13} />
                            </span>
                            <span className="text-xs font-semibold text-[var(--ink)]">{skill.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <Tag variant={domain.tagVariant}>{domain.label}</Tag>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[var(--mute)] font-mono">
                        {skill.createdAt ? new Date(skill.createdAt).toLocaleDateString('en-IN') : 'Default'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(skill.id)}
                              disabled={loading || !editingName.trim()}
                              className="p-1.5 text-[var(--g1)] hover:bg-[var(--panel)] rounded-full transition-colors cursor-pointer"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={loading}
                              className="p-1.5 text-[var(--mute)] hover:bg-[var(--panel)] rounded-full transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(skill)}
                              disabled={loading}
                              className="p-1.5 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--panel)] rounded-full transition-colors cursor-pointer"
                              title="Rename"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteDialog(skill)}
                              disabled={loading}
                              className="p-1.5 text-[var(--mute)] hover:text-[#b53c37] hover:bg-[var(--panel)] rounded-full transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {filteredSkills.length === 0 && (
        <EmptyState
          icon={<TagIcon size={28} />}
          title="No skill tags match your criteria"
          description={
            searchQuery
              ? `No skills found matching "${searchQuery}". Clear your search or add "${searchQuery}" as a new skill.`
              : 'No skills found in this domain. Switch categories or add new skills above.'
          }
          actionLabel={searchQuery ? `Add "${searchQuery}"` : undefined}
          onAction={searchQuery ? () => handleAdd(searchQuery) : undefined}
          actionIcon={<Plus size={14} />}
        />
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Skill Tag"
        description={`Are you sure you want to remove the skill tag "${skillToDelete?.name}"? It will no longer be available for learner intake selections.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Skill Tag'}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false)
          setSkillToDelete(null)
        }}
      />
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-[var(--card)] rounded-[26px] shadow-2xl border border-[var(--border)] overflow-hidden max-h-[90vh] flex flex-col">
          <div className="p-4 px-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--panel)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--g1)] text-white flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--ink)]">Manage Knowledge &amp; Skill Tags</h2>
                <p className="text-[11px] text-[var(--mute)]">Add or edit skill tags for learner profiles</p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-[var(--mute)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">{content}</div>
          <div className="p-3 px-6 bg-[var(--panel)] border-t border-[var(--border)] flex justify-end">
            <PillButton size="sm" onClick={onClose}>
              Done
            </PillButton>
          </div>
        </div>
      </div>
    )
  }

  return content
}
