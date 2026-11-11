import { auth } from "../../core/auth";
import { fail } from "../../core/validation";
import { bookingRoute, staffDesk } from "../../core/runtime";

export default defineEventHandler((event) => {
  const path = bookingRoute(getRequestURL(event).pathname).slice("/api/auth".length);
  const allowed: Record<string, string[]> = {
    "/sign-in/email": ["POST"],
    "/sign-up/email": ["POST"],
    "/sign-out": ["POST"],
    "/get-session": ["GET"],
  };
  if (!allowed[path]?.includes(event.method) || (staffDesk && path === "/sign-up/email"))
    fail(404, "Authentication route not available.");
  return auth.handler(toWebRequest(event));
});
