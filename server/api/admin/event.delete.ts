import { requireAdmin } from '~~/server/utils/requireAdmin'
import { deleteCalendarEvent } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = await readBody(event)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  await deleteCalendarEvent(id)
  return { ok: true }
})
