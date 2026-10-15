<script setup lang="ts">
import { eventDateLabel, eventTimeLabel, type PublicCalendarEvent } from '~~/shared/eventPresentation'
const props = defineProps<{ events: PublicCalendarEvent[]; past?: boolean }>()
const groups = computed(() => {
  const result: { key: string; label: string; events: PublicCalendarEvent[] }[] = []
  for (const event of props.events) {
    const key = event.startDate.slice(0, 7)
    let group = result.find(item => item.key === key)
    if (!group) {
      group = { key, label: new Date(event.startDate + 'T12:00:00+02:00').toLocaleDateString('en-ZA', { month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' }), events: [] }
      result.push(group)
    }
    group.events.push(event)
  }
  return result
})
</script>

<template>
  <div class="space-y-10">
    <section v-for="group in groups" :key="group.key" :aria-label="group.label">
      <h2 class="mb-4 font-display text-xl font-bold text-secondary">{{ group.label }}</h2>
      <ul class="grid min-w-0 gap-5 lg:grid-cols-2">
        <li v-for="event in group.events" :key="event.id" class="min-w-0">
          <article class="flex h-full min-w-0 flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
            <div class="flex min-w-0 gap-4 p-5 sm:p-6">
              <NuxtLink v-if="event.publicDetails?.posterUrl" :to="`/calendar/event/${event.id}`" class="w-20 shrink-0 self-start sm:w-24" :aria-label="`View ${event.title}`" tabindex="-1" aria-hidden="true">
                <img :src="event.publicDetails.posterUrl" alt="" loading="lazy" class="aspect-[4/5] w-full rounded-field bg-base-200 object-cover object-top" />
              </NuxtLink>
              <div class="min-w-0 flex-1">
                <p class="mb-2 text-sm font-semibold text-secondary">{{ eventDateLabel(event) }}</p>
                <h3 class="break-words font-display text-lg font-bold leading-snug text-secondary sm:text-xl"><NuxtLink :to="`/calendar/event/${event.id}`" class="hover:underline">{{ event.title }}</NuxtLink></h3>
                <p v-if="eventTimeLabel(event.publicDetails)" class="mt-3 text-sm text-base-content/75">{{ eventTimeLabel(event.publicDetails) }} <span class="text-base-content/55">SAST</span></p>
                <p v-if="event.publicDetails?.venue" class="mt-1 break-words text-sm text-base-content/75">{{ event.publicDetails.venue }}</p>
                <p v-if="event.bookingCostLabel" class="mt-2 font-semibold text-secondary">{{ event.bookingCostLabel }}</p>
              </div>
            </div>
            <p v-if="event.detail" class="line-clamp-2 px-5 text-sm leading-relaxed text-base-content/65 sm:px-6">{{ event.detail }}</p>
            <div class="mt-auto px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
              <NuxtLink :to="`/calendar/event/${event.id}`" class="btn btn-primary min-h-11 w-full sm:w-auto" :aria-label="`${past ? 'View' : 'View and book'} ${event.title}`">{{ past ? 'View event' : 'View event & book' }} <span aria-hidden="true">→</span></NuxtLink>
            </div>
          </article>
        </li>
      </ul>
    </section>
  </div>
</template>
