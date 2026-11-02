export class BookingError extends Error {
  statusCode: number;
  statusMessage: string;
  constructor(status: number, message: string) {
    super(message);
    this.statusCode = status;
    this.statusMessage = message;
  }
}
export function fail(status: number, message: string): never {
  throw new BookingError(status, message);
}
export function text(
  value: unknown,
  label: string,
  max = 250,
  required = true,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (required && !value.trim())
  )
    fail(400, `Enter a valid ${label}.`);
  return value.trim();
}
export function integer(
  value: unknown,
  label: string,
  min: number,
  max: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    fail(400, `Enter a valid ${label}.`);
  return value;
}
export function date(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail(400, "Choose a valid date.");
  return value;
}
export function instant(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.000Z$/.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  )
    fail(400, "Choose a valid appointment time.");
  return new Date(value).toISOString();
}
export function email(value: unknown): string {
  const result = text(value, "email address", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    fail(400, "Enter a valid email address.");
  return result;
}
export function flag(value: unknown): number {
  if (typeof value !== "boolean") fail(400, "Use true or false.");
  return value ? 1 : 0;
}
