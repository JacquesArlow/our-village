<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { colorClass } from '~~/composables/useCalendar'
const { data } = await useFetch<EventRow[]>('/api/calendar/events')
useHead({ title: 'All events — Our Village' })
const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
</script>
<template>
  <section class="container-px section-y">
    <h1 class="font-script text-5xl text-secondary">Events</h1>
    <ul class="mt-8 divide-y divide-base-200">
      <li v-for="e in data ?? []" :key="e.id" class="flex gap-4 py-4">
        <span class="w-40 shrink-0 text-sm text-base-content/60">{{ fmt(e.startDate) }}</span>
        <div>
          <p class="font-semibold" :class="colorClass(e.color)">{{ e.title }}</p>
          <p v-if="e.detail" class="text-sm text-base-content/70">{{ e.detail }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
