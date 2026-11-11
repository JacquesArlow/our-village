export function isDoctorCalendar(path: string) {
  return /^\/doctors\/[^/]+\/?$/.test(path);
}

export function isPublicBookingPage(path: string) {
  return ["/", "/sign-up", "/register", "/privacy"].includes(path) || isDoctorCalendar(path);
}

export function bookingReturnPath(value: unknown, staff = false) {
  if (typeof value !== "string" || !value.startsWith("/") || /^\/\//.test(value) || /[\\\s]/.test(value))
    return undefined;
  const url = new URL(value, "https://booking.invalid");
  const path = url.pathname.replace(/\/$/, "") || "/";
  const sections = staff ? /^\/(admin|doctor|reception|invoices)(\/|$)/ : /^\/(account|invoices|pay|payment-return)(\/|$)/;
  if (path === "/" || sections.test(path) || (!staff && isDoctorCalendar(path)))
    return url.pathname + url.search + url.hash;
}
