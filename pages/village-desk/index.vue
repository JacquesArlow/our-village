<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'
definePageMeta({ layout: false })
const { data: session } = await authClient.useSession(useFetch)
const email = ref(''); const password = ref(''); const err = ref('')
async function login() {
  err.value = ''
  const { error } = await authClient.signIn.email({ email: email.value, password: password.value })
  if (error) err.value = error.message || 'Login failed'
  else await refreshNuxtData()
}
useHead({ title: 'Village Desk' })
</script>
<template>
  <div class="min-h-screen bg-base-200">
    <div v-if="!session" class="grid min-h-screen place-items-center p-6">
      <form class="w-full max-w-sm space-y-4 rounded-box bg-base-100 p-8 shadow" @submit.prevent="login">
        <h1 class="font-script text-4xl text-secondary">Village Desk</h1>
        <input v-model="email" type="email" placeholder="Email" class="input input-bordered w-full" required />
        <input v-model="password" type="password" placeholder="Password" class="input input-bordered w-full" required />
        <p v-if="err" class="text-sm text-error">{{ err }}</p>
        <button class="btn btn-primary w-full" type="submit">Sign in</button>
      </form>
    </div>
    <div v-else class="p-8">Signed in. Planner coming in Task 8. <button class="btn" @click="authClient.signOut().then(refreshNuxtData)">Sign out</button></div>
  </div>
</template>
