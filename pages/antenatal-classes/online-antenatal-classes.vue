<script setup lang="ts">
useHead({ title: 'Online Antenatal Classes — Our Village' })

const tab = ref<'get' | 'how'>('get')

const getList = [
  'Full access to our complete antenatal video series',
  'Expert tips on pregnancy, labour, birth and early parenting',
  'Downloadable resources to keep',
  'A flexible, self-paced experience with lifetime access'
]
const howSteps = [
  { t: 'Choose & purchase', d: 'A simple once-off payment of R1 300.' },
  { t: 'Instant access', d: 'Privately hosted videos, available immediately.' },
  { t: 'Learn at your own pace', d: 'Watch anytime — lifetime access, no rush.' },
  { t: 'Downloadable resources', d: 'Handy guides and checklists to support you.' },
  { t: 'Support on request', d: 'Questions? Our team is a message away.' }
]
const who = ['First-time parents', 'Parents wanting a refresher', 'Busy parents who prefer flexibility']
</script>

<template>
  <div>
    <section class="bg-base-200">
      <div class="container-px grid items-center gap-10 py-16 lg:grid-cols-2 sm:py-20">
        <div>
          <p class="eyebrow mb-3">Online Antenatal Classes</p>
          <h1 class="font-display text-4xl font-bold text-secondary sm:text-5xl">Learn at your own pace</h1>
          <p class="mt-5 text-lg text-base-content/75">
            Prepare with confidence through our self-paced antenatal video series — expert guidance for pregnancy,
            birth and those first precious weeks, available whenever it suits you.
          </p>
          <div class="mt-7 flex flex-wrap items-center gap-4">
            <WhatsAppButton size="lg" context="the online antenatal class series (R1 300)" label="Buy online classes" />
            <span class="font-display text-3xl font-bold text-primary">R1 300</span>
          </div>
        </div>
        <img src="/antenatal/online-hero.png" alt="Online antenatal classes" class="w-full rounded-[2rem] object-cover shadow-xl" />
      </div>
    </section>

    <section class="section-y">
      <div class="container-px mx-auto max-w-3xl">
        <div class="mb-8 flex justify-center gap-2">
          <button class="btn rounded-full normal-case" :class="tab === 'get' ? 'btn-primary' : 'btn-ghost border border-base-300'" @click="tab = 'get'">What you’ll get</button>
          <button class="btn rounded-full normal-case" :class="tab === 'how' ? 'btn-primary' : 'btn-ghost border border-base-300'" @click="tab = 'how'">How it works</button>
        </div>

        <ul v-if="tab === 'get'" class="space-y-4">
          <li v-for="g in getList" :key="g" class="flex items-start gap-3 rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            <span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current stroke-[3]"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
            <span class="text-base-content/80">{{ g }}</span>
          </li>
        </ul>

        <ol v-else class="space-y-4">
          <li v-for="(s, i) in howSteps" :key="s.t" class="flex gap-4 rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-content">{{ i + 1 }}</span>
            <span><span class="font-semibold text-secondary">{{ s.t }}</span><span class="block text-sm text-base-content/70">{{ s.d }}</span></span>
          </li>
        </ol>
      </div>
    </section>

    <section class="section-y bg-base-200">
      <div class="container-px text-center">
        <SectionHeading title="Who should attend?" />
        <div class="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          <div v-for="w in who" :key="w" class="rounded-2xl bg-base-100 p-6 font-semibold text-secondary shadow-sm">{{ w }}</div>
        </div>
        <div class="mt-10"><WhatsAppButton size="lg" context="the online antenatal class series (R1 300)" label="Book now" /></div>
      </div>
    </section>
  </div>
</template>
