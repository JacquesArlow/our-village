import nodemailer from 'nodemailer'

let cached: nodemailer.Transporter | null = null

function transport(): nodemailer.Transporter | null {
  if (cached) return cached
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  const port = Number(process.env.SMTP_PORT || 587)
  cached = nodemailer.createTransport({
    host, port,
    secure: port === 465, // 587 uses STARTTLS
    auth: { user, pass }
  })
  return cached
}

export const mailerConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

export async function sendMail(opts: {
  to: string; from: string; replyTo?: string; subject: string; text: string; html?: string
}): Promise<void> {
  const t = transport()
  if (!t) throw new Error('SMTP is not configured')
  await t.sendMail(opts)
}
