<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    context?: string
    label?: string
    size?: 'sm' | 'md' | 'lg'
    variant?: 'primary' | 'outline' | 'white'
    block?: boolean
  }>(),
  { label: 'Book Appointment', size: 'md', variant: 'primary', block: false }
)

const { bookingLink } = useBooking()
const href = computed(() => bookingLink(props.context))

const sizeClass = computed(
  () => ({ sm: 'btn-sm', md: '', lg: 'btn-lg' }[props.size])
)
const variantClass = computed(
  () =>
    ({
      primary: 'btn-primary',
      outline: 'btn-outline btn-primary',
      white: 'bg-white text-secondary border-white hover:bg-base-200'
    }[props.variant])
)
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener"
    :class="[
      'btn gap-2 rounded-full font-semibold normal-case shadow-sm transition-transform hover:-translate-y-0.5',
      sizeClass,
      variantClass,
      block ? 'btn-block' : ''
    ]"
  >
    <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.736-.98zm5.392-2.84c-.272-.136-.297-.146-.57.213-.198.262-.578.624-.69.749-.111.124-.224.139-.418.046-.272-.124-1.137-.42-2.166-1.336-.8-.715-1.34-1.597-1.498-1.868-.157-.272-.017-.419.12-.555.123-.122.272-.318.408-.477.135-.16.18-.273.27-.456.09-.18.045-.339-.023-.477-.067-.136-.61-1.47-.835-2.013-.22-.529-.444-.457-.61-.466l-.52-.009a1 1 0 00-.724.34c-.249.272-.95.929-.95 2.265 0 1.337.973 2.629 1.109 2.811.135.182 1.915 2.925 4.638 4.101.648.28 1.154.448 1.548.573.65.207 1.242.178 1.71.108.522-.078 1.607-.657 1.834-1.291.226-.635.226-1.18.158-1.291-.067-.111-.249-.18-.521-.317z" />
    </svg>
    <span>{{ label }}</span>
  </a>
</template>
