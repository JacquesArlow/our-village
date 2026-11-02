import { database } from "../../core/database";
import { slots } from "../../core/store";
import { date, text } from "../../core/validation";
import { throttle } from "../../utils/access";
export default defineEventHandler((event) => {
  throttle(event, "slots", 60);
  const q = getQuery(event);
  return slots(
    database(),
    text(q.serviceId, "appointment type", 100),
    date(q.date),
  );
});
