/** Returns the Indian financial year label (start year–end year) for an ISO date. */
export function financialYearFor(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(`${date}T00:00:00.000Z`) : date
  if (Number.isNaN(value.getTime())) throw new RangeError('Invalid date.')
  const year = value.getUTCFullYear()
  const startYear = value.getUTCMonth() < 3 || (value.getUTCMonth() === 2 && value.getUTCDate() <= 31) ? year - 1 : year
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}
