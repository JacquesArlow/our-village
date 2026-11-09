import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('~~/lib/auth', () => ({ auth: { api: { getSession } } }))
vi.mock('h3', async (importOriginal) => ({
  ...await importOriginal<typeof import('h3')>(),
  setResponseHeader: vi.fn(),
  getHeader: (event: { headers: Headers }, name: string) => event.headers.get(name),
}))

import { requireAdmin } from '~~/server/utils/requireAdmin'

describe('requireAdmin', () => {
  beforeEach(() => getSession.mockReset())
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('throws 401 when no session', async () => {
    getSession.mockResolvedValue(null)
    await expect(requireAdmin({ headers: new Headers() } as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns userId when session valid', async () => {
    getSession.mockResolvedValue({ user: { id: 'u1' } })
    await expect(requireAdmin({ headers: new Headers() } as any)).resolves.toEqual({ userId: 'u1' })
  })

  it('authorizes the shared Desk admin session and forwards only the session cookie', async () => {
    vi.stubEnv('BOOKING_DESK_AUTH_URL', 'http://desk/village-desk/api/me')
    const upstream = vi.fn().mockResolvedValue(Response.json({ user: { id: 'desk-admin', role: 'admin' } }))
    vi.stubGlobal('fetch', upstream)
    const headers = new Headers({ cookie: 'session=fixture', 'x-role': 'admin' })
    await expect(requireAdmin({ method: 'GET', headers } as any)).resolves.toEqual({ userId: 'desk-admin' })
    expect(upstream).toHaveBeenCalledWith('http://desk/village-desk/api/me', expect.objectContaining({
      headers: { cookie: 'session=fixture' },
    }))
    expect(getSession).not.toHaveBeenCalled()
  })

  it.each(['doctor', 'receptionist', 'patient'])('denies calendar administration to a %s session', async (role) => {
    vi.stubEnv('BOOKING_DESK_AUTH_URL', 'http://desk/village-desk/api/me')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ user: { id: 'staff', role } })))
    await expect(requireAdmin({ method: 'GET', headers: new Headers({ cookie: 'session=fixture' }) } as any))
      .rejects.toMatchObject({ statusCode: 403 })
  })
})
