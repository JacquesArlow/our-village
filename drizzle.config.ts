import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'turso', // libSQL; works with file: URLs
  dbCredentials: { url: process.env.DATABASE_URL || 'file:./local.db' }
})
