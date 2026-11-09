# Our Village appointment pilot

The `staging` branch runs the booking pilot at
`https://staging.our-village.co.za` and the private live-domain workspaces.
Staff enter through `/village-desk` and patients sign in at `/booking/login`.
Both use the same account database and enforce their audience on the server.

## Included in this pilot

- Patient signup on staging, sign-in, contact consent, appointment holds, rescheduling,
  cancellation, private invoices and payment links.
- Doctor first-login password change and a four-step onboarding wizard: profile,
  appointment types/prices/buffers, weekly working periods and publishing.
- Each doctor has their own list/week calendar, time off and appointment actions.
  Every access check is enforced server-side, not just by hiding UI links.
- Admin user management covers patients, receptionists, doctors and administrators,
  with account creation, edits, temporary passwords, deactivation and audit.
- Reception has a read-only directory of patient names, emails and phone numbers.
- All payment collection is for one Our Village Yoco account. Prices and invoices
  use integer ZAR cents. Existing invoice details and prices are snapshots.
- A booking is held for 15 minutes. Overlap checks, buffers and invoice creation
  run in one SQLite write transaction. Payment after expiry is flagged for manual
  review rather than taking another patient's slot.
- Printable invoices support the browser's Save as PDF. These remain explicitly
  watermarked **STAGING — NOT A TAX INVOICE**. No medical-aid claims are produced.
- Yoco hosted checkout integration and raw-body HMAC webhook verification,
  timestamp tolerance, checkout/amount/currency/test-mode checks and event dedupe.
  Without client credentials, checkout is disabled, not silently simulated.
- Admin payment simulations are labelled **NO MONEY RECEIVED** and recorded
  separately from Yoco test payments.

## Safety boundaries and deliberate limitations

No emails are sent. There is no email verification, email recovery or SMTP
transport configured. The admin provisions test staff credentials and can reset
doctor/patient passwords, revoking their sessions and forcing a password change.
Use test data only. Do not enter clinical notes, diagnoses, identity numbers,
medical-aid details or card data. This is not a production-ready clinical record
system and is not represented as legally compliant patient software.

Doctor fees/hours are empty until the doctor/admin deliberately configures them.
The initial doctor is Dr Natasha Bartie. New doctors must complete the same flow.
Booking notice, booking horizon and online-change cutoff are editable settings
that must be reviewed by the practice. A paid cancellation requires manual refund
review: this pilot does **not** execute refunds or claim one was issued.

Before real patient use, complete practice acceptance testing, an independent
security/operational review, privacy/consent and retention policies, email
verification and recovery, financial/tax review, backup/restore testing, production
Yoco tests and approved cancellation/refund procedures. Authentication is currently
password-based; MFA and automated reminders are future work.

## What we need from the client for Yoco

1. Enable the **Checkout API** integration in the Yoco App and confirm the merchant
   account and settlement setup belong to the intended Our Village business.
2. Share the **test secret key** (`sk_test_…`) using the approved secret vault or
   another secure credential handover, never chat or source control. This hosted
   server-side flow does not require embedding a public key in the frontend.
3. We register the callback and securely retain its returned `whsec_…` verification
   secret. Do not delete existing account webhooks to make room without approval.
4. For a later live launch, the client must get the intended public website domain
   reviewed by Yoco, supply the resulting live secret through the vault and approve
   fees, billing identity and refund policies. Live keys are deliberately rejected
   by this staging app.

