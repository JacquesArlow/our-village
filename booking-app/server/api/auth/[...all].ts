import { auth } from "../../core/auth";
import { fail } from "../../core/validation";

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname.replace("/api/auth", "");
  const allowed: Record<string, string[]> = {
    "/sign-in/email": ["POST"],
    "/sign-up/email": ["POST"],
    "/sign-out": ["POST"],
    "/get-session": ["GET"],
  };
  if (!allowed[path]?.includes(event.method))
    fail(404, "Authentication route not available in this pilot.");
  return auth.handler(toWebRequest(event));
});
