export type ColorToken = 'sage' | 'pink' | 'red' | 'default'
export const COLOR_TOKENS: ColorToken[] = ['sage', 'pink', 'red', 'default']

export type BlockSection = 'important_dates' | 'hot_topics' | 'focus' | 'training'
export const BLOCK_SECTIONS: BlockSection[] = ['important_dates', 'hot_topics', 'focus', 'training']

export const BLOCK_SECTION_LABELS: Record<BlockSection, string> = {
  important_dates: 'Important dates',
  hot_topics: 'Hot Topics',
  focus: 'Focus list',
  training: 'Training note'
}

/** Format a Date as YYYY-MM-DD (local). */
export function ymd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Inclusive YYYY-MM-DD bounds for a calendar month. */
export function monthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate() // month is 1-based here
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export interface EventRow {
  id: string
  startDate: string
  endDate: string | null
  title: string
  detail: string | null
  staff: string | null
  color: ColorToken
  isHighlight: boolean
  isPublic: boolean
  createdAt: number
  updatedAt: number
}

export interface BlockRow {
  id: string
  year: number
  month: number
  section: BlockSection
  text: string
  color: ColorToken
  sortOrder: number
  isPublic: boolean
  createdAt: number
  updatedAt: number
}
