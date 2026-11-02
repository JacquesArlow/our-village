import { fail } from "../core/validation";
import { publicBase } from "../utils/access";

export default defineEventHandler((event) => {
  setHeaders(event, {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  });
  if (["GET", "HEAD"].includes(event.method)) return;
  const path = getRequestURL(event).pathname;
  if (path === "/api/payments/yoco/webhook" && event.method === "POST") return;
  const origin = getHeader(event, "origin");
  if (!origin || origin !== publicBase())
    fail(403, "Request origin is not permitted.");
  if (!getHeader(event, "content-type")?.startsWith("application/json"))
    fail(415, "Send JSON data.");
  if (Number(getHeader(event, "content-length") || 0) > 16384)
    fail(413, "Request is too large.");
});
