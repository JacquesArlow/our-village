import { requireAdmin } from '~~/server/utils/requireAdmin'
import { updateCalendarEvent } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const { id, ...patch } = body
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  await updateCalendarEvent(id, patch)
  return { ok: true }
})
