import { verifyTurnstile } from '~~/server/utils/turnstile'
import { sendMail, mailerConfigured } from '~~/server/utils/mailer'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Anti-spam: managed Turnstile, verified server-side (fails closed).
  const ip = getRequestHeader(event, 'cf-connecting-ip')
    || getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
  if (!(await verifyTurnstile(body?.turnstileToken, ip))) {
    throw createError({ statusCode: 400, statusMessage: 'Spam check failed — please try again.' })
  }

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const firstName = str(body?.firstName), lastName = str(body?.lastName)
  const email = str(body?.email), subject = str(body?.subject), message = str(body?.message)
  if (!firstName || !email || !message) {
    throw createError({ statusCode: 400, statusMessage: 'Name, email and message are required.' })
  }
  if (!EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }

  if (!mailerConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Email is not configured. Please use WhatsApp for now.' })
  }

  const to = process.env.CONTACT_TO || 'reception@our-village.co.za'
  const from = process.env.CONTACT_FROM || 'Our Village Website <reception@our-village.co.za>'
  const name = `${firstName} ${lastName}`.trim()
  const text =
    `New enquiry from the Our Village website\n\n` +
    `Name:    ${name}\n` +
    `Email:   ${email}\n` +
    `Subject: ${subject || '(none)'}\n\n` +
    `Message:\n${message}\n`
  const html =
    `<h2 style="font-family:sans-serif">New website enquiry</h2>` +
    `<p style="font-family:sans-serif"><strong>Name:</strong> ${name}<br>` +
    `<strong>Email:</strong> <a href="mailto:${email}">${email}</a><br>` +
    `<strong>Subject:</strong> ${subject || '(none)'}</p>` +
    `<p style="font-family:sans-serif;white-space:pre-wrap">${message.replace(/</g, '&lt;')}</p>`

  try {
    await sendMail({ to, from, replyTo: `${name} <${email}>`, subject: `Website enquiry: ${subject || name}`, text, html })
  } catch (e) {
    console.error('[contact] send failed', e)
    throw createError({ statusCode: 502, statusMessage: 'Could not send your message right now. Please try WhatsApp.' })
  }
  return { ok: true }
})
