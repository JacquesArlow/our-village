import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

// In vitest 4, vi.mock factories are hoisted above imports.
// Use vi.hoisted() to create variables that the factory can close over.
const dbRef = vi.hoisted(() => ({ current: null as any }))

vi.mock('~~/server/db/client', () => ({
  get db() { return dbRef.current },
  schema: {}
}))

import * as schema from '~~/server/db/schema'
import { booking } from '~~/server/db/schema'
import { getMonth, listEvents, createCalendarEvent, createBlock, createBooking } from '~~/server/utils/calendarRepo'

beforeEach(async () => {
  const client = createClient({ url: 'file::memory:' })
  const freshDb = drizzle(client, { schema })
  await migrate(freshDb, { migrationsFolder: './server/db/migrations' })
  dbRef.current = freshDb
})

describe('calendarRepo', () => {
  it('getMonth returns only public events when publicOnly', async () => {
    await createCalendarEvent({ startDate: '2026-06-05', title: 'Public day', isPublic: true })
    await createCalendarEvent({ startDate: '2026-06-06', title: 'Private day', isPublic: false })
    await createBlock({ year: 2026, month: 6, section: 'important_dates', text: 'Public block', isPublic: true })
    await createBlock({ year: 2026, month: 6, section: 'important_dates', text: 'Private block', isPublic: false })

    const pub = await getMonth(2026, 6, { publicOnly: true })
    expect(pub.events.map(e => e.title)).toEqual(['Public day'])
    expect(pub.blocks.map(b => b.text)).toEqual(['Public block'])

    const all = await getMonth(2026, 6)
    expect(all.events).toHaveLength(2)
    expect(all.blocks).toHaveLength(2)
  })

  it('getMonth includes events whose range overlaps the month', async () => {
    await createCalendarEvent({ startDate: '2026-05-30', endDate: '2026-06-02', title: 'Spanning week', isPublic: true })
    const june = await getMonth(2026, 6, { publicOnly: true })
    expect(june.events.map(e => e.title)).toContain('Spanning week')
  })

  it('listEvents orders newest first', async () => {
    await createCalendarEvent({ startDate: '2026-01-01', title: 'Old', isPublic: true })
    await createCalendarEvent({ startDate: '2026-06-01', title: 'New', isPublic: true })
    const list = await listEvents({ publicOnly: true })
    expect(list.map(e => e.title)).toEqual(['New', 'Old'])
  })

  it('public projection strips staff and timestamps; admin path retains them', async () => {
    await createCalendarEvent({ startDate: '2026-06-10', title: 'Staffed event', isPublic: true, staff: 'Megan' })

    // publicOnly: true — staff must be absent
    const pub = await getMonth(2026, 6, { publicOnly: true })
    expect(pub.events).toHaveLength(1)
    expect('staff' in pub.events[0]).toBe(false)
    expect('createdAt' in pub.events[0]).toBe(false)
    expect('updatedAt' in pub.events[0]).toBe(false)

    // admin (no publicOnly) — staff must be present with correct value
    const admin = await getMonth(2026, 6)
    expect(admin.events).toHaveLength(1)
    expect('staff' in admin.events[0]).toBe(true)
    expect(admin.events[0].staff).toBe('Megan')

    // listEvents publicOnly — staff must be absent
    const pubList = await listEvents({ publicOnly: true })
    expect(pubList).toHaveLength(1)
    expect('staff' in pubList[0]).toBe(false)

    // listEvents admin — staff must be present
    const adminList = await listEvents()
    expect(adminList).toHaveLength(1)
    expect('staff' in adminList[0]).toBe(true)
    expect(adminList[0].staff).toBe('Megan')
  })

  it('publishes event dropdown config and stores valid booking answers', async () => {
    const event = await createCalendarEvent({
      startDate: '2026-06-12',
      title: 'Antenatal morning',
      isPublic: true,
      formDropdown: {
        enabled: true,
        label: 'Which sessions are you interested in?',
        selectionMode: 'multiple',
        options: ['Birth prep', 'Feeding', 'Baby CPR']
      }
    })

    const pub = await listEvents({ publicOnly: true })
    expect(pub[0].formDropdown).toEqual({
      enabled: true,
      label: 'Which sessions are you interested in?',
      selectionMode: 'multiple',
      options: ['Birth prep', 'Feeding', 'Baby CPR']
    })

    await createBooking({
      eventId: event.id,
      eventTitle: event.title,
      name: 'A',
      surname: 'Parent',
      email: 'a@example.com',
      phone: '',
      dropdownAnswer: ['Birth prep', 'Tampered option', 'Feeding']
    })

    const rows = await dbRef.current.select().from(booking)
    expect(rows[0].formResponse).toEqual({
      dropdown: {
        label: 'Which sessions are you interested in?',
        selectionMode: 'multiple',
        value: ['Birth prep', 'Feeding']
      }
    })
  })
})
