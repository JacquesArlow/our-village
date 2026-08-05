import { requireAdmin } from '~~/server/utils/requireAdmin'
import { clearEventFormFile } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const eventId = typeof body?.eventId === 'string' ? body.eventId.trim() : ''
  if (!eventId) throw createError({ statusCode: 400, statusMessage: 'eventId required' })
  await clearEventFormFile(eventId)
  return { ok: true }
})
