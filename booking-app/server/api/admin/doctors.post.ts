import { createManagedUser } from "../../core/accounts";
import { database } from "../../core/database";
import { actor } from "../../utils/access";
import { text } from "../../core/validation";

export default defineEventHandler(async (event) => {
  const user = await actor(event);
  const input = await readBody(event);
  const result = await createManagedUser(database(), user, {
    ...input,
    password: text(input?.password, "temporary password", 128),
    role: "doctor",
  });
  return {
    id: result.doctorId,
    email: result.email,
    message: "Doctor account created.",
  };
});
