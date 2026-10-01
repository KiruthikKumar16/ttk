'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { brand } from '@/lib/brand'
import { can, type Resource } from '@/lib/auth/permissions'
import type { Role } from '@/lib/types'

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
  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
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
      <nav aria-label="Main navigation">
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
                <Icon size={18} className="mr-2" />
                {!collapsed && <span className="flex-1 text-left">{label}</span>}
              </Link>
            )
          })}
      </nav>
      <div className="sidebar-bottom">
        {!collapsed && <p className="eyebrow px-3">SETTINGS</p>}
        {can(role, 'gst', 'read') && (
          <Link
            href="/settings/gst"
            onClick={onNavigate}
            aria-current={pathname.startsWith('/settings/gst') ? 'page' : undefined}
            className={`nav-item${pathname.startsWith('/settings/gst') ? ' active' : ''}`}
            title="GST Settings"
          >
            <Settings size={18} className="mr-2" />
            {!collapsed && <span className="flex-1 text-left">GST Settings</span>}
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
            <Users size={18} className="mr-2" />
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
            <Users size={18} className="mr-2" />
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
            <Layers size={18} className="mr-2" />
            {!collapsed && <span className="flex-1 text-left">Course categories</span>}
          </Link>
        )}
        {role === 'admin' && (
          <Link
            href="/settings/brand"
            onClick={onNavigate}
            aria-current={pathname.startsWith('/settings/brand') ? 'page' : undefined}
            className={`nav-item${pathname.startsWith('/settings/brand') ? ' active' : ''}`}
            title="Brand information"
          >
            <Building2 size={18} className="mr-2" />
            {!collapsed && <span className="flex-1 text-left">Brand information</span>}
          </Link>
        )}
        <div className="account">
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
