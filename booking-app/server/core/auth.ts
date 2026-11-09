import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { database } from "./database";
import {
  appPrefix,
  authPath,
  bookingOrigin,
  isTestAddress,
  livePreview,
} from "./runtime";

export const auth = betterAuth({
  database: database(),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: bookingOrigin,
  basePath: authPath,
  trustedOrigins: [bookingOrigin],
  appName: "Our Village Appointments",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "patient",
        input: false,
      },
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      disabledAt: {
        type: "number",
        required: false,
        input: false,
        returned: false,
      },
    },
  },
  session: {
    expiresIn: 8 * 3600,
    updateAge: 1800,
    cookieCache: { enabled: false },
  },
  advanced: {
    cookiePrefix: livePreview ? "ov-bookings-preview" : "ov-bookings-staging",
    defaultCookieAttributes: { path: appPrefix || "/" },
    useSecureCookies:
      process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false,
    ipAddress: { ipAddressHeaders: ["x-real-ip"] },
  },
  rateLimit: { enabled: true, window: 60, max: 30, storage: "database" },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email" || typeof ctx.body?.email !== "string")
        return;
      const email = ctx.body.email.trim().toLowerCase();
      const user = database()
        .prepare("SELECT disabledAt FROM user WHERE email=?")
        .get(email);
      if (user?.disabledAt || (livePreview && isTestAddress(email)))
        throw new APIError("UNAUTHORIZED", {
          message: "Invalid email or password.",
        });
    }),
  },
});
