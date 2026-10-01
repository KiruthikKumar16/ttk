import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  client: {} as any,
  notificationsData: [] as any[],
  readsData: [] as any[],
  error: null as any,
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mocks.client }))
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdminClient: () => mocks.client }))

import {
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
} from './service'

describe('notifications service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.notificationsData = []
    mocks.readsData = []
    mocks.error = null

    mocks.client = {
      from: vi.fn((table: string) => {
        if (table === 'notifications') {
          return {
            select: vi.fn(() => ({
              or: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(async () => ({ data: mocks.notificationsData, error: mocks.error })),
                })),
              })),
            })),
            insert: vi.fn(async (row: any) => ({ data: row, error: mocks.error })),
          }
        }
        if (table === 'notification_reads') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(async () => ({ data: mocks.readsData, error: null })),
            })),
            upsert: vi.fn(async (rows: any) => ({ data: rows, error: mocks.error })),
          }
        }
        return {}
      }),
    }
  })

  it('lists notifications and computes isRead state based on notification_reads table', async () => {
    mocks.notificationsData = [
      {
        id: 'n1',
        title: 'Payment Received',
        message: 'Invoice INV-100 created',
        type: 'info',
        link: '/invoices/INV-100',
        urgent: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'n2',
        title: 'New Student',
        message: 'Alice enrolled',
        type: 'success',
        link: '/students/101',
        urgent: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]
    mocks.readsData = [{ notification_id: 'n1' }]

    const result = await listUserNotifications('u123', 'admin')
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('n1')
    expect(result[0].isRead).toBe(true)
    expect(result[1].id).toBe('n2')
    expect(result[1].isRead).toBe(false)
  })

  it('marks a single notification as read by upserting into notification_reads', async () => {
    let upsertedRow: any = null
    mocks.client.from = vi.fn((table: string) => {
      if (table === 'notification_reads') {
        return {
          upsert: vi.fn(async (row: any) => {
            upsertedRow = row
            return { data: row, error: null }
          }),
        }
      }
      return {}
    })

    await markNotificationRead('u123', 'n1')
    expect(upsertedRow).toBeDefined()
    expect(upsertedRow.user_id).toBe('u123')
    expect(upsertedRow.notification_id).toBe('n1')
  })

  it('creates a notification with admin or custom client without throwing', async () => {
    let insertedRow: any = null
    const customClient = {
      from: vi.fn((table: string) => ({
        insert: vi.fn(async (row: any) => {
          insertedRow = row
          return { data: row, error: null }
        }),
      })),
    }

    await createNotification(
      {
        recipientRole: 'admin',
        title: 'Low Attendance',
        message: 'Bob attendance is 65%',
        type: 'warning',
        urgent: true,
      },
      customClient,
    )

    expect(insertedRow).toBeDefined()
    expect(insertedRow.recipient_role).toBe('admin')
    expect(insertedRow.title).toBe('Low Attendance')
    expect(insertedRow.urgent).toBe(true)
  })
})
