import { describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/env', () => ({
  clientEnv: { NEXT_PUBLIC_APP_URL: 'https://app.test', NEXT_PUBLIC_VERIFY_BASE_URL: 'https://verify.test///' },
}))
import { brand, brandCssVariables } from './brand'
import { certificateSkills } from './constants'

describe('centralized brand data', () => {
  it('uses the canonical product identity and strips trailing verify slashes', () => {
    expect(brand).toMatchObject({
      displayName: 'ThoorigAI Infotech',
      legalName: 'ThoorigAI Infotech LLP',
      websiteUrl: 'https://app.test',
      verifyBaseUrl: 'https://verify.test',
    })
    expect(brandCssVariables['--brand-navy']).toBe(brand.theme.colors.navy)
    expect(certificateSkills.length).toBeGreaterThan(0)
  })
})
