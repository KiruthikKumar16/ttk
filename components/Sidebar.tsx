import { BarChart3, BookOpen, ChevronDown, FileCheck2, FileText, LayoutDashboard, Menu, Settings, Users, List } from 'lucide-react'
import type { Student, View } from '@/lib/types'
import React from 'react'

export function Sidebar({ view, setView, collapsed, students }: { view: View; setView: (v: View) => void; collapsed?: boolean; students?: Student[] }) {
  const nav: [View, typeof LayoutDashboard, string][] = [
    ['Dashboard', LayoutDashboard, 'Dashboard'],
    ['Students', Users, 'Students'],
    ['Courses', BookOpen, 'Courses'],
    ['Certificates', FileCheck2, 'Certificates'],
    ['Invoices', FileText, 'Invoices'],
    ['Reports', BarChart3, 'Reports'],
    ['Audit Log', List, 'Audit Log'], // Added Audit Log
    ['Assessments', List, 'Assessments'],
  ];
  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <img src="/thoorigai-logo.png" alt="ThoorigAI" className="brand-mark-img" />
        </div>
        {!collapsed && (
          <div>
            <div className="brand-name">THOORIGAI</div>
            <div className="brand-sub">INFOTECH</div>
          </div>
        )}
      </div>
      <nav>
        {nav.map(([label, Icon]) => (
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
        <button
          className={`nav-item${view === 'Settings' ? ' active' : ''}`}
          onClick={() => setView('Settings')}
          title="Settings"
        >
          <Settings size={18} className="mr-2" />
          {!collapsed && <span className="flex-1 text-left">Settings</span>}
        </button>
        <div className="account">
          <div className="avatar">AK</div>
          {!collapsed && (
            <>
              <div>
                <strong>Admin account</strong>
                <small>ThoorigAI Infotech</small>
              </div>
              <ChevronDown size={15} />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}