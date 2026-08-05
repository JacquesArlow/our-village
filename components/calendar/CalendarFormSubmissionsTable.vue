<script setup lang="ts">
import type { FormSubmissionRow } from '~~/shared/calendar'

const props = defineProps<{ eventId: string }>()

const rows = ref<FormSubmissionRow[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try { rows.value = await $fetch<FormSubmissionRow[]>('/api/admin/form-submissions', { query: { eventId: props.eventId } }) }
  finally { loading.value = false }
}
onMounted(load)

const fmt = (ms: number) =>
  new Date(ms).toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`
</script>

<template>
  <div class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
    <div class="mb-3 flex items-center gap-2">
      <p class="font-display text-sm font-bold uppercase tracking-wide text-secondary">Completed forms</p>
      <span class="rounded-full bg-base-200 px-2 py-0.5 text-xs text-base-content/55">{{ rows.length }}</span>
      <button class="btn btn-ghost btn-xs ml-auto" :disabled="loading" @click="load">{{ loading ? '...' : 'Refresh' }}</button>
    </div>

    <p v-if="loading" class="py-4 text-center text-sm text-base-content/45">Loading...</p>
    <p v-else-if="!rows.length" class="rounded-field border border-dashed border-base-300 px-3 py-6 text-center text-sm text-base-content/45">
      No completed forms uploaded for this event yet.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[620px] text-sm">
        <thead>
          <tr class="border-b border-base-300 text-left text-xs font-semibold uppercase tracking-wide text-base-content/50">
            <th class="py-2 pr-3">Name</th>
            <th class="py-2 pr-3">Email</th>
            <th class="py-2 pr-3">Phone</th>
            <th class="py-2 pr-3">File</th>
            <th class="py-2 pr-3 whitespace-nowrap">Uploaded</th>
            <th class="py-2 pr-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in rows" :key="s.id" class="border-b border-base-200 align-top">
            <td class="py-2 pr-3 font-medium">{{ s.name }}</td>
            <td class="py-2 pr-3">
              <a v-if="s.email" :href="`mailto:${s.email}`" class="text-secondary hover:underline">{{ s.email }}</a>
              <span v-else class="text-base-content/45">-</span>
            </td>
            <td class="py-2 pr-3 whitespace-nowrap">
              <a v-if="s.phone" :href="`tel:${s.phone}`" class="text-secondary hover:underline">{{ s.phone }}</a>
              <span v-else class="text-base-content/45">-</span>
            </td>
            <td class="py-2 pr-3">
              <span class="font-medium">{{ s.fileName }}</span>
              <span class="block text-xs text-base-content/45">{{ fmtBytes(s.fileSize) }}</span>
            </td>
            <td class="py-2 pr-3 whitespace-nowrap text-base-content/50">{{ fmt(s.createdAt) }}</td>
            <td class="py-2 pr-3 text-right">
              <a :href="`/api/admin/form-submission-file?id=${s.id}`" class="btn btn-ghost btn-xs">Download</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
