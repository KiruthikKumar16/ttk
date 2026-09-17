import { BarChart3, BookOpen, ChevronDown, FileCheck2, FileText, LayoutDashboard, Menu, Settings, Users } from 'lucide-react'
import type { View } from '@/lib/types'
import React from 'react'

export function Sidebar({ view, setView, collapsed }: { view: View; setView: (v: View) => void; collapsed?: boolean }) {
  const nav: [View, typeof LayoutDashboard, string][] = [
    ['Dashboard', LayoutDashboard, 'Dashboard'],
    ['Students', Users, 'Students'],
    ['Courses', BookOpen, 'Courses'],
    ['Certificates', FileCheck2, 'Certificates'],
    ['Invoices', FileText, 'Invoices'],
    ['Reports', BarChart3, 'Reports'],
  ];
  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-mark">TAI</div>
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
            {!collapsed && label === 'Students' && <span className="ml-auto flex-shrink-0">48</span>}
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