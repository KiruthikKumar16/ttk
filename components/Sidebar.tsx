'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  FileCheck2,
  FileText,
  LayoutDashboard,
  List,
  Settings,
  Users,
  CalendarDays,
  ClipboardCheck,
  FolderOpen,
  Building2,
  Layers,
  Tags,
  UserCog,
  Palette,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { brand } from '@/lib/brand'
import { can, type Resource } from '@/lib/auth/permissions'
import type { Role } from '@/lib/types'
import { useTheme } from '@/lib/ThemeContext'

const nav: { label: string; href: string; Icon: typeof LayoutDashboard; resource: Resource }[] = [
  { label: 'Dashboard', href: '/', Icon: LayoutDashboard, resource: 'reports' },
  { label: 'Students', href: '/students', Icon: Users, resource: 'students' },
  { label: 'Invoices', href: '/invoices', Icon: FileText, resource: 'payments' },
  { label: 'Courses', href: '/courses', Icon: BookOpen, resource: 'courses' },
  { label: 'Course materials', href: '/materials', Icon: FolderOpen, resource: 'materials' },
  { label: 'Certificates', href: '/certificates', Icon: FileCheck2, resource: 'certificates' },
  { label: 'Attendance', href: '/attendance', Icon: CalendarDays, resource: 'attendance' },
  { label: 'Assessments', href: '/assessments', Icon: ClipboardCheck, resource: 'assessments' },
  { label: 'Reports', href: '/reports', Icon: BarChart3, resource: 'reports' },
  { label: 'Audit Log', href: '/audit-log', Icon: List, resource: 'audit' },
]

