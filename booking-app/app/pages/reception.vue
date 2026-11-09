<script setup lang="ts">
definePageMeta({ middleware: "account" });

const search = ref("");
const query = reactive({ q: "", page: 1 });
const { data, error, status } = await useFetch<{
  users: { id: string; name: string; email: string; phone: string | null }[];
  total: number;
  pageSize: number;
}>(useBookingPath("/api/reception/patients"), { query });
const pages = computed(() =>
  Math.max(
    1,
    Math.ceil((data.value?.total ?? 0) / (data.value?.pageSize ?? 30)),
  ),
);

function findPatients() {
  query.page = 1;
  query.q = search.value.trim();
}
</script>

<template>
  <section class="wrap section">
    <p class="eyebrow">Reception</p>
    <h1>Patient directory</h1>
    <p class="lede">Find patient contact details for the practice.</p>
    <div class="panel">
      <form class="form-panel" @submit.prevent="findPatients">
        <label
          >Search patients<input
            v-model="search"
            type="search"
            maxlength="120"
            placeholder="Name, email or phone"
        /></label>
        <div class="actions">
          <button class="button small secondary">Search</button>
        </div>
      </form>
      <p v-if="error" class="notice error" role="alert">
        Unable to load patient profiles. Please try again.
      </p>
      <p v-else-if="status === 'pending'" role="status">Loading patients…</p>
      <p v-else-if="!data?.users.length" class="empty">No matching patients.</p>
      <article
        v-for="patient in data?.users"
        :key="patient.id"
        class="directory-row"
      >
        <h2>{{ patient.name }}</h2>
        <div>
          <small>{{ patient.email }}</small>
          <small>{{ patient.phone || "No phone number saved" }}</small>
        </div>
      </article>
      <div v-if="pages > 1" class="actions spaced">
        <button
          class="button small secondary"
          :disabled="query.page <= 1"
          @click="query.page--"
        >
          Previous page
        </button>
        <span>Page {{ query.page }} of {{ pages }}</span>
        <button
          class="button small secondary"
          :disabled="query.page >= pages"
          @click="query.page++"
        >
          Next page
        </button>
      </div>
    </div>
  </section>
</template>
