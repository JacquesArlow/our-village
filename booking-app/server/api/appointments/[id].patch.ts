import { actor } from "../../utils/access";
import { database } from "../../core/database";
import { changeAppointment } from "../../core/store";
export default defineEventHandler(async (event) =>
  changeAppointment(
    database(),
    await actor(event),
    getRouterParam(event, "id")!,
    await readBody(event),
  ),
);
