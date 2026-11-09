export const livePreview = process.env.APP_MODE === "live-preview";
export const staffDesk =
  livePreview && process.env.BOOKING_AUDIENCE === "staff";
export const appPrefix = (process.env.NUXT_APP_BASE_URL || "/").replace(
  /\/$/,
  "",
);
export const authPath = appPrefix + "/api/auth";
export const bookingOrigin = new URL(
  process.env.BETTER_AUTH_URL || "http://localhost:3000",
).origin;

export function bookingRoute(path: string) {
  return appPrefix && path.startsWith(appPrefix + "/")
    ? path.slice(appPrefix.length)
    : path;
}

export function audienceAllows(role: unknown) {
  if (!livePreview) return true;
  return staffDesk
    ? role === "admin" || role === "doctor" || role === "receptionist"
    : role === "patient";
}

export function isTestAddress(email: string) {
  const domain = email.toLowerCase().split("@").at(-1) || "";
  return (
    /(?:^|\.)(test|example|invalid|localhost)$/.test(domain) ||
    /(?:^|\.)example\.(com|net|org)$/.test(domain)
  );
}
