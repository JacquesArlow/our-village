<script setup lang="ts">
import { useMonthName } from '~~/composables/useCalendar'
const props = defineProps<{ year: number; month: number }>()
defineEmits<{ prev: []; next: [] }>()
</script>
<template>
  <div class="flex items-center justify-center gap-4">
    <button class="btn btn-ghost btn-sm" @click="$emit('prev')" aria-label="Previous month">‹</button>
    <h2 class="font-script text-5xl leading-none text-secondary">{{ useMonthName(month) }} {{ year }}</h2>
    <button class="btn btn-ghost btn-sm" @click="$emit('next')" aria-label="Next month">›</button>
  </div>
</template>
