import { requireAdmin } from '~~/server/utils/requireAdmin'
import { getFormSubmission } from '~~/server/utils/calendarRepo'
import { downloadHeaders, readStoredFile } from '~~/server/utils/fileStorage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = String(getQuery(event).id || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const row = await getFormSubmission(id)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Submission not found' })
  setHeaders(event, downloadHeaders(row.fileName, row.fileMime))
  return await readStoredFile(row.filePath)
})
