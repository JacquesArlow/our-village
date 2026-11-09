import type { H3Event } from "h3";
import { auth } from "../core/auth";
import { database } from "../core/database";
import { fail } from "../core/validation";
import { one, run, type Actor } from "../core/store";
import { appPrefix, bookingOrigin } from "../core/runtime";

export async function actor(
  event: H3Event,
  allowPasswordChange = false,
): Promise<Actor> {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) fail(401, "Please sign in to continue.");
  const user = one(
    database(),
    "SELECT id,name,email,role,mustChangePassword FROM user WHERE id=?",
    session.user.id,
  );
  if (!user || !["admin", "doctor", "patient"].includes(user.role))
    fail(403, "Account access is not configured.");
  if (user.mustChangePassword && !allowPasswordChange)
    fail(403, "Change your temporary password before continuing.");
  return user as Actor;
}
export function throttle(event: H3Event, scope: string, max = 60) {
  const db = database(),
    now = Date.now(),
    windowAt = Math.floor(now / 60000) * 60000;
  const ip =
    getHeader(event, "x-real-ip") ||
    event.node.req.socket.remoteAddress ||
    "unknown";
  const key = scope + ":" + ip;
  run(
    db,
    `INSERT INTO rate_limit(key,window_at,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window_at=excluded.window_at THEN count+1 ELSE 1 END,window_at=excluded.window_at`,
    key,
    windowAt,
  );
  if (one(db, "SELECT count FROM rate_limit WHERE key=?", key).count > max)
    fail(429, "Too many requests. Please wait a minute and try again.");
  run(db, "DELETE FROM rate_limit WHERE window_at<?", now - 3600000);
}
export function publicBase() {
  return bookingOrigin + appPrefix;
}
