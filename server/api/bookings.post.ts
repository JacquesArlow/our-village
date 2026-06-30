import { createBooking } from '~~/server/utils/calendarRepo'
import { verifyTurnstile } from '~~/server/utils/turnstile'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Turnstile (managed) — verify the token before doing anything else.
  const ip = getRequestHeader(event, 'cf-connecting-ip')
    || getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
  const human = await verifyTurnstile(body?.turnstileToken, ip)
  if (!human) {
    throw createError({ statusCode: 400, statusMessage: 'Spam check failed — please try again.' })
  }

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const name = str(body?.name), surname = str(body?.surname), email = str(body?.email), phone = str(body?.phone)
  if (!name || !surname || !email || !phone) {
    throw createError({ statusCode: 400, statusMessage: 'Name, surname, email and phone are required.' })
  }
  if (!EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }

  await createBooking({
    eventId: str(body?.eventId) || null,
    eventTitle: str(body?.eventTitle) || null,
    name, surname, email, phone,
    message: str(body?.message) || null
  })
  return { ok: true }
})
