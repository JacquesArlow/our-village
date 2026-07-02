import type { EventRow, BlockRow, BlockSection } from '~~/shared/calendar'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const useMonthName = (month: number) => MONTHS[month - 1] ?? ''

export function buildWeeks(year: number, month: number): ({ date: string | null })[][] {
  const first = new Date(year, month - 1, 1)
  const startDow = first.getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: ({ date: string | null })[] = []
  for (let i = 0; i < startDow; i++) cells.push({ date: null })
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}` })
  }
  while (cells.length % 7 !== 0) cells.push({ date: null })
  const weeks: ({ date: string | null })[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function eventsForDay(events: EventRow[], date: string): EventRow[] {
  return events.filter(e => date >= e.startDate && date <= (e.endDate ?? e.startDate))
}

export function blocksBySection(blocks: BlockRow[]): Record<BlockSection, BlockRow[]> {
  const out = { important_dates: [], hot_topics: [], focus: [], training: [] } as Record<BlockSection, BlockRow[]>
  for (const b of blocks) out[b.section]?.push(b)
  for (const k of Object.keys(out) as BlockSection[]) out[k].sort((a,b)=>a.sortOrder-b.sortOrder)
  return out
}

const COLOR_CLASS: Record<string,string> = {
  sage: 'text-primary', pink: 'text-accent', red: 'text-error', blue: 'text-info', default: 'text-base-content'
}
export const colorClass = (c?: string) => COLOR_CLASS[c ?? 'default'] ?? COLOR_CLASS.default
