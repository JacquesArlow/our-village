<script setup lang="ts">
import { addCalendarDays, type AvailabilityWeek, type CalendarSlot } from "~~/shared/calendar";

const doctorPhoto = useBookingPath("/natasha.webp");
const bookingFetch = useBookingRequest();
const route = useRoute();
const router = useRouter();
const { account, refresh } = useAccount();
const { money, clock, today, dateLabel, message } = useBookingUi();
const { data: doctors, error: directoryError } = await useFetch<any[]>(
  useBookingPath("/api/public/doctors"),
);
const doctor = computed(() => doctors.value?.find((item) => item.id === route.params.id));
if (directoryError.value) throw directoryError.value;
if (!doctor.value)
  throw createError({ statusCode: 404, statusMessage: "Doctor not found" });

const firstDate = today();
const requestedService = doctor.value.services.find((item: any) => item.id === route.query.service);
const serviceId = ref(requestedService?.id || doctor.value.services[0]?.id || "");
const requestedDate = typeof route.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(route.query.date)
  ? route.query.date
  : "";
const dateMs = Date.parse(requestedDate + "T00:00:00Z");
const initialDate = Number.isFinite(dateMs) && new Date(dateMs).toISOString().slice(0, 10) === requestedDate && requestedDate >= firstDate
  ? requestedDate
  : "";
const weekFrom = ref(initialDate || firstDate);
const day = ref(initialDate);
const selection = ref<{ slot: CalendarSlot; requestKey?: string }>();
const review = ref<HTMLElement>();
const busy = ref(false);
const error = ref("");
const {
  data: availability,
  refresh: refreshAvailability,
  status,
  error: availabilityError,
} = await useFetch<AvailabilityWeek>(useBookingPath("/api/public/availability"), {
  query: { serviceId, from: weekFrom },
});
const service = computed(() => doctor.value?.services.find((item: any) => item.id === serviceId.value));
const available = computed(
  () => availability.value?.days.find((item) => item.date === day.value)?.slots || [],
);
const timeGroups = computed(() => {
  const groups: { label: string; slots: CalendarSlot[] }[] = [
    { label: "Morning", slots: [] },
    { label: "Afternoon", slots: [] },
    { label: "Evening", slots: [] },
  ];
  for (const slot of available.value) {
    const hour = (new Date(slot.start).getUTCHours() + 2) % 24;
    groups[hour < 12 ? 0 : hour < 17 ? 1 : 2]!.slots.push(slot);
  }
  return groups.filter((group) => group.slots.length);
});
watch(serviceId, () => {
  day.value = "";
});
watch(availability, (week) => {
  if (week?.days.some((item) => item.date === day.value)) return;
  day.value = week?.days.find((item) => item.slots.length)?.date ?? week?.days[0]?.date ?? "";
}, { immediate: true });
const restored = available.value.find((slot) => slot.start === route.query.start);
if (restored) selection.value = { slot: restored };
else if (typeof route.query.start === "string" && availability.value)
  error.value = "That time is no longer available. Please choose another time.";
watch([serviceId, weekFrom, day], () => {
  selection.value = undefined;
  error.value = "";
});
const returnToSlot = computed(() => router.resolve({
  path: route.path,
  query: { service: serviceId.value, date: day.value, start: selection.value?.slot.start },
}).fullPath);

function shiftWeek(direction: number) {
  const next = addCalendarDays(weekFrom.value, direction * 7);
  day.value = "";
  weekFrom.value = next < firstDate ? firstDate : next;
}

function jumpToDate(date: string) {
  if (!date || date < firstDate || !availability.value || date > availability.value.lastDate) return;
  day.value = date;
  if (!availability.value.days.some((item) => item.date === date)) weekFrom.value = date;
}

async function selectSlot(slot: CalendarSlot) {
  if (selection.value?.slot.start !== slot.start)
    selection.value = { slot };
  await nextTick();
  review.value?.focus();
}

