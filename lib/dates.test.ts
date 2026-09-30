import { describe, expect, it } from 'vitest'
import { financialYearFor } from './dates'

describe('financial year boundaries', () => {
  it('keeps 31 March in the year ending that day and starts the next year on 1 April', () => {
    expect(financialYearFor('2026-03-31')).toBe('2025-26')
    expect(financialYearFor('2026-04-01')).toBe('2026-27')
  })

  it('rejects invalid dates', () => {
    expect(() => financialYearFor('not-a-date')).toThrow(RangeError)
  })
})
