import type { H3Event } from "h3";
import { database } from "../core/database";
import { handlePaymentEvent, verifyWebhook } from "../core/payments";
import { yocoWebhookSecret, type PaymentMode } from "../core/payment-mode";
import { fail } from "../core/validation";

export async function receiveYocoWebhook(event: H3Event, mode: PaymentMode) {
  const raw = await readRawBody(event);
  if (!raw || Buffer.byteLength(raw) > 65536)
    fail(400, "Invalid payment notification body.");
  verifyWebhook(
    raw,
    {
      "webhook-id": getHeader(event, "webhook-id"),
      "webhook-timestamp": getHeader(event, "webhook-timestamp"),
      "webhook-signature": getHeader(event, "webhook-signature"),
    },
    yocoWebhookSecret(mode) || "",
  );
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    fail(400, "Invalid payment notification JSON.");
  }
  return handlePaymentEvent(database(), input, Date.now(), mode);
}
