import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const event = sqliteTable('event', {
  id: text('id').primaryKey(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  title: text('title').notNull(),
  detail: text('detail'),
  staff: text('staff'),
  formFileName: text('form_file_name'),
  formFilePath: text('form_file_path'),
  formFileMime: text('form_file_mime'),
  formFileSize: integer('form_file_size'),
  formUploadedAt: integer('form_uploaded_at'),
  bookingFormVariant: text('booking_form_variant'),
  bookingCostLabel: text('booking_cost_label'),
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

export const booking = sqliteTable('booking', {
  id: text('id').primaryKey(),
  eventId: text('event_id'),
  eventTitle: text('event_title'),
  name: text('name').notNull(),
  surname: text('surname').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  guests: integer('guests'),
  babyName: text('baby_name'),
  babySurname: text('baby_surname'),
  babyDateOfBirth: text('baby_date_of_birth'),
  message: text('message'),
  createdAt: integer('created_at').notNull()
})

export const formSubmission = sqliteTable('form_submission', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull(),
  eventTitle: text('event_title'),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileMime: text('file_mime').notNull(),
  fileSize: integer('file_size').notNull(),
  createdAt: integer('created_at').notNull()
})

export type EventSelect = typeof event.$inferSelect
export type EventInsert = typeof event.$inferInsert
export type MonthBlockSelect = typeof monthBlock.$inferSelect
export type MonthBlockInsert = typeof monthBlock.$inferInsert
export type BookingSelect = typeof booking.$inferSelect
export type BookingInsert = typeof booking.$inferInsert
export type FormSubmissionSelect = typeof formSubmission.$inferSelect
export type FormSubmissionInsert = typeof formSubmission.$inferInsert
