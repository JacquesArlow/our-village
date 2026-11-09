import { createError, getHeader, setResponseHeader, type H3Event } from 'h3'
import { auth } from '~~/lib/auth'

export async function requireAdmin(event: H3Event): Promise<{ userId: string }> {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const desk = process.env.BOOKING_DESK_AUTH_URL
  if (desk) {
    const cookie = getHeader(event, 'cookie')
    if (!cookie) throw createError({ statusCode: 401, statusMessage: 'Sign in through Village Desk' })
    if (!['GET', 'HEAD'].includes(event.method) &&
        getHeader(event, 'origin') !== new URL(process.env.BETTER_AUTH_URL!).origin)
      throw createError({ statusCode: 403, statusMessage: 'Request origin is not permitted' })
    const response = await fetch(desk, { headers: { cookie }, redirect: 'error', signal: AbortSignal.timeout(3000) })
      .catch(() => null)
    if (response?.status === 401)
      throw createError({ statusCode: 401, statusMessage: 'Sign in through Village Desk' })
    if (!response?.ok)
      throw createError({ statusCode: 503, statusMessage: 'Village Desk sign-in is temporarily unavailable' })
    const { user } = await response.json()
    if (user?.role !== 'admin' || user.mustChangePassword || typeof user.id !== 'string')
      throw createError({ statusCode: 403, statusMessage: 'Administrator access is required' })
    return { userId: user.id }
  }
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return { userId: session.user.id }
}
