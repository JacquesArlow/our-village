import { getMonth } from '~~/server/utils/calendarRepo'
import { requireAdmin } from '~~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const q = getQuery(event)
  return await getMonth(Number(q.year), Number(q.month))
})
