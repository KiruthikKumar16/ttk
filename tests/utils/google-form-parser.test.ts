import { describe, it, expect } from 'vitest'
import {
  extractNumericScore,
  parseCsvOrTsv,
  parseGoogleFormResponses,
} from '@/modules/assessments/utils/google-form-parser'

describe('google-form-parser', () => {
  it('extracts numeric scores correctly from different formats', () => {
    // Standard Google Forms quiz fraction: "28.00 / 30"
    expect(extractNumericScore('28.00 / 30', 30)).toBe(28)
    expect(extractNumericScore('24 / 30', 30)).toBe(24)

    // Percentage
    expect(extractNumericScore('80%', 30)).toBe(24)

    // Simple number
    expect(extractNumericScore('29', 30)).toBe(29)
    expect(extractNumericScore('29.5', 30)).toBe(29.5)

    // Clamps to maxScore
    expect(extractNumericScore('35', 30)).toBe(30)
  })

  it('parses CSV and TSV table content correctly', () => {
    const csv = 'Timestamp,Email,Score,Student Name\n2026-10-04,test@gmail.com,"28.00 / 30",Asha'
    const parsedCsv = parseCsvOrTsv(csv)
    expect(parsedCsv.length).toBe(2)
    expect(parsedCsv[1][2]).toBe('28.00 / 30')
    expect(parsedCsv[1][3]).toBe('Asha')

    const tsv = 'Asha\t28 / 30\nBala\t24 / 30'
    const parsedTsv = parseCsvOrTsv(tsv)
    expect(parsedTsv.length).toBe(2)
    expect(parsedTsv[0][0]).toBe('Asha')
    expect(parsedTsv[0][1]).toBe('28 / 30')
  })

  it('matches students by register ID or name from Google Forms responses', () => {
    const enrolledStudents = [
      { id: 'uuid-1', register_id: 1042, name: 'Asha' },
      { id: 'uuid-2', register_id: 1043, name: 'Kiruthik Kumar' },
      { id: 'uuid-3', register_id: 1044, name: 'Bala' },
    ]

    const googleFormCsv = `Timestamp,Email Address,Score,Student Name
2026/10/04 10:15:00 AM GMT+5:30,asha@gmail.com,28.00 / 30,Asha
2026/10/04 10:18:00 AM GMT+5:30,kk@gmail.com,30.00 / 30,Kiruthik
2026/10/04 10:20:00 AM GMT+5:30,bala@gmail.com,25.00 / 30,Bala #1044
2026/10/04 10:22:00 AM GMT+5:30,unknown@gmail.com,22.00 / 30,Visitor Name`

    const results = parseGoogleFormResponses(googleFormCsv, enrolledStudents, 30)

    expect(results.length).toBe(4)

    // Asha - exact match
    expect(results[0].studentId).toBe(1042)
    expect(results[0].score).toBe(28)
    expect(results[0].matched).toBe(true)

    // Kiruthik - fuzzy match
    expect(results[1].studentId).toBe(1043)
    expect(results[1].score).toBe(30)
    expect(results[1].matched).toBe(true)

    // Bala with ID
    expect(results[2].studentId).toBe(1044)
    expect(results[2].score).toBe(25)
    expect(results[2].matched).toBe(true)

    // Visitor Name - unmatched
    expect(results[3].studentId).toBe(null)
    expect(results[3].matched).toBe(false)
  })
})
