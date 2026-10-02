import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { AppNotification, CreateNotificationInput, NotificationType } from './types'

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSec < 60) return 'Just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  } catch {
    return 'Recent'
  }
}

export async function listUserNotifications(userId: string, role: string): Promise<AppNotification[]> {
  const supabase = await createClient()

  // 1. Fetch accessible notifications matching user_id or recipient_role/all
  const { data: notifs, error } = await supabase
    .from('notifications')
    .select(
      `
      id,
      title,
      message,
      type,
      link,
      urgent,
      entity_type,
      entity_id,
      created_at,
      recipient_role,
      user_id
    `,
    )
    .or(`user_id.eq.${userId},and(user_id.is.null,recipient_role.in.(${role},all))`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !notifs || notifs.length === 0) {
    return []
  }

  // 2. Fetch read markers for this user
  const { data: reads } = await supabase.from('notification_reads').select('notification_id').eq('user_id', userId)

  const readSet = new Set((reads ?? []).map((r: any) => String(r.notification_id)))

  return notifs.map((n: any) => ({
    id: String(n.id),
    title: String(n.title),
    message: String(n.message),
    type: n.type as NotificationType,
    link: n.link ? String(n.link) : '/',
    timestamp: formatRelativeTime(n.created_at),
    urgent: Boolean(n.urgent),
    isRead: readSet.has(String(n.id)),
    createdAt: String(n.created_at),
    entityType: n.entity_type ? String(n.entity_type) : undefined,
    entityId: n.entity_id ? String(n.entity_id) : undefined,
  }))
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('notification_reads').upsert(
    {
      user_id: userId,
      notification_id: notificationId,
      read_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,notification_id' },
  )
}

export async function markAllNotificationsRead(userId: string, role: string): Promise<void> {
  const supabase = await createClient()
  const { data: notifs } = await supabase
    .from('notifications')
    .select('id')
    .or(`user_id.eq.${userId},and(user_id.is.null,recipient_role.in.(${role},all))`)

  if (!notifs || notifs.length === 0) return

  const rows = notifs.map((n: any) => ({
    user_id: userId,
    notification_id: n.id,
    read_at: new Date().toISOString(),
  }))

  await supabase.from('notification_reads').upsert(rows, { onConflict: 'user_id,notification_id' })
}

export async function createNotification(input: CreateNotificationInput, client?: any): Promise<void> {
  try {
    let supabase = client
    if (!supabase) {
      try {
        const { getSupabaseAdminClient } = await import('@/lib/supabase/admin')
        supabase = getSupabaseAdminClient()
      } catch {
        return
      }
    }
    if (!supabase || typeof supabase.from !== 'function') return

    await supabase.from('notifications').insert({
      recipient_role: input.recipientRole || 'all',
      user_id: input.userId || null,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      link: input.link || '/',
      urgent: Boolean(input.urgent),
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
    })
  } catch {
    // Non-blocking background notification creation
  }
}
