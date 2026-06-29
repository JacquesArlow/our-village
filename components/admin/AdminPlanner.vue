<script setup lang="ts">
import type { EventRow, BlockRow, BlockSection } from '~~/shared/calendar'
import { BLOCK_SECTIONS } from '~~/shared/calendar'
import { blocksBySection } from '~~/composables/useCalendar'
defineEmits<{ signout: [] }>()
const now = new Date()
const year = ref(now.getFullYear()); const month = ref(now.getMonth() + 1)
const { data, refresh } = await useFetch<{ events: EventRow[]; blocks: BlockRow[] }>('/api/admin/month', { query: { year, month } })
function prev() { if (month.value===1){month.value=12;year.value--}else month.value-- }
function next() { if (month.value===12){month.value=1;year.value++}else month.value++ }
const grouped = computed(() => blocksBySection(data.value?.blocks ?? []))
const sections = BLOCK_SECTIONS as BlockSection[]
function openDay(date: string) { navigateTo(`/village-desk/day/${date}`) }
</script>
<template>
  <div class="container-px py-8">
    <div class="mb-6 flex items-center justify-between">
      <CalendarMonthNav :year="year" :month="month" @prev="prev" @next="next" />
      <button class="btn btn-ghost btn-sm" @click="$emit('signout')">Sign out</button>
    </div>
    <div class="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <p class="mb-2 text-sm text-base-content/60">Click a day to add or edit events.</p>
        <CalendarGrid :year="year" :month="month" :events="data?.events ?? []" editable @day-click="openDay" />
      </div>
      <div class="space-y-4">
        <CalendarBlockListEditor v-for="s in sections" :key="s" :year="year" :month="month" :section="s" :items="grouped[s]" @changed="refresh" />
      </div>
    </div>
  </div>
</template>
