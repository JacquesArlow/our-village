<script setup lang="ts">
import type { EventRow, BlockRow } from '~~/shared/calendar'
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const { data } = await useFetch<{ events: EventRow[]; blocks: BlockRow[] }>('/api/calendar/month', {
  query: { year, month }
})
function prev() { if (month.value === 1) { month.value = 12; year.value-- } else month.value-- }
function next() { if (month.value === 12) { month.value = 1; year.value++ } else month.value++ }
const training = computed(() => (data.value?.blocks ?? []).filter(b => b.section === 'training'))
useHead({ title: 'Calendar — Our Village' })
</script>
<template>
  <section class="container-px section-y">
    <div class="mb-6 flex items-center justify-between">
      <img src="/logo.png" alt="Our Village" class="h-12 w-auto" />
      <CalendarMonthNav :year="year" :month="month" @prev="prev" @next="next" />
      <NuxtLink to="/calendar/events" class="btn btn-ghost btn-sm">All events ›</NuxtLink>
    </div>
    <p v-if="training.length" class="mb-3 text-sm font-semibold text-error">
      <span v-for="t in training" :key="t.id">● {{ t.text }} </span>
    </p>
    <div class="grid gap-8 lg:grid-cols-[1fr_320px]">
      <CalendarGrid :year="year" :month="month" :events="data?.events ?? []" />
      <CalendarSidebar :blocks="data?.blocks ?? []" />
    </div>
  </section>
</template>
