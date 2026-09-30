import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { brand } from '@/lib/brand'
import type { BrandSettings } from '@/lib/types'
import type { BrandInput } from './schema'

export async function getBrandSettings(): Promise<BrandSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brand_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle()

  if (error || !data) {
    return {
      displayName: brand.displayName,
      legalName: brand.legalName,
      shortName: brand.shortName,
      tagline: brand.tagline,
      supportEmail: brand.supportEmail,
      websiteUrl: brand.websiteUrl,
      verifyBaseUrl: brand.verifyBaseUrl,
      invoicePrefix: brand.invoicePrefix,
    }
  }

  return {
    displayName: String(data.display_name || brand.displayName),
    legalName: String(data.legal_name || brand.legalName),
    shortName: String(data.short_name || brand.shortName),
    tagline: String(data.tagline || brand.tagline),
    supportEmail: String(data.support_email || brand.supportEmail),
    websiteUrl: String(data.website_url || brand.websiteUrl),
    verifyBaseUrl: String(data.verify_base_url || brand.verifyBaseUrl),
    invoicePrefix: String(data.invoice_prefix || brand.invoicePrefix),
  }
}

export async function updateBrandSettings(input: BrandInput): Promise<BrandSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brand_settings')
    .upsert({
      id: 'default',
      display_name: input.displayName,
      legal_name: input.legalName,
      short_name: input.shortName,
      tagline: input.tagline,
      support_email: input.supportEmail,
      website_url: input.websiteUrl,
      verify_base_url: input.verifyBaseUrl,
      invoice_prefix: input.invoicePrefix,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update brand settings')
  }

  return {
    displayName: String(data.display_name),
    legalName: String(data.legal_name),
    shortName: String(data.short_name),
    tagline: String(data.tagline),
    supportEmail: String(data.support_email),
    websiteUrl: String(data.website_url),
    verifyBaseUrl: String(data.verify_base_url),
    invoicePrefix: String(data.invoice_prefix),
  }
}