Official references:
[Yoco setup](https://support.yoco.help/en/articles/739322-yoco-checkout-api),
[server-side checkout](https://developer.yoco.com/guides/online-payments/accepting-a-payment),
[signature verification](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events).

## Configuration and deployment

Runtime variables (never commit their values):

```
APP_MODE=staging
BETTER_AUTH_URL=https://staging.our-village.co.za
BETTER_AUTH_SECRET=<isolated randomly generated secret, at least 32 characters>
BOOKING_DATABASE_PATH=/data/bookings.db
BOOKING_ADMIN_EMAIL=<initial staging admin identity>
BOOKING_ADMIN_PASSWORD=<temporary password>
BOOKING_DOCTOR_EMAIL=<initial staging doctor identity>
BOOKING_DOCTOR_PASSWORD=<temporary password>
EMAIL_MODE=off
ENABLE_STAGING_SIMULATIONS=true
YOCO_SECRET_KEY=<empty until the client's sk_test_ key is securely configured>
YOCO_WEBHOOK_SECRET=<empty until the callback has been registered>
```

The new database volume is `ourvillage-web-staging_booking_data`. The previous
staging calendar volume `ourvillage-web-staging_ourvillage_data` and old application
directory `/opt/ourvillage-web-staging` are preserved for rollback, including their
existing events and RSVPs. Never point this app at the public website's database.

The existing repository's **self-hosted** `our-village` runner builds and tests
this app on pushes to `staging`. No GitHub-hosted runner or fallback is permitted.
Staging uses `/opt/ourvillage-booking-staging` and a separately provisioned `.env`;
the deployment must not overwrite it with production GitHub secrets. The runtime
container is non-root, read-only except for its private data volume and `/tmp`.

`ops/bootstrap-staging.cjs` is a root-run, idempotent server bootstrap. It adds a
new Nginx review user without rotating the existing one and writes initial app
credentials outside the checkout, with mode 0600. The app's admin and doctor
passwords must be changed at first login; the Nginx gate is independent.

On staging, browser routes and ordinary API routes are behind Nginx basic auth.
**Only** `POST /api/payments/yoco/webhook` is exempt so Yoco can deliver events;
the application rejects unverified requests. Do not exempt the whole `/api` path.
Cloudflare source restrictions, strict TLS and no-index/no-cache headers apply.

`compose.preview.yml` runs the tested image for patients and for staff.
They share the mode-0600 `.env.booking-preview` and the
`ourvillage-booking-preview_booking_data` volume. Provision the initial named
administrator with `BOOKING_ADMIN_*` and a separate `BETTER_AUTH_SECRET`, then
create additional accounts in the admin panel. The live preview rejects reserved
test addresses and public sign-ups. Both services validate the same host-only
session cookie and restrict the workspace by role. The Desk additionally reads
`.env.booking-desk` for Turnstile. The existing event planner validates the Desk
session over the internal `ourvillage-desk-auth` network.
This preview uses admin payment simulations.
`ops/live-preview.nginx.conf` is included only by the production www vhost.

To register the callback once credentials are available, use Yoco's server-side
webhook registration endpoint with the URL:
`https://staging.our-village.co.za/api/payments/yoco/webhook`.
Never log the registration response: its verification secret is shown only once.

## Local verification

Use Node >=24.15. Set the staging env vars and an isolated temporary database.
Run `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, then
`node .output/server/index.mjs` with the configured local `BETTER_AUTH_URL`.
Do not reuse a real practice database for development.

Domain tests cover timezones, schedule validation, onboarding, doctor/patient
isolation, buffer conflicts, reservation idempotency and rollback, invoice
snapshots, expired holds, private payment links, raw-body signatures, replay
rejection, amount/mode/currency matching, event deduplication, late-payment review
and simulated-payment cancellation handling.

The 2 November 2026 local browser review exercised doctor password change and
onboarding, patient registration and contact consent, reservations, invoices,
private payment links, admin payment simulations, patient rescheduling, privilege
escalation attempts and cross-account isolation. Three concurrent requests for one
slot produced one reservation and two conflicts at the server-authoritative price.
Responsive page/calendar checks passed at 320, 390, 768 and 1440 pixels, with no
page overflow or browser runtime errors. Actual Yoco checkout remains unverified
until the client's test key and webhook secret are configured.

The previous staging database was backed up to
`/data/backups/pre-booking-pilot-20261102.db` in its original volume, with 85 events
and 2 RSVPs verified against the backup. Its image is retained as
`ourvillage-staging-rollback:pre-booking-20261102`. For rollback, stop the new
staging container, start the preserved old compose project from
`/opt/ourvillage-web-staging`, and restore the backed-up staging Nginx vhost after
`nginx -t`. Never remove either data volume during deployment or rollback.
