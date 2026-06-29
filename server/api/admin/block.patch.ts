import { requireAdmin } from '~~/server/utils/requireAdmin'
import { updateBlock } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id, ...patch } = await readBody(event)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  await updateBlock(id, patch)
  return { ok: true }
})
