import { auth } from '~~/lib/auth'

export default defineEventHandler((event) => {
  if (process.env.BOOKING_DESK_AUTH_URL)
    throw createError({ statusCode: 404, statusMessage: 'Sign in through Village Desk' })
  return auth.handler(toWebRequest(event))
})
