<script setup lang="ts">
const route = useRoute()
await navigateTo({ path: '/calendar', query: { ...route.query, view: 'list' } }, { redirectCode: 301 })
</script>

<template>
  <p class="sr-only">Opening the event list…</p>
</template>
