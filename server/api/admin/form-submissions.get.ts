import { requireAdmin } from '~~/server/utils/requireAdmin'
import { listFormSubmissions } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const eventId = getQuery(event).eventId as string | undefined
  return await listFormSubmissions(eventId || undefined)
})
