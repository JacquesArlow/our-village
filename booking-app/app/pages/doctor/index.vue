<script setup lang="ts">
definePageMeta({ middleware: "account" });
const route = useRoute(),
  { account } = useAccount(),
  { today, dayOf, when, toIso, message } = useBookingUi();
const doctorId =
  account.value.user.role === "admin" &&
  typeof route.query.doctorId === "string"
    ? route.query.doctorId
    : undefined;
const day = ref(today()),
  view = ref("list"),
  error = ref(""),
  busy = ref(false);
const { data, refresh } = await useFetch<any>("/api/manage", {
  query: { doctorId, date: day },
});
const block = reactive({ start: "", end: "", label: "Unavailable" });
const setupLink = computed(
  () =>
    "/doctor/get-started" +
    (account.value.user.role === "admin" ? "?doctorId=" + doctorId : ""),
);
if (data.value && !data.value.doctor.onboarded) {
  await navigateTo(setupLink.value, { replace: true });
}
const week = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const date = new Date(
      Date.parse(day.value + "T12:00:00+02:00") + i * 86400000,
    )
      .toISOString()
      .slice(0, 10);
    return {
      date,
      label: new Date(date + "T12:00:00+02:00").toLocaleDateString("en-ZA", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      rows: (data.value?.appointments || []).filter(
        (a: any) => dayOf(a.start_at) === date,
      ),
    };
  }),
);
function shift(n: number) {
  day.value = new Date(
    Date.parse(day.value + "T12:00:00+02:00") + n * 7 * 86400000,
  )
    .toISOString()
    .slice(0, 10);
}
async function addBlock() {
  error.value = "";
  busy.value = true;
  try {
    await $fetch("/api/manage/blocks", {
      method: "POST",
      body: {
        doctorId: data.value.doctor.id,
        start: toIso(block.start),
        end: toIso(block.end),
        label: block.label,
      },
    });
    block.start = "";
    block.end = "";
    await refresh();
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
async function removeBlock(id: string) {
  error.value = "";
  try {
    await $fetch("/api/manage/blocks/" + id, { method: "DELETE", body: {} });
    await refresh();
  } catch (e) {
    error.value = message(e);
  }
}
</script>
<template>
  <section class="wrap section">
    <template v-if="data?.doctor.onboarded"
      ><div class="section-heading">
        <div>
          <p class="eyebrow">Doctor workspace</p>
          <h1>{{ data.doctor.name }}</h1>
          <p>
            {{
              data.doctor.onboarded
                ? "Your calendar is published"
                : "Your calendar is not open for bookings yet"
            }}
            · SAST
          </p>
        </div>
        <div class="actions">
          <NuxtLink
            v-if="account.user.role === 'admin'"
            to="/admin"
            class="button secondary"
            >Admin console</NuxtLink
          ><NuxtLink :to="setupLink" class="button">{{
            data.doctor.onboarded
              ? "Edit services & availability"
              : "Get started"
          }}</NuxtLink>
        </div>
      </div>
      <div class="calendar-toolbar panel">
        <div class="actions">
          <button
            class="button small secondary"
            aria-label="Previous week"
            @click="shift(-1)"
          >
            ← Previous</button
          ><label>Week starting<input v-model="day" type="date" /></label
          ><button
            class="button small secondary"
            aria-label="Next week"
            @click="shift(1)"
          >
            Next →
          </button>
        </div>
        <div class="segmented" role="group" aria-label="Calendar view">
          <button
            :aria-pressed="view === 'list'"
            :class="view === 'list' ? 'selected' : ''"
            @click="view = 'list'"
          >
            List</button
          ><button
            :aria-pressed="view === 'week'"
            :class="view === 'week' ? 'selected' : ''"
            @click="view = 'week'"
          >
            Week
          </button>
        </div>
      </div>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <div v-if="view === 'list'" class="panel">
        <h2>Appointments this week</h2>
        <AppointmentList
          :records="data.appointments"
          staff
          @changed="refresh()"
        />
      </div>
      <div v-else class="calendar-week">
        <section v-for="date in week" :key="date.date" class="calendar-day">
          <h3>{{ date.label }}</h3>
          <AppointmentList :records="date.rows" staff @changed="refresh()" />
        </section>
      </div>
      <div class="dashboard-grid spaced">
        <form class="panel form-panel" @submit.prevent="addBlock">
          <h2>Time off &amp; unavailable periods</h2>
          <p class="hint">
            Only affects this doctor. Existing held or confirmed bookings must
            be moved before blocking their time.
          </p>
          <div class="two-cols">
            <label
              >From (SAST)<input
                v-model="block.start"
                type="datetime-local"
                required /></label
            ><label
              >Until (SAST)<input
                v-model="block.end"
                type="datetime-local"
                required
            /></label>
          </div>
          <label
            >Calendar label<input
              v-model="block.label"
              maxlength="120"
              required /></label
          ><button class="button secondary" :disabled="busy">Block time</button>
        </form>
        <section class="panel">
          <h2>Blocked periods</h2>
          <div v-for="b in data.blocks" :key="b.id" class="service-row">
            <div>
              <strong>{{ b.label }}</strong
              ><small>{{ when(b.start_at) }} — {{ when(b.end_at) }}</small>
            </div>
            <button
              class="button small ghost danger"
              @click="removeBlock(b.id)"
            >
              Remove
            </button>
          </div>
          <p v-if="!data.blocks.length" class="empty">
            No time off configured.
          </p>
        </section>
      </div></template
    >
    <p v-else class="notice error">
      Choose a doctor from the admin console, or ask the administrator to check
      your doctor account.
    </p>
  </section>
</template>
