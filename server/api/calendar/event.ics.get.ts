import { getPublicEvent } from '~~/server/utils/calendarRepo'
import { buildEventIcs } from '~~/server/utils/eventIcs'

export default defineEventHandler(async (request) => {
  const id = getQuery(request).id
  if (typeof id !== 'string' || !id) throw createError({ statusCode: 400, statusMessage: 'Event id required' })
  const event = await getPublicEvent(id)
  if (!event) throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  setHeaders(request, {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'attachment; filename="our-village-event.ics"',
    'Cache-Control': 'no-store'
  })
  return buildEventIcs(event, useRuntimeConfig().public.siteUrl as string)
})
