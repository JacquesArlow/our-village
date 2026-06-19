<script setup lang="ts">
import { team, teamCategories } from '~/data/team'

useHead({ title: 'Our Team — Our Village' })

const active = ref<string>('All')
const filters = ['All', ...teamCategories]
const visible = computed(() => (active.value === 'All' ? team : team.filter((m) => m.category === active.value)))

const grouped = computed(() =>
  teamCategories
    .map((cat) => ({ cat, members: visible.value.filter((m) => m.category === cat) }))
    .filter((g) => g.members.length)
)
</script>

<template>
  <div>
    <section class="bg-base-200">
      <div class="container-px py-16 text-center sm:py-20">
        <p class="eyebrow mb-3">Your Village</p>
        <h1 class="font-display text-4xl font-bold text-secondary sm:text-5xl">Meet Our Team</h1>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-base-content/70">
          A caring community of health and therapy professionals, here to help your family discover strength,
          resilience and growth.
        </p>
      </div>
    </section>

    <section class="section-y">
      <div class="container-px">
        <div class="mb-10 flex flex-wrap justify-center gap-2">
          <button
            v-for="f in filters"
            :key="f"
            class="btn btn-sm rounded-full font-semibold normal-case"
            :class="active === f ? 'btn-primary' : 'btn-ghost border border-base-300 text-base-content/70'"
            @click="active = f"
          >
            {{ f }}
          </button>
        </div>

        <div v-for="g in grouped" :key="g.cat" class="mb-16 scroll-mt-24">
          <h2 class="mb-6 font-display text-2xl font-bold text-secondary">{{ g.cat }}</h2>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <TeamCard v-for="m in g.members" :key="m.slug" :member="m" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
