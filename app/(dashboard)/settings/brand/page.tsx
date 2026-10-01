import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth/current-profile'
import { getBrandSettings } from '@/modules/brand/service'
import { BrandSettingsClient } from '@/modules/brand/components/BrandSettingsClient'

export const dynamic = 'force-dynamic'

export default async function BrandSettingsPage() {
  const profile = await getCurrentProfile()
  if (profile.role !== 'admin') redirect('/')
  const settings = await getBrandSettings()

  return <BrandSettingsClient settings={settings} editable={true} />
}
