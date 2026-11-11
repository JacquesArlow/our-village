export const bookingIntervals = [5, 10, 15, 20, 30, 60] as const;

export function addCalendarDays(day: string, count: number) {
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function mondayOf(day: string) {
  const weekday = new Date(day + "T12:00:00Z").getUTCDay();
  return addCalendarDays(day, -((weekday + 6) % 7));
}

export interface CalendarSlot {
  start: string;
  end: string;
  busyUntil: string;
}

export interface AvailabilityWeek {
  days: { date: string; slots: CalendarSlot[] }[];
  lastDate: string;
  nextAvailable: string | null;
}
