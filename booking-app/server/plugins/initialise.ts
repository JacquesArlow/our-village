import { getMigrations } from "better-auth/db/migration";
import { auth } from "../core/auth";
import { database, migrateDomain, transaction } from "../core/database";
import { many, one, run } from "../core/store";
import { appPrefix, isTestAddress, livePreview } from "../core/runtime";

export default defineNitroPlugin(async () => {
  if (process.env.APP_MODE !== "staging" && !livePreview)
    throw new Error(
      "Set APP_MODE to staging or live-preview for the booking pilot.",
    );
  if (
    !process.env.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET.length < 32
  )
    throw new Error(
      "An isolated booking auth secret of at least 32 characters is required.",
    );
  if (
    process.env.YOCO_SECRET_KEY &&
    !process.env.YOCO_SECRET_KEY.startsWith("sk_test_")
  )
    throw new Error("Only Yoco test keys are accepted by this staging app.");
  if (
    livePreview &&
    (appPrefix !== "/booking" ||
      useRuntimeConfig().public.bookingLoginRequired !== true ||
      process.env.YOCO_SECRET_KEY ||
      process.env.YOCO_WEBHOOK_SECRET)
  )
    throw new Error(
      "The live preview requires /booking, account access and simulated payments.",
    );
  const migrations = await getMigrations(auth.options);
  await migrations.runMigrations();
  const db = database();
  migrateDomain(db);
  if (livePreview) {
    transaction(db, () => {
      for (const user of many(db, "SELECT id,email FROM user")) {
        if (!isTestAddress(user.email)) continue;
        run(
          db,
          "UPDATE user SET disabledAt=COALESCE(disabledAt,?) WHERE id=?",
          Date.now(),
          user.id,
        );
        run(
          db,
          "UPDATE account SET password=NULL WHERE userId=? AND providerId='credential'",
          user.id,
        );
        run(db, "DELETE FROM session WHERE userId=?", user.id);
      }
    });
  }
  const liveAdminExists =
    livePreview &&
    many(db, "SELECT email FROM user WHERE role='admin'").some(
      (user) => !isTestAddress(user.email),
    );
  for (const config of [
    {
      email: process.env.BOOKING_ADMIN_EMAIL,
      password: process.env.BOOKING_ADMIN_PASSWORD,
      name: livePreview
        ? "Our Village Administrator"
        : "Our Village Staging Admin",
      role: "admin",
    },
    {
      email: process.env.BOOKING_DOCTOR_EMAIL,
      password: process.env.BOOKING_DOCTOR_PASSWORD,
      name: "Dr Natasha Bartie",
      role: "doctor",
    },
    {
      email: process.env.BOOKING_PATIENT_EMAIL,
      password: process.env.BOOKING_PATIENT_PASSWORD,
      name: "Our Village Test Patient",
      role: "patient",
    },
  ]) {
    if (livePreview && (config.role !== "admin" || liveAdminExists)) continue;
    if (!config.email || !config.password) continue;
    const email = config.email.toLowerCase();
    if (livePreview && isTestAddress(email))
      throw new Error("A live booking account requires a real email address.");
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
