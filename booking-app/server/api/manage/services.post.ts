import { actor } from "../../utils/access";
import { database } from "../../core/database";
import { saveService } from "../../core/store";
import { text } from "../../core/validation";
export default defineEventHandler(async (event) => {
  const user = await actor(event),
    input = await readBody(event);
  return saveService(
    database(),
    user,
    text(input.doctorId, "doctor", 100),
    input,
  );
});
