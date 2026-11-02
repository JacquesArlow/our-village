import { database } from "../../core/database";
import { invoiceFromToken, expireHolds } from "../../core/store";
import { throttle } from "../../utils/access";
export default defineEventHandler((event) => {
  throttle(event, "payment-link", 30);
  const db = database();
  expireHolds(db);
  const invoice = invoiceFromToken(db, getRouterParam(event, "token")!);
  // A shared link is a payment capability, not permission to read patient records.
  return {
    id: invoice.id,
    seq: invoice.seq,
    amountCents: invoice.amount_cents,
    currency: invoice.currency,
    state: invoice.state,
    paymentMethod: invoice.payment_method,
  };
});
