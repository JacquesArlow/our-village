import { actor, throttle } from "../../utils/access";
import { database } from "../../core/database";
import { createAppointment } from "../../core/store";
export default defineEventHandler(async (event) => {
  throttle(event, "booking", 10);
  return createAppointment(
    database(),
    await actor(event),
    await readBody(event),
  );
});
