<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { colorClass } from '~~/composables/useCalendar'
const props = defineProps<{ date: string | null; events: EventRow[]; editable?: boolean; compact?: boolean }>()
const dayNum = (d: string) => Number(d.slice(-2))
const highlighted = computed(() => props.events.some(e => e.isHighlight))
</script>
<template>
  <div
    class="relative min-w-0 border border-base-300 p-1.5 text-[11px] leading-tight"
    :class="[compact ? 'min-h-[76px] sm:min-h-[110px]' : 'min-h-[92px]', editable && date ? 'cursor-pointer hover:bg-base-200/60' : '']"
  >
    <div v-if="date" class="mb-1 flex items-center justify-between">
      <span class="font-display font-bold text-base-content/80">{{ dayNum(date) }}</span>
      <span v-if="highlighted" class="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true"></span>
    </div>
    <NuxtLink v-if="compact && date && events.length" :to="{ path: '/calendar', query: { view: 'list', date } }" class="mt-1 flex min-h-11 flex-col items-center justify-center rounded-field bg-primary/15 px-0.5 text-center text-[10px] font-semibold text-secondary sm:hidden" :aria-label="`${events.length} ${events.length === 1 ? 'event' : 'events'} on ${date}`"><span>{{ events.length }}</span><span>{{ events.length === 1 ? 'event' : 'events' }}</span></NuxtLink>
    <ul class="relative space-y-1" :class="compact ? 'hidden sm:block' : ''">
      <li v-for="e in events" :key="e.id" :class="colorClass(e.color)">
        <!-- Public: clickable to the event page (→ booking form). Admin: plain text; the cell handles day-edit. -->
        <NuxtLink
          v-if="!editable"
          :to="`/calendar/event/${e.id}`"
          class="block break-words rounded py-1 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
          :class="e.detail ? 'font-semibold' : ''"
        >{{ e.title }}</NuxtLink>
        <template v-else>
          <span :class="e.detail ? 'font-semibold' : ''">{{ e.title }}</span>
          <span v-if="!e.isPublic" class="ml-1 text-[9px] uppercase text-base-content/40">(private)</span>
        </template>
      </li>
    </ul>
  </div>
</template>
