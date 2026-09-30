import { z } from 'zod'

export const brandSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required').max(100),
  legalName: z.string().trim().min(1, 'Legal name is required').max(150),
  shortName: z.string().trim().min(1, 'Short name is required').max(50),
  tagline: z.string().trim().max(200).default(''),
  supportEmail: z.string().trim().email('Valid support email is required'),
  websiteUrl: z.string().trim().url('Valid website URL is required'),
  verifyBaseUrl: z.string().trim().url('Valid verification site URL is required'),
  invoicePrefix: z.string().trim().min(1, 'Invoice prefix is required').max(10),
})

export type BrandInput = z.infer<typeof brandSchema>
