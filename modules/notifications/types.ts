import type { Role } from '@/lib/types'

export type NotificationType = 'alert' | 'warning' | 'info' | 'success'

export type AppNotification = {
  id: string
  title: string
  message: string
  type: NotificationType
  link: string
  timestamp: string
  urgent: boolean
  isRead: boolean
  createdAt: string
  entityType?: string
  entityId?: string
}

export type CreateNotificationInput = {
  recipientRole?: 'admin' | 'staff' | 'all'
  userId?: string
  title: string
  message: string
  type?: NotificationType
  link?: string
  urgent?: boolean
  entityType?: string
  entityId?: string
}
