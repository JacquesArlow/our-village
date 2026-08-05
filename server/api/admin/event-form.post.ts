import { requireAdmin } from '~~/server/utils/requireAdmin'
import { getEvent, setEventFormFile } from '~~/server/utils/calendarRepo'
import { storePdf } from '~~/server/utils/fileStorage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const form = await readMultipartFormData(event)
  const eventId = form?.find(p => p.name === 'eventId')?.data.toString().trim()
  const filePart = form?.find(p => p.name === 'file')
  if (!eventId) throw createError({ statusCode: 400, statusMessage: 'eventId required' })
  if (!filePart?.data?.length) throw createError({ statusCode: 400, statusMessage: 'PDF file required' })

  const row = await getEvent(eventId)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Event not found' })

  const file = new File([filePart.data], filePart.filename || 'event-form.pdf', {
    type: filePart.type || 'application/pdf'
  })
  const stored = await storePdf(file, `event-forms/${eventId}`)
  await setEventFormFile(eventId, stored)
  return { ok: true, ...stored }
})
