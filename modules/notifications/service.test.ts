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

import { listUserNotifications, markNotificationRead, markAllNotificationsRead, createNotification } from './service'

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
                then: (resolve: (v: any) => any, reject: (err: any) => any) =>
                  Promise.resolve({ data: mocks.notificationsData, error: mocks.error }).then(resolve, reject),
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

  it('lists notifications and computes isRead state and relative timestamps', async () => {
    const now = Date.now()
    mocks.notificationsData = [
      {
        id: 'n1',
        title: 'Payment Received',
        message: 'Invoice INV-100 created',
        type: 'info',
        link: '/invoices/INV-100',
        urgent: false,
        created_at: new Date(now - 10000).toISOString(), // 10s ago -> Just now
      },
      {
        id: 'n2',
        title: 'New Student',
        message: 'Alice enrolled',
        type: 'success',
        link: '/students/101',
        urgent: true,
        created_at: new Date(now - 120000).toISOString(), // 2m ago -> 2m ago
      },
      {
        id: 'n3',
        title: 'Attendance Alert',
        message: 'Low attendance',
        type: 'warning',
        link: '/attendance',
        urgent: false,
        created_at: new Date(now - 7200000).toISOString(), // 2h ago -> 2h ago
      },
      {
        id: 'n4',
        title: 'Weekly Summary',
        message: 'Summary ready',
        type: 'info',
        link: '',
        urgent: false,
        created_at: new Date(now - 172800000).toISOString(), // 2d ago -> 2d ago
      },
      {
        id: 'n5',
        title: 'Old Notification',
        message: 'Old alert',
        type: 'info',
        link: '',
        urgent: false,
        created_at: '2025-01-01T00:00:00Z', // > 7d ago
      },
      {
        id: 'n6',
        title: 'Invalid Date',
        message: 'Bad date',
        type: 'alert',
        link: null,
        urgent: false,
        created_at: 'not-a-valid-date',
      },
    ]
    mocks.readsData = [{ notification_id: 'n1' }]

    const result = await listUserNotifications('u123', 'admin')
    expect(result).toHaveLength(6)
    expect(result[0].id).toBe('n1')
    expect(result[0].isRead).toBe(true)
    expect(result[0].timestamp).toBe('Just now')
    expect(result[1].id).toBe('n2')
    expect(result[1].isRead).toBe(false)
    expect(result[1].timestamp).toContain('m ago')
    expect(result[2].timestamp).toContain('h ago')
    expect(result[3].timestamp).toContain('d ago')
    expect(result[4].timestamp).toBeTruthy()
    expect(result[5].link).toBe('/')
  })

  it('returns empty array if notifications query fails or is empty', async () => {
    mocks.notificationsData = []
    const emptyResult = await listUserNotifications('u123', 'admin')
    expect(emptyResult).toEqual([])

    mocks.error = new Error('db error')
    const errorResult = await listUserNotifications('u123', 'admin')
    expect(errorResult).toEqual([])
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

  it('marks all notifications as read', async () => {
    let upsertedRows: any = null
    mocks.notificationsData = [{ id: 'n1' }, { id: 'n2' }]
    mocks.client.from = vi.fn((table: string) => {
      if (table === 'notifications') {
        return {
          select: vi.fn(() => ({
            or: vi.fn(async () => ({ data: mocks.notificationsData, error: null })),
          })),
        }
      }
      if (table === 'notification_reads') {
        return {
          upsert: vi.fn(async (rows: any) => {
            upsertedRows = rows
            return { data: rows, error: null }
          }),
        }
      }
      return {}
    })

    await markAllNotificationsRead('u123', 'admin')
    expect(upsertedRows).toHaveLength(2)
    expect(upsertedRows[0].notification_id).toBe('n1')

    // If no notifications exist, does nothing
    upsertedRows = null
    mocks.notificationsData = []
    await markAllNotificationsRead('u123', 'admin')
    expect(upsertedRows).toBeNull()
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

    // With default admin client
    await createNotification({
      recipientRole: 'staff',
      title: 'Course Update',
      message: 'Materials added',
    })
  })
})
