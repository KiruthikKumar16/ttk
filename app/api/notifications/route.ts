import { z } from 'zod'
import { apiResult, withApi } from '@/lib/http/handler'
import {
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
} from '@/modules/notifications/service'
import type { AppNotification } from '@/modules/notifications/types'

export type { AppNotification }

const patchNotificationSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional(),
})

const createNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.enum(['alert', 'warning', 'info', 'success']).optional(),
  link: z.string().optional(),
  urgent: z.boolean().optional(),
  recipientRole: z.enum(['admin', 'staff', 'all']).optional(),
  userId: z.string().optional(),
})

import { getCurrentProfile } from '@/lib/auth/current-profile'

export const GET = withApi({ roles: ['admin', 'staff'] as const }, async ({ user, role }) => {
  const profile = await getCurrentProfile()
  const userId = user?.id || profile.id
  const userRole = role || profile.role || 'staff'
  const notifications = await listUserNotifications(userId, userRole)
  return apiResult(notifications)
})

export const PATCH = withApi(
  {
    roles: ['admin', 'staff'] as const,
    body: patchNotificationSchema,
  },
  async ({ user, role, body }) => {
    const profile = await getCurrentProfile()
    const userId = user?.id || profile.id
    const userRole = role || profile.role || 'staff'
    if (body.all) {
      await markAllNotificationsRead(userId, userRole)
      return apiResult({ success: true, message: 'All notifications marked as read' })
    }
    if (body.id) {
      await markNotificationRead(userId, body.id)
      return apiResult({ success: true, message: 'Notification marked as read' })
    }
    return apiResult({ success: false, message: 'No action specified' })
  },
)

export const POST = withApi(
  {
    roles: ['admin', 'staff'] as const,
    body: createNotificationSchema,
    successStatus: 201,
  },
  async ({ body }) => {
    await createNotification(body)
    return apiResult({ success: true, message: 'Notification created' }, { status: 201 })
  },
)
