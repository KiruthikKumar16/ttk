'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CheckCheck,
  X,
  AlertTriangle,
  UserCheck,
  Receipt,
  FolderOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import type { Role } from '@/lib/types'
import type { AppNotification } from '@/app/api/notifications/route'

const STORAGE_KEY = 'thoorigai_read_notification_ids'

export function NotificationPanel({ role }: { role: Role }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [readIds, setReadIds] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Load read notification IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setReadIds(JSON.parse(stored))
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Fetch notifications from /api/notifications
  useEffect(() => {
    let isMounted = true
    async function fetchNotifications() {
      setLoading(true)
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            const list: AppNotification[] = Array.isArray(data) ? data : data.data || []
            setNotifications(list)
            const dbReadIds = list.filter((n) => n.isRead).map((n) => n.id)
            if (dbReadIds.length > 0) {
              setReadIds((prev) => Array.from(new Set([...prev, ...dbReadIds])))
            }
          }
        }
      } catch {
        // Silently handle offline
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void fetchNotifications()
    return () => {
      isMounted = false
    }
  }, [role])

  // Click outside and Escape key to close
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setReadIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {
      // Ignored: local state already updated
    }
  }

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    const allIds = notifications.map((n) => n.id)
    setReadIds(allIds)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds))
    } catch {}

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
    } catch {
      // Ignored
    }
  }

  const handleNotificationClick = (n: AppNotification) => {
    void markAsRead(n.id)
    setIsOpen(false)
    if (n.link) {
      router.push(n.link)
    }
  }

  const isNotificationRead = (n: AppNotification) => Boolean(n.isRead || readIds.includes(n.id))
  const unreadCount = notifications.filter((n) => !isNotificationRead(n)).length
  const displayedNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !isNotificationRead(n))
      : notifications

  const hasUrgentUnread = notifications.some((n) => n.urgent && !isNotificationRead(n))

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'alert':
        return <UserCheck size={16} className="text-amber-600" />
      case 'warning':
        return <AlertTriangle size={16} className="text-rose-600" />
      case 'info':
        return <Receipt size={16} className="text-indigo-600" />
      default:
        return <FolderOpen size={16} className="text-emerald-600" />
    }
  }

  return (
    <div className="relative inline-block" ref={panelRef}>
      {/* Functional Notification Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
          isOpen
            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
            : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/80 shadow-2xs'
        }`}
        title={`Notifications (${unreadCount} unread)`}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Bell size={16} className={hasUrgentUnread ? 'text-amber-600' : 'text-slate-600'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-bold shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
            {hasUrgentUnread && (
              <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75 pointer-events-none" />
            )}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 px-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-medium">
                  Caught up
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close notifications"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 px-3 pt-2 bg-white gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`pb-2 px-2 text-xs font-semibold border-b-2 transition-colors ${
                filter === 'all'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`pb-2 px-2 text-xs font-semibold border-b-2 transition-colors ${
                filter === 'unread'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications Feed */}
          <div className="max-h-88 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading notifications...</div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mb-2">
                  <Sparkles size={18} />
                </div>
                <p className="text-xs font-semibold text-slate-800">You&rsquo;re all caught up!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">No unread notifications right now.</p>
              </div>
            ) : (
              displayedNotifications.map((n) => {
                const isRead = readIds.includes(n.id)

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 px-4 flex items-start gap-3 cursor-pointer transition-colors hover:bg-slate-50/90 text-left ${
                      isRead ? 'opacity-70 bg-white' : 'bg-indigo-50/20'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        n.type === 'alert'
                          ? 'bg-amber-100/80 text-amber-800'
                          : n.type === 'warning'
                          ? 'bg-rose-100/80 text-rose-800'
                          : n.type === 'info'
                          ? 'bg-indigo-100/80 text-indigo-800'
                          : 'bg-emerald-100/80 text-emerald-800'
                      }`}
                    >
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{n.title}</span>
                        <span className="text-[10px] text-slate-600 shrink-0 font-medium">
                          {n.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold mt-1">
                        <span>Take action</span>
                        <ArrowRight size={11} />
                      </div>
                    </div>

                    {!isRead && (
                      <span
                        className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"
                        title="Unread"
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium capitalize">Role: {role}</span>
            <button
              type="button"
              onClick={() => {
                markAllAsRead()
                setIsOpen(false)
              }}
              className="text-slate-600 hover:text-slate-900 font-semibold"
            >
              Dismiss all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
