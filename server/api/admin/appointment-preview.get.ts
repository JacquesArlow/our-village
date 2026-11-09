import { auth } from '~~/lib/auth'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const adminEmail = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase()
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user || !adminEmail || session.user.email.toLowerCase() !== adminEmail) {
    return { url: null }
  }
  return { url: '/booking/admin' }
})
