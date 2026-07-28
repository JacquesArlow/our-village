<script setup lang="ts">
import { serviceCategories } from '~/data/services'
import { team } from '~/data/team'

const site = useSite()
const featured = team.filter((m) =>
  ['andrea-swart', 'suzanne-de-beer', 'dr-natasha-bartie', 'cassandra-ruysch', 'danielle-skinner', 'monique-van-der-merwe', 'dr-celiane-van-der-westhuizen', 'alicia-coertze'].includes(m.slug)
)

const values = [
  { title: 'All under one roof', text: 'A full circle of medical and therapy care, working together for your family.' },
  { title: 'Every stage of life', text: 'From pregnancy and newborns to children, parents and beyond.' },
  { title: 'Warm, human care', text: 'A safe, welcoming space where every question is valid and you feel heard.' }
]

useHead({ title: 'Our Village — Care That Grows With You' })
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="relative overflow-hidden bg-base-200">
      <div class="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl"></div>

      <div class="container-px relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p class="eyebrow mb-4">Welcome to Our Village</p>
          <h1 class="font-display text-4xl font-bold leading-[1.05] text-secondary sm:text-5xl lg:text-6xl">
            Care That Grows<br />With You
          </h1>
          <p class="mt-6 max-w-xl text-lg leading-relaxed text-base-content/75">
            A comprehensive range of healthcare and therapy services — thoughtfully designed to support babies,
            children, parents and families through every stage of life. All under one roof, with a unified approach to care.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <WhatsAppButton size="lg" />
            <NuxtLink to="/our-team" class="btn btn-lg rounded-full border-secondary/30 bg-base-100 font-semibold normal-case text-secondary hover:bg-base-100/70">
              Meet Our Team
            </NuxtLink>
          </div>
        </div>

        <div class="relative">
          <div class="overflow-hidden rounded-[2.5rem] border-8 border-base-100 shadow-2xl">
            <img src="/services/baby-family-clinic.webp" alt="Caring for babies and families at Our Village" class="aspect-[4/3] w-full object-cover" />
          </div>
          <div class="absolute -bottom-6 -left-6 hidden rounded-2xl bg-primary px-6 py-4 text-primary-content shadow-xl sm:block">
            <p class="font-display text-2xl font-bold leading-none">15+</p>
            <p class="text-sm">caring professionals</p>
          </div>
        </div>
      </div>
    </section>

    <!-- VALUES -->
    <section class="section-y">
      <div class="container-px grid gap-6 sm:grid-cols-3">
        <div v-for="v in values" :key="v.title" class="rounded-3xl border border-base-200 bg-base-100 p-7 shadow-sm">
          <div class="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <svg viewBox="0 0 24 24" class="h-6 w-6 fill-none stroke-current stroke-2"><path d="M12 21s-7-4.35-9.5-8.5C.5 8 3 4.5 6.5 4.5c2 0 3.5 1.5 5.5 4 2-2.5 3.5-4 5.5-4C21 4.5 23.5 8 21.5 12.5 19 16.65 12 21 12 21z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h3 class="font-display text-xl font-bold text-secondary">{{ v.title }}</h3>
          <p class="mt-2 text-base-content/70">{{ v.text }}</p>
        </div>
      </div>
    </section>

    <!-- ABOUT -->
    <section class="section-y bg-base-200">
      <div class="container-px grid items-center gap-12 lg:grid-cols-2">
        <div class="order-2 grid grid-cols-2 gap-4 lg:order-1">
          <img src="/services/nursing-care.webp" alt="" class="aspect-square w-full rounded-3xl object-cover" />
          <img src="/services/occupational-therapy.webp" alt="" class="mt-8 aspect-square w-full rounded-3xl object-cover" />
        </div>
        <div class="order-1 lg:order-2">
          <p class="eyebrow mb-3">Previously BCF The Village — Now Our Village</p>
          <h2 class="font-display text-3xl font-bold text-secondary sm:text-4xl">A village of support for your family</h2>
          <p class="mt-5 text-lg leading-relaxed text-base-content/75">
            For years, families have trusted us as a safe, supportive space during some of life’s most important
            moments. At Our Village you’ll find a caring community of health and therapy professionals who genuinely
            walk with you — from pregnancy and parenting to healing and growth.
          </p>
          <p class="mt-4 text-lg leading-relaxed text-base-content/75">
            We believe in real connection, expert care, and a personal approach that puts your family first.
          </p>
          <NuxtLink to="/our-team" class="btn btn-primary mt-7 rounded-full font-semibold normal-case">Meet Our Team</NuxtLink>
        </div>
      </div>
    </section>

    <!-- SERVICES -->
    <section class="section-y">
      <div class="container-px">
        <SectionHeading eyebrow="Our Services" title="Care for every chapter of life" subtitle="Our multidisciplinary team works together to provide compassionate, evidence-based services tailored to your family." />
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="c in serviceCategories"
            :key="c.key"
            to="/our-services"
            class="group relative overflow-hidden rounded-3xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <img :src="c.image" :alt="c.title" class="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/30 to-transparent"></div>
            <div class="absolute inset-x-0 bottom-0 p-6">
              <h3 class="font-display text-xl font-bold text-white">{{ c.title }}</h3>
              <p class="mt-1 text-sm text-white/80">{{ c.services.length }} services</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ANTENATAL -->
    <section class="section-y bg-secondary">
      <div class="container-px">
        <SectionHeading light eyebrow="Antenatal Classes" title="Feel prepared, supported & empowered" subtitle="Whether you’re expecting your first or simply want a refresher, our antenatal classes give you the knowledge, confidence and calm to prepare for birth and life with a new baby." />
        <div class="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <div class="flex flex-col rounded-3xl bg-base-100 p-8 shadow-lg">
            <h3 class="font-display text-2xl font-bold text-secondary">Online Classes</h3>
            <p class="mt-2 flex-1 text-base-content/70">Self-paced video series with lifetime access — learn whenever and wherever suits you.</p>
            <p class="mt-4 font-display text-3xl font-bold text-primary">R1 300<span class="text-base font-normal text-base-content/60"> once-off</span></p>
            <NuxtLink to="/antenatal-classes/online-antenatal-classes" class="btn btn-primary mt-5 rounded-full font-semibold normal-case">Grab online sessions</NuxtLink>
          </div>
          <div class="flex flex-col rounded-3xl bg-base-100 p-8 shadow-lg">
            <h3 class="font-display text-2xl font-bold text-secondary">In-Person Classes</h3>
            <p class="mt-2 flex-1 text-base-content/70">Hands-on learning and real connection with experts and other parents-to-be.</p>
            <p class="mt-4 font-display text-3xl font-bold text-primary">R1 800<span class="text-base font-normal text-base-content/60"> per couple</span></p>
            <NuxtLink to="/antenatal-classes/inperson-antenatal" class="btn btn-primary mt-5 rounded-full font-semibold normal-case">Book in-person class</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- TEAM -->
    <section class="section-y">
      <div class="container-px">
        <SectionHeading eyebrow="Meet the Team" title="Find the perfect professional to help you" />
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <TeamCard v-for="m in featured" :key="m.slug" :member="m" />
        </div>
        <div class="mt-10 text-center">
          <NuxtLink to="/our-team" class="btn btn-outline btn-primary rounded-full font-semibold normal-case">See the whole team</NuxtLink>
        </div>
      </div>
    </section>

    <!-- CONTACT -->
    <section class="section-y bg-base-200">
      <div class="container-px grid gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading align="left" eyebrow="Your care starts here" title="Let’s start your wellness journey" subtitle="Booking is simple, and we’ll guide you every step of the way. Prefer to chat first? We’re happy to help you find the right therapist." />
          <div class="mt-8 space-y-4 text-base-content/80">
            <a :href="site.phoneHref" class="flex items-center gap-3 hover:text-primary"><span class="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">☎</span>{{ site.phone }}</a>
            <a :href="`mailto:${site.email}`" class="flex items-center gap-3 hover:text-primary"><span class="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">✉</span>{{ site.email }}</a>
            <a :href="site.mapsUrl" target="_blank" rel="noopener" class="flex items-center gap-3 hover:text-primary"><span class="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">📍</span>{{ site.address }}</a>
          </div>
        </div>
        <div class="rounded-3xl bg-base-100 p-7 shadow-sm sm:p-9">
          <ContactForm />
        </div>
      </div>
    </section>
  </div>
</template>
