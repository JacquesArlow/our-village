import { fail } from "../core/validation";
import { sessionActor } from "../utils/access";
import {
  appPrefix,
  bookingOrigin,
  bookingRoute,
  livePreview,
} from "../core/runtime";

const guestPages = new Set([
  "/login",
  "/sign-in",
  "/api/health",
  "/logo.png",
  "/favicon.ico",
]);
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
  setHeaders(event, {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  });
  const url = getRequestURL(event);
  const path = bookingRoute(url.pathname).replace(/\/$/, "") || "/";
  const read = ["GET", "HEAD"].includes(event.method);
  if (path === "/api/payments/yoco/webhook") {
    if (livePreview)
      fail(404, "The payment gateway is unavailable in this preview.");
    if (event.method === "POST") return;
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
  if (read && path === "/sign-up")
    return sendRedirect(event, appPrefix + "/login", 302);
  if (path === "/api/auth/sign-up/email")
    fail(404, "Account registration is closed for this preview.");
  if (read && (guestPages.has(path) || path.startsWith("/_nuxt/"))) return;
  if (event.method === "POST" && path === "/api/auth/sign-in/email") return;

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
