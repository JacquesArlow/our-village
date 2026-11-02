export default defineEventHandler(() => ({
  mode: "staging",
  emailsEnabled: false,
  currency: "ZAR",
  timeZone: "Africa/Johannesburg",
  yocoConnected:
    !!process.env.YOCO_SECRET_KEY?.startsWith("sk_test_") &&
    !!process.env.YOCO_WEBHOOK_SECRET,
  simulatedPaymentsEnabled: process.env.ENABLE_STAGING_SIMULATIONS === "true",
}));
