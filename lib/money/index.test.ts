import { describe, expect, it } from 'vitest'
import {
  allocatePaise,
  amountInWords,
  calculateGstExclusive,
  calculateGstFromParts,
  calculateGstInclusive,
  calculateGstForRupees,
  differenceRupees,
  formatINR,
  numberToIndianWords,
  paiseToRupees,
  percentageOfRupees,
  roundRatio,
  rupeesToPaise,
  splitGstPaise,
  sumPaise,
  sumRupees,
} from './index'

describe('money conversions and formatting', () => {
  it('converts rupees to integer paise with decimal half-up rounding', () => {
    expect(rupeesToPaise(123.45)).toBe(12345)
    expect(rupeesToPaise(1.005)).toBe(101)
    expect(rupeesToPaise(-1.005)).toBe(-101)
    expect(rupeesToPaise(1e-7)).toBe(0)
    expect(() => rupeesToPaise(Number.NaN)).toThrow(RangeError)
    expect(() => rupeesToPaise(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })

  it('checks safe paise values and converts back to rupees', () => {
    expect(paiseToRupees(12345)).toBe(123.45)
    expect(() => paiseToRupees(1.5)).toThrow(RangeError)
  })

  it('adds and subtracts money as integer paise', () => {
    expect(sumPaise([101, 203])).toBe(304)
    expect(sumPaise([])).toBe(0)
    expect(sumRupees([1.01, 2.03])).toBe(3.04)
    expect(differenceRupees(10, 3.25)).toBe(6.75)
    expect(differenceRupees(1, 2)).toBe(-1)
    expect(percentageOfRupees(3, 4)).toBe(75)
    expect(percentageOfRupees(3, 0)).toBe(0)
    expect(() => sumPaise([1.5])).toThrow(RangeError)
  })

  it('rounds integer ratios deterministically', () => {
    expect(roundRatio(5n, 2n)).toBe(3n)
    expect(roundRatio(-5n, 2n)).toBe(-3n)
    expect(roundRatio(4n, 2n)).toBe(2n)
    expect(() => roundRatio(1n, 0n)).toThrow(RangeError)
  })

  it('formats INR with either paise or whole rupees', () => {
    expect(formatINR(12345)).toBe('₹123.45')
    expect(formatINR(12300, 0)).toBe('₹123')
    expect(() => formatINR(1.2)).toThrow(RangeError)
  })

  it('uses Indian number groups in amount words', () => {
    expect(numberToIndianWords(0)).toBe('Zero')
    expect(numberToIndianWords(19)).toBe('Nineteen')
    expect(numberToIndianWords(20)).toBe('Twenty')
    expect(numberToIndianWords(105)).toBe('One Hundred Five')
    expect(numberToIndianWords(1_234_567)).toBe('Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven')
    expect(numberToIndianWords(100_000_000)).toBe('Ten Crore')
    expect(numberToIndianWords(1_000_000_000_000)).toBe('One Lakh Crore')
    expect(() => numberToIndianWords(-1)).toThrow(RangeError)
    expect(() => numberToIndianWords(1.2)).toThrow(RangeError)
    expect(amountInWords(12345)).toBe('Indian Rupees One Hundred Twenty Three and Forty Five Paise Only')
    expect(amountInWords(12_300)).toBe('Indian Rupees One Hundred Twenty Three Only')
    expect(amountInWords(-5)).toBe('Minus Indian Rupees Zero and Five Paise Only')
  })
})

describe('GST calculations in paise', () => {
  it('splits every paise exactly with the first component winning a tie', () => {
    expect(splitGstPaise(5)).toEqual({ cgstPaise: 3, sgstPaise: 2 })
    expect(allocatePaise(10, [1, 1, 1])).toEqual([4, 3, 3])
    expect(allocatePaise(10, [1, 2])).toEqual([3, 7])
    expect(allocatePaise(10, [2, 1])).toEqual([7, 3])
    expect(allocatePaise(7, [0, 1])).toEqual([0, 7])
    expect(() => allocatePaise(-1, [1])).toThrow(RangeError)
    expect(() => allocatePaise(1, [])).toThrow(RangeError)
    expect(() => allocatePaise(1, [-1])).toThrow(RangeError)
    expect(() => allocatePaise(1, [Number.NaN])).toThrow(RangeError)
    expect(() => allocatePaise(1, [0, 0])).toThrow(RangeError)
  })

  it('calculates exclusive GST and reconciles inclusive totals', () => {
    expect(calculateGstExclusive(10_000, 18)).toEqual({
      taxablePaise: 10_000,
      gstPaise: 1_800,
      cgstPaise: 900,
      sgstPaise: 900,
      totalPaise: 11_800,
    })
    expect(calculateGstExclusive(1, 1)).toMatchObject({ gstPaise: 0, totalPaise: 1 })
    expect(calculateGstInclusive(11_800, 18)).toEqual({
      taxablePaise: 10_000,
      gstPaise: 1_800,
      cgstPaise: 900,
      sgstPaise: 900,
      totalPaise: 11_800,
    })
    expect(calculateGstInclusive(1, 100)).toMatchObject({ taxablePaise: 1, gstPaise: 0 })
    expect(calculateGstFromParts(11800, 900, 900)).toMatchObject({
      taxablePaise: 10000,
      gstPaise: 1800,
      totalPaise: 11800,
    })
    expect(calculateGstFromParts(100, 0, 0)).toMatchObject({ taxablePaise: 100, gstPaise: 0 })
    expect(calculateGstExclusive(0, 0)).toMatchObject({ gstPaise: 0, totalPaise: 0 })
    expect(() => calculateGstExclusive(-1, 18)).toThrow(RangeError)
    expect(() => calculateGstInclusive(-1, 18)).toThrow(RangeError)
    expect(() => calculateGstFromParts(-1, 0, 0)).toThrow(RangeError)
    expect(() => calculateGstFromParts(10, -1, 0)).toThrow(RangeError)
    expect(() => calculateGstFromParts(10, 0, -1)).toThrow(RangeError)
    expect(() => calculateGstFromParts(10, 10, 1)).toThrow(RangeError)
    expect(() => calculateGstExclusive(1, -1)).toThrow(RangeError)
    expect(() => calculateGstExclusive(1, 101)).toThrow(RangeError)
    expect(() => calculateGstExclusive(1, Number.NaN)).toThrow(RangeError)
    expect(() => calculateGstExclusive(1, 1.001)).toThrow(RangeError)
    expect(calculateGstForRupees(100, 18, false)).toMatchObject({
      taxableAmount: 100,
      gstAmount: 18,
      cgstAmount: 9,
      sgstAmount: 9,
      totalAmount: 118,
    })
    expect(calculateGstForRupees(118, 18, true)).toMatchObject({
      taxableAmount: 100,
      gstAmount: 18,
      totalAmount: 118,
    })
  })
})
