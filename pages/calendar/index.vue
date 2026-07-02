<script setup lang="ts">
import type { EventRow, BlockRow } from '~~/shared/calendar'
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const { data } = await useFetch<{ events: EventRow[]; blocks: BlockRow[] }>('/api/calendar/month', {
  query: { year, month }
})
function prev() { if (month.value === 1) { month.value = 12; year.value-- } else month.value-- }
function next() { if (month.value === 12) { month.value = 1; year.value++ } else month.value++ }
const training = computed(() => (data.value?.blocks ?? []).filter(b => b.section === 'training'))

// Fullscreen (desktop/Android/tablets; hidden where unsupported e.g. iPhone Safari)
const calRef = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const canFullscreen = ref(false)
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) await calRef.value?.requestFullscreen()
    else await document.exitFullscreen()
  } catch { /* ignore */ }
}
function onFsChange() { isFullscreen.value = !!document.fullscreenElement }
onMounted(() => {
  canFullscreen.value = !!document.fullscreenEnabled
  document.addEventListener('fullscreenchange', onFsChange)
})
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFsChange))

useHead({ title: 'Calendar — Our Village' })
</script>

<template>
  <section class="container-px section-y">
    <div ref="calRef" :class="isFullscreen ? 'overflow-auto bg-base-100 p-4 sm:p-8' : ''">
      <!-- Header: stacks on mobile (no overflow); logo left + actions right on desktop -->
      <div class="relative mb-6 flex flex-col items-center gap-3">
        <img src="/logo.png" alt="Our Village" class="hidden h-10 w-auto lg:absolute lg:left-0 lg:top-0 lg:block" />

        <CalendarMonthNav
          :year="year" :month="month"
          @prev="prev" @next="next"
          @update:year="year = $event" @update:month="month = $event"
        />

        <div class="flex flex-wrap items-center justify-center gap-2 lg:absolute lg:right-0 lg:top-0">
          <button v-if="canFullscreen" type="button" class="btn btn-ghost btn-sm gap-1.5" @click="toggleFullscreen">
            <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
              <path v-if="!isFullscreen" d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" stroke-linecap="round"/>
              <path v-else d="M9 4v4a1 1 0 0 1-1 1H4m16 0h-4a1 1 0 0 1-1-1V4M9 20v-4a1 1 0 0 0-1-1H4m16 0h-4a1 1 0 0 0-1 1v4" stroke-linecap="round"/>
            </svg>
            {{ isFullscreen ? 'Exit' : 'Fullscreen' }}
          </button>
          <NuxtLink to="/calendar/events" class="btn btn-ghost btn-sm">All events ›</NuxtLink>
        </div>
      </div>

      <p v-if="training.length" class="mb-3 text-center text-sm font-semibold text-error">
        <span v-for="t in training" :key="t.id">● {{ t.text }} </span>
      </p>

      <CalendarGrid :year="year" :month="month" :events="data?.events ?? []" />

      <!-- Important dates / Hot Topics now sit below the calendar -->
      <div class="mt-10 border-t border-base-200 pt-8">
        <CalendarSidebar :blocks="data?.blocks ?? []" />
      </div>
    </div>
  </section>
</template>
