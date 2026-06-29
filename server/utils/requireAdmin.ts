import type { H3Event } from 'h3'
import { auth } from '~~/lib/auth'

export async function requireAdmin(event: H3Event): Promise<{ userId: string }> {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return { userId: session.user.id }
}
