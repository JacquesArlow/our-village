<script setup lang="ts">
import QRCode from 'qrcode'

const props = defineProps<{ event: { id: string; title: string; isPublic?: boolean } }>()

const requestUrl = useRequestURL()
const link = computed(() => `${requestUrl.origin}/calendar/event/${props.event.id}`)
const slug = computed(() =>
  (props.event.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'event'
)

const QR_OPTS = { margin: 2, color: { dark: '#20281a', light: '#ffffff' } }
const pngUrl = ref('')
const copied = ref(false)

async function render() {
  try { pngUrl.value = await QRCode.toDataURL(link.value, { ...QR_OPTS, width: 480 }) }
  catch { pngUrl.value = '' }
}
onMounted(render)
watch(link, render)

function triggerDownload(href: string, filename: string, revoke = false) {
  const a = document.createElement('a')
  a.href = href; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  if (revoke) URL.revokeObjectURL(href)
}
function downloadPng() {
  if (pngUrl.value) triggerDownload(pngUrl.value, `${slug.value}-qr.png`)
}
async function downloadSvg() {
  const svg = await QRCode.toString(link.value, { type: 'svg', ...QR_OPTS })
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  triggerDownload(url, `${slug.value}-qr.svg`, true)
}
async function copyLink() {
  try { await navigator.clipboard.writeText(link.value); copied.value = true; setTimeout(() => (copied.value = false), 1500) } catch { /* ignore */ }
}
</script>

<template>
  <div class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
    <p class="mb-3 font-display text-sm font-bold uppercase tracking-wide text-secondary">Event QR code</p>

    <p v-if="event.isPublic === false" class="mb-3 rounded-field bg-warning/15 px-3 py-2 text-xs text-warning-content">
      This event is <strong>private</strong> — the link won’t open for visitors until you mark it public.
    </p>

    <div class="flex flex-col items-start gap-4 sm:flex-row">
      <div class="shrink-0 rounded-box border border-base-200 bg-base-100 p-2">
        <img v-if="pngUrl" :src="pngUrl" :alt="`QR code for ${event.title}`" class="h-36 w-36" width="144" height="144" />
        <div v-else class="grid h-36 w-36 place-items-center text-xs text-base-content/40">generating…</div>
      </div>

      <div class="min-w-0 flex-1 space-y-3">
        <div>
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Link</span>
          <code class="block truncate rounded-field bg-base-200/60 px-2.5 py-1.5 text-xs text-base-content/70">{{ link }}</code>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-primary btn-sm" @click="downloadSvg">Download SVG <span class="ml-1 opacity-70">· print</span></button>
          <button type="button" class="btn btn-outline btn-primary btn-sm" @click="downloadPng">Download PNG</button>
          <button type="button" class="btn btn-ghost btn-sm" @click="copyLink">{{ copied ? 'Copied ✓' : 'Copy link' }}</button>
        </div>
        <p class="text-xs text-base-content/45">SVG is vector — best for posters at any size.</p>
      </div>
    </div>
  </div>
</template>
