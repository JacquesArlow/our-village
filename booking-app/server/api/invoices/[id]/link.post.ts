import { actor, paymentBase } from "../../../utils/access";
import { database } from "../../../core/database";
import { createPaymentLink } from "../../../core/store";
export default defineEventHandler(async (event) =>
  createPaymentLink(
    database(),
    await actor(event),
    getRouterParam(event, "id")!,
    paymentBase(),
  ),
);
