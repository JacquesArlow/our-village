<script setup lang="ts">
const site = useSite()
const year = 2026
</script>

<template>
  <footer class="mt-auto bg-secondary text-secondary-content">
    <div class="container-px grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <img src="/logo.png" alt="Our Village" class="mb-4 h-16 w-auto brightness-0 invert" />
        <p class="max-w-xs text-sm leading-relaxed text-secondary-content/80">
          A village of health and therapy professionals, caring for babies, children, parents and families — all under one roof.
        </p>
      </div>

      <div>
        <h3 class="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-secondary-content/70">Contact Details</h3>
        <ul class="space-y-3 text-sm">
          <li><a :href="site.phoneHref" class="hover:text-primary">{{ site.phone }}</a></li>
          <li><a :href="`mailto:${site.email}`" class="break-all hover:text-primary">{{ site.email }}</a></li>
          <li><a :href="site.mapsUrl" target="_blank" rel="noopener" class="hover:text-primary">{{ site.address }}</a></li>
        </ul>
      </div>

      <div>
        <h3 class="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-secondary-content/70">Navigate</h3>
        <ul class="space-y-3 text-sm">
          <li><NuxtLink to="/our-services" class="hover:text-primary">Our Services</NuxtLink></li>
          <li><NuxtLink to="/our-team" class="hover:text-primary">Our Team</NuxtLink></li>
          <li><NuxtLink to="/antenatal-classes/online-antenatal-classes" class="hover:text-primary">Online Antenatal Classes</NuxtLink></li>
          <li><NuxtLink to="/antenatal-classes/inperson-antenatal" class="hover:text-primary">In-Person Antenatal Classes</NuxtLink></li>
          <li><NuxtLink to="/contact-us" class="hover:text-primary">Contact Us</NuxtLink></li>
        </ul>
      </div>

      <div>
        <h3 class="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-secondary-content/70">Follow Our Journey</h3>
        <div class="flex gap-3">
          <a :href="site.socials.facebook" target="_blank" rel="noopener" aria-label="Facebook" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-primary hover:text-primary-content">
            <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z"/></svg>
          </a>
          <a :href="site.socials.instagram" target="_blank" rel="noopener" aria-label="Instagram" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-primary hover:text-primary-content">
            <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.52.01-4.76.07-.96.04-1.48.2-1.83.34-.46.18-.79.39-1.13.74-.35.34-.56.67-.74 1.13-.14.35-.3.87-.34 1.83-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.96.2 1.48.34 1.83.18.46.39.79.74 1.13.34.35.67.56 1.13.74.35.14.87.3 1.83.34 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.96-.04 1.48-.2 1.83-.34.46-.18.79-.39 1.13-.74.35-.34.56-.67.74-1.13.14-.35.3-.87.34-1.83.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.96-.2-1.48-.34-1.83a3.05 3.05 0 00-.74-1.13 3.05 3.05 0 00-1.13-.74c-.35-.14-.87-.3-1.83-.34-1.24-.06-1.61-.07-4.76-.07zm0 2.76a5.3 5.3 0 110 10.6 5.3 5.3 0 010-10.6zm0 1.62a3.68 3.68 0 100 7.36 3.68 3.68 0 000-7.36zm5.5-.42a1.24 1.24 0 110 2.48 1.24 1.24 0 010-2.48z"/></svg>
          </a>
          <a :href="site.socials.youtube" target="_blank" rel="noopener" aria-label="YouTube" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-primary hover:text-primary-content">
            <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current"><path d="M23.5 6.2a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 00.5 6.2C0 8.07 0 12 0 12s0 3.93.5 5.8a3.02 3.02 0 002.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>
          </a>
        </div>
        <WhatsAppButton class="mt-6" variant="white" size="sm" />
      </div>
    </div>

    <div class="border-t border-white/10">
      <div class="container-px flex flex-col items-center justify-between gap-2 py-5 text-xs text-secondary-content/70 sm:flex-row">
        <p>© {{ year }} Our Village. All rights reserved.</p>
        <p>Previously BCF The Village.</p>
      </div>
    </div>
  </footer>
</template>