async function book() {
  const selected = selection.value;
  if (!selected || busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await refresh();
    if (!account.value) {
      await navigateTo({ path: "/sign-in", query: { next: returnToSlot.value } });
      return;
    }
    if (account.value.user.role !== "patient") {
      error.value = "Use a patient account to book for yourself. Administrators can book for patients from the admin workspace.";
      return;
    }
    if (!account.value.patient) {
      await navigateTo({ path: "/account", query: { next: returnToSlot.value } });
      return;
    }
    const config = await bookingFetch<{ mode: string }>("/api/public/config");
    selected.requestKey ??= crypto.randomUUID();
    const result = await bookingFetch<any>("/api/appointments", {
      method: "POST",
      body: {
        serviceId: serviceId.value,
        start: selected.slot.start,
        requestKey: selected.requestKey,
        paymentMode: config.mode,
      },
    });
    await navigateTo("/invoices/" + result.invoice.id);
  } catch (e) {
    error.value = message(e);
    await refreshAvailability();
    if (
      (e as { statusCode?: number }).statusCode === 409 &&
      !available.value.some((slot) => slot.start === selected.slot.start)
    ) selection.value = undefined;
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
      </aside>
      <div class="panel booking-calendar">
        <h2>Book an appointment</h2>
        <label for="appointment-type">Appointment type</label>
        <select id="appointment-type" v-model="serviceId" :disabled="busy">
          <option v-for="item in doctor.services" :key="item.id" :value="item.id">
            {{ item.name }} · {{ item.duration_minutes }} min · {{ money(item.amount_cents) }}
          </option>
        </select>
        <p class="hint">All times are South African time (SAST).</p>
        <div class="booking-calendar-heading">
          <h3>Choose a date</h3>
          <div class="actions">
            <button
              type="button"
              class="button small secondary"
              :disabled="busy || status === 'pending' || weekFrom <= firstDate"
              @click="shiftWeek(-1)"
            >← Previous week</button>
            <button
              type="button"
              class="button small secondary"
              :disabled="busy || status === 'pending' || !availability || addCalendarDays(weekFrom, 7) > availability.lastDate"
              @click="shiftWeek(1)"
            >Next week →</button>
          </div>
        </div>
        <p v-if="status === 'pending'" class="notice" role="status">Loading available times…</p>
        <p v-else-if="availabilityError" class="notice error" role="alert">
          {{ message(availabilityError) }}
          <button type="button" class="button small ghost" @click="refreshAvailability()">Try again</button>
        </p>
        <template v-else-if="availability">
          <div class="booking-days" role="group" aria-label="Appointment dates">
            <button
              v-for="item in availability.days"
              :key="item.date"
              type="button"
              class="booking-day"
              :class="{ 'is-selected': item.date === day, 'has-slots': item.slots.length }"
              :disabled="busy"
              :aria-pressed="item.date === day"
              @click="day = item.date"
            >
              <strong>{{ dateLabel(item.date) }}</strong>
              <small>{{ item.slots.length ? item.slots.length + (item.slots.length === 1 ? ' time' : ' times') : 'No times' }}</small>
            </button>
          </div>
          <div class="calendar-jump">
            <label for="appointment-date">Jump to date</label>
            <input
              id="appointment-date"
              type="date"
              :value="day"
              :min="firstDate"
              :max="availability.lastDate"
              :disabled="busy"
              @change="jumpToDate(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="booking-times">
            <h3 v-if="day">{{ dateLabel(day, true) }}</h3>
            <div v-if="!available.length" class="empty">
              <p>{{ day ? 'No available times on this date.' : 'No further dates are open for booking.' }}</p>
              <button
                v-if="availability.nextAvailable"
                type="button"
                class="button small secondary"
                :disabled="busy"
                @click="jumpToDate(availability.nextAvailable)"
              >Next available · {{ dateLabel(availability.nextAvailable) }}</button>
            </div>
            <section v-for="group in timeGroups" :key="group.label" class="booking-time-group">
              <h4>{{ group.label }}</h4>
              <div class="slot-grid" role="group" :aria-label="group.label + ' appointment times'">
                <button
                  v-for="slot in group.slots"
                  :key="slot.start"
                  type="button"
                  class="slot"
                  :class="{ 'is-selected': selection?.slot.start === slot.start }"
                  :aria-pressed="selection?.slot.start === slot.start"
                  :disabled="busy"
                  @click="selectSlot(slot)"
                >{{ clock(slot.start) }}</button>
              </div>
            </section>
          </div>
        </template>
        <p v-if="error" class="notice error" role="alert">{{ error }}</p>
        <section v-if="selection && service" class="booking-review" aria-labelledby="booking-review-title">
          <h3 id="booking-review-title" ref="review" tabindex="-1">Review your appointment</h3>
          <p>{{ service.name }} · {{ dateLabel(day, true) }} · {{ clock(selection.slot.start) }} SAST</p>
          <p>{{ service.duration_minutes }} minutes · {{ money(service.amount_cents) }}</p>
          <template v-if="account">
            <p class="hint">Reserve this time to hold it for 15 minutes while you pay.</p>
            <button type="button" class="button" :disabled="busy" @click="book()">
              {{ busy ? 'Reserving…' : 'Reserve and continue' }}
            </button>
          </template>
          <template v-else>
            <p class="hint">Sign in or create a patient account to reserve this time.</p>
            <div class="actions">
              <NuxtLink :to="{ path: '/sign-up', query: { next: returnToSlot } }" class="button">Register to book</NuxtLink>
              <NuxtLink :to="{ path: '/sign-in', query: { next: returnToSlot } }" class="button secondary">Sign in to book</NuxtLink>
            </div>
          </template>
        </section>
      </div>
    </div>
  </section>
</template>
