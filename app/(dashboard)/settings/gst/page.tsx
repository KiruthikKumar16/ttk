import { requirePermission } from '@/lib/auth/current-profile'
import { can } from '@/lib/auth/permissions'
import { getGstSettings } from '@/modules/gst/service'
import { GstSettingsClient } from '@/modules/gst/components/GstSettingsClient'

export default async function GstSettingsRoute() {
  const profile = await requirePermission('gst', 'read')
  const settings = await getGstSettings()
  return <GstSettingsClient settings={settings} editable={can(profile.role, 'gst', 'update')} />
}
