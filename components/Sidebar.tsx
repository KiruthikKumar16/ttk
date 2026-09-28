import { BarChart3, BookOpen, ChevronDown, FileCheck2, FileText, LayoutDashboard, Menu, Settings, Users, List } from 'lucide-react'
import type { Role, Student, View } from '@/lib/types'
import React from 'react'
import { brand } from '@/lib/brand'
import { can, type Resource } from '@/lib/auth/permissions'

export function Sidebar({ view, setView, collapsed, students, role }: { view: View; setView: (v: View) => void; collapsed?: boolean; students?: Student[]; role: Role }) {
  const nav: [View, typeof LayoutDashboard, string, Resource][] = [
    ['Dashboard', LayoutDashboard, 'Dashboard', 'reports'],
    ['Students', Users, 'Students', 'students'],
    ['Courses', BookOpen, 'Courses', 'courses'],
    ['Certificates', FileCheck2, 'Certificates', 'certificates'],
    ['Invoices', FileText, 'Invoices', 'payments'],
    ['Reports', BarChart3, 'Reports', 'reports'],
    ['Audit Log', List, 'Audit Log', 'audit'],
    ['Assessments', List, 'Assessments', 'assessments'],
  ];
  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <img src={brand.logoPath} alt={brand.shortName} className="brand-mark-img" />
        </div>
        {!collapsed && (
          <div>
            <div className="brand-name">{brand.shortName.toUpperCase()}</div>
            <div className="brand-sub">{brand.displayName.replace(`${brand.shortName} `, '').toUpperCase()}</div>
          </div>
        )}
      </div>
      <nav>
        {nav.filter(([, , , resource]) => can(role, resource, 'read')).map(([label, Icon]) => (
          <button key={label} className={`nav-item ${view === label ? 'active' : ''}`} onClick={() => setView(label)} title={label}>
            <Icon size={18} className="mr-2" />
            {!collapsed && <span className="flex-1 text-left">{label}</span>}
            {!collapsed && label === 'Students' && students && (
              <span className="ml-auto flex-shrink-0">{students.length}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        {can(role, 'gst', 'read') && (
          <button
            className={`nav-item${view === 'Settings' ? ' active' : ''}`}
            onClick={() => setView('Settings')}
            title="Settings"
          >
            <Settings size={18} className="mr-2" />
            {!collapsed && <span className="flex-1 text-left">Settings</span>}
          </button>
        )}
        <div className="account">
          <div className="avatar">AK</div>
          {!collapsed && (
            <>
              <div>
                <strong>{role[0].toUpperCase() + role.slice(1)} account</strong>
                <small>{brand.displayName}</small>
              </div>
              <ChevronDown size={15} />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
