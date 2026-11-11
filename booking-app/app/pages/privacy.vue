<script setup lang="ts">
const { data: config } = await useFetch<any>(useBookingPath("/api/public/config"));
</script>

<template>
  <section class="wrap section prose">
    <p class="eyebrow">Our Village appointments</p>
    <h1>Privacy &amp; safety notice</h1>
    <h2>Information you share</h2>
    <p>
      Enter only the contact details needed to manage your appointment. Keep
      identity numbers, clinical notes, diagnoses and medical-aid details out of
      the booking form. Use test information while payments are in test mode.
    </p>
    <h2>What this pilot stores</h2>
    <p>
      Account names, email addresses, password hashes, contact numbers,
      appointment times, appointment types, invoice snapshots, payment
      references and an activity audit trail. Passwords are hashed by the
      authentication system, not stored in plaintext. Doctors can access only
      their own bookings; practice administrators manage the pilot.
    </p>
    <h2>No email delivery</h2>
    <p>
      Registration, appointment and invoice emails are intentionally disabled.
      There is no email verification or email password recovery in this pilot.
      Testing access and temporary passwords must be shared securely by the
      administrator.
    </p>
    <h2>Payments and invoices</h2>
    <p>
      {{ config?.mode === "live" ? "New invoices use live Yoco checkout and can charge real money." : "Test invoices and administrator simulations use no real money." }}
      Enter card details on Yoco’s hosted checkout. Our Village confirms
      payment after verifying Yoco’s notification.
    </p>
    <h2>Before a public launch</h2>
    <p>
      The practice must approve patient consent and privacy terms, retention and
      deletion policies, billing identity and tax treatment, fees, working
      hours, cancellation and refund policies, email verification and recovery,
      and the production payment setup. Real patient use needs a separate
      security and operational review.
    </p>
    <h2>Need urgent care?</h2>
    <p>
      This booking system is not an emergency service. Use your usual emergency
      or urgent-care service if immediate medical attention is needed.
    </p>
    <NuxtLink to="/" class="button secondary">Back to appointments</NuxtLink>
  </section>
</template>
