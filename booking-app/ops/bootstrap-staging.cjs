// Run as root on the existing cloud server. Idempotent: never rotates existing
// review passwords or app secrets. Credentials are written to a mode-0600 file,
// never stdout. The old Nginx user and old calendar volume are preserved.
const fs = require("fs"),
  crypto = require("crypto"),
  cp = require("child_process");
if (process.getuid() !== 0) throw Error("Run this bootstrap as root.");
const dir = "/opt/ourvillage-booking-staging";
const privateDir = "/home/ubuntu/.config/our-village-booking";
const file = privateDir + "/staging-access.json";
const authFile = "/home/ourvillage-stg/.htpasswd";
const uid = Number(cp.execFileSync("id", ["-u", "ubuntu"]).toString().trim());
const gid = Number(cp.execFileSync("id", ["-g", "ubuntu"]).toString().trim());
function ownedDirectory(path) {
  fs.mkdirSync(path, { recursive: true, mode: 0o700 });
  fs.chownSync(path, uid, gid);
}
ownedDirectory(dir);
ownedDirectory(privateDir);
let access;
if (fs.existsSync(file)) access = JSON.parse(fs.readFileSync(file, "utf8"));
else {
  const password = function () {
    return crypto.randomBytes(24).toString("hex");
  };
  access = {
    url: "https://staging.our-village.co.za",
    review: { username: "booking-review", password: password() },
    admin: { email: "admin@our-village.test", password: password() },
    doctor: { email: "natasha@our-village.test", password: password() },
    authSecret: crypto.randomBytes(48).toString("hex"),
    note: "Private staging only. No emails. Admin and doctor must change their temporary app passwords at first login; this does not change the separate Nginx review password.",
  };
  fs.writeFileSync(file, JSON.stringify(access, null, 2) + "\n", {
    mode: 0o600,
    flag: "wx",
  });
  fs.chownSync(file, uid, gid);
}
const existing = fs.existsSync(authFile)
  ? fs.readFileSync(authFile, "utf8")
  : "";
const hasUser = existing.split("\n").some(function (line) {
  return line.split(":")[0] === access.review.username;
});
if (hasUser) {
  const check = cp.spawnSync(
    "htpasswd",
    ["-v", "-i", authFile, access.review.username],
    { input: access.review.password + "\n", encoding: "utf8" },
  );
  if (check.status !== 0)
    throw Error("Existing review password differs. Refusing to rotate it.");
} else {
  if (fs.existsSync(authFile))
    fs.copyFileSync(authFile, authFile + ".before-booking-" + Date.now());
  const args = ["-i", "-B", "-C", "12"];
  if (!fs.existsSync(authFile)) args.push("-c");
  args.push(authFile, access.review.username);
  const added = cp.spawnSync("htpasswd", args, {
    input: access.review.password + "\n",
    encoding: "utf8",
  });
  if (added.status !== 0) throw Error("Could not provision the review user.");
}
const env = dir + "/.env";
if (!fs.existsSync(env)) {
  const lines = [
    "APP_MODE=staging",
    "BETTER_AUTH_URL=" + access.url,
    "BETTER_AUTH_SECRET=" + access.authSecret,
    "BOOKING_ADMIN_EMAIL=" + access.admin.email,
    "BOOKING_ADMIN_PASSWORD=" + access.admin.password,
    "BOOKING_DOCTOR_EMAIL=" + access.doctor.email,
    "BOOKING_DOCTOR_PASSWORD=" + access.doctor.password,
    "EMAIL_MODE=off",
    "ENABLE_STAGING_SIMULATIONS=true",
    "YOCO_SECRET_KEY=",
    "YOCO_WEBHOOK_SECRET=",
  ];
  fs.writeFileSync(env, lines.join("\n") + "\n", { mode: 0o600, flag: "wx" });
  fs.chownSync(env, uid, gid);
}
console.log(
  "Private staging configuration ready. Existing passwords and calendar data preserved. Credential file: " +
    file,
);
