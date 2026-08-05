import { createBooking, getEvent } from '~~/server/utils/calendarRepo'
import { verifyTurnstile } from '~~/server/utils/turnstile'
import { sendMail, mailerConfigured } from '~~/server/utils/mailer'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

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

  await createBooking({
    eventId,
    eventTitle: bookingEvent?.title || eventTitle,
    name, surname, email, phone,
    guests: isGrowthScreening ? null : guests,
    babyName: isGrowthScreening ? babyName : null,
    babySurname: isGrowthScreening ? babySurname : null,
    babyDateOfBirth: isGrowthScreening ? babyDateOfBirth : null,
    message: str(body?.message) || null
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
    const lines = [
      `New booking${eventTitle ? ` for: ${eventTitle}` : ''}`,
      '',
      `Name:   ${full}`,
      `Email:  ${email || '(not given)'}`,
      `Phone:  ${phone || '(not given)'}`,
      ...eventLines,
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
