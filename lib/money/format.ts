import { assertPaise } from './core'

export function formatINR(paise: number, fractionDigits: 0 | 2 = 2): string {
  assertPaise(paise)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(paise / 100)
}

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function underThousand(value: number): string {
  const words: string[] = []
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100
  if (hundreds > 0) words.push(`${ones[hundreds]} Hundred`)
  if (remainder >= 10 && remainder < 20) words.push(teens[remainder - 10])
  else {
    const tensDigit = Math.floor(remainder / 10)
    const onesDigit = remainder % 10
    if (tensDigit > 0) words.push(tens[tensDigit])
    if (onesDigit > 0) words.push(ones[onesDigit])
  }
  return words.join(' ')
}

export function numberToIndianWords(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Value must be a non-negative safe integer.')
  if (value === 0) return 'Zero'

  const units: readonly [number, string][] = [
    [10_000_000, 'Crore'],
    [100_000, 'Lakh'],
    [1_000, 'Thousand'],
    [1, ''],
  ]
  let remainder = value
  const words: string[] = []
  for (const [unit, label] of units) {
    const count = Math.floor(remainder / unit)
    if (count > 0) {
      const countWords = count < 1000 ? underThousand(count) : numberToIndianWords(count)
      words.push(label ? `${countWords} ${label}` : countWords)
      remainder %= unit
    }
  }
  return words.join(' ')
}

export function amountInWords(paise: number): string {
  assertPaise(paise)
  const negative = paise < 0
  const magnitude = Math.abs(paise)
  const rupees = Math.floor(magnitude / 100)
  const fractionalPaise = magnitude % 100
  const prefix = negative ? 'Minus Indian Rupees ' : 'Indian Rupees '
  const rupeeWords = numberToIndianWords(rupees)
  return `${prefix}${rupeeWords}${fractionalPaise ? ` and ${numberToIndianWords(fractionalPaise)} Paise` : ''} Only`
}
