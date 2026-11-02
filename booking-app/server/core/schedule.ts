import { date, fail, integer } from "./validation";

export interface Hours {
  day: number;
  start: string;
  end: string;
}
const minute = (value: string) => +value.slice(0, 2) * 60 + +value.slice(3);
export function normaliseHours(input: unknown): Hours[] {
  if (!Array.isArray(input) || input.length > 28)
    fail(400, "Use a valid weekly schedule (up to 28 periods).");
  const hours = input
    .map((row) => {
      integer(row?.day, "day", 0, 6);
      if (
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(row?.start) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(row?.end) ||
        minute(row.end) <= minute(row.start)
      )
        fail(
          400,
          "Every working period needs a start time before its end time.",
        );
      return { day: row.day, start: row.start, end: row.end };
    })
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
  let previous: Hours | undefined;
  for (const period of hours) {
    if (previous && period.day === previous.day && period.start < previous.end)
      fail(400, "Working periods cannot overlap.");
    previous = period;
  }
  return hours;
}
export const localDay = (now = Date.now()) =>
  new Date(now + 2 * 3600000).toISOString().slice(0, 10);
export const localTime = (iso: string) =>
  new Date(Date.parse(iso) + 2 * 3600000).toISOString().slice(11, 16);
export function candidateSlots(
  doctor: any,
  service: any,
  day: string,
  now = Date.now(),
) {
  date(day);
  const delta =
    (Date.parse(day + "T00:00:00+02:00") -
      Date.parse(localDay(now) + "T00:00:00+02:00")) /
    86400000;
  if (delta < 0 || delta > doctor.horizon_days) return [];
  const weekday = new Date(day + "T12:00:00+02:00").getUTCDay();
  const periods: Hours[] = JSON.parse(doctor.weekly_hours);
  const result: { start: string; end: string; busyUntil: string }[] = [];
  for (const period of periods.filter((row) => row.day === weekday)) {
    for (
      let time = minute(period.start);
      time + service.duration_minutes + service.buffer_minutes <=
      minute(period.end);
      time += 15
    ) {
      const start = Date.parse(
        day +
          "T" +
          String(Math.floor(time / 60)).padStart(2, "0") +
          ":" +
          String(time % 60).padStart(2, "0") +
          ":00+02:00",
      );
      if (start < now + doctor.min_notice_hours * 3600000) continue;
      result.push({
        start: new Date(start).toISOString(),
        end: new Date(start + service.duration_minutes * 60000).toISOString(),
        busyUntil: new Date(
          start + (service.duration_minutes + service.buffer_minutes) * 60000,
        ).toISOString(),
      });
    }
  }
  return result;
}
