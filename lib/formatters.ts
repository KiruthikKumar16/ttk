import { amountInWords as amountInWordsPaise, formatINR, rupeesToPaise } from '@/lib/money'

/** Compatibility adapter for existing UI fields that are still stored in rupees. */
export function money(rupees: number): string {
  return formatINR(rupeesToPaise(rupees), 0)
}

/** Compatibility adapter for invoice data that is still supplied in rupees. */
export function amountInWords(rupees: number): string {
  return amountInWordsPaise(rupeesToPaise(rupees))
}
