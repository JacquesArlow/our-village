import { betterAuth } from "better-auth";
import { database } from "./database";

export const auth = betterAuth({
  database: database(),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
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
    },
  },
  session: {
    expiresIn: 8 * 3600,
    updateAge: 1800,
    cookieCache: { enabled: false },
  },
  advanced: {
    cookiePrefix: "ov-bookings-staging",
    useSecureCookies:
      process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false,
    ipAddress: { ipAddressHeaders: ["x-real-ip"] },
  },
  rateLimit: { enabled: true, window: 60, max: 30, storage: "database" },
});
