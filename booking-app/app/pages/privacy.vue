<template>
  <section class="wrap section prose">
    <p class="eyebrow">Private staging</p>
    <h1>Privacy &amp; safety notice</h1>
    <h2>Use test information only</h2>
    <p>
      This is an access-controlled testing environment, not a production patient
      service. Do not enter identity numbers, clinical notes, diagnoses,
      medical-aid details, sensitive health information or real payment-card
      data.
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
      Only Yoco test credentials can be configured. Administrator simulations
      are labelled and do not charge or receive money. Invoice documents are
      test documents, not production tax invoices or medical-aid claims. A
      returned checkout page is not proof of payment.
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
