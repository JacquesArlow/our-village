import { database } from "../../../core/database";
import { verifyWebhook, handlePaymentEvent } from "../../../core/payments";
import { fail } from "../../../core/validation";
export default defineEventHandler(async (event) => {
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
    process.env.YOCO_WEBHOOK_SECRET || "",
  );
  let input: any;
  try {
    input = JSON.parse(raw);
  } catch {
    fail(400, "Invalid payment notification JSON.");
  }
  return handlePaymentEvent(database(), input);
});
