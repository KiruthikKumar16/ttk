import { describe, expect, it } from 'vitest'
import { getTimeBasedGreeting } from './greeting'

describe('getTimeBasedGreeting', () => {
  it('returns Good morning between 5:00 and 11:59', () => {
    const morning = new Date(2026, 8, 29, 8, 30, 0)
    const result = getTimeBasedGreeting(morning)
    expect(result.greeting).toBe('Good morning')
    expect(result.subcopy).toContain('Ready for a productive day')
    expect(result.formattedDate).toBeTruthy()
  })

  it('returns Good afternoon between 12:00 and 16:59', () => {
    const afternoon = new Date(2026, 8, 29, 14, 15, 0)
    const result = getTimeBasedGreeting(afternoon)
    expect(result.greeting).toBe('Good afternoon')
    expect(result.subcopy).toContain('Keep up the momentum')
  })

  it('returns Good evening between 17:00 and 21:59', () => {
    const evening = new Date(2026, 8, 29, 19, 0, 0)
    const result = getTimeBasedGreeting(evening)
    expect(result.greeting).toBe('Good evening')
    expect(result.subcopy).toContain("Wrapping up today's sessions")
  })

  it('returns after-hours Good evening between 22:00 and 4:59', () => {
    const lateNight = new Date(2026, 8, 29, 23, 30, 0)
    const resultLate = getTimeBasedGreeting(lateNight)
    expect(resultLate.greeting).toBe('Good evening')
    expect(resultLate.subcopy).toContain('Reviewing after-hours academy operations')

    const earlyHours = new Date(2026, 8, 29, 3, 0, 0)
    const resultEarly = getTimeBasedGreeting(earlyHours)
    expect(resultEarly.greeting).toBe('Good evening')
    expect(resultEarly.subcopy).toContain('Reviewing after-hours academy operations')
  })

  it('defaults to current time when no date is provided', () => {
    const result = getTimeBasedGreeting()
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(result.greeting)
    expect(result.formattedDate).toBeTruthy()
  })
})
