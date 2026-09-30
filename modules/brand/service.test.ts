import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  client: {} as any,
  data: null as any,
  error: null as any,
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/env', () => ({
  clientEnv: {
    NEXT_PUBLIC_APP_URL: 'https://ttk-lemon.vercel.app',
    NEXT_PUBLIC_VERIFY_BASE_URL: 'https://ttk-lemon.vercel.app',
  },
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mocks.client }))

import { getBrandSettings, updateBrandSettings } from './service'
import { brand } from '@/lib/brand'

describe('brand service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.data = null
    mocks.error = null
    mocks.client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: mocks.data, error: mocks.error })),
          })),
        })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: mocks.data, error: mocks.error })),
          })),
        })),
      })),
    }
  })

  it('returns default fallback brand settings if no row exists or error occurs', async () => {
    mocks.data = null
    mocks.error = null
    const res = await getBrandSettings()
    expect(res.displayName).toBe(brand.displayName)
    expect(res.websiteUrl).toBe(brand.websiteUrl)

    mocks.error = new Error('db error')
    const resErr = await getBrandSettings()
    expect(resErr.displayName).toBe(brand.displayName)
  })

  it('returns brand settings from database row when present', async () => {
    mocks.data = {
      display_name: 'Custom Brand',
      legal_name: 'Custom Legal',
      short_name: 'CB',
      tagline: 'Best Education',
      support_email: 'custom@ttk.com',
      website_url: 'https://custom.ttk.com',
      verify_base_url: 'https://custom.ttk.com',
      invoice_prefix: 'CB',
    }
    const res = await getBrandSettings()
    expect(res.displayName).toBe('Custom Brand')
    expect(res.legalName).toBe('Custom Legal')
    expect(res.supportEmail).toBe('custom@ttk.com')
  })

  it('updates brand settings and returns updated fields', async () => {
    const input = {
      displayName: 'New Name',
      legalName: 'New Legal',
      shortName: 'NN',
      tagline: 'New Tag',
      supportEmail: 'nn@ttk.com',
      websiteUrl: 'https://nn.com',
      verifyBaseUrl: 'https://nn.com',
      invoicePrefix: 'INV',
    }
    mocks.data = {
      display_name: input.displayName,
      legal_name: input.legalName,
      short_name: input.shortName,
      tagline: input.tagline,
      support_email: input.supportEmail,
      website_url: input.websiteUrl,
      verify_base_url: input.verifyBaseUrl,
      invoice_prefix: input.invoicePrefix,
    }
    const updated = await updateBrandSettings(input)
    expect(updated.displayName).toBe('New Name')
    expect(updated.supportEmail).toBe('nn@ttk.com')
  })

  it('throws on update error', async () => {
    mocks.data = null
    mocks.error = new Error('upsert failed')
    await expect(
      updateBrandSettings({
        displayName: 'A',
        legalName: 'B',
        shortName: 'C',
        tagline: 'D',
        supportEmail: 'e@e.com',
        websiteUrl: 'https://e.com',
        verifyBaseUrl: 'https://e.com',
        invoicePrefix: 'E',
      }),
    ).rejects.toThrow('upsert failed')
  })
})
