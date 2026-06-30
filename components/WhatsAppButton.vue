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
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.736-.98zm5.392-2.84c-.272-.136-1.611-.795-1.861-.886-.249-.091-.43-.136-.612.137-.181.272-.701.885-.86 1.067-.158.181-.317.204-.589.068-.272-.136-1.149-.423-2.189-1.351-.809-.722-1.355-1.614-1.514-1.886-.158-.272-.017-.419.12-.555.123-.122.272-.318.408-.477.137-.159.182-.273.273-.455.091-.182.046-.341-.023-.477-.068-.136-.612-1.476-.839-2.021-.221-.531-.446-.459-.612-.467l-.522-.01a1 1 0 00-.724.341c-.249.272-.95.929-.95 2.265 0 1.337.973 2.629 1.108 2.81.137.182 1.915 2.925 4.638 4.102.649.28 1.155.448 1.549.573.65.207 1.243.178 1.711.108.522-.078 1.611-.658 1.838-1.294.227-.636.227-1.181.158-1.295-.068-.114-.249-.181-.521-.317z" />
    </svg>
    <span>{{ label }}</span>
  </a>
</template>
