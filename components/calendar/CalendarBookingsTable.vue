<script setup lang="ts">
interface Booking {
  id: string; name: string; surname: string; email: string; phone: string
  guests: number | null
  babyName: string | null; babySurname: string | null; babyDateOfBirth: string | null
  message: string | null; createdAt: number
}
const props = defineProps<{ eventId: string }>()

const rows = ref<Booking[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try { rows.value = await $fetch<Booking[]>('/api/admin/bookings', { query: { eventId: props.eventId } }) }
  finally { loading.value = false }
}
onMounted(load)

const fmt = (ms: number) =>
  new Date(ms).toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtDate = (d: string | null) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'
</script>

<template>
  <div class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
    <div class="mb-3 flex items-center gap-2">
      <p class="font-display text-sm font-bold uppercase tracking-wide text-secondary">Bookings</p>
      <span class="rounded-full bg-base-200 px-2 py-0.5 text-xs text-base-content/55">{{ rows.length }}</span>
      <button class="btn btn-ghost btn-xs ml-auto" :disabled="loading" @click="load">{{ loading ? '…' : 'Refresh' }}</button>
    </div>

    <p v-if="loading" class="py-4 text-center text-sm text-base-content/45">Loading…</p>
    <p v-else-if="!rows.length" class="rounded-field border border-dashed border-base-300 px-3 py-6 text-center text-sm text-base-content/45">
      No bookings captured for this event yet.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[840px] text-sm">
        <thead>
          <tr class="border-b border-base-300 text-left text-xs font-semibold uppercase tracking-wide text-base-content/50">
            <th class="py-2 pr-3">Name</th>
            <th class="py-2 pr-3">Surname</th>
            <th class="py-2 pr-3">Email</th>
            <th class="py-2 pr-3">Phone</th>
            <th class="py-2 pr-3">Guests</th>
            <th class="py-2 pr-3">Baby</th>
            <th class="py-2 pr-3 whitespace-nowrap">Baby DOB</th>
            <th class="py-2 pr-3">Message</th>
            <th class="py-2 pr-3 whitespace-nowrap">Submitted</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in rows" :key="b.id" class="border-b border-base-200 align-top">
            <td class="py-2 pr-3 font-medium">{{ b.name }}</td>
            <td class="py-2 pr-3">{{ b.surname }}</td>
            <td class="py-2 pr-3"><a :href="`mailto:${b.email}`" class="text-secondary hover:underline">{{ b.email }}</a></td>
            <td class="py-2 pr-3 whitespace-nowrap"><a :href="`tel:${b.phone}`" class="text-secondary hover:underline">{{ b.phone }}</a></td>
            <td class="py-2 pr-3 text-center">{{ b.guests ?? '-' }}</td>
            <td class="py-2 pr-3">{{ [b.babyName, b.babySurname].filter(Boolean).join(' ') || '-' }}</td>
            <td class="py-2 pr-3 whitespace-nowrap">{{ fmtDate(b.babyDateOfBirth) }}</td>
            <td class="py-2 pr-3 text-base-content/70">{{ b.message || '—' }}</td>
            <td class="py-2 pr-3 whitespace-nowrap text-base-content/50">{{ fmt(b.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
