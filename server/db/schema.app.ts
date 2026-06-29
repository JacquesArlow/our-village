import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const event = sqliteTable('event', {
  id: text('id').primaryKey(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  title: text('title').notNull(),
  detail: text('detail'),
  staff: text('staff'),
  color: text('color').notNull().default('default'),
  isHighlight: integer('is_highlight', { mode: 'boolean' }).notNull().default(false),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export const monthBlock = sqliteTable('month_block', {
  id: text('id').primaryKey(),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  section: text('section').notNull(),
  text: text('text').notNull(),
  color: text('color').notNull().default('default'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export type EventSelect = typeof event.$inferSelect
export type EventInsert = typeof event.$inferInsert
export type MonthBlockSelect = typeof monthBlock.$inferSelect
export type MonthBlockInsert = typeof monthBlock.$inferInsert
