import { getMonth } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const year = Number(q.year)
  const month = Number(q.month)
  if (!year || !month) throw createError({ statusCode: 400, statusMessage: 'year and month required' })
  return await getMonth(year, month, { publicOnly: true })
})
