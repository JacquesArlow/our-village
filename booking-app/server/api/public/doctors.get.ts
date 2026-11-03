import { database } from "../../core/database";
import { publishedDoctors } from "../../core/store";

export default defineEventHandler(() => publishedDoctors(database()));
