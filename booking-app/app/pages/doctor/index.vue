<script setup lang="ts">
import { addCalendarDays, mondayOf } from "~~/shared/calendar";

definePageMeta({ middleware: "account" });
const bookingFetch = useBookingRequest();
const route = useRoute();
const { account } = useAccount();
const { today, dayOf, dateLabel, when, toIso, message } = useBookingUi();
const admin = account.value.user.role === "admin";
const doctorId = admin && typeof route.query.doctorId === "string" ? route.query.doctorId : undefined;
const currentDate = today();
const day = ref(currentDate);
const weekStart = computed(() => mondayOf(day.value));
const view = ref<"agenda" | "week" | "day">("agenda");
const includeClosed = ref(false);
const error = ref("");
const notice = ref("");
const busy = ref(false);
const { data, status, error: loadError, refresh } = await useFetch<any>(useBookingPath("/api/manage"), {
  query: { doctorId, date: weekStart },
});
const setupLink = "/doctor/get-started" + (doctorId ? "?doctorId=" + encodeURIComponent(doctorId) : "");
const settingsLink = setupLink + (doctorId ? "&" : "?") + "section=hours";
if (data.value && !data.value.doctor.onboarded)
  await navigateTo(setupLink, { replace: true });

const block = reactive({
  allDay: true,
  first: currentDate,
  last: currentDate,
  start: "",
  end: "",
  label: "Unavailable",
});
watch(() => block.first, (date) => {
  if (block.last < date) block.last = date;
});
const days = computed(() => {
  const hours = JSON.parse(data.value?.doctor.weekly_hours || "[]") as { day: number }[];
  return Array.from({ length: 7 }, (_, index) => {
    const date = addCalendarDays(weekStart.value, index);
    const start = toIso(date + "T00:00");
    const end = toIso(addCalendarDays(date, 1) + "T00:00");
    return {
      date,
      working: hours.some((period) => period.day === (index + 1) % 7),
      appointments: (data.value?.appointments || []).filter(
        (row: any) => dayOf(row.start_at) === date && (includeClosed.value || !["cancelled", "expired"].includes(row.status)),
      ),
      blocks: (data.value?.blocks || []).filter((item: any) => item.start_at < end && item.end_at > start),
    };
  });
});
const agendaDays = computed(() =>
  view.value === "day"
    ? days.value.filter((item) => item.date === day.value)
    : days.value.filter((item) => item.appointments.length || item.blocks.length),
);
const dateRange = computed(() =>
  view.value === "day"
    ? dateLabel(day.value, true)
    : dateLabel(weekStart.value) + " – " + dateLabel(addCalendarDays(weekStart.value, 6)),
);

