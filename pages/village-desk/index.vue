<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'
definePageMeta({ layout: false })
const cfg = useRuntimeConfig().public
const { data: session } = await authClient.useSession(useFetch)
const email = ref(''); const password = ref(''); const err = ref(''); const busy = ref(false)

// Managed Turnstile on the login (enforced server-side by Better Auth's captcha plugin).
const tsToken = ref('')
const widgetEl = ref<HTMLElement | null>(null)
const widgetId = ref<string | undefined>()
useHead({
  title: 'Village Desk',
  script: [{ src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: true, defer: true }]
})
function renderWidget(): boolean {
  const ts = (window as any).turnstile
  if (!ts || !widgetEl.value || widgetId.value !== undefined) return widgetId.value !== undefined
  widgetId.value = ts.render(widgetEl.value, {
    sitekey: cfg.turnstileSiteKey, theme: 'light',
    callback: (t: string) => { tsToken.value = t },
    'error-callback': () => { tsToken.value = '' },
    'expired-callback': () => { tsToken.value = '' }
  })
  return true
}
function mountWidget() {
  if (renderWidget()) return
  const iv = setInterval(() => { if (renderWidget()) clearInterval(iv) }, 200)
  setTimeout(() => clearInterval(iv), 10000)
}
onMounted(() => { if (!session.value) mountWidget() })
watch(session, async (s) => {
  if (!s) { widgetId.value = undefined; tsToken.value = ''; await nextTick(); mountWidget() }
})

async function login() {
  err.value = ''
  if (!tsToken.value) { err.value = 'Please wait a moment for the security check to load.'; return }
  busy.value = true
  const { error } = await authClient.signIn.email({
    email: email.value,
    password: password.value,
    fetchOptions: { headers: { 'x-captcha-response': tsToken.value } }
  })
  busy.value = false
  if (error) {
    err.value = error.message || 'Login failed'
    const ts = (window as any).turnstile
    if (ts && widgetId.value !== undefined) { ts.reset(widgetId.value); tsToken.value = '' }
  } else {
    await refreshNuxtData()
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <div v-if="!session" class="grid min-h-screen place-items-center p-6">
      <form class="w-full max-w-sm space-y-4 rounded-box bg-base-100 p-8 shadow" @submit.prevent="login">
        <h1 class="font-script text-4xl text-secondary">Village Desk</h1>
        <input v-model="email" type="email" placeholder="Email" class="input input-bordered w-full" required />
        <input v-model="password" type="password" placeholder="Password" class="input input-bordered w-full" required />
        <!-- managed Turnstile (usually invisible) -->
        <div ref="widgetEl" class="min-h-[1px]"></div>
        <p v-if="err" class="text-sm text-error">{{ err }}</p>
        <button class="btn btn-primary w-full" type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      </form>
    </div>
    <div v-else><AdminPlanner @signout="authClient.signOut().then(refreshNuxtData)" /></div>
  </div>
</template>
