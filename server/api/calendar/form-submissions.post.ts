import { createFormSubmission, getEvent } from '~~/server/utils/calendarRepo'
import { storePdf } from '~~/server/utils/fileStorage'
import { verifyTurnstile } from '~~/server/utils/turnstile'
import { mailerConfigured, sendMail } from '~~/server/utils/mailer'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  const getText = (name: string) => parts?.find(p => p.name === name)?.data.toString().trim() || ''
  const eventId = getText('eventId')
  const name = getText('name')
  const email = getText('email')
  const phone = getText('phone')
  const turnstileToken = getText('turnstileToken')
  const filePart = parts?.find(p => p.name === 'file')

  const ip = getRequestHeader(event, 'cf-connecting-ip')
    || getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    throw createError({ statusCode: 400, statusMessage: 'Spam check failed - please try again.' })
  }

  if (!eventId) throw createError({ statusCode: 400, statusMessage: 'Event required.' })
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Please enter your name.' })
  if (!email && !phone) throw createError({ statusCode: 400, statusMessage: 'Please enter a phone number or email.' })
  if (email && !EMAIL_RE.test(email)) throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  if (!filePart?.data?.length) throw createError({ statusCode: 400, statusMessage: 'Please choose a completed PDF.' })

  const row = await getEvent(eventId)
  if (!row?.isPublic || !row.formFilePath) throw createError({ statusCode: 404, statusMessage: 'Event form not found.' })

  const file = new File([filePart.data], filePart.filename || 'completed-form.pdf', {
    type: filePart.type || 'application/pdf'
  })
  const stored = await storePdf(file, `completed-forms/${eventId}`)
  const submission = await createFormSubmission({
    eventId,
    eventTitle: row.title,
    name,
    email: email || null,
    phone: phone || null,
    ...stored
  })

  if (mailerConfigured()) {
    const to = process.env.BOOKING_TO || 'marketing@our-village.co.za'
    const from = process.env.CONTACT_FROM || 'Our Village Website <reception@our-village.co.za>'
    try {
      await sendMail({
        to, from,
        replyTo: email ? `${name} <${email}>` : undefined,
        subject: `Completed form uploaded: ${row.title} - ${name}`,
        text: [
          `Completed form uploaded for: ${row.title}`,
          '',
          `Name:  ${name}`,
          `Email: ${email || '(not given)'}`,
          `Phone: ${phone || '(not given)'}`,
          `File:  ${stored.fileName}`,
          '',
          'Log in to Village Desk to download the submitted PDF.'
        ].join('\n')
      })
    } catch (e) {
      console.error('[form-submissions] notification email failed (submission still saved)', e)
    }
  }

  return { ok: true, id: submission.id }
})
