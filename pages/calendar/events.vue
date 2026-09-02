<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { colorClass, useMonthName } from '~~/composables/useCalendar'

const { data } = await useFetch<EventRow[]>('/api/calendar/events')
usePageSeo({
  title: 'Upcoming Family Wellness Events | Our Village',
  description: 'See all upcoming Our Village events, including antenatal sessions, parent workshops and family wellness activities in Pretoria.'
})

// Events arrive newest → oldest; group sequentially by year-month.
const groups = computed(() => {
  const out: { key: string; label: string; events: EventRow[] }[] = []
  for (const e of data.value ?? []) {
    const y = Number(e.startDate.slice(0, 4))
    const m = Number(e.startDate.slice(5, 7))
    const key = `${y}-${m}`
    let g = out[out.length - 1]
    if (!g || g.key !== key) { g = { key, label: `${useMonthName(m)} ${y}`, events: [] }; out.push(g) }
    g.events.push(e)
  }
  return out
})

const dayNum = (d: string) => Number(d.slice(8, 10))
const weekday = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'short' })
const range = (e: EventRow) => e.endDate && e.endDate !== e.startDate
</script>

<template>
  <section class="container-px section-y">
    <div class="mb-10 flex items-end justify-between">
      <div>
        <p class="eyebrow">Our Village</p>
        <h1 class="font-script text-6xl leading-none text-secondary">Events</h1>
      </div>
      <NuxtLink to="/calendar" class="btn btn-ghost btn-sm">‹ Calendar view</NuxtLink>
    </div>

    <p v-if="!groups.length" class="rounded-box border border-dashed border-base-300 px-6 py-12 text-center text-base-content/50">
      No upcoming events have been published yet.
    </p>

    <div v-for="g in groups" :key="g.key" class="mb-10">
      <div class="mb-4 flex items-center gap-3">
        <h2 class="font-script text-3xl text-primary">{{ g.label }}</h2>
        <span class="h-px flex-1 bg-base-300"></span>
      </div>
      <ul class="space-y-3">
        <li v-for="e in g.events" :key="e.id">
          <NuxtLink
            :to="`/calendar/event/${e.id}`"
            class="flex items-stretch gap-4 rounded-box border border-base-200 bg-base-100 p-3 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div class="grid w-14 shrink-0 place-items-center rounded-field bg-base-200 text-center">
              <span class="text-[10px] font-semibold uppercase tracking-wide text-base-content/45">{{ weekday(e.startDate) }}</span>
              <span class="font-display text-xl font-bold leading-none text-secondary">{{ dayNum(e.startDate) }}</span>
            </div>
            <div class="min-w-0 flex-1 self-center">
              <p class="font-display font-semibold" :class="colorClass(e.color)">{{ e.title }}</p>
              <p v-if="e.detail" class="text-sm text-base-content/70">{{ e.detail }}</p>
              <p v-if="range(e)" class="mt-0.5 text-xs text-base-content/45">
                until {{ new Date(e.endDate + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' }) }}
              </p>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>
