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
  Tag,
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
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type SkillCategory = 'all' | 'frontend' | 'backend' | 'ai_data' | 'cloud_devops' | 'levels' | 'general'

interface DomainMeta {
  category: SkillCategory
  label: string
  badgeClass: string
  bgSoft: string
  borderClass: string
  dotClass: string
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
      badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      bgSoft: 'bg-cyan-500/10 text-cyan-700',
      borderClass: 'border-cyan-200/80 hover:border-cyan-300',
      dotClass: 'bg-cyan-500',
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
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      bgSoft: 'bg-purple-500/10 text-purple-700',
      borderClass: 'border-purple-200/80 hover:border-purple-300',
      dotClass: 'bg-purple-500',
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
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      bgSoft: 'bg-emerald-500/10 text-emerald-700',
      borderClass: 'border-emerald-200/80 hover:border-emerald-300',
      dotClass: 'bg-emerald-500',
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
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      bgSoft: 'bg-amber-500/10 text-amber-700',
      borderClass: 'border-amber-200/80 hover:border-amber-300',
      dotClass: 'bg-amber-500',
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
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      bgSoft: 'bg-indigo-500/10 text-indigo-700',
      borderClass: 'border-indigo-200/80 hover:border-indigo-300',
      dotClass: 'bg-indigo-500',
      icon: Database,
    }
  }
  return {
    category: 'general',
    label: 'Core Competency',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    bgSoft: 'bg-slate-500/10 text-slate-700',
    borderClass: 'border-slate-200/80 hover:border-slate-300',
    dotClass: 'bg-slate-500',
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
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 shadow-2xs animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 text-rose-500 hover:text-rose-800 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-2xs animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-medium">{success}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="p-1 text-emerald-600 hover:text-emerald-900 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* METRIC OVERVIEW CARDS (only on standalone page, not modal) */}
      {!isModal && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Skill Tags</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Tags size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono">{skills.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">Configured and ready for learner intake</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Domains</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Globe size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {Object.entries(domainCounts).filter(([k, v]) => k !== 'all' && v > 0).length}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Frontend, Backend, AI, DevOps & Cohorts</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested Presets</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Wand2 size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono">{availablePresets.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">Popular tech stack items available</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Learner Dossier</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Check size={16} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700">Synchronized</p>
            <p className="mt-1 text-[11px] text-slate-500">Live in registration &amp; student profiles</p>
          </div>
        </div>
      )}

      {/* QUICK ADD & POPULAR PRESETS COMPONENT */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" />
              Add Skill Tag
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter any technology, domain, or learning level to append it to the master academy catalog.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAdd()
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Next.js, Docker, Kubernetes, Machine Learning, UI/UX..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs font-medium text-slate-900"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !newSkillName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all shrink-0"
          >
            <Plus size={14} className="mr-1.5" />
            {loading ? 'Adding...' : 'Add Tag'}
          </Button>
        </form>

        {/* 1-Click Recommended Presets */}
        {availablePresets.length > 0 && (
          <div className="pt-2 border-t border-indigo-100/60 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Wand2 size={12} className="text-indigo-500" />
              Suggested:
            </span>
            {availablePresets.slice(0, 8).map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={loading}
                onClick={() => handleAdd(preset)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 shadow-2xs transition-all disabled:opacity-50"
                title={`Click to add ${preset}`}
              >
                <Plus size={11} className="text-slate-400 group-hover:text-indigo-600" />
                {preset}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TOOLBAR: SEARCH, DOMAIN FILTERS, & VIEW TOGGLE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search skill tags by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <span className="text-[11px] text-slate-500 font-mono">
              Showing <strong className="text-slate-800">{filteredSkills.length}</strong> of {skills.length}
            </span>

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-lg border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Data Table View"
              >
                <ListIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDomain('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDomain === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            All Domains ({domainCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setSelectedDomain('frontend')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDomain === 'frontend'
                ? 'bg-cyan-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            Frontend & UI ({domainCounts.frontend})
          </button>
          <button
            type="button"
            onClick={() => setSelectedDomain('backend')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDomain === 'backend'
                ? 'bg-indigo-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            Backend & Data ({domainCounts.backend})
          </button>
          <button
            type="button"
            onClick={() => setSelectedDomain('ai_data')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDomain === 'ai_data'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            AI & Machine Learning ({domainCounts.ai_data})
          </button>
          <button
            type="button"
            onClick={() => setSelectedDomain('cloud_devops')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDomain === 'cloud_devops'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            Cloud & DevOps ({domainCounts.cloud_devops})
          </button>
          <button
            type="button"
            onClick={() => setSelectedDomain('levels')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDomain === 'levels'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            Learner Cohort ({domainCounts.levels})
          </button>
        </div>
      </div>

      {/* VIEW: GRID MODE */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSkills.map((skill, index) => {
            const isEditing = editingId === skill.id
            const domain = getSkillDomain(skill.name)
            const DomainIcon = domain.icon

            return (
              <div
                key={skill.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${domain.borderClass}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${domain.bgSoft}`}
                      >
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
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-slate-900 bg-white"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm tracking-tight truncate">{skill.name}</h4>
                          </div>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-md text-[10px] font-semibold border ${domain.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${domain.dotClass}`} />
                          {domain.label}
                        </span>
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
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Save changes (Enter)"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={loading}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
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
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Rename Skill Tag"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(skill)}
                            disabled={loading}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Skill Tag"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-[10px]">#Index: {index + 1}</span>
                  <span>
                    {skill.createdAt ? new Date(skill.createdAt).toLocaleDateString('en-IN') : 'Standard Tag'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VIEW: TABLE MODE */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Skill Tag
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Domain Classification
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Configured Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredSkills.map((skill, index) => {
                const isEditing = editingId === skill.id
                const domain = getSkillDomain(skill.name)
                const DomainIcon = domain.icon

                return (
                  <tr key={skill.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-slate-400">{index + 1}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
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
                          className="px-2.5 py-1 text-xs rounded border border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${domain.bgSoft}`}
                          >
                            <DomainIcon size={13} />
                          </span>
                          <span className="text-xs font-semibold text-slate-900">{skill.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${domain.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${domain.dotClass}`} />
                        {domain.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {skill.createdAt ? new Date(skill.createdAt).toLocaleDateString('en-IN') : 'Default'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(skill.id)}
                            disabled={loading || !editingName.trim()}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Save"
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
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(skill)}
                            disabled={loading}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Rename"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(skill)}
                            disabled={loading}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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
      )}

      {/* EMPTY STATE */}
      {filteredSkills.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <Tag size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">No skill tags match your criteria</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No skills found matching "${searchQuery}". Clear your search or add "${searchQuery}" as a new skill.`
                : 'No skills found in this domain. Switch categories or add new skills above.'}
            </p>
          </div>
          {searchQuery && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setSearchQuery('')} className="text-xs">
                Clear Search
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleAdd(searchQuery)}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus size={13} className="mr-1" />
                Add &quot;{searchQuery}&quot;
              </Button>
            </div>
          )}
        </div>
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Manage Knowledge &amp; Skill Tags</h2>
                <p className="text-[11px] text-slate-500">Add or edit skill tags for learner profiles</p>
              </div>
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
          <div className="p-4 sm:p-5 overflow-y-auto flex-1">{content}</div>
          <div className="p-3 px-5 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button size="sm" onClick={onClose} className="text-xs bg-slate-900 text-white hover:bg-slate-800">
              Done
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return content
}
