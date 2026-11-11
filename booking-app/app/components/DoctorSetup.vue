<script setup lang="ts">
import { bookingIntervals } from "~~/shared/calendar";

const bookingFetch = useBookingRequest();
const props = defineProps<{ doctorId?: string; initialStep: number }>(),
  { message, money } = useBookingUi();
const {
  data,
  refresh,
  error: loadError,
} = await useFetch<any>(useBookingPath("/api/manage"), { query: { doctorId: props.doctorId } });
const source = data.value?.doctor;
const step = ref(source?.onboarded ? props.initialStep : 1),
  error = ref(""),
  saved = ref(""),
  busy = ref(false);
const model = reactive({
  name: source?.name || "",
  title: source?.title || "",
  description: source?.description || "",
  location: source?.location || "",
  active: !!source?.active,
  weeklyHours: JSON.parse(source?.weekly_hours || "[]") as { day: number; start: string; end: string }[],
  minNoticeHours: source?.min_notice_hours ?? 24,
  horizonDays: source?.horizon_days ?? 60,
  cancellationHours: source?.cancellation_hours ?? 24,
  slotIntervalMinutes: source?.slot_interval_minutes ?? 15,
});
const type = reactive({
  id: "",
  name: "",
  durationMinutes: 30,
  bufferMinutes: 0,
  price: "",
  active: true,
});
const days = [
  { label: "Monday", value: 1 }, { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 }, { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 }, { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
] as const;
const calendarLink = "/doctor" + (props.doctorId ? "?doctorId=" + encodeURIComponent(props.doctorId) : "");
const weekdayNumbers = [1, 2, 3, 4, 5];
const mondayHours = computed(() => model.weeklyHours.filter((period) => period.day === 1));

function setWeekdays() {
  model.weeklyHours = weekdayNumbers.map((day) => ({ day, start: "09:00", end: "17:00" }));
}

function copyMonday() {
  const weekdays = weekdayNumbers.slice(1);
  if (
    model.weeklyHours.some((period) => weekdays.includes(period.day)) &&
    !window.confirm("Replace the draft hours for Tuesday to Friday with Monday’s hours?")
  ) return;
  model.weeklyHours = [
    ...model.weeklyHours.filter((period) => !weekdays.includes(period.day)),
    ...weekdays.flatMap((day) => mondayHours.value.map((period) => ({ ...period, day }))),
  ];
}

function addPeriod(day: number) {
  error.value = "";
  const periods = model.weeklyHours.filter((period) => period.day === day);
  if (!periods.length) {
    model.weeklyHours.push({ day, start: "09:00", end: "17:00" });
    return;
  }
  const minute = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const time = (minutes: number) => new Date(minutes * 60000).toISOString().slice(11, 16);
  const ordered = [...periods].sort((a, b) => a.start.localeCompare(b.start));
  const after = Math.max(...ordered.map((period) => minute(period.end)));
  if (after < 23 * 60 + 59) {
    model.weeklyHours.push({ day, start: time(after), end: time(Math.min(after + 60, 1439)) });
    return;
  }
  let start = 0;
  for (const period of ordered) {
    const end = minute(period.start);
    if (end > start) {
      model.weeklyHours.push({ day, start: time(Math.max(start, end - 60)), end: period.start });
      return;
    }
    start = Math.max(start, minute(period.end));
  }
  error.value = "There is no free time to add another period on this day.";
}
function clearType() {
  Object.assign(type, {
    id: "",
    name: "",
    durationMinutes: 30,
    bufferMinutes: 0,
    price: "",
    active: true,
  });
}
function editType(s: any) {
  Object.assign(type, {
    id: s.id,
    name: s.name,
    durationMinutes: s.duration_minutes,
    bufferMinutes: s.buffer_minutes,
    price: (s.amount_cents / 100).toFixed(2),
    active: !!s.active,
  });
}
async function saveType() {
  busy.value = true;
  error.value = "";
  try {
    await bookingFetch("/api/manage/services", {
      method: "POST",
      body: {
        ...type,
        id: type.id || undefined,
        doctorId: source.id,
        amountCents: Math.round(Number(type.price) * 100),
      },
    });
    clearType();
    await refresh();
    await refreshNuxtData("public-doctors");
    saved.value = "Appointment type saved.";
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
async function save(publish = false, next = false) {
  busy.value = true;
  error.value = "";
  saved.value = "";
  try {
    await bookingFetch("/api/manage/settings", {
      method: "POST",
      body: {
        ...model,
        doctorId: source.id,
        onboarded: publish || !!data.value.doctor.onboarded,
      },
    });
    await refreshNuxtData("public-doctors");
    saved.value = "Calendar settings saved.";
    if (publish)
      await navigateTo(calendarLink);
    else if (next) step.value = Math.min(4, step.value + 1);
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
function continueServices() {
  if (!data.value?.services.some((s: any) => s.active)) {
    error.value = "Add at least one active appointment type first.";
    return;
  }
  error.value = "";
  step.value = 3;
}
</script>
<template>
  <div v-if="loadError || !source" class="notice error">
    Unable to load this doctor’s setup. Administrators should select a doctor
    from the admin console.
  </div>
  <div v-else>
    <NuxtLink v-if="source.onboarded" :to="calendarLink" class="back-link">← Doctor calendar</NuxtLink>
    <h1>{{ source.onboarded ? 'Calendar settings' : 'Set up your calendar' }}</h1>
    <div class="setup-progress" aria-label="Setup progress">
      <button
        v-for="(label, index) in [
          'Profile',
          'Appointment types',
          'Working hours',
          source.onboarded ? 'Review' : 'Review & open',
        ]"
        :key="label"
        class="progress-step"
        :class="step === index + 1 ? 'current' : ''"
        :aria-current="step === index + 1 ? 'step' : undefined"
        @click="step = index + 1"
      >
        <span>{{ index + 1 }}</span
        >{{ label }}
      </button>
    </div>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="saved" class="notice success" role="status">{{ saved }}</p>
    <section v-if="step === 1" class="panel form-panel">
      <h2>Your professional profile</h2>
      <p>
        This profile appears in the booking directory when your calendar is open.
      </p>
      <label
        >Doctor name<input
          v-model="model.name"
          required
          maxlength="100" /></label
      ><label
        >Professional title<input
          v-model="model.title"
          required
          maxlength="150" /></label
      ><label
        >Short introduction<textarea
          v-model="model.description"
          rows="4"
          maxlength="1500"
        ></textarea></label
      ><label
        >Consultation location<input
          v-model="model.location"
          required
          maxlength="250" /></label
      ><label v-if="!source.onboarded" class="check"
        ><input v-model="model.active" type="checkbox" /><span
          >Show this doctor in the booking directory after publishing</span
        ></label
      ><button class="button" :disabled="busy" @click="save(false, !source.onboarded)">
        {{ source.onboarded ? 'Save profile' : 'Save draft & continue' }}
      </button>
    </section>
    <section v-if="step === 2" class="dashboard-grid">
      <div class="panel">
        <h2>Appointment types</h2>
        <p class="muted">
          These are your own services. Price and duration changes affect new
          bookings only, not existing invoices.
        </p>
        <div v-for="s in data.services" :key="s.id" class="service-row">
          <div>
            <strong>{{ s.name }}</strong
            ><small
              >{{ s.duration_minutes }} minutes + {{ s.buffer_minutes }} minute
              buffer · {{ money(s.amount_cents) }} ·
              {{ s.active ? "Active" : "Archived" }}</small
            >
          </div>
          <button class="button small secondary" @click="editType(s)">
            Edit
          </button>
        </div>
        <p v-if="!data.services.length" class="empty">
          No appointment types yet.
        </p>
        <button class="button" @click="continueServices">
          Continue to working hours
        </button>
      </div>
      <form class="panel form-panel" @submit.prevent="saveType">
        <h2>
          {{ type.id ? "Edit appointment type" : "Add appointment type" }}
        </h2>
        <label
          >Name<input
            v-model="type.name"
            required
            maxlength="150"
            placeholder="e.g. General consultation"
        /></label>
        <div class="two-cols">
          <label
            >Duration (minutes)<input
              v-model.number="type.durationMinutes"
              type="number"
              min="5"
              max="240"
              required /></label
          ><label
            >Buffer after visit (minutes)<input
              v-model.number="type.bufferMinutes"
              type="number"
              min="0"
              max="120"
              required
          /></label>
        </div>
        <label
          >Patient price in ZAR<input
            v-model="type.price"
            type="number"
            min="2"
            max="100000"
            step="0.01"
            required
            placeholder="Set your consultation price"
        /></label>
        <p class="hint">
          Enter the full amount to collect, including any applicable taxes. All
          fees require the practice’s approval before real-world launch.
        </p>
        <label class="check"
          ><input v-model="type.active" type="checkbox" /><span
            >Available for new bookings</span
          ></label
        ><button class="button secondary" :disabled="busy">
          {{ busy ? "Saving…" : "Save appointment type" }}</button
        ><button
          v-if="type.id"
          type="button"
          class="button ghost"
          @click="clearType"
        >
          Cancel editing
        </button>
      </form>
    </section>
    <section v-if="step === 3" class="panel form-panel">
      <h2>Your working hours</h2>
      <p>
        All times are SAST. Add separate periods for mornings and afternoons if
        you take a break. A consultation and its buffer must fit inside a
        working period.
      </p>
      <div class="actions">
        <button v-if="!model.weeklyHours.length" type="button" class="button small secondary" @click="setWeekdays">Use Monday–Friday, 09:00–17:00</button>
        <button v-else-if="mondayHours.length" type="button" class="button small secondary" @click="copyMonday">Copy Monday to Tuesday–Friday</button>
      </div>
      <div v-for="day in days" :key="day.value" class="hours-day">
        <div class="row">
          <strong>{{ day.label }}</strong
          ><button
            type="button"
            class="button small secondary"
            :aria-label="'Add period for ' + day.label"
            @click="addPeriod(day.value)"
          >
            Add period
          </button>
        </div>
        <div
          v-for="(period, pi) in model.weeklyHours.filter(
            (p) => p.day === day.value,
          )"
          :key="pi"
          class="hours-period"
        >
          <label>From<input v-model="period.start" type="time" /></label
          ><label>Until<input v-model="period.end" type="time" /></label
          ><button
            type="button"
            class="button small ghost danger"
            @click="
              model.weeklyHours.splice(model.weeklyHours.indexOf(period), 1)
            "
          >
            Remove
          </button>
        </div>
        <p v-if="!model.weeklyHours.some((p) => p.day === day.value)" class="hint">
          Not working
        </p>
      </div>
      <h3>Booking rules</h3>
      <div class="two-cols">
        <div>
          <label for="calendar-slot-interval">Offer an appointment start every</label>
          <select id="calendar-slot-interval" v-model.number="model.slotIntervalMinutes">
            <option v-for="interval in bookingIntervals" :key="interval" :value="interval">{{ interval }} minutes</option>
          </select>
        </div>
        <label
          >Minimum booking notice (hours)<input
            v-model.number="model.minNoticeHours"
            type="number"
            min="0"
            max="720" /></label
        ><label
          >Book ahead (days)<input
            v-model.number="model.horizonDays"
            type="number"
            min="1"
            max="365" /></label
        ><label
          >Online changes close before visit (hours)<input
            v-model.number="model.cancellationHours"
            type="number"
            min="0"
            max="720"
        /></label>
      </div>
      <label v-if="source.onboarded" class="check">
        <input v-model="model.active" type="checkbox" />
        Accept online bookings
      </label>
      <p v-if="source.onboarded && !model.active" class="hint">
        Pausing closes online booking and rescheduling. Existing appointments stay on the calendar.
      </p>
      <p class="hint">
        Review these practice policies before opening bookings. Paid
        cancellations are flagged for refund review; no automatic refund is
        promised or issued.
      </p>
      <button class="button" :disabled="busy" @click="save(false, !source.onboarded)">
        {{ source.onboarded ? 'Save calendar settings' : 'Save working hours & continue' }}
      </button>
    </section>
    <section v-if="step === 4" class="panel form-panel">
      <h2>{{ source.onboarded ? 'Review calendar settings' : 'Ready to open your calendar?' }}</h2>
      <p>
        <strong>{{ model.name }}</strong> · {{ model.title }}<br />{{
          model.location
        }}
      </p>
      <p>
        {{ data.services.filter((s: any) => s.active).length }} active
        appointment type(s) · {{ model.weeklyHours.length }} weekly working
        period(s).
      </p>
      <p class="notice">
        Patients can see available times and consultation prices when your calendar is open.
      </p>
      <div class="actions">
        <button v-if="!source.onboarded" class="button" :disabled="busy" @click="save(true)">
          Publish calendar</button
        ><button class="button secondary" :disabled="busy" @click="save(false)">
          Save settings
        </button>
      </div>
    </section>
  </div>
</template>
