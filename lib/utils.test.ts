import { describe, expect, it, vi } from 'vitest'
import { cn, generateUniqueVerificationCode, generateVerificationCode } from './utils'

describe('verification code generator', () => {
  it('produces the requested number of URL-safe characters', () => {
    for (const size of [1, 10, 32]) {
      expect(generateVerificationCode(size)).toMatch(new RegExp(`^[A-Za-z0-9_-]{${size}}$`))
    }
  })
})

describe('utility helpers', () => {
  it('joins only truthy class names', () => {
    expect(cn('card', undefined, false, null, 0, 'active')).toBe('card active')
  })

  it('retries code collisions, returns a candidate on lookup errors, and stops at its limit', async () => {
    const originalCrypto = globalThis.crypto
    vi.stubGlobal('crypto', {
      getRandomValues: (array: Uint32Array) => {
        array[0] = 0
        return array
      },
    })
    const client = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            then: (resolve: (value: unknown) => unknown) => Promise.resolve({ count: 1, error: null }).then(resolve),
          }),
        }),
      })),
    }
    await expect(generateUniqueVerificationCode(client, 2)).rejects.toThrow('maximum attempts')
    client.from.mockImplementationOnce(
      () =>
        ({
          select: () => ({
            eq: () => ({
              then: (resolve: (value: unknown) => unknown) => Promise.resolve({ count: 1, error: null }).then(resolve),
            }),
          }),
        }) as any,
    )
    client.from.mockImplementationOnce(
      () =>
        ({
          select: () => ({
            eq: () => ({
              then: (resolve: (value: unknown) => unknown) => Promise.resolve({ count: 0, error: null }).then(resolve),
            }),
          }),
        }) as any,
    )
    await expect(generateUniqueVerificationCode(client, 2)).resolves.toBe('A'.repeat(10))
    const failedLookup = {
      from: () => ({ select: () => ({ eq: () => Promise.resolve({ error: new Error('offline') }) }) }),
    }
    await expect(generateUniqueVerificationCode(failedLookup)).resolves.toBe('A'.repeat(10))
    vi.stubGlobal('crypto', originalCrypto)
  })
})
