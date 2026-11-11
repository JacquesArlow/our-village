import { actor, paymentBase } from "../../../utils/access";
import { database } from "../../../core/database";
import { invoiceFor } from "../../../core/store";
import { startCheckout } from "../../../core/payments";
export default defineEventHandler(async (event) => {
  const db = database(),
    invoice = invoiceFor(db, await actor(event), getRouterParam(event, "id")!);
  return startCheckout(db, invoice.id, paymentBase());
});
