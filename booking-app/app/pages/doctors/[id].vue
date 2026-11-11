<script setup lang="ts">
const doctorPhoto = useBookingPath("/natasha.webp");
const bookingFetch = useBookingRequest();
const route = useRoute(),
  { account, refresh } = useAccount(),
  { money, clock, today, message } = useBookingUi();
const { data: doctors, error: directoryError } = await useFetch<any[]>(
  useBookingPath("/api/public/doctors"),
);
const { data: config, refresh: refreshConfig } = await useFetch<any>(useBookingPath("/api/public/config"));
const doctor = computed(() =>
  doctors.value?.find((d) => d.id === route.params.id),
);
if (directoryError.value) throw directoryError.value;
if (!doctor.value)
  throw createError({ statusCode: 404, statusMessage: "Doctor not found" });
const serviceId = ref(doctor.value.services[0]?.id || ""),
  day = ref(today()),
  busy = ref(false),
  error = ref(""),
  requestKey = ref("");
const {
  data: available,
  refresh: refreshSlots,
  status,
} = await useFetch<any[]>(useBookingPath("/api/public/slots"), {
  query: { serviceId, date: day },
  immediate: !!serviceId.value,
  watch: [serviceId, day],
});
const service = computed(() =>
  doctor.value?.services.find((s: any) => s.id === serviceId.value),
);
watch([serviceId, day], () => {
  requestKey.value = "";
  error.value = "";
});
async function book(slot: any) {
  busy.value = true;
  error.value = "";
  try {
    await refresh();
    if (!account.value) {
      await navigateTo(
        "/sign-in?next=" + encodeURIComponent("/doctors/" + doctor.value.id),
      );
      return;
    }
    if (account.value.user.role !== "patient") {
      error.value =
        "Use a patient account to book for yourself. Administrators can book for patients from the admin workspace.";
      return;
    }
    if (!account.value.patient) {
      await navigateTo(
        "/account?next=" + encodeURIComponent("/doctors/" + doctor.value.id),
      );
      return;
    }
    requestKey.value ||= crypto.randomUUID();
    const result = await bookingFetch<any>("/api/appointments", {
      method: "POST",
      body: {
        serviceId: serviceId.value,
        start: slot.start,
        requestKey: requestKey.value,
        paymentMode: config.value?.mode,
      },
    });
    await navigateTo("/invoices/" + result.invoice.id);
  } catch (e) {
    error.value = message(e);
    await Promise.all([refreshSlots(), refreshConfig()]);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section v-if="doctor" class="wrap section">
    <NuxtLink to="/#doctors" class="back-link">← All doctors</NuxtLink>
    <div class="section-heading">
      <div>
        <p class="eyebrow">Your doctor’s calendar</p>
        <h1>{{ doctor.name }}</h1>
        <p class="role">{{ doctor.title }}</p>
      </div>
      <p>{{ doctor.location }}</p>
    </div>
    <div class="booking-layout">
      <aside class="panel">
        <img
          v-if="doctor.id === 'dr-natasha-bartie'"
          :src="doctorPhoto"
          :alt="doctor.name"
          class="profile-photo"
        />
        <p>{{ doctor.description }}</p>
        <p class="notice">
          All appointment times are SAST (UTC+02:00).
          <template v-if="config?.mode === 'test'">Payments are in test mode.</template>
        </p>
      </aside>
      <div class="panel">
        <template v-if="doctor.services.length"
          ><h2>Choose your appointment</h2>
          <label
            >Appointment type<select v-model="serviceId">
              <option v-for="s in doctor.services" :key="s.id" :value="s.id">
                {{ s.name }} · {{ s.duration_minutes }} min ·
                {{ money(s.amount_cents) }}
              </option>
            </select></label
          ><label
            >Date<input v-model="day" type="date" :min="today()" required
          /></label>
          <p v-if="service" class="muted">
            {{ service.duration_minutes }} minutes ·
            {{ money(service.amount_cents) }} · payment is needed to confirm the
            reserved slot.
          </p>
          <p v-if="error" class="notice error" role="alert">{{ error }}</p>
          <p v-if="status === 'pending'" role="status">
            Loading available times…
          </p>
          <div v-else-if="available?.length" class="slot-grid">
            <button
              v-for="slot in available"
              :key="slot.start"
              class="slot"
              :disabled="busy"
              @click="book(slot)"
            >
              {{ clock(slot.start)
              }}<small>{{ busy ? "Please wait" : "Reserve time" }}</small>
            </button>
          </div>
          <div v-else class="empty">
            No available times on this date. Try another date or appointment
            type.
          </div>
          <p class="hint">
            Choosing a slot reserves it for 15 minutes. It is confirmed only
            after payment is verified.
          </p></template
        >
      </div>
    </div>
  </section>
</template>
