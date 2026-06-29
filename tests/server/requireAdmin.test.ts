import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('~~/lib/auth', () => ({ auth: { api: { getSession } } }))
// h3 auto-imports: provide createError global
;(globalThis as any).createError = (o: any) => Object.assign(new Error(o.statusMessage), o)

import { requireAdmin } from '~~/server/utils/requireAdmin'

describe('requireAdmin', () => {
  beforeEach(() => getSession.mockReset())

  it('throws 401 when no session', async () => {
    getSession.mockResolvedValue(null)
    await expect(requireAdmin({ headers: new Headers() } as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns userId when session valid', async () => {
    getSession.mockResolvedValue({ user: { id: 'u1' } })
    await expect(requireAdmin({ headers: new Headers() } as any)).resolves.toEqual({ userId: 'u1' })
  })
})