export function Sidebar({
  role,
  collapsed = false,
  onNavigate,
}: {
  role: Role
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { openSettings } = useTheme()

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Brand Logo & Name */}
      <Link href="/" className="brand" aria-label={`${brand.displayName} dashboard`} onClick={onNavigate}>
        <div className="brand-mark">
          <Image src={brand.logoPath} alt="" width={72} height={72} sizes="72px" className="brand-mark-img" />
        </div>
        {!collapsed && (
          <div>
            <div className="brand-name">{brand.shortName.toUpperCase()}</div>
            <div className="brand-sub">INFOTECH LLP</div>
          </div>
        )}
      </Link>

      {/* Main Menu Group */}
      {!collapsed && <p className="nav-group-label">MENU</p>}
      <nav aria-label="Main navigation" className="space-y-1">
        {nav
          .filter((item) => can(role, item.resource, 'read'))
          .map(({ label, href, Icon }) => {
            const active =
              href === '/'
                ? pathname === '/'
                : pathname === href ||
                  pathname.startsWith(`${href}/`) ||
                  (href === '/materials' && pathname.endsWith('/materials'))
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={`nav-item${active ? ' active' : ''}`}
                title={label}
              >
                <Icon size={16} />
                {!collapsed && <span className="flex-1 text-left">{label}</span>}
              </Link>
            )
          })}
      </nav>

      {/* Admin Settings Section */}
      {role === 'admin' && (
        <div className="mt-4">
          {!collapsed && <p className="nav-group-label">SETTINGS</p>}
          <div className="space-y-1">
            {can(role, 'gst', 'read') && (
              <Link
                href="/settings/gst"
                onClick={onNavigate}
                aria-current={pathname.startsWith('/settings/gst') ? 'page' : undefined}
                className={`nav-item${pathname.startsWith('/settings/gst') ? ' active' : ''}`}
                title="GST Settings"
              >
                <Settings size={16} />
                {!collapsed && <span className="flex-1 text-left">GST settings</span>}
              </Link>
            )}
            {can(role, 'users', 'manage') && (
              <Link
                href="/settings/users"
                onClick={onNavigate}
                aria-current={pathname.startsWith('/settings/users') ? 'page' : undefined}
                className={`nav-item${pathname.startsWith('/settings/users') ? ' active' : ''}`}
                title="Users and roles"
              >
                <Users size={16} />
                {!collapsed && <span className="flex-1 text-left">Users and roles</span>}
              </Link>
            )}
            {can(role, 'courses', 'manage') && (
              <Link
                href="/settings/trainers"
                onClick={onNavigate}
                aria-current={pathname.startsWith('/settings/trainers') ? 'page' : undefined}
                className={`nav-item${pathname.startsWith('/settings/trainers') ? ' active' : ''}`}
                title="Instructor assignments"
              >
                <Users size={16} />
                {!collapsed && <span className="flex-1 text-left">Instructor assignments</span>}
              </Link>
            )}
            {can(role, 'courses', 'manage') && (
              <Link
                href="/settings/course-categories"
                onClick={onNavigate}
                aria-current={pathname.startsWith('/settings/course-categories') ? 'page' : undefined}
                className={`nav-item${pathname.startsWith('/settings/course-categories') ? ' active' : ''}`}
                title="Course categories"
              >
                <Layers size={16} />
                {!collapsed && <span className="flex-1 text-left">Course categories</span>}
              </Link>
            )}
            <Link
              href="/settings/skills"
              onClick={onNavigate}
              aria-current={pathname.startsWith('/settings/skills') ? 'page' : undefined}
              className={`nav-item${pathname.startsWith('/settings/skills') ? ' active' : ''}`}
              title="Skill tags"
            >
              <Tags size={16} />
              {!collapsed && <span className="flex-1 text-left">Skill tags</span>}
            </Link>
            <Link
              href="/settings/brand"
              onClick={onNavigate}
              aria-current={pathname.startsWith('/settings/brand') ? 'page' : undefined}
              className={`nav-item${pathname.startsWith('/settings/brand') ? ' active' : ''}`}
              title="Brand information"
            >
              <Building2 size={16} />
              {!collapsed && <span className="flex-1 text-left">Brand information</span>}
            </Link>
          </div>
        </div>
      )}

      {/* General Section: User Settings, Theme & Sign Out */}
      <div className="sidebar-bottom mt-auto pt-4 border-t border-[var(--border)]">
        {!collapsed && <p className="nav-group-label">GENERAL</p>}
        <div className="space-y-1">
          <Link
            href="/settings/user"
            onClick={onNavigate}
            aria-current={pathname === '/settings/user' || pathname.startsWith('/settings/user/') ? 'page' : undefined}
            className={`nav-item${pathname === '/settings/user' || pathname.startsWith('/settings/user/') ? ' active' : ''}`}
            title="User settings"
          >
            <UserCog size={16} />
            {!collapsed && <span className="flex-1 text-left">User settings</span>}
          </Link>

          <button
            type="button"
            onClick={openSettings}
            className="nav-item cursor-pointer text-left w-full"
            title="Appearance & Theme"
          >
            <Palette size={16} />
            {!collapsed && <span className="flex-1 text-left">Theme & Accent</span>}
          </button>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="nav-item cursor-pointer text-left w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50/50"
            title="Sign out"
          >
            <LogOut size={16} />
            {!collapsed && <span className="flex-1 text-left">Sign out</span>}
          </button>
        </div>

        {/* Promo / Version Card at Bottom */}
        {!collapsed && (
          <div className="mt-4 rounded-[18px] bg-[var(--panel)] p-3 border border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[var(--g1)] animate-pulse" />
              <span className="text-[11px] font-bold text-[var(--text-heading)]">ThoorigAI Portal</span>
            </div>
            <p className="mt-1 text-[10px] text-[var(--mute)]">
              {role.toUpperCase()} session active
            </p>
          </div>
        )}

        {/* Account Info */}
        <div className="account mt-3 pt-3 border-t border-[var(--border)]">
          <div className="avatar">{role.slice(0, 1).toUpperCase()}</div>
          {!collapsed && (
            <div>
              <strong>{role[0].toUpperCase() + role.slice(1)} account</strong>
              <small>{brand.displayName}</small>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
