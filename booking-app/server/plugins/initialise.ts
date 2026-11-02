import { getMigrations } from "better-auth/db/migration";
import { auth } from "../core/auth";
import { database, migrateDomain } from "../core/database";
import { one, run } from "../core/store";

export default defineNitroPlugin(async () => {
  if (process.env.APP_MODE !== "staging")
    throw new Error(
      "The booking pilot is staging-only. Set APP_MODE=staging; production release needs separate approval.",
    );
  if (
    !process.env.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET.length < 32
  )
    throw new Error(
      "An isolated staging auth secret of at least 32 characters is required.",
    );
  if (
    process.env.YOCO_SECRET_KEY &&
    !process.env.YOCO_SECRET_KEY.startsWith("sk_test_")
  )
    throw new Error("Only Yoco test keys are accepted by this staging app.");
  const migrations = await getMigrations(auth.options);
  await migrations.runMigrations();
  const db = database();
  migrateDomain(db);
  for (const config of [
    {
      email: process.env.BOOKING_ADMIN_EMAIL,
      password: process.env.BOOKING_ADMIN_PASSWORD,
      name: "Our Village Staging Admin",
      role: "admin",
    },
    {
      email: process.env.BOOKING_DOCTOR_EMAIL,
      password: process.env.BOOKING_DOCTOR_PASSWORD,
      name: "Dr Natasha Bartie",
      role: "doctor",
    },
  ]) {
    if (!config.email || !config.password) continue;
    const email = config.email.toLowerCase();
    let user = one(db, "SELECT * FROM user WHERE email=?", email);
    if (!user) {
      const created = await auth.api.signUpEmail({
        body: { name: config.name, email, password: config.password },
      });
      run(
        db,
        "UPDATE user SET role=?,mustChangePassword=1 WHERE id=?",
        config.role,
        created.user.id,
      );
      user = one(db, "SELECT * FROM user WHERE id=?", created.user.id);
    }
    if (user.role !== config.role)
      throw new Error(
        "Seed identity already exists with a different role; refusing to promote an existing account.",
      );
    if (config.role === "doctor")
      run(
        db,
        `INSERT OR IGNORE INTO doctor(id,user_id,name,title,description,location,created_at) VALUES(?,?,?,?,?,?,?)`,
        "dr-natasha-bartie",
        user.id,
        "Dr Natasha Bartie",
        "General Practitioner",
        "Compassionate family medical care at Our Village.",
        "Our Village, 525 Alsation Drive, Garsfontein, Pretoria",
        Date.now(),
      );
  }
});
