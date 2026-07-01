<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { colorClass } from '~~/composables/useCalendar'
const props = defineProps<{ date: string | null; events: EventRow[]; editable?: boolean }>()
const dayNum = (d: string) => Number(d.slice(-2))
const highlighted = computed(() => props.events.some(e => e.isHighlight))
</script>
<template>
  <div
    class="relative min-h-[92px] border border-base-300 p-1.5 text-[11px] leading-tight"
    :class="[editable && date ? 'cursor-pointer hover:bg-base-200/60' : '']"
  >
    <div v-if="date" class="mb-1 flex items-center justify-between">
      <span class="font-display font-bold text-base-content/80">{{ dayNum(date) }}</span>
      <span v-if="highlighted" class="absolute right-1 top-1 h-7 w-7 rounded-full bg-primary/55"></span>
    </div>
    <ul class="relative space-y-0.5">
      <li v-for="e in events" :key="e.id" :class="colorClass(e.color)">
        <!-- Public: clickable to the event page (→ booking form). Admin: plain text; the cell handles day-edit. -->
        <NuxtLink
          v-if="!editable"
          :to="`/calendar/event/${e.id}`"
          class="hover:underline"
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
