import { describe, expect, it } from 'vitest'
import { validateCourseMaterialFile } from './uploads'

describe('course material file validation', () => {
  it('accepts a PDF only when extension, MIME and signature agree', async () => {
    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])], 'notes.pdf', {
      type: 'application/pdf',
    })
    await expect(validateCourseMaterialFile(file)).resolves.toBe('pdf')
  })

  it('rejects a mismatched magic signature', async () => {
    const file = new File(['not really a PDF'], 'notes.pdf', { type: 'application/pdf' })
    await expect(validateCourseMaterialFile(file)).resolves.toBeNull()
  })

  it('rejects a MIME and extension mismatch', async () => {
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'image.pdf', {
      type: 'image/png',
    })
    await expect(validateCourseMaterialFile(file)).resolves.toBeNull()
  })
})
