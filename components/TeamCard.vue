<script setup lang="ts">
import type { TeamMember } from '~/data/team'

const props = defineProps<{ member: TeamMember }>()

const initials = computed(() =>
  props.member.name
    .replace(/^(Dr\.?|Sr)\s+/i, '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
)
</script>

<template>
  <article
    class="group flex h-full flex-col overflow-hidden rounded-3xl border border-base-200 bg-base-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
  >
    <NuxtLink :to="`/team/${member.slug}`" class="block">
      <div class="relative aspect-[4/5] overflow-hidden bg-base-200">
        <img
          v-if="member.photo"
          :src="member.photo"
          :alt="member.name"
          loading="lazy"
          class="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        <div v-else class="grid h-full w-full place-items-center bg-primary/15">
          <span class="font-display text-5xl font-bold text-primary/60">{{ initials }}</span>
        </div>
        <span
          v-if="member.owner"
          class="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-content"
        >
          Co-Owner
        </span>
      </div>
    </NuxtLink>

    <div class="flex flex-1 flex-col p-5">
      <h3 class="font-display text-lg font-bold leading-tight text-secondary">
        <NuxtLink :to="`/team/${member.slug}`" class="hover:text-primary">{{ member.name }}</NuxtLink>
      </h3>
      <p class="mt-0.5 text-sm font-semibold text-primary">{{ member.role }}</p>
      <p class="mt-3 flex-1 text-sm leading-relaxed text-base-content/70">{{ member.tagline }}</p>

      <div class="mt-5 flex items-center gap-2">
        <NuxtLink
          :to="`/team/${member.slug}`"
          class="btn btn-ghost btn-sm rounded-full text-secondary hover:bg-base-200"
        >
          Read more
        </NuxtLink>
        <WhatsAppButton v-if="member.bookable" :context="member.bookable" label="Book" size="sm" />
      </div>
    </div>
  </article>
</template>
