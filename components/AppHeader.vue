<script setup lang="ts">
const open = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => (open.value = false))

const links = [
  { label: 'Home', to: '/' },
  { label: 'Our Services', to: '/our-services' },
  { label: 'Our Team', to: '/our-team' },
  { label: 'Calendar', to: '/calendar' },
  { label: 'Antenatal Classes', to: '/antenatal-classes' },
  { label: 'Contact', to: '/contact-us' }
]
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-base-200/70 bg-base-100/85 backdrop-blur-md">
    <div class="container-px flex h-20 items-center justify-between gap-4">
      <NuxtLink to="/" class="flex items-center gap-3" aria-label="Our Village home">
        <img src="/logo.png" alt="Our Village" class="h-12 w-auto" />
      </NuxtLink>

      <!-- desktop nav -->
      <nav class="hidden items-center gap-1 lg:flex">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="rounded-full px-4 py-2 text-sm font-semibold text-base-content/75 transition-colors hover:bg-base-200 hover:text-secondary"
          active-class="!text-secondary"
        >
          {{ l.label }}
        </NuxtLink>
      </nav>

      <div class="hidden lg:block">
        <WhatsAppButton size="sm" />
      </div>

      <!-- mobile toggle -->
      <button
        class="btn btn-ghost btn-square lg:hidden"
        :aria-expanded="open"
        aria-label="Toggle menu"
        @click="open = !open"
      >
        <svg v-if="!open" viewBox="0 0 24 24" class="h-6 w-6 fill-none stroke-current stroke-2">
          <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
        </svg>
        <svg v-else viewBox="0 0 24 24" class="h-6 w-6 fill-none stroke-current stroke-2">
          <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- mobile menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="open" class="border-t border-base-200 bg-base-100 lg:hidden">
        <nav class="container-px flex flex-col gap-1 py-4">
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="rounded-xl px-4 py-3 font-semibold text-base-content/80 hover:bg-base-200"
            active-class="bg-base-200 !text-secondary"
          >
            {{ l.label }}
          </NuxtLink>
          <WhatsAppButton class="mt-2" block />
        </nav>
      </div>
    </Transition>
  </header>
</template>
