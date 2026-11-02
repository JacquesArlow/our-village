<script setup lang="ts">
const props = defineProps<{ records: any[]; staff?: boolean }>(),
  emit = defineEmits<{ changed: [] }>();
const { when, money, clock, today, message, paidLabel } = useBookingUi();
const editing = ref<any>(null),
  day = ref(today()),
  options = ref<any[]>([]),
  error = ref(""),
  busy = ref(false);
async function begin(row: any) {
  editing.value = row;
  error.value = "";
  await loadSlots();
}
async function loadSlots() {
  error.value = "";
  try {
    options.value = await $fetch<any[]>(
      "/api/appointments/" + editing.value.id + "/slots",
      { query: { date: day.value } },
    );
  } catch (e) {
    error.value = message(e);
  }
}
watch(day, () => {
  if (editing.value) loadSlots();
});
async function action(row: any, type: string, start?: string) {
  if (
    type === "cancel" &&
    !window.confirm(
      "Cancel this appointment? If a test payment was recorded, the invoice will be flagged for refund review; no automatic refund is performed.",
    )
  )
    return;
  busy.value = true;
  error.value = "";
  try {
    await $fetch("/api/appointments/" + row.id, {
      method: "PATCH",
      body: { action: type, start },
    });
    editing.value = null;
    emit("changed");
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="appointment-list">
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <article v-for="row in records" :key="row.id" class="appointment">
      <div class="appointment-main">
        <div>
          <p class="eyebrow">{{ when(row.start_at) }}</p>
          <h3>{{ staff ? row.patient_name : row.doctor_name }}</h3>
          <p>{{ row.service_name }} · {{ money(row.amount_cents) }}</p>
          <p v-if="staff" class="hint">
            {{ row.patient_email
            }}<template v-if="row.phone"> · {{ row.phone }}</template>
          </p>
        </div>
        <span
          class="badge"
          :class="row.status === 'confirmed' ? 'success' : ''"
          >{{ row.status.replaceAll("_", " ") }}</span
        >
      </div>
      <p v-if="row.payment_method" class="hint">
        {{ paidLabel(row.payment_method) }}
      </p>
      <p v-if="row.status === 'payment_review'" class="notice error">
        Payment arrived after the slot could be confirmed. The practice needs to
        reconcile this booking.
      </p>
      <div class="actions">
        <NuxtLink
          v-if="row.invoice_id"
          :to="'/invoices/' + row.invoice_id"
          class="button small secondary"
          >Invoice</NuxtLink
        ><template v-if="['hold', 'confirmed'].includes(row.status)"
          ><button class="button small secondary" @click="begin(row)">
            Reschedule</button
          ><button
            class="button small ghost danger"
            :disabled="busy"
            @click="action(row, 'cancel')"
          >
            Cancel</button
          ><template
            v-if="
              staff &&
              row.status === 'confirmed' &&
              Date.parse(row.end_at) < Date.now()
            "
            ><button
              class="button small secondary"
              @click="action(row, 'completed')"
            >
              Complete</button
            ><button class="button small ghost" @click="action(row, 'no_show')">
              No-show
            </button></template
          ></template
        >
      </div>
      <div v-if="editing?.id === row.id" class="inset-form">
        <h4>Choose a new time</h4>
        <p class="hint">
          The original booked duration and invoice price are retained. All times
          are SAST.
        </p>
        <label
          >New date<input v-model="day" type="date" :min="today()"
        /></label>
        <div class="slot-grid">
          <button
            v-for="slot in options"
            :key="slot.start"
            class="slot"
            :disabled="busy"
            @click="action(row, 'reschedule', slot.start)"
          >
            {{ clock(slot.start) }}
          </button>
        </div>
        <p v-if="!options.length">No available times on this date.</p>
        <button class="button small ghost" @click="editing = null">
          Close
        </button>
      </div>
    </article>
    <div v-if="!records.length" class="empty">No appointments to show.</div>
  </div>
</template>
