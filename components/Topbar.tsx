import { Button } from '@/components/ui/button'
import { Bell, Menu, Search } from 'lucide-react'
import type { View } from '@/lib/types'

export function Topbar({ view, onMenu }: { view: View; onMenu: () => void }) {
  return (
    <header className="topbar">
      <Button variant="default" size="default" onClick={onMenu} className="p-0" aria-label="Open navigation">
        <Menu size={20} />
      </Button>
      <div className="crumb">
        <span>Workspace</span>
        <span>/</span>
        <strong>{view}</strong>
      </div>
      <div className="top-actions">
        <div className="top-search">
          <Search size={16} />
          <input placeholder="Search anything" />
        </div>
        <Button variant="default" size="default" aria-label="Notifications">
          <Bell size={18} />
          <i />
        </Button>
        <div className="top-avatar">AK</div>
      </div>
    </header>
  );
}