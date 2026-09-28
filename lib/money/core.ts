import type { Paise } from './types'

export function assertPaise(value: number): asserts value is Paise {
  if (!Number.isSafeInteger(value)) throw new RangeError('Money must be a safe integer number of paise.')
}

export function rupeesToPaise(rupees: number): Paise {
  if (!Number.isFinite(rupees)) throw new RangeError('Rupees must be a finite number.')
  const decimal = String(Math.abs(rupees)).toLowerCase()
  const [coefficient, exponentText] = decimal.split('e')
  const exponent = exponentText ? Number(exponentText) : 0
  const [whole = '0', fraction = ''] = coefficient.split('.')
  const digits = BigInt(`${whole}${fraction}`)
  const scale = exponent - fraction.length + 2
  const divisor = scale < 0 ? 10n ** BigInt(-scale) : 1n
  const magnitude = scale >= 0
    ? digits * 10n ** BigInt(scale)
    : (digits + divisor / 2n) / divisor
  const signed = rupees < 0 ? -magnitude : magnitude
  const paise = Number(signed)
  assertPaise(paise)
  return paise as Paise
}

export function paiseToRupees(paise: number): number {
  assertPaise(paise)
  return paise / 100
}

export function sumPaise(values: readonly number[]): Paise {
  let total = 0n
  for (const value of values) {
    assertPaise(value)
    total += BigInt(value)
  }
  return bigintToPaise(total)
}

export function sumRupees(values: readonly number[]): number {
  return paiseToRupees(sumPaise(values.map(rupeesToPaise)))
}

export function differenceRupees(minuend: number, subtrahend: number): number {
  return paiseToRupees(bigintToPaise(BigInt(rupeesToPaise(minuend)) - BigInt(rupeesToPaise(subtrahend))))
}

export function percentageOfRupees(part: number, total: number): number {
  const partPaise = rupeesToPaise(part)
  const totalPaise = rupeesToPaise(total)
  if (totalPaise <= 0) return 0
  return Number(roundRatio(BigInt(partPaise) * 100n, BigInt(totalPaise)))
}

export function roundRatio(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new RangeError('Denominator must be positive.')
  const sign = numerator < 0n ? -1n : 1n
  const magnitude = numerator < 0n ? -numerator : numerator
  const rounded = (magnitude + denominator / 2n) / denominator
  return rounded * sign
}

export function bigintToPaise(value: bigint): Paise {
  const number = Number(value)
  assertPaise(number)
  return number as Paise
}

