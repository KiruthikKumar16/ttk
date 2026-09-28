import { calculateGstExclusive, calculateGstInclusive } from './gst'
import { paiseToRupees, rupeesToPaise } from './core'

export type RupeeGstBreakdown = {
  taxableAmount: number
  gstAmount: number
  cgstAmount: number
  sgstAmount: number
  totalAmount: number
}

/** Converts legacy rupee-valued form/DB fields at the boundary; calculations run in integer paise. */
export function calculateGstForRupees(amount: number, ratePercent: number, inclusive: boolean): RupeeGstBreakdown {
  const amountPaise = rupeesToPaise(amount)
  const result = inclusive
    ? calculateGstInclusive(amountPaise, ratePercent)
    : calculateGstExclusive(amountPaise, ratePercent)
  return {
    taxableAmount: paiseToRupees(result.taxablePaise),
    gstAmount: paiseToRupees(result.gstPaise),
    cgstAmount: paiseToRupees(result.cgstPaise),
    sgstAmount: paiseToRupees(result.sgstPaise),
    totalAmount: paiseToRupees(result.totalPaise),
  }
}
