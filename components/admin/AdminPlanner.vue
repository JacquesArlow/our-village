<script setup lang="ts">
import type { EventRow, BlockRow, BlockSection } from '~~/shared/calendar'
import { BLOCK_SECTIONS } from '~~/shared/calendar'
import { blocksBySection } from '~~/composables/useCalendar'
defineEmits<{ signout: [] }>()
const now = new Date()
const year = ref(now.getFullYear()); const month = ref(now.getMonth() + 1)
const { data, refresh } = await useFetch<{ events: EventRow[]; blocks: BlockRow[] }>('/api/admin/month', { query: { year, month } })
function prev() { if (month.value === 1) { month.value = 12; year.value-- } else month.value-- }
function next() { if (month.value === 12) { month.value = 1; year.value++ } else month.value++ }
const grouped = computed(() => blocksBySection(data.value?.blocks ?? []))
const sections = BLOCK_SECTIONS as BlockSection[]
function openDay(date: string) { navigateTo(`/village-desk/day/${date}`) }
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <header class="border-b border-base-300 bg-base-100/80 backdrop-blur">
      <div class="container-px flex h-16 items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="Our Village" class="h-8 w-auto" />
          <span class="hidden text-sm font-semibold uppercase tracking-[0.2em] text-base-content/40 sm:inline">Village Desk</span>
        </div>
        <button class="btn btn-ghost btn-sm" @click="$emit('signout')">Sign out</button>
      </div>
    </header>

    <div class="container-px py-8">
      <div class="mb-6 flex justify-center">
        <CalendarMonthNav
          :year="year" :month="month"
          @prev="prev" @next="next"
          @update:year="year = $event" @update:month="month = $event"
        />
      </div>

      <div class="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
          <p class="mb-3 flex items-center gap-2 text-sm text-base-content/55">
            <svg viewBox="0 0 24 24" class="h-4 w-4 text-primary" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
            Click any day to add or edit its events.
          </p>
          <CalendarGrid :year="year" :month="month" :events="data?.events ?? []" editable @day-click="openDay" />
        </div>
        <div class="space-y-4">
          <p class="font-script text-3xl text-secondary">Sidebar content</p>
          <CalendarBlockListEditor
            v-for="s in sections" :key="s"
            :year="year" :month="month" :section="s" :items="grouped[s]"
            @changed="refresh"
          />
        </div>
      </div>
    </div>
  </div>
</template>
