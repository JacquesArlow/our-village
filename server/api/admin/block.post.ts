import { requireAdmin } from '~~/server/utils/requireAdmin'
import { createBlock } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  return await createBlock(body)
})
