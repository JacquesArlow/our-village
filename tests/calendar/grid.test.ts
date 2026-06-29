import { describe, it, expect } from 'vitest'
import { buildWeeks, eventsForDay } from '~~/composables/useCalendar'

describe('buildWeeks', () => {
  it('June 2026 starts on Monday and has 30 days', () => {
    const weeks = buildWeeks(2026, 6)
    expect(weeks[0][0].date).toBeNull() // Sunday blank (June 1 2026 is Monday)
    expect(weeks[0][1].date).toBe('2026-06-01')
    const days = weeks.flat().filter(c => c.date).length
    expect(days).toBe(30)
  })
})

describe('eventsForDay', () => {
  it('matches ranges inclusively', () => {
    const ev = [{ startDate:'2026-06-02', endDate:'2026-06-06', title:'Week' } as any]
    expect(eventsForDay(ev, '2026-06-04')).toHaveLength(1)
    expect(eventsForDay(ev, '2026-06-07')).toHaveLength(0)
  })
})
