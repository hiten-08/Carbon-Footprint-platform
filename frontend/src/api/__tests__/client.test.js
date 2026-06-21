import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getToken, setToken } from '../client'

describe('token storage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('returns null when no token is set', () => {
    expect(getToken()).toBeNull()
  })

  it('persists a token to sessionStorage', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
  })

  it('clears the token when set to null', () => {
    setToken('abc123')
    setToken(null)
    expect(getToken()).toBeNull()
  })
})

describe('api client request handling', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('attaches the bearer token to authenticated requests', async () => {
    setToken('my-token')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { api } = await import('../client')
    await api.listEntries()

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer my-token')
  })

  it('throws ApiError with the server-provided detail message on failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Incorrect email or password' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { api, ApiError } = await import('../client')
    await expect(api.login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(
      'Incorrect email or password',
    )
    await expect(api.login({ email: 'a@b.com', password: 'wrong' })).rejects.toBeInstanceOf(ApiError)
  })
})
