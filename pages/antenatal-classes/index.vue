<script setup lang="ts">
usePageSeo({
  title: 'Antenatal Classes in Pretoria & Online | Our Village',
  description: 'Prepare for birth and newborn life with supportive, expert-led antenatal classes. Choose in-person classes in Pretoria or learn online at your pace.',
  image: '/antenatal/holistic.webp'
})
</script>

<template>
  <div>
    <section class="bg-base-200">
      <div class="container-px py-16 text-center sm:py-20">
        <p class="eyebrow mb-3">Antenatal Classes</p>
        <h1 class="font-display text-4xl font-bold text-secondary sm:text-5xl">Feel Prepared, Supported & Empowered</h1>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-base-content/70">
          Becoming a parent can feel overwhelming — but you don’t have to figure it out alone. Choose the way of
          learning that fits your life.
        </p>
      </div>
    </section>

    <section class="section-y">
      <div class="container-px mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        <NuxtLink to="/antenatal-classes/online-antenatal-classes" class="group flex flex-col overflow-hidden rounded-3xl border border-base-200 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <img src="/antenatal/online-hero.webp" alt="Online antenatal classes" class="aspect-[16/10] w-full object-cover" />
          <div class="flex flex-1 flex-col p-7">
            <h2 class="font-display text-2xl font-bold text-secondary group-hover:text-primary">Online Classes</h2>
            <p class="mt-2 flex-1 text-base-content/70">Self-paced video series with lifetime access. Learn at your own pace, wherever you are.</p>
            <p class="mt-4 font-display text-2xl font-bold text-primary">R1 300 once-off</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/antenatal-classes/inperson-antenatal" class="group flex flex-col overflow-hidden rounded-3xl border border-base-200 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <img src="/antenatal/real-connection.webp" alt="In-person antenatal classes" class="aspect-[16/10] w-full bg-base-200 object-contain p-6" />
          <div class="flex flex-1 flex-col p-7">
            <h2 class="font-display text-2xl font-bold text-secondary group-hover:text-primary">In-Person Classes</h2>
            <p class="mt-2 flex-1 text-base-content/70">Hands-on learning and real connection with experts and other parents-to-be.</p>
            <p class="mt-4 font-display text-2xl font-bold text-primary">R1 800 per couple</p>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
