import { assertPaise, bigintToPaise, roundRatio } from './core'
import type { Paise } from './types'

export type GstBreakdown = {
  taxablePaise: Paise
  gstPaise: Paise
  cgstPaise: Paise
  sgstPaise: Paise
  totalPaise: Paise
}

function gstRateBasisPoints(ratePercent: number): bigint {
  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    throw new RangeError('GST rate must be between 0 and 100 percent.')
  }
  const text = String(ratePercent)
  const decimalPlaces = text.includes('.') ? text.split('.')[1].length : 0
  if (decimalPlaces > 2) throw new RangeError('GST rate supports at most two decimal places.')
  return BigInt(Math.round(ratePercent * 100))
}

export function allocatePaise(total: number, weights: readonly number[]): Paise[] {
  assertPaise(total)
  if (total < 0) throw new RangeError('Allocation total cannot be negative.')
  if (weights.length === 0 || weights.some((weight) => !Number.isFinite(weight) || weight < 0)) {
    throw new RangeError('Allocation weights must be non-negative finite numbers.')
  }
  const integerWeights = weights.map((weight) => BigInt(Math.round(weight * 1_000_000)))
  const weightTotal = integerWeights.reduce((sum, weight) => sum + weight, 0n)
  if (weightTotal === 0n) throw new RangeError('At least one allocation weight must be positive.')

  const totalBigInt = BigInt(total)
  const shares = integerWeights.map((weight, index) => {
    const numerator = totalBigInt * weight
    return { index, amount: numerator / weightTotal, remainder: numerator % weightTotal }
  })
  let remaining = totalBigInt - shares.reduce((sum, share) => sum + share.amount, 0n)
  const remainderOrder = [...shares].sort((left, right) => {
    if (left.remainder === right.remainder) return left.index - right.index
    return left.remainder > right.remainder ? -1 : 1
  })
  for (let index = 0; remaining > 0n; index += 1, remaining -= 1n) {
    remainderOrder[index].amount += 1n
  }
  return shares.map((share) => bigintToPaise(share.amount))
}

export function splitGstPaise(gstPaise: number): { cgstPaise: Paise; sgstPaise: Paise } {
  const [cgstPaise, sgstPaise] = allocatePaise(gstPaise, [1, 1])
  return { cgstPaise, sgstPaise }
}

export function calculateGstFromParts(totalPaise: number, cgstPaise: number, sgstPaise: number): GstBreakdown {
  assertPaise(totalPaise)
  assertPaise(cgstPaise)
  assertPaise(sgstPaise)
  if (totalPaise < 0 || cgstPaise < 0 || sgstPaise < 0) {
    throw new RangeError('GST parts cannot be negative.')
  }
  const gstPaise = BigInt(cgstPaise) + BigInt(sgstPaise)
  if (gstPaise > BigInt(totalPaise)) throw new RangeError('GST parts cannot exceed the invoice total.')
  return {
    taxablePaise: bigintToPaise(BigInt(totalPaise) - gstPaise),
    gstPaise: bigintToPaise(gstPaise),
    cgstPaise: cgstPaise as Paise,
    sgstPaise: sgstPaise as Paise,
    totalPaise: totalPaise as Paise,
  }
}

export function calculateGstExclusive(taxablePaise: number, ratePercent: number): GstBreakdown {
  assertPaise(taxablePaise)
  if (taxablePaise < 0) throw new RangeError('Taxable amount cannot be negative.')
  const basisPoints = gstRateBasisPoints(ratePercent)
  const gstPaise = bigintToPaise(roundRatio(BigInt(taxablePaise) * basisPoints, 10_000n))
  const { cgstPaise, sgstPaise } = splitGstPaise(gstPaise)
  return {
    taxablePaise: taxablePaise as Paise,
    gstPaise,
    cgstPaise,
    sgstPaise,
    totalPaise: bigintToPaise(BigInt(taxablePaise) + BigInt(gstPaise)),
  }
}

export function calculateGstInclusive(totalPaise: number, ratePercent: number): GstBreakdown {
  assertPaise(totalPaise)
  if (totalPaise < 0) throw new RangeError('Total amount cannot be negative.')
  const basisPoints = gstRateBasisPoints(ratePercent)
  const taxablePaise = bigintToPaise(roundRatio(BigInt(totalPaise) * 10_000n, 10_000n + basisPoints))
  const gstPaise = bigintToPaise(BigInt(totalPaise) - BigInt(taxablePaise))
  const { cgstPaise, sgstPaise } = splitGstPaise(gstPaise)
  return { taxablePaise, gstPaise, cgstPaise, sgstPaise, totalPaise: totalPaise as Paise }
}
