<script setup lang="ts">
import type { EventRow, BlockRow } from '~~/shared/calendar'
import { southAfricaToday, sortCalendarEvents, eventDateLabel } from '~~/shared/eventPresentation'
import { eventsForDay } from '~~/composables/useCalendar'

const route = useRoute()
const router = useRouter()
const today = useState('public-calendar-today', () => southAfricaToday())
const view = computed(() => route.query.view === 'month' ? 'month' : 'list')
const scope = computed(() => route.query.scope === 'past' ? 'past' : 'upcoming')
const selectedDate = computed(() => {
  const value = route.query.date
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(value + 'T12:00:00Z')
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null
})
const validYear = (value: unknown) => typeof value === 'string' && /^\d{4}$/.test(value) && +value >= 1900 && +value <= 2100 ? +value : +today.value.slice(0, 4)
const validMonth = (value: unknown) => typeof value === 'string' && /^\d{1,2}$/.test(value) && +value >= 1 && +value <= 12 ? +value : +today.value.slice(5, 7)
const year = computed(() => validYear(route.query.year))
const month = computed(() => validMonth(route.query.month))
const { data: events, status, error, refresh } = await useFetch<EventRow[]>('/api/calendar/events')
const { data: monthData } = await useFetch<{ events: EventRow[]; blocks: BlockRow[] }>('/api/calendar/month', { query: { year, month } })
const upcoming = computed(() => sortCalendarEvents(events.value ?? [], 'upcoming', today.value))
const past = computed(() => sortCalendarEvents(events.value ?? [], 'past', today.value))
const visible = computed(() => selectedDate.value
  ? eventsForDay(events.value ?? [], selectedDate.value).sort((a, b) => (a.publicDetails?.startTime || '').localeCompare(b.publicDetails?.startTime || ''))
  : scope.value === 'past' ? past.value : upcoming.value)

function selectView(value: 'list' | 'month') { return router.replace({ query: { ...route.query, view: value, date: undefined } }) }
function selectScope(value: 'upcoming' | 'past') { return router.replace({ query: { ...route.query, scope: value, date: undefined } }) }
function selectMonth(y: number, m: number) { return router.replace({ query: { ...route.query, view: 'month', year: String(y), month: String(m), date: undefined } }) }
function stepMonth(delta: number) {
  const next = new Date(year.value, month.value - 1 + delta, 1)
  return selectMonth(next.getFullYear(), next.getMonth() + 1)
}
const selectedDateLabel = computed(() => selectedDate.value ? eventDateLabel({ startDate: selectedDate.value, endDate: null }) : '')
const monthRef = ref<HTMLElement | null>(null)
const canFullscreen = ref(false)
const isFullscreen = ref(false)
function onFullscreenChange() { isFullscreen.value = !!document.fullscreenElement }
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await monthRef.value?.requestFullscreen()
  } catch { /* Unsupported browsers retain the normal month view. */ }
}
onMounted(() => {
  canFullscreen.value = !!document.fullscreenEnabled
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFullscreenChange))
</script>

<template>
  <section class="container-px section-y">
    <div class="mb-8 flex min-w-0 flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="eyebrow">What's on at Our Village</p>
        <h1 class="mt-2 font-display text-3xl font-bold text-secondary sm:text-4xl">Events & workshops</h1>
        <p class="mt-3 max-w-xl text-base-content/65">Find your next workshop, family activity or community gathering.</p>
      </div>
      <div class="flex shrink-0 self-start rounded-full border border-base-300 bg-base-200 p-1" role="group" aria-label="Calendar view">
        <button type="button" class="min-h-11 rounded-full px-5 text-sm font-semibold" :class="view === 'list' ? 'bg-secondary text-white shadow-sm' : 'text-secondary'" :aria-pressed="view === 'list'" @click="selectView('list')">List</button>
        <button type="button" class="min-h-11 rounded-full px-5 text-sm font-semibold" :class="view === 'month' ? 'bg-secondary text-white shadow-sm' : 'text-secondary'" :aria-pressed="view === 'month'" @click="selectView('month')">Month</button>
      </div>
    </div>
    <div v-if="error" class="rounded-box border border-base-300 p-6" role="alert">
      <p>We couldn't load the events. Please try again.</p><button type="button" class="btn btn-primary mt-4" @click="refresh()">Try again</button>
    </div>
    <p v-else-if="status === 'pending'" class="py-12 text-base-content/65" role="status">Loading events…</p>
    <template v-else-if="view === 'list'">
      <div class="mb-7 flex flex-wrap gap-2" role="group" aria-label="Event dates">
        <button type="button" class="btn min-h-11" :class="scope === 'upcoming' && !selectedDate ? 'btn-primary' : 'btn-ghost border-base-300'" :aria-pressed="scope === 'upcoming' && !selectedDate" @click="selectScope('upcoming')">Upcoming <span class="text-xs">({{ upcoming.length }})</span></button>
        <button type="button" class="btn min-h-11" :class="scope === 'past' && !selectedDate ? 'btn-primary' : 'btn-ghost border-base-300'" :aria-pressed="scope === 'past' && !selectedDate" @click="selectScope('past')">Past events</button>
      </div>
      <div v-if="selectedDate" class="mb-6 flex flex-wrap items-center gap-3 rounded-field bg-base-200 p-4">
        <p class="font-semibold">Events on {{ selectedDateLabel }}</p><button type="button" class="btn btn-ghost btn-sm" @click="selectScope('upcoming')">Show all upcoming events</button>
      </div>
      <div aria-live="polite">
        <CalendarEventList v-if="visible.length" :events="visible" :past="!selectedDate && scope === 'past'" />
        <div v-else class="rounded-box border border-dashed border-base-300 px-5 py-12 text-center">
          <h2 class="font-display text-xl font-semibold text-secondary">{{ selectedDate ? 'No events on this day' : scope === 'past' ? 'No past events to show' : 'New events are on their way' }}</h2>
          <p class="mt-3 text-base-content/65">{{ scope === 'upcoming' && !selectedDate ? 'Please check back soon, or explore our past events.' : 'Choose another view to explore the calendar.' }}</p>
          <button type="button" class="btn btn-ghost mt-4" @click="selectScope(scope === 'past' ? 'upcoming' : 'past')">{{ scope === 'past' ? 'See upcoming events' : 'Browse past events' }}</button>
        </div>
      </div>
    </template>
    <div v-else ref="monthRef" :class="isFullscreen ? 'overflow-auto bg-base-100 p-4 sm:p-8' : ''">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <CalendarMonthNav :year="year" :month="month" @prev="stepMonth(-1)" @next="stepMonth(1)" @update:year="selectMonth($event, month)" @update:month="selectMonth(year, $event)" />
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-ghost border-base-300" @click="selectMonth(+today.slice(0, 4), +today.slice(5, 7))">This month</button>
          <button v-if="canFullscreen" type="button" class="btn btn-ghost hidden sm:inline-flex" @click="toggleFullscreen">{{ isFullscreen ? 'Exit fullscreen' : 'Fullscreen' }}</button>
        </div>
      </div>
      <p class="mb-4 text-sm text-base-content/65">Select an event to see details and book. On a phone, tap an event count to see that day's list.</p>
      <CalendarGrid :year="year" :month="month" :events="events ?? []" responsive />
      <div v-if="monthData?.blocks.length" class="mt-8 border-t border-base-200 pt-8"><CalendarSidebar :blocks="monthData.blocks" /></div>
    </div>
  </section>
</template>
