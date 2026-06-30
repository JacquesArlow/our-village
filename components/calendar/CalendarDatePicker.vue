<script setup lang="ts">
import { buildWeeks, useMonthName } from '~~/composables/useCalendar'

const props = defineProps<{ modelValue: string | null; placeholder?: string; clearable?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [string | null] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const now = new Date()
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

// View state — defaults to the selected date's month, else the current month.
const seed = props.modelValue ? new Date(props.modelValue + 'T00:00:00') : now
const viewYear = ref(seed.getFullYear())
const viewMonth = ref(seed.getMonth() + 1)

const months = Array.from({ length: 12 }, (_, i) => i + 1)
const years = computed(() => {
  const base = now.getFullYear()
  return Array.from({ length: 9 }, (_, i) => base - 2 + i) // current-2 … current+6
})
const weeks = computed(() => buildWeeks(viewYear.value, viewMonth.value))
const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const display = computed(() =>
  props.modelValue
    ? new Date(props.modelValue + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
    : (props.placeholder || 'Select date')
)

function toggle() {
  if (!open.value) {
    // re-centre the view on the current value each time it opens
    const s = props.modelValue ? new Date(props.modelValue + 'T00:00:00') : now
    viewYear.value = s.getFullYear()
    viewMonth.value = s.getMonth() + 1
  }
  open.value = !open.value
}
function prevM() { if (viewMonth.value === 1) { viewMonth.value = 12; viewYear.value-- } else viewMonth.value-- }
function nextM() { if (viewMonth.value === 12) { viewMonth.value = 1; viewYear.value++ } else viewMonth.value++ }
function pick(date: string | null) { if (!date) return; emit('update:modelValue', date); open.value = false }
function clear() { emit('update:modelValue', null); open.value = false }
function jumpToday() { viewYear.value = now.getFullYear(); viewMonth.value = now.getMonth() + 1 }

const isSelected = (d: string | null) => !!d && d === props.modelValue
const isToday = (d: string | null) => !!d && d === todayStr

function onDocClick(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="relative">
    <!-- Trigger -->
    <button
      type="button"
      @click="toggle"
      class="flex w-full items-center gap-2 rounded-field border border-base-300 bg-base-100 px-3 py-2 text-left text-sm transition hover:border-primary focus:border-primary focus:outline-none"
      :class="open ? 'border-primary ring-2 ring-primary/20' : ''"
    >
      <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" stroke-linecap="round" />
      </svg>
      <span :class="modelValue ? 'text-base-content' : 'text-base-content/45'">{{ display }}</span>
    </button>

    <!-- Popover -->
    <Transition
      enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100 ease-in" leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute left-0 z-50 mt-2 w-72 rounded-box border border-base-300 bg-base-100 p-3 shadow-xl shadow-secondary/10"
      >
        <!-- month / year controls -->
        <div class="mb-2 flex items-center gap-1.5">
          <button type="button" @click="prevM" class="grid h-7 w-7 place-items-center rounded-field text-secondary hover:bg-base-200" aria-label="Previous month">‹</button>
          <select v-model.number="viewMonth" class="min-w-0 flex-1 rounded-field border border-base-300 bg-base-100 px-2 py-1 text-sm focus:border-primary focus:outline-none">
            <option v-for="m in months" :key="m" :value="m">{{ useMonthName(m) }}</option>
          </select>
          <select v-model.number="viewYear" class="rounded-field border border-base-300 bg-base-100 px-2 py-1 text-sm focus:border-primary focus:outline-none">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
          <button type="button" @click="nextM" class="grid h-7 w-7 place-items-center rounded-field text-secondary hover:bg-base-200" aria-label="Next month">›</button>
        </div>

        <!-- day grid -->
        <div class="grid grid-cols-7 gap-0.5">
          <div v-for="(l, i) in dayLabels" :key="i" class="grid h-7 place-items-center text-[10px] font-semibold uppercase tracking-wide text-base-content/40">{{ l }}</div>
          <template v-for="(week, wi) in weeks" :key="wi">
            <button
              v-for="(cell, ci) in week" :key="ci"
              type="button"
              :disabled="!cell.date"
              @click="pick(cell.date)"
              class="grid h-9 place-items-center rounded-field text-sm transition disabled:cursor-default"
              :class="[
                isSelected(cell.date) ? 'bg-primary font-semibold text-primary-content'
                  : cell.date ? 'hover:bg-base-200 text-base-content' : 'text-transparent',
                isToday(cell.date) && !isSelected(cell.date) ? 'ring-1 ring-primary/50 font-semibold' : ''
              ]"
            >{{ cell.date ? +cell.date.slice(-2) : '' }}</button>
          </template>
        </div>

        <!-- footer -->
        <div class="mt-2 flex items-center justify-between border-t border-base-200 pt-2 text-xs">
          <button type="button" @click="jumpToday" class="font-semibold text-secondary hover:text-primary">Today</button>
          <button v-if="clearable && modelValue" type="button" @click="clear" class="text-base-content/50 hover:text-error">Clear</button>
        </div>
      </div>
    </Transition>
  </div>
</template>
