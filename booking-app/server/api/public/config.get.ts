import { database } from "../../core/database";
import { paymentOptions } from "../../core/payment-mode";

export default defineEventHandler(() => ({
  ...paymentOptions(database()),
  emailsEnabled: false,
  currency: "ZAR",
  timeZone: "Africa/Johannesburg",
}));
