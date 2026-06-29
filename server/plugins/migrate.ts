import { runMigrations } from '~~/server/db/migrate'
import { auth } from '~~/lib/auth'

export default defineNitroPlugin(async () => {
  await runMigrations()

  const email = process.env.ADMIN_SEED_EMAIL
  const password = process.env.ADMIN_SEED_PASSWORD
  if (!email || !password) return

  // Seed the first admin only if no users exist yet.
  const { db } = await import('~~/server/db/client')
  const { user } = await import('~~/server/db/schema')
  const existing = await db.select().from(user).limit(1)
  if (existing.length > 0) return

  try {
    await auth.api.signUpEmail({ body: { email, password, name: 'Our Village Admin' } })
    console.log(`[seed] created initial admin ${email}`)
  } catch (e) {
    console.error('[seed] admin creation failed', e)
  }
})
