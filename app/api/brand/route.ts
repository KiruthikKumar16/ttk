import { apiResult, withApi } from '@/lib/http/handler'
import { brandSchema } from '@/modules/brand/schema'
import { getBrandSettings, updateBrandSettings } from '@/modules/brand/service'

export const GET = withApi(
  { roles: ['admin', 'staff', 'trainer'] as const },
  async () => apiResult(await getBrandSettings()),
)

export const POST = withApi(
  { roles: ['admin'] as const, body: brandSchema },
  async ({ body }) => apiResult(await updateBrandSettings(body)),
)
