<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { buildWeeks, eventsForDay } from '~~/composables/useCalendar'
const props = defineProps<{ year: number; month: number; events: EventRow[]; editable?: boolean }>()
const emit = defineEmits<{ 'day-click': [date: string] }>()
const weeks = computed(() => buildWeeks(props.year, props.month))
const labels = ['SUN','MON','TUE','WED','THU','FRI','SAT']
</script>
<template>
  <div class="overflow-x-auto">
    <div class="min-w-[680px]">
      <div class="grid grid-cols-7 border-b-2 border-base-content/70 py-2">
        <div v-for="l in labels" :key="l" class="cal-daylabel text-xs">{{ l }}</div>
      </div>
      <div v-for="(week, wi) in weeks" :key="wi" class="grid grid-cols-7">
        <CalendarDayCell
          v-for="(cell, ci) in week" :key="ci"
          :date="cell.date"
          :events="cell.date ? eventsForDay(events, cell.date) : []"
          :editable="editable"
          @click="cell.date && editable ? emit('day-click', cell.date) : null"
        />
      </div>
    </div>
  </div>
</template>
