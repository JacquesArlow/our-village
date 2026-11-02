import { database } from "../../../core/database";
import { invoiceFromToken } from "../../../core/store";
import { startCheckout } from "../../../core/payments";
import { throttle, publicBase } from "../../../utils/access";
export default defineEventHandler(async (event) => {
  throttle(event, "checkout", 10);
  const db = database(),
    invoice = invoiceFromToken(db, getRouterParam(event, "token")!);
  return startCheckout(db, invoice.id, publicBase());
});
