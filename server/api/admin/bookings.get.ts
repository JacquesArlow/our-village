import { requireAdmin } from '~~/server/utils/requireAdmin'
import { listBookings } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const eventId = getQuery(event).eventId as string | undefined
  return await listBookings(eventId || undefined)
})
