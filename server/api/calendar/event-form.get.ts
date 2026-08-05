import { getEvent } from '~~/server/utils/calendarRepo'
import { downloadHeaders, readStoredFile } from '~~/server/utils/fileStorage'

export default defineEventHandler(async (event) => {
  const eventId = String(getQuery(event).id || '')
  if (!eventId) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const row = await getEvent(eventId)
  if (!row?.isPublic || !row.formFilePath || !row.formFileName) {
    throw createError({ statusCode: 404, statusMessage: 'Form not found' })
  }
  setHeaders(event, downloadHeaders(row.formFileName, row.formFileMime || 'application/pdf'))
  return await readStoredFile(row.formFilePath)
})
