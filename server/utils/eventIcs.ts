import { eventEndDate, eventLocation, type PublicCalendarEvent } from '~~/shared/eventPresentation'

const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

function fold(line: string) {
  const parts: string[] = []
  let part = '', bytes = 0
  for (const char of line) {
    const length = Buffer.byteLength(char, 'utf8')
    if (bytes + length > 75) { parts.push(part); part = ' '; bytes = 1 }
    part += char; bytes += length
  }
  parts.push(part)
  return parts.join('\r\n')
}

export function buildEventIcs(event: PublicCalendarEvent, siteUrl: string, now = new Date()) {
  const url = siteUrl.replace(/\/$/, '') + '/calendar/event/' + event.id
  const details = event.publicDetails
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Our Village//Public Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    'UID:' + escape(event.id + '@our-village.co.za'), 'DTSTAMP:' + stamp(now)]
  if (details?.startTime) {
    lines.push('DTSTART:' + stamp(new Date(event.startDate + 'T' + details.startTime + ':00+02:00')))
    if (details.endTime) {
      const end = new Date(eventEndDate(event) + 'T' + details.endTime + ':00+02:00')
      const start = new Date(event.startDate + 'T' + details.startTime + ':00+02:00')
      if (end > start) lines.push('DTEND:' + stamp(end))
    }
  } else {
    const next = new Date(eventEndDate(event) + 'T12:00:00Z')
    next.setUTCDate(next.getUTCDate() + 1)
    lines.push('DTSTART;VALUE=DATE:' + event.startDate.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + next.toISOString().slice(0, 10).replace(/-/g, ''))
  }
  lines.push('SUMMARY:' + escape(event.title), 'DESCRIPTION:' + escape([event.detail, event.bookingCostLabel ? 'Cost: ' + event.bookingCostLabel : '', url].filter(Boolean).join('\n')))
  if (eventLocation(details)) lines.push('LOCATION:' + escape(eventLocation(details)))
  lines.push('URL:' + url, 'END:VEVENT', 'END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
