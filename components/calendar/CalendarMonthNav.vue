<script setup lang="ts">
import { useMonthName } from '~~/composables/useCalendar'

const props = defineProps<{ year: number; month: number }>()
const emit = defineEmits<{
  prev: []; next: []
  'update:year': [number]
  'update:month': [number]
}>()

const months = Array.from({ length: 12 }, (_, i) => i + 1)
const years = computed(() => Array.from({ length: 9 }, (_, i) => props.year - 3 + i)) // selected ±, window of 9
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <div class="flex items-center gap-4">
      <button class="grid h-12 w-12 place-items-center rounded-full text-5xl leading-none text-secondary transition hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/30" @click="emit('prev')" aria-label="Previous month">‹</button>
      <h2 class="font-script text-4xl leading-none text-secondary sm:text-5xl">{{ useMonthName(month) }} {{ year }}</h2>
      <button class="grid h-12 w-12 place-items-center rounded-full text-5xl leading-none text-secondary transition hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/30" @click="emit('next')" aria-label="Next month">›</button>
    </div>
    <div class="flex items-center gap-2">
      <select
        :value="month" @change="emit('update:month', +($event.target as HTMLSelectElement).value)"
        class="rounded-field border border-base-300 bg-base-100/70 px-3 py-1 text-sm text-base-content/80 transition hover:border-primary focus:border-primary focus:outline-none"
        aria-label="Select month"
      >
        <option v-for="m in months" :key="m" :value="m">{{ useMonthName(m) }}</option>
      </select>
      <select
        :value="year" @change="emit('update:year', +($event.target as HTMLSelectElement).value)"
        class="rounded-field border border-base-300 bg-base-100/70 px-3 py-1 text-sm text-base-content/80 transition hover:border-primary focus:border-primary focus:outline-none"
        aria-label="Select year"
      >
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>
  </div>
</template>
