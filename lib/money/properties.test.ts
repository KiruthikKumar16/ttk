import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { calculateGstExclusive, calculateGstInclusive } from './index'

describe('GST integer invariants', () => {
  it('reconciles CGST + SGST + taxable value to the exclusive total for generated paise amounts', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000_000 }), fc.integer({ min: 0, max: 100 }), (amount, rate) => {
        const result = calculateGstExclusive(amount, rate)
        expect(result.cgstPaise + result.sgstPaise).toBe(result.gstPaise)
        expect(result.taxablePaise + result.gstPaise).toBe(result.totalPaise)
      }),
      { numRuns: 500, seed: 20260929 },
    )
  })

  it('preserves the supplied total for inclusive calculations including odd paise', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000_000 }), fc.integer({ min: 0, max: 100 }), (total, rate) => {
        const result = calculateGstInclusive(total, rate)
        expect(result.cgstPaise + result.sgstPaise).toBe(result.gstPaise)
        expect(result.taxablePaise + result.gstPaise).toBe(total)
        expect(result.totalPaise).toBe(total)
      }),
      { numRuns: 500, seed: 20260930 },
    )
  })
})
