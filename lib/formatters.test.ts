import { describe, expect, it } from 'vitest'
import { amountInWords, money } from './formatters'

describe('legacy rupee formatters', () => {
  it('converts rupee values to shared INR and amount-in-words formatting', () => {
    expect(money(1200)).toContain('1,200')
    expect(amountInWords(1.5)).toContain('One and Fifty Paise')
  })
})
