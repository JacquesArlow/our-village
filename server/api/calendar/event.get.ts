import { getPublicEvent } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async (event) => {
  const id = getQuery(event).id as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const row = await getPublicEvent(id)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  return row
})
