import { listEvents } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async () => {
  return await listEvents({ publicOnly: true })
})
