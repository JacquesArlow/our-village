import { createHmac, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { transaction } from "./database";
import { one, run, assertPayable, settleInvoice, audit } from "./store";
import { fail } from "./validation";

export function verifyWebhook(
  raw: string,
  headers: Record<string, string | undefined>,
  secret: string,
  now = Date.now(),
) {
  if (!secret.startsWith("whsec_"))
    fail(503, "Yoco webhook verification is not configured.");
  const id = headers["webhook-id"],
    timestamp = headers["webhook-timestamp"],
    signature = headers["webhook-signature"];
  if (
    !id ||
    id.length > 200 ||
    !timestamp ||
    !/^\d{10,12}$/.test(timestamp) ||
    Math.abs(now / 1000 - Number(timestamp)) > 180 ||
    !signature ||
    signature.length > 2000
  )
    fail(401, "Invalid payment notification signature.");
  const key = Buffer.from(secret.slice(6), "base64");
  if (key.length < 16)
    fail(503, "Yoco webhook verification is not configured.");
  const expected = createHmac("sha256", key)
    .update(id + "." + timestamp + "." + raw)
    .digest();
  const valid = signature.split(" ").some((item) => {
    const [version, value] = item.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && timingSafeEqual(expected, given);
  });
  if (!valid) fail(401, "Invalid payment notification signature.");
}
export function handlePaymentEvent(
  db: DatabaseSync,
  event: any,
  now = Date.now(),
) {
  if (typeof event?.id !== "string" || event.id.length > 200)
    fail(400, "Invalid payment event.");
  if (event.type !== "payment.succeeded")
    return { accepted: true, processed: false };
  const payment = event.payload;
  if (
    payment?.mode !== "test" ||
    payment.status !== "succeeded" ||
    payment.currency !== "ZAR" ||
    !Number.isSafeInteger(payment.amount) ||
    typeof payment.id !== "string" ||
    payment.id.length > 200 ||
    typeof payment.metadata?.checkoutId !== "string"
  )
    fail(
      400,
      "Payment notification does not match the staging payment contract.",
    );
  return transaction(db, () => {
    if (one(db, "SELECT id FROM payment_event WHERE id=?", event.id))
      return { accepted: true, duplicate: true };
    const invoice = one(
      db,
      "SELECT * FROM invoice WHERE checkout_id=?",
      payment.metadata.checkoutId,
    );
    if (!invoice)
      fail(
        409,
        "Checkout is not yet recorded. Please retry notification delivery.",
      );
    if (invoice.amount_cents !== payment.amount)
      fail(409, "Payment amount does not match the invoice.");
    const existing = one(
      db,
      "SELECT id FROM invoice WHERE payment_id=?",
      payment.id,
    );
    if (existing && existing.id !== invoice.id)
      fail(409, "Payment was already allocated to another invoice.");
    settleInvoice(db, invoice.id, payment.id, "yoco_test", now);
    run(
      db,
      "INSERT INTO payment_event(id,checkout_id,received_at) VALUES(?,?,?)",
      event.id,
      invoice.checkout_id,
      now,
    );
    return { accepted: true, processed: true };
  });
}
export async function startCheckout(
  db: DatabaseSync,
  invoiceId: string,
  base: string,
) {
  const key = process.env.YOCO_SECRET_KEY;
  if (
    !key?.startsWith("sk_test_") ||
    !process.env.YOCO_WEBHOOK_SECRET?.startsWith("whsec_")
  )
    fail(
      503,
      "Yoco test payments are not connected yet. Ask the practice administrator to configure the test key and webhook.",
    );
  const invoice = one(db, "SELECT * FROM invoice WHERE id=?", invoiceId);
  if (!invoice) fail(404, "Invoice not found.");
  assertPayable(db, invoice);
  if (invoice.checkout_id && invoice.checkout_url)
    return { redirectUrl: invoice.checkout_url };
  let response: Response;
  try {
    response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        "Idempotency-Key": "ov-staging-" + invoice.id,
      },
      body: JSON.stringify({
        amount: invoice.amount_cents,
        currency: "ZAR",
        externalId: invoice.id,
        successUrl: base + "/payment-return?outcome=submitted",
        cancelUrl: base + "/payment-return?outcome=cancelled",
        failureUrl: base + "/payment-return?outcome=failed",
        metadata: { invoiceId: invoice.id, environment: "our-village-staging" },
      }),
    });
  } catch {
    fail(
      502,
      "Yoco could not be reached. You can safely retry this same invoice.",
    );
  }
  if (!response.ok)
    fail(
      502,
      "Yoco did not accept the checkout request. Contact the practice; no payment has been confirmed.",
    );
  const checkout = (await response.json()) as any;
  let redirect: URL;
  try {
    redirect = new URL(checkout.redirectUrl);
  } catch {
    fail(502, "Yoco returned an invalid checkout link.");
  }
  if (
    checkout.processingMode !== "test" ||
    checkout.amount !== invoice.amount_cents ||
    checkout.currency !== "ZAR" ||
    typeof checkout.id !== "string" ||
    !/^[a-zA-Z0-9_-]{1,150}$/.test(checkout.id) ||
    redirect.protocol !== "https:" ||
    redirect.hostname !== "c.yoco.com" ||
    redirect.username ||
    redirect.password ||
    redirect.port
  )
    fail(
      502,
      "Yoco returned an unexpected checkout. No payment was confirmed.",
    );
  run(
    db,
    "UPDATE invoice SET checkout_id=?,checkout_url=? WHERE id=? AND checkout_id IS NULL",
    checkout.id,
    redirect.toString(),
    invoice.id,
  );
  audit(db, null, "checkout.created", invoice.id, "yoco_test");
  return { redirectUrl: redirect.toString() };
}
