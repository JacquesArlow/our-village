// Temporary CLI-only config using relative paths (no ~~ alias)
// Used only by: npx @better-auth/cli generate
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '../server/db/client'
import * as schema from '../server/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000'
})
