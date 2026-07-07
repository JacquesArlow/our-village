import { betterAuth } from 'better-auth'
import { captcha } from 'better-auth/plugins'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '~~/server/db/client'
import * as schema from '~~/server/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true },
  plugins: [
    // Cloudflare Turnstile on the admin login. Only /sign-in/email is gated so the
    // server-side admin seed (sign-up) is unaffected. Client sends the token as the
    // `x-captcha-response` header; verified server-side (fails closed).
    captcha({
      provider: 'cloudflare-turnstile',
      secretKey: process.env.TURNSTILE_SECRET_KEY as string,
      endpoints: ['/sign-in/email']
    })
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL
})
