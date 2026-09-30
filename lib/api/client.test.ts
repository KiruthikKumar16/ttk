import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError, apiClient } from './client'

afterEach(() => vi.unstubAllGlobals())

describe('browser API client', () => {
  it('sends JSON headers and idempotency keys and unwraps the response envelope', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: 1 }, meta: { page: 1 } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: 2 } }), { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(apiClient.get('/api/students')).resolves.toEqual({ data: { id: 1 }, meta: { page: 1 } })
    await apiClient.post('/api/payments', { amount: 1 }, { idempotencyKey: 'once' })
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'Idempotency-Key': 'once' },
    })
  })

  it('maps API failures to typed errors and uses a fallback for non-standard bodies', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Denied' } }), { status: 403 }),
        ),
    )
    await expect(apiClient.get('/api/private')).rejects.toMatchObject(new ApiClientError('Denied', 403, 'FORBIDDEN'))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 500 })))
    await expect(apiClient.get('/api/fail')).rejects.toThrow('The request failed.')
  })
})
