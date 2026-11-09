import type { H3Event } from "h3";
import { auth } from "../core/auth";
import { database } from "../core/database";
import { fail } from "../core/validation";
import { one, run, type Actor } from "../core/store";
import {
  appPrefix,
  audienceAllows,
  bookingOrigin,
  isTestAddress,
  livePreview,
} from "../core/runtime";
import { accountRoles } from "../../shared/accounts";

export async function sessionActor(event: H3Event): Promise<Actor | null> {
  if (event.context.bookingActor !== undefined)
    return event.context.bookingActor;
  const session = await auth.api.getSession({ headers: event.headers });
  const user = session?.user
    ? one(
        database(),
        "SELECT id,name,email,role,mustChangePassword,disabledAt FROM user WHERE id=?",
        session.user.id,
      )
    : null;
  const active =
    user &&
    !user.disabledAt &&
    accountRoles.includes(user.role) &&
    audienceAllows(user.role) &&
    !(livePreview && isTestAddress(user.email));
  return (event.context.bookingActor = active ? (user as Actor) : null);
}

export async function actor(
  event: H3Event,
  allowPasswordChange = false,
): Promise<Actor> {
  const user = await sessionActor(event);
  if (!user) fail(401, "Please sign in to continue.");
  if (user.mustChangePassword && !allowPasswordChange)
    fail(403, "Change your temporary password before continuing.");
  return user;
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

export function paymentBase() {
  return livePreview ? bookingOrigin + "/booking" : publicBase();
}
