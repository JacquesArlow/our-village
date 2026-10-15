import type { EventDetails, EventRow } from './calendar'

export type PublicCalendarEvent = Pick<EventRow, 'id' | 'title' | 'startDate' | 'endDate' | 'detail' | 'bookingCostLabel' | 'publicDetails'> & { color?: string }

export function southAfricaToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now)
}

export function eventEndDate(event: Pick<EventRow, 'startDate' | 'endDate'>) {
  return event.endDate && event.endDate >= event.startDate ? event.endDate : event.startDate
}

export function isPastEvent(event: Pick<EventRow, 'startDate' | 'endDate'>, today: string) {
  return eventEndDate(event) < today
}

export function sortCalendarEvents<T extends PublicCalendarEvent>(events: T[], scope: 'upcoming' | 'past', today: string): T[] {
  return events.filter(event => isPastEvent(event, today) === (scope === 'past')).sort((a, b) => {
    if (scope === 'past') return eventEndDate(b).localeCompare(eventEndDate(a)) || b.startDate.localeCompare(a.startDate)
    return a.startDate.localeCompare(b.startDate)
      || (a.publicDetails?.startTime || '').localeCompare(b.publicDetails?.startTime || '')
      || a.title.localeCompare(b.title)
  })
}

export function eventDateLabel(event: Pick<EventRow, 'startDate' | 'endDate'>) {
  const format = (date: string) => new Date(date + 'T12:00:00+02:00').toLocaleDateString('en-ZA', {
    timeZone: 'Africa/Johannesburg', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  })
  return format(event.startDate) + (eventEndDate(event) !== event.startDate ? ' – ' + format(eventEndDate(event)) : '')
}

export function eventTimeLabel(details?: EventDetails | null) {
  return details?.startTime ? details.startTime + (details.endTime ? '–' + details.endTime : '') : ''
}

export function eventLocation(details?: EventDetails | null) {
  return [details?.venue, details?.address].filter(Boolean).join(', ')
}

export function eventDirections(details?: EventDetails | null) {
  const location = eventLocation(details)
  return location ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location) : null
}

export function eventShareLink(event: PublicCalendarEvent, siteUrl: string) {
  const text = [event.title, eventDateLabel(event), eventTimeLabel(event.publicDetails), siteUrl.replace(/\/$/, '') + '/calendar/event/' + event.id].filter(Boolean).join('\n')
  return 'https://wa.me/?text=' + encodeURIComponent(text)
}

/** Validate optional public fields without interpreting legacy free-text descriptions. */
export function normalizeEventDetails(input: unknown): EventDetails | null {
  if (input == null) return null
  if (typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid event details')
  const source = input as Record<string, unknown>
  const out: EventDetails = {}
  for (const field of ['startTime', 'endTime', 'venue', 'address', 'presenter', 'posterUrl'] as const) {
    const value = typeof source[field] === 'string' ? source[field].trim() : ''
    if (!value) continue
    if (value.length > (field === 'posterUrl' ? 1000 : 250)) throw new Error('Event detail is too long')
    if ((field === 'startTime' || field === 'endTime') && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Use a valid time in HH:mm format')
    if (field === 'posterUrl') {
      const local = /^\/(?!\/)[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp)$/i.test(value) && !value.includes('..')
      let https = false
      try { const url = new URL(value); https = url.protocol === 'https:' && !url.username && !url.password } catch { /* local image */ }
      if (!local && !https) throw new Error('Use a local image path or an HTTPS poster link')
    }
    out[field] = value
  }
  if (out.endTime && !out.startTime) throw new Error('Add a start time before an end time')
  return Object.keys(out).length ? out : null
}
