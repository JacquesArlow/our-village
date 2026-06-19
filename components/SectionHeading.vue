<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    subtitle?: string
    align?: 'left' | 'center'
    light?: boolean
  }>(),
  { align: 'center', light: false }
)
</script>

<template>
  <div :class="['max-w-2xl', align === 'center' ? 'mx-auto text-center' : '']">
    <p v-if="eyebrow" class="eyebrow mb-3">{{ eyebrow }}</p>
    <h2 :class="['text-3xl font-bold sm:text-4xl', light ? 'text-secondary-content' : 'text-secondary']">
      {{ title }}
    </h2>
    <p v-if="subtitle" :class="['mt-4 text-lg leading-relaxed', light ? 'text-secondary-content/80' : 'text-base-content/70']">
      {{ subtitle }}
    </p>
  </div>
</template>
