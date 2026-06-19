<script setup lang="ts">
const site = useSite()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: ''
})

// No server mailer is configured, so the form composes a WhatsApp message to
// the practice — consistent with the site's WhatsApp-first booking approach.
const submit = () => {
  const lines = [
    `Hi Our Village,`,
    ``,
    `Name: ${form.firstName} ${form.lastName}`.trim(),
    form.email ? `Email: ${form.email}` : '',
    form.subject ? `Subject: ${form.subject}` : '',
    ``,
    form.message
  ].filter(Boolean)
  const url = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`
  window.open(url, '_blank', 'noopener')
}
</script>

<template>
  <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="submit">
    <label class="form-control">
      <span class="mb-1.5 text-sm font-semibold text-base-content/80">First name</span>
      <input v-model="form.firstName" type="text" required class="input input-bordered rounded-xl bg-base-100" />
    </label>
    <label class="form-control">
      <span class="mb-1.5 text-sm font-semibold text-base-content/80">Last name</span>
      <input v-model="form.lastName" type="text" class="input input-bordered rounded-xl bg-base-100" />
    </label>
    <label class="form-control sm:col-span-2">
      <span class="mb-1.5 text-sm font-semibold text-base-content/80">Email</span>
      <input v-model="form.email" type="email" required class="input input-bordered rounded-xl bg-base-100" />
    </label>
    <label class="form-control sm:col-span-2">
      <span class="mb-1.5 text-sm font-semibold text-base-content/80">Subject</span>
      <input v-model="form.subject" type="text" class="input input-bordered rounded-xl bg-base-100" />
    </label>
    <label class="form-control sm:col-span-2">
      <span class="mb-1.5 text-sm font-semibold text-base-content/80">Your message</span>
      <textarea v-model="form.message" rows="4" required class="textarea textarea-bordered rounded-xl bg-base-100"></textarea>
    </label>
    <div class="sm:col-span-2">
      <button type="submit" class="btn btn-primary gap-2 rounded-full font-semibold normal-case">
        Send via WhatsApp
      </button>
      <p class="mt-2 text-xs text-base-content/60">
        Prefer email? Write to
        <a :href="`mailto:${site.email}`" class="font-semibold text-primary hover:underline">{{ site.email }}</a>
      </p>
    </div>
  </form>
</template>
