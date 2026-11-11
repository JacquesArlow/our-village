import { fail } from "../core/validation";
import { isPublicBookingPage } from "../../shared/booking-navigation";
import { sessionActor } from "../utils/access";
import {
  appPrefix,
  bookingOrigin,
  bookingRoute,
  livePreview,
  staffDesk,
} from "../core/runtime";

const guestPages = new Set([
  "/login",
  "/sign-in",
  "/api/health",
  "/logo.png",
  "/favicon.ico",
]);
const guestAvailability = new Set(["/api/public/doctors", "/api/public/availability"]);
const receptionApis = new Set([
  "/api/me",
  "/api/reception/patients",
  "/api/public/config",
  "/api/account/password",
  "/api/auth/sign-in/email",
  "/api/auth/sign-out",
  "/api/auth/get-session",
]);

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const path = bookingRoute(url.pathname).replace(/\/$/, "") || "/";
  const deskLogin = staffDesk && (path === "/login" || path === "/sign-in");
  const turnstile = deskLogin ? " https://challenges.cloudflare.com" : "";
  setHeaders(event, {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "Content-Security-Policy": `default-src 'self'; script-src 'self' 'unsafe-inline'${turnstile}; frame-src 'self'${turnstile}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
  });
  const read = ["GET", "HEAD"].includes(event.method);
  if (/^\/api\/payments\/yoco\/(?:(?:test|live)\/)?webhook$/.test(path)) {
    const enabled = livePreview
      ? !staffDesk && path !== "/api/payments/yoco/webhook"
      : path === "/api/payments/yoco/webhook";
    if (!enabled || event.method !== "POST") fail(404, "Webhook not found.");
    return;
  }
  if (!read) {
    if (getHeader(event, "origin") !== bookingOrigin)
      fail(403, "Request origin is not permitted.");
    if (!getHeader(event, "content-type")?.startsWith("application/json"))
      fail(415, "Send JSON data.");
    if (Number(getHeader(event, "content-length") || 0) > 16384)
      fail(413, "Request is too large.");
  }
  if (!livePreview) {
    if (
      path.startsWith("/api/") &&
      getHeader(event, "cookie") &&
      !receptionApis.has(path) &&
      (await sessionActor(event))?.role === "receptionist"
    )
      fail(403, "This action is outside reception access.");
    return;
  }
  if (staffDesk && read && ["/sign-up", "/register"].includes(path))
    return sendRedirect(event, appPrefix + "/login", 302);
  const staffPage = /^\/(admin|doctor|reception)(\/|$)/.test(path);
  const patientPage = /^\/(account|doctors|pay|payment-return)(\/|$)/.test(
    path,
  );
  if (read && (staffDesk ? patientPage : staffPage)) {
    setResponseStatus(event, 404);
    return "Page not found.";
  }
  if (!staffDesk && read && (isPublicBookingPage(path) || guestAvailability.has(path))) return;
  if (staffDesk && path === "/api/auth/sign-up/email")
    fail(404, "Registration is available through patient booking.");
  if (read && (guestPages.has(path) || path.startsWith("/_nuxt/"))) return;
  if (event.method === "POST" && ["/api/auth/sign-in/email", "/api/auth/sign-up/email"].includes(path)) return;

  const user = await sessionActor(event);
  if (user) {
    if (
      user.role === "receptionist" &&
      path.startsWith("/api/") &&
      !receptionApis.has(path)
    )
      fail(403, "This action is outside reception access.");
    return;
  }
  if (read && !path.startsWith("/api/"))
    return sendRedirect(
      event,
      appPrefix + "/login?next=" + encodeURIComponent(path + url.search),
      302,
    );
  fail(401, "Please sign in to continue.");
});
