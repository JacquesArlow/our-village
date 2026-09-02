import { createBooking, createFormSubmission, getEvent } from '~~/server/utils/calendarRepo'
import { storePdf } from '~~/server/utils/fileStorage'
import { verifyTurnstile } from '~~/server/utils/turnstile'
import { sendMail, mailerConfigured } from '~~/server/utils/mailer'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default defineEventHandler(async (event) => {
  const contentType = getRequestHeader(event, 'content-type') || ''
  const isMultipart = contentType.includes('multipart/form-data')
  let filePart: Awaited<ReturnType<typeof readMultipartFormData>>[number] | undefined
  let body: Record<string, unknown>

  if (isMultipart) {
    const parts = await readMultipartFormData(event)
    const getText = (name: string) => parts?.find(p => p.name === name)?.data.toString().trim() || ''
    const getAllText = (name: string) => parts
      ?.filter(p => p.name === name)
      .map(p => p.data.toString().trim())
      .filter(Boolean) || []
    body = {
      name: getText('name'),
      surname: getText('surname'),
      email: getText('email'),
      phone: getText('phone'),
      guests: getText('guests'),
      babyName: getText('babyName'),
      babySurname: getText('babySurname'),
      babyDateOfBirth: getText('babyDateOfBirth'),
      message: getText('message'),
      eventId: getText('eventId'),
      eventTitle: getText('eventTitle'),
      dropdownAnswer: getAllText('dropdownAnswer'),
      turnstileToken: getText('turnstileToken')
    }
    filePart = parts?.find(p => p.name === 'completedForm' || p.name === 'file')
  } else {
    body = await readBody(event)
  }

  // Turnstile (managed) — verify the token before doing anything else.
  const ip = getRequestHeader(event, 'cf-connecting-ip')
    || getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
  if (!(await verifyTurnstile(body?.turnstileToken, ip))) {
    throw createError({ statusCode: 400, statusMessage: 'Spam check failed — please try again.' })
  }

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const name = str(body?.name), surname = str(body?.surname)
  const email = str(body?.email), phone = str(body?.phone)
  const guestsRaw = Number.parseInt(String(body?.guests ?? ''), 10)
  const guests = Number.isFinite(guestsRaw) && guestsRaw > 0 ? guestsRaw : null
  const babyName = str(body?.babyName)
  const babySurname = str(body?.babySurname)
  const babyDateOfBirth = str(body?.babyDateOfBirth)
  const eventId = str(body?.eventId) || null
  const eventTitle = str(body?.eventTitle) || null
  const bookingEvent = eventId ? await getEvent(eventId) : null
  const requiresCompletedForm = !!bookingEvent?.formFilePath
  const isGrowthScreening = bookingEvent?.bookingFormVariant
    ? bookingEvent.bookingFormVariant === 'growth_screening'
    : /growth\s*ot|developmental\s+screenings?/i.test(eventTitle || '')
  const costLabel = bookingEvent?.bookingCostLabel?.trim() || 'R375'

  // Need a name and at least one way to reach them (number OR email).
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Please enter your name.' })
  if (!email && !phone) throw createError({ statusCode: 400, statusMessage: 'Please enter a phone number or email.' })
  if (email && !EMAIL_RE.test(email)) throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  if (babyDateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(babyDateOfBirth)) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid baby date of birth.' })
  }
  if (requiresCompletedForm && !filePart?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Please upload the completed event PDF before sending your details.' })
  }

  let submittedFormFileName: string | null = null
  if (requiresCompletedForm && filePart?.data?.length && eventId) {
    const file = new File([filePart.data], filePart.filename || 'completed-form.pdf', {
      type: filePart.type || 'application/pdf'
    })
    const stored = await storePdf(file, `completed-forms/${eventId}`)
    await createFormSubmission({
      eventId,
      eventTitle: bookingEvent?.title || eventTitle,
      name: `${name} ${surname}`.trim(),
      email: email || null,
      phone: phone || null,
      ...stored
    })
    submittedFormFileName = stored.fileName
  }

  const booking = await createBooking({
    eventId,
    eventTitle: bookingEvent?.title || eventTitle,
    name, surname, email, phone,
    guests: isGrowthScreening ? null : guests,
    babyName: isGrowthScreening ? babyName : null,
    babySurname: isGrowthScreening ? babySurname : null,
    babyDateOfBirth: isGrowthScreening ? babyDateOfBirth : null,
    message: str(body?.message) || null,
    dropdownAnswer: body?.dropdownAnswer as string | string[] | null | undefined
  })

  // Notify marketing (best-effort — the booking is already saved & visible in admin).
  if (mailerConfigured()) {
    const to = process.env.BOOKING_TO || 'marketing@our-village.co.za'
    const from = process.env.CONTACT_FROM || 'Our Village Website <reception@our-village.co.za>'
    const full = `${name} ${surname}`.trim()
    const eventLines = isGrowthScreening
      ? [
          `Baby:   ${[babyName, babySurname].filter(Boolean).join(' ') || '(not given)'}`,
          `DOB:    ${babyDateOfBirth || '(not given)'}`,
          `Cost:   ${costLabel}`
        ]
      : [`Guests: ${guests ?? '(not given)'}`]
    const formLines = submittedFormFileName
      ? [`Completed form: ${submittedFormFileName}`]
      : []
    const dropdown = booking.formResponse?.dropdown
    const dropdownAnswer = Array.isArray(dropdown?.value) ? dropdown.value.join(', ') : dropdown?.value
    const lines = [
      `New booking${eventTitle ? ` for: ${eventTitle}` : ''}`,
      '',
      `Name:   ${full}`,
      `Email:  ${email || '(not given)'}`,
      `Phone:  ${phone || '(not given)'}`,
      ...eventLines,
      dropdown && dropdownAnswer ? `${dropdown.label}: ${dropdownAnswer}` : '',
      ...formLines,
      body?.message ? `\nMessage:\n${str(body?.message)}` : ''
    ].filter(Boolean)
    try {
      await sendMail({
        to, from,
        replyTo: email ? `${full} <${email}>` : undefined,
        subject: `New booking${eventTitle ? `: ${eventTitle}` : ''} — ${full}`,
        text: lines.join('\n')
      })
    } catch (e) {
      console.error('[bookings] notification email failed (booking still saved)', e)
    }
  }

  return { ok: true }
})
