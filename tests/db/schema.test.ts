import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { event } from '~~/server/db/schema.app'

describe('app schema', () => {
  let db: ReturnType<typeof drizzle>
  beforeAll(async () => {
    const client = createClient({ url: 'file::memory:' })
    db = drizzle(client)
    await migrate(db, { migrationsFolder: './server/db/migrations' })
  })

  it('inserts and reads an event with boolean coercion', async () => {
    const now = 1_700_000_000_000
    await db.insert(event).values({
      id: 'e1', startDate: '2026-06-25', title: 'World Vitiligo Day',
      color: 'sage', isHighlight: true, isPublic: true, createdAt: now, updatedAt: now
    })
    const rows = await db.select().from(event)
    expect(rows).toHaveLength(1)
    expect(rows[0].isPublic).toBe(true)
    expect(rows[0].title).toBe('World Vitiligo Day')
  })
})
