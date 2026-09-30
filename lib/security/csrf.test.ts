import { afterEach, describe, expect, it, vi } from 'vitest'
import { validateMutationRequest } from './csrf'

afterEach(() => vi.unstubAllEnvs())

describe('mutation origin and content-type validation', () => {
  it('accepts same-origin JSON and configured multipart requests', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.test/path')
    const json = new Request('https://app.example.test/api/students', {
      method: 'POST',
      headers: {
        origin: 'https://app.example.test',
        host: 'app.example.test',
        'content-type': 'application/json; charset=utf-8',
      },
    })
    expect(validateMutationRequest(json)).toBeNull()
    const upload = new Request('https://app.example.test/api/materials', {
      method: 'POST',
      headers: {
        origin: 'https://app.example.test',
        host: 'app.example.test',
        'content-type': 'multipart/form-data; boundary=x',
      },
    })
    expect(validateMutationRequest(upload, ['multipart/form-data'])).toBeNull()
  })

  it.each([
    [undefined, 'https://app.example.test', 'application/json'],
    ['https://evil.test', 'https://app.example.test', 'application/json'],
    ['https://app.example.test', 'evil.test', 'application/json'],
    ['https://app.example.test', 'app.example.test', 'text/plain'],
  ])('rejects invalid origin, host, or content type', async (origin, host, contentType) => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.test')
    const headers = new Headers({ host: host!, 'content-type': contentType })
    if (origin) headers.set('origin', origin)
    const response = validateMutationRequest(new Request('https://app.example.test/api', { method: 'POST', headers }))
    expect(response?.status).toBe(403)
    await expect(response?.json()).resolves.toMatchObject({ error: { code: 'FORBIDDEN' } })
  })
})