function shift(direction: number) {
  day.value = addCalendarDays(day.value, direction * (view.value === "day" ? 1 : 7));
}
function showDay(date: string) {
  day.value = date;
  view.value = "day";
}
function useCalendarDate() {
  block.first = block.last = day.value;
  block.start = day.value + "T09:00";
  block.end = day.value + "T17:00";
}
function formatBlock(item: { start_at: string; end_at: string }) {
  const start = dayOf(item.start_at);
  const end = dayOf(item.end_at);
  if (item.start_at === toIso(start + "T00:00") && item.end_at === toIso(end + "T00:00")) {
    const last = addCalendarDays(end, -1);
    return start === last ? dateLabel(start, true) + " · All day" : dateLabel(start) + " – " + dateLabel(last) + " · All day";
  }
  return when(item.start_at) + " – " + when(item.end_at);
}
async function addBlock() {
  busy.value = true;
  error.value = notice.value = "";
  try {
    const start = block.allDay ? block.first + "T00:00" : block.start;
    const end = block.allDay ? addCalendarDays(block.last, 1) + "T00:00" : block.end;
    if (end <= start) {
      error.value = "Choose an end date and time after the start.";
      return;
    }
    await bookingFetch("/api/manage/blocks", {
      method: "POST",
      body: { doctorId: data.value.doctor.id, start: toIso(start), end: toIso(end), label: block.label },
    });
    day.value = start.slice(0, 10);
    notice.value = "Time off saved.";
    await refresh();
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
async function removeBlock(id: string) {
  busy.value = true;
  error.value = notice.value = "";
  try {
    await bookingFetch("/api/manage/blocks/" + id, { method: "DELETE", body: {} });
    notice.value = "Time off removed.";
    await refresh();
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="wrap section">
    <template v-if="data?.doctor.onboarded">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Doctor workspace</p>
          <h1>{{ data.doctor.name }}</h1>
          <p>{{ data.doctor.active ? "Online bookings open" : "Online bookings paused" }} · SAST</p>
        </div>
        <div class="actions">
          <NuxtLink v-if="admin" to="/admin" class="button secondary">Admin console</NuxtLink>
          <NuxtLink :to="settingsLink" class="button">Calendar settings</NuxtLink>
        </div>
      </div>

      <div class="calendar-toolbar panel">
        <div class="doctor-calendar-nav">
          <h2 aria-live="polite">{{ dateRange }}</h2>
          <div class="actions">
            <button type="button" class="button small secondary" :aria-label="view === 'day' ? 'Previous day' : 'Previous week'" @click="shift(-1)">← Previous</button>
            <button type="button" class="button small secondary" @click="day = currentDate">Today</button>
            <button type="button" class="button small secondary" :aria-label="view === 'day' ? 'Next day' : 'Next week'" @click="shift(1)">Next →</button>
          </div>
        </div>
        <div class="calendar-view-controls">
          <label for="doctor-calendar-date">Jump to date</label>
          <input id="doctor-calendar-date" :value="day" type="date" @change="day = ($event.target as HTMLInputElement).value || day" />
          <div class="segmented" role="group" aria-label="Calendar view">
            <button v-for="option in (['agenda', 'week', 'day'] as const)" :key="option" type="button" :aria-pressed="view === option" :class="{ selected: view === option }" @click="view = option">
              {{ option[0]!.toUpperCase() + option.slice(1) }}
            </button>
          </div>
        </div>
      </div>

      <label class="check calendar-status-filter">
        <input v-model="includeClosed" type="checkbox" />
        Show cancelled and expired appointments
      </label>
      <p v-if="status === 'pending'" class="notice" role="status">Loading calendar…</p>
      <p v-else-if="loadError" class="notice error" role="alert">
        {{ message(loadError) }}
        <button type="button" class="button small ghost" @click="refresh()">Try again</button>
      </p>
      <div v-else-if="view === 'week'" class="booking-days doctor-week" role="group" aria-label="Days this week">
        <button v-for="item in days" :key="item.date" type="button" class="booking-day" :class="{ 'has-slots': item.appointments.length, 'is-selected': item.date === day }" @click="showDay(item.date)">
          <strong>{{ dateLabel(item.date) }}</strong>
          <small>{{ item.appointments.length ? item.appointments.length + (item.appointments.length === 1 ? ' visit' : ' visits') : item.working ? 'No visits' : 'Outside regular hours' }}</small>
          <small v-if="item.blocks.length">Time off</small>
        </button>
      </div>
      <div v-else class="doctor-agenda">
        <section v-for="item in agendaDays" :key="item.date" class="panel">
          <h3>{{ dateLabel(item.date, true) }}</h3>
          <ul v-if="item.blocks.length" class="calendar-blocks">
            <li v-for="period in item.blocks" :key="period.id">
              <strong>{{ period.label }}</strong> · {{ formatBlock(period) }}
            </li>
          </ul>
          <AppointmentList :records="item.appointments" staff @changed="refresh()" />
        </section>
        <p v-if="!agendaDays.length" class="empty">No appointments or time off this week.</p>
      </div>

      <div class="dashboard-grid spaced">
        <form class="panel form-panel" @submit.prevent="addBlock">
          <div class="booking-calendar-heading">
            <h2>Block time off</h2>
            <button type="button" class="button small secondary" :disabled="busy" @click="useCalendarDate">Use calendar date</button>
          </div>
          <p class="hint">Move or cancel any overlapping bookings before blocking time.</p>
          <label class="check"><input v-model="block.allDay" type="checkbox" /> All day</label>
          <div v-if="block.allDay" class="two-cols">
            <label>First day<input v-model="block.first" type="date" required /></label>
            <label>Last day (inclusive)<input v-model="block.last" type="date" :min="block.first" required /></label>
          </div>
          <div v-else class="two-cols">
            <label>From (SAST)<input v-model="block.start" type="datetime-local" required /></label>
            <label>Until (SAST)<input v-model="block.end" type="datetime-local" :min="block.start" required /></label>
          </div>
          <label>Calendar label<input v-model="block.label" maxlength="120" required /></label>
          <p v-if="error" class="notice error" role="alert">{{ error }}</p>
          <p v-if="notice" class="notice success" role="status">{{ notice }}</p>
          <button type="submit" class="button secondary" :disabled="busy">Block time</button>
        </form>
        <section class="panel">
          <h2>Blocked periods</h2>
          <div v-for="period in data.blocks" :key="period.id" class="service-row">
            <div><strong>{{ period.label }}</strong><small>{{ formatBlock(period) }}</small></div>
            <button type="button" class="button small ghost danger" :disabled="busy" @click="removeBlock(period.id)">Remove</button>
          </div>
          <p v-if="!data.blocks.length" class="empty">No time off configured.</p>
        </section>
      </div>
    </template>
    <p v-else-if="status === 'pending'" class="notice" role="status">Loading calendar…</p>
    <p v-else class="notice error" role="alert">
      {{ loadError ? message(loadError) : "Choose a doctor from the admin console to open their calendar." }}
    </p>
  </section>
</template>
