import { describe, expect, it } from 'vitest'
import { getVerificationSelector, verificationRegistry } from './verification'

describe('public verification result mapping', () => {
  it('maps certificate and invoice documents to valid public results', () => {
    expect(
      verificationRegistry.certificate({ student_name: 'Asha', course_name: 'AI', issue_date: '2026-03-31' }),
    ).toEqual({ studentName: 'Asha', courseName: 'AI', issueDate: '2026-03-31', status: 'Valid' })
    expect(
      verificationRegistry.invoice({
        invoice: 'TAI/2026/INV000001',
        amountPaise: 11800,
        gst_rate: 18,
        payment_date: '2026-03-31',
      }),
    ).toMatchObject({ invoiceNumber: 'TAI/2026/INV000001', amount: 118, gstStatus: 'GST Applied', status: 'Valid' })
  })

  it('returns no selector for unknown document types', () => {
    expect(getVerificationSelector('unknown')).toBeUndefined()
  })
})
