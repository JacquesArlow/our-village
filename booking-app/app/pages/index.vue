<script setup lang="ts">
const { data: doctors, error } = await useFetch<any[]>("/api/public/doctors");
</script>
<template>
  <section class="hero">
    <div class="wrap">
      <p class="eyebrow">Your health. Your village.</p>
      <h1>Care that fits<br />your day.</h1>
      <p class="lede">
        Find your doctor, choose a time and manage your appointments in one
        calm, connected space.
      </p>
      <div class="hero-actions">
        <a href="#doctors" class="button">Explore doctors</a
        ><NuxtLink to="/sign-up" class="button secondary"
          >Create a patient account</NuxtLink
        >
      </div>
      <p class="muted">
        A private preview of Our Village’s new booking experience.
      </p>
    </div>
  </section>
  <section id="doctors" class="wrap section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Meet your care team</p>
        <h2>Choose your doctor</h2>
      </div>
      <p>Online bookings open once each doctor has completed their setup.</p>
    </div>
    <p v-if="error" class="notice error">
      We couldn’t load the doctors. Please refresh and try again.
    </p>
    <div class="cards">
      <article v-for="doctor in doctors" :key="doctor.id" class="doctor-card">
        <img
          v-if="doctor.id === 'dr-natasha-bartie'"
          src="/natasha.webp"
          alt="Dr Natasha Bartie"
          class="doctor-photo"
        />
        <div v-else class="doctor-monogram" aria-hidden="true">
          {{
            doctor.name
              .split(" ")
              .filter((part: string) => part !== "Dr")
              .map((part: string) => part[0])
              .slice(0, 2)
              .join("")
          }}
        </div>
        <div class="card-body">
          <span class="badge" :class="doctor.onboarded ? 'success' : ''">{{
            doctor.onboarded ? "Bookings open" : "Setup in progress"
          }}</span>
          <h3>{{ doctor.name }}</h3>
          <p class="role">{{ doctor.title || "Doctor at Our Village" }}</p>
          <p>
            {{
              doctor.description ||
              "A member of Our Village’s growing care team."
            }}
          </p>
          <p class="muted">{{ doctor.location }}</p>
          <NuxtLink :to="'/doctors/' + doctor.id" class="button secondary"
            >View calendar &amp; appointments</NuxtLink
          >
        </div>
      </article>
    </div>
    <div v-if="!doctors?.length && !error" class="empty">
      Our care team is being set up. Please check back soon.
    </div>
  </section>
  <section class="soft-section">
    <div class="wrap three-cols">
      <div>
        <span class="step-number">01</span>
        <h3>Your own patient account</h3>
        <p>
          Keep track of upcoming visits and invoices without chasing messages.
        </p>
      </div>
      <div>
        <span class="step-number">02</span>
        <h3>A calendar for each doctor</h3>
        <p>
          See the appointment types and times your doctor has made available.
        </p>
      </div>
      <div>
        <span class="step-number">03</span>
        <h3>A clear payment trail</h3>
        <p>
          Secure hosted checkout when connected, with invoices and verified
          payment updates.
        </p>
      </div>
    </div>
  </section>
  <section class="wrap section">
    <div class="notice">
      <strong>This pilot is not an emergency service.</strong> Online bookings
      are not monitored for urgent medical needs. Please use your usual
      emergency or urgent-care service when immediate assistance is needed.
    </div>
  </section>
</template>
