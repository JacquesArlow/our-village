import { requireAdmin } from '~~/server/utils/requireAdmin'
import { updateEvent } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const { id, ...patch } = body
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  await updateEvent(id, patch)
  return { ok: true }
})
