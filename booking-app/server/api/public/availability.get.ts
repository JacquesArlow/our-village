import { database } from "../../core/database";
import { availabilityWeek } from "../../core/store";
import { date, fail, text } from "../../core/validation";
import { throttle } from "../../utils/access";

export default defineEventHandler((event) => {
  throttle(event, "availability", 60);
  const query = getQuery(event);
  const week = availabilityWeek(
    database(),
    text(query.serviceId, "appointment type", 100),
    date(query.from),
  );
  if (!week) fail(404, "This appointment type is no longer available.");
  return week;
});
