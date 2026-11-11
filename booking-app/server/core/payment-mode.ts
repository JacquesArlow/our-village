import type { DatabaseSync } from "node:sqlite";
import { livePreview } from "./runtime";
import { fail } from "./validation";

export type PaymentMode = "test" | "live";

export function paymentMode(db: DatabaseSync): PaymentMode {
  const setting = db.prepare("SELECT mode FROM payment_setting WHERE id=1").get();
  return setting?.mode === "live" ? "live" : "test";
}

export function requirePaymentMode(db: DatabaseSync, expected: unknown) {
  if (paymentMode(db) !== expected)
    fail(409, "The payment mode has changed. Reload the page and try again.");
}

export function yocoWebhookSecret(mode: PaymentMode) {
  if (livePreview)
    return mode === "live"
      ? process.env.YOCO_LIVE_WEBHOOK_SECRET
      : process.env.YOCO_TEST_WEBHOOK_SECRET;
  if (mode === "test") return process.env.YOCO_WEBHOOK_SECRET;
}

export function yocoSigningKey(secret?: string) {
  if (!secret || !/^whsec_[A-Za-z0-9+/_-]+={0,2}$/.test(secret)) return;
  const key = Buffer.from(secret.slice(6), "base64");
  if (key.length >= 16) return key;
}

export function yocoCheckoutKey(mode: PaymentMode) {
  const key = livePreview
    ? mode === "live"
      ? process.env.YOCO_LIVE_SECRET_KEY
      : process.env.YOCO_TEST_SECRET_KEY
    : mode === "test"
      ? process.env.YOCO_SECRET_KEY
      : undefined;
  if (key?.startsWith(`sk_${mode}_`) && yocoSigningKey(yocoWebhookSecret(mode)))
    return key;
}

export function paymentOptions(db: DatabaseSync) {
  const mode = paymentMode(db);
  return {
    mode,
    yocoConnected: !!yocoCheckoutKey(mode),
    simulatedPaymentsEnabled:
      mode === "test" && process.env.ENABLE_STAGING_SIMULATIONS === "true",
  };
}
