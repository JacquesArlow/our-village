import { describe, it, expect, vi } from 'vitest'

const { requireAdmin, createCalendarEvent } = vi.hoisted(() => {
  // These globalThis stubs must be set before the handler module is imported,
  // because ESM imports are hoisted above module body statements.
  // vi.hoisted() runs before any imports, so this is the correct place.
  ;(globalThis as any).defineEventHandler = (fn: any) => fn
  ;(globalThis as any).readBody = async () => ({ startDate: '2026-06-01', title: 'X' })
  ;(globalThis as any).createError = (o: any) => Object.assign(new Error(o.statusMessage), o)

  return {
    requireAdmin: vi.fn(),
    createCalendarEvent: vi.fn().mockResolvedValue({ id: 'x' }),
  }
})

vi.mock('~~/server/utils/requireAdmin', () => ({ requireAdmin }))
vi.mock('~~/server/utils/calendarRepo', () => ({ createCalendarEvent }))

import handler from '~~/server/api/admin/event.post'

describe('admin event.post', () => {
  it('calls requireAdmin before createCalendarEvent', async () => {
    const order: string[] = []
    requireAdmin.mockImplementation(async () => { order.push('guard') })
    createCalendarEvent.mockImplementation(async () => { order.push('create'); return { id: 'x' } })
    await handler({} as any)
    expect(order).toEqual(['guard', 'create'])
  })
})
