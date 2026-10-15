import { describe, it, expect } from 'vitest'
import { southAfricaToday, sortCalendarEvents, normalizeEventDetails, type PublicCalendarEvent } from '~~/shared/eventPresentation'
import { buildEventIcs } from '~~/server/utils/eventIcs'

const event = (id: string, startDate: string, extra: Partial<PublicCalendarEvent> = {}): PublicCalendarEvent => ({
  id, startDate, endDate: null, title: id, detail: null, color: 'sage', bookingCostLabel: null, ...extra
})

describe('public calendar dates', () => {
  it('uses the South African date across UTC midnight', () => {
    expect(southAfricaToday(new Date('2026-10-15T22:30:00Z'))).toBe('2026-10-16')
  })
  it('keeps ongoing and same-day events and sorts the next events first without mutating data', () => {
    const rows = [event('later', '2026-11-01'), event('past', '2026-10-14'), event('afternoon', '2026-10-15', { publicDetails: { startTime: '14:00' } }), event('ongoing', '2026-10-13', { endDate: '2026-10-16' }), event('morning', '2026-10-15', { publicDetails: { startTime: '08:30' } })]
    expect(sortCalendarEvents(rows, 'upcoming', '2026-10-15').map(e => e.id)).toEqual(['ongoing', 'morning', 'afternoon', 'later'])
    expect(rows[0].id).toBe('later')
    expect(sortCalendarEvents(rows, 'past', '2026-10-15').map(e => e.id)).toEqual(['past'])
  })
  it('shows the most recent past event first and tolerates legacy reversed ranges', () => {
    const rows = [event('old', '2026-09-01'), event('recent', '2026-10-14'), event('legacy', '2026-08-01', { endDate: '2026-07-07' })]
    expect(sortCalendarEvents(rows, 'past', '2026-10-15').map(e => e.id)).toEqual(['recent', 'old', 'legacy'])
  })
})

describe('event metadata', () => {
  it('accepts optional local poster paths and rejects executable or traversal URLs and invalid times', () => {
    expect(normalizeEventDetails({ venue: ' Our Village ', posterUrl: '/events/poster.webp' })).toEqual({ venue: 'Our Village', posterUrl: '/events/poster.webp' })
    expect(normalizeEventDetails({})).toBeNull()
    expect(() => normalizeEventDetails({ posterUrl: 'javascript:alert(1)' })).toThrow()
    expect(() => normalizeEventDetails({ posterUrl: '//untrusted.test/image.jpg' })).toThrow()
    expect(() => normalizeEventDetails({ posterUrl: '/events/../private.jpg' })).toThrow()
    expect(() => normalizeEventDetails({ startTime: '25:30' })).toThrow()
  })
})

describe('calendar downloads', () => {
  it('exports the actual South African session time in UTC', () => {
    const text = buildEventIcs(event('cpr', '2026-10-31', { publicDetails: { startTime: '08:30', endTime: '12:00', venue: 'Our Village', address: '525 Alsation Drive' } }), 'https://www.our-village.co.za')
    expect(text).toContain('DTSTART:20261031T063000Z\r\n')
    expect(text).toContain('DTEND:20261031T100000Z\r\n')
    expect(text).toContain('LOCATION:Our Village\\, 525 Alsation Drive')
  })
  it('exports date-only legacy events with an exclusive end date', () => {
    const text = buildEventIcs(event('week', '2026-10-30', { endDate: '2026-11-02' }), 'https://www.our-village.co.za')
    expect(text).toContain('DTSTART;VALUE=DATE:20261030')
    expect(text).toContain('DTEND;VALUE=DATE:20261103')
  })
  it('escapes text, folds by bytes, and prevents description lines from injecting events', () => {
    const title = 'Café, bébés; ' + 'é'.repeat(100)
    const text = buildEventIcs(event('safe', '2026-10-31', { title, detail: 'First\nBEGIN:VEVENT\nFake' }), 'https://www.our-village.co.za')
    const unfolded = text.replace(/\r\n /g, '')
    expect(unfolded).toContain('SUMMARY:Café\\, bébés\\; ')
    expect(unfolded).toContain('First\\nBEGIN:VEVENT\\nFake')
    expect(text.split('\r\n').filter(line => line === 'BEGIN:VEVENT')).toHaveLength(1)
    expect(text.split('\r\n').every(line => Buffer.byteLength(line) <= 75)).toBe(true)
  })
})
