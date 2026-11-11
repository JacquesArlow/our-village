<script setup lang="ts">
import {
  accountRoles,
  accountRoleLabels,
  type AccountRole,
} from "~~/shared/accounts";

interface UserEntry {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  disabledAt: number | null;
  mustChangePassword: boolean;
  phone: string | null;
  consent_at: number | null;
}

const emit = defineEmits<{ changed: [] }>();
const { account } = useAccount();
const { message } = useBookingUi();
const request = useBookingRequest();
const filter = reactive({ q: "", role: "", page: 1 });
const search = ref("");
const {
  data,
  error: loadError,
  refresh,
} = await useFetch<{
  users: UserEntry[];
  total: number;
  pageSize: number;
}>(useBookingPath("/api/admin/users"), { query: filter });
const form = reactive({
  name: "",
  email: "",
  role: "patient" as AccountRole,
  phone: "",
});
const editing = ref<UserEntry | null>(null);
const showForm = ref(false);
const busy = ref(false);
const error = ref("");
const notice = ref("");
const credentials = ref<{ email: string; temporaryPassword: string } | null>(
  null,
);
const pages = computed(() =>
  Math.max(
    1,
    Math.ceil((data.value?.total ?? 0) / (data.value?.pageSize ?? 30)),
  ),
);

function openForm(user: UserEntry | null) {
  error.value = "";
  editing.value = user;
  Object.assign(form, {
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "patient",
    phone: user?.phone ?? "",
  });
  showForm.value = true;
}

async function update(
  path: string,
  method: "POST" | "PATCH",
  body: object,
  success: string,
) {
  error.value = "";
  notice.value = "";
  busy.value = true;
  try {
    const result = await request<{
      email?: string;
      temporaryPassword?: string;
    }>(path, { method, body });
    if (result.email && result.temporaryPassword)
      credentials.value = {
        email: result.email,
        temporaryPassword: result.temporaryPassword,
      };
    notice.value = success;
    await Promise.all([refresh(), refreshNuxtData("public-doctors")]);
    emit("changed");
    return true;
  } catch (e) {
    error.value = message(e);
    return false;
  } finally {
    busy.value = false;
  }
}

async function save() {
  const user = editing.value;
  const body = { name: form.name, email: form.email };
  const saved = user
    ? await update(
        "/api/admin/users/" + user.id,
        "PATCH",
        user.consent_at ? { ...body, phone: form.phone } : body,
        "Account updated.",
      )
    : await update(
        "/api/admin/users",
        "POST",
        { ...body, role: form.role },
        "Account created.",
      );
  if (saved) showForm.value = false;
}

async function toggle(user: UserEntry) {
  const enabled = !!user.disabledAt;
  if (!enabled && !window.confirm("Disable this account and sign them out?"))
    return;
  await update(
    "/api/admin/users/" + user.id,
    "PATCH",
    { enabled },
    enabled ? "Account reactivated." : "Account disabled.",
  );
}

async function reset(user: UserEntry) {
  if (
    !window.confirm("Set a new temporary password and sign this account out?")
  )
    return;
  await update(
    "/api/admin/users/" + user.id + "/temporary-password",
    "POST",
    {},
    "Temporary password set.",
  );
}

async function copyPassword() {
  if (!credentials.value) return;
  try {
    await navigator.clipboard.writeText(credentials.value.temporaryPassword);
    notice.value = "Temporary password copied.";
  } catch {
    error.value = "Select the temporary password to copy it.";
  }
}
</script>

<template>
  <section class="panel">
    <div class="section-heading">
      <div>
        <h2>User management</h2>
        <p class="hint">
          Create and manage booking accounts. Share new temporary passwords
          securely.
        </p>
      </div>
      <div class="actions">
        <NuxtLink to="/change-password" class="button secondary small"
          >Change my password</NuxtLink
        >
        <button type="button" class="button small" @click="openForm(null)">
          Add user
        </button>
      </div>
    </div>
    <p v-if="error || loadError" class="notice error" role="alert">
      {{ error || "Unable to load user accounts. Please try again." }}
    </p>
    <p v-if="notice" class="notice success" role="status">{{ notice }}</p>
    <div v-if="credentials" class="notice">
      <strong>Temporary sign-in details</strong>
      <p>{{ credentials.email }}</p>
      <label
        >Temporary password
        <input
          :value="credentials.temporaryPassword"
          readonly
          autocomplete="off"
        />
      </label>
      <p class="hint">
        Share these details securely. The user will change this password at their first sign-in.
      </p>
      <div class="actions">
        <button
          class="button small secondary"
          type="button"
          @click="copyPassword"
        >
          Copy password
        </button>
        <button
          class="button small ghost"
          type="button"
          @click="credentials = null"
        >
          Hide credentials
        </button>
      </div>
    </div>
    <form
      v-if="showForm"
      class="form-panel panel spaced"
      @submit.prevent="save"
    >
      <h3>{{ editing ? "Edit account" : "Add a booking account" }}</h3>
      <label
        >Full name<input v-model="form.name" maxlength="100" required
      /></label>
      <label
        >Sign-in email<input
          v-model="form.email"
          type="email"
          maxlength="254"
          :disabled="editing?.id === account?.user.id"
          required
      /></label>
      <p v-if="editing && editing.email !== form.email" class="hint">
        Changing this address generates a new temporary password and ends
        existing sessions.
      </p>
      <label v-if="!editing"
        >Account role
        <select v-model="form.role">
          <option v-for="role in accountRoles" :key="role" :value="role">
            {{ accountRoleLabels[role] }}
          </option>
        </select>
      </label>
      <label v-if="editing?.role === 'patient' && editing.consent_at"
        >Phone number<input v-model="form.phone" type="tel" maxlength="30"
      /></label>
      <div class="actions">
        <button class="button" :disabled="busy">
          {{ editing ? "Save account" : "Create account" }}
        </button>
        <button class="button ghost" type="button" @click="showForm = false">
          Cancel
        </button>
      </div>
    </form>
    <form
      class="form-panel spaced"
      @submit.prevent="
        filter.page = 1;
        filter.q = search.trim();
      "
    >
      <div class="two-cols">
        <label
          >Search accounts<input
            v-model="search"
            type="search"
            maxlength="120"
            placeholder="Name, email or phone"
        /></label>
        <label
          >Filter by role
          <select v-model="filter.role" @change="filter.page = 1">
            <option value="">All roles</option>
            <option v-for="role in accountRoles" :key="role" :value="role">
              {{ accountRoleLabels[role] }}
            </option>
          </select>
        </label>
      </div>
      <div class="actions">
        <button class="button small secondary">Search</button>
      </div>
    </form>
    <article v-for="user in data?.users" :key="user.id" class="directory-row">
      <div>
        <h3>{{ user.name }}</h3>
        <small
          >{{ user.email
          }}<template v-if="user.phone"> · {{ user.phone }}</template></small
        >
        <span class="badge">{{ accountRoleLabels[user.role] }}</span>
        <span class="badge" :class="user.disabledAt ? '' : 'success'">
          {{
            user.disabledAt
              ? "Disabled"
              : user.mustChangePassword
                ? "Password change required"
                : "Active"
          }}
        </span>
      </div>
      <div class="actions">
        <button
          class="button small secondary"
          :disabled="busy"
          @click="openForm(user)"
        >
          Edit
        </button>
        <template v-if="user.id !== account?.user.id">
          <button
            class="button small ghost"
            :disabled="busy"
            @click="reset(user)"
          >
            Reset password
          </button>
          <button
            class="button small secondary"
            :disabled="busy"
            @click="toggle(user)"
          >
            {{ user.disabledAt ? "Reactivate" : "Disable" }}
          </button>
        </template>
      </div>
    </article>
    <p v-if="data && !data.users.length" class="empty">
      No accounts match this search.
    </p>
    <div v-if="pages > 1" class="actions spaced">
      <button
        class="button small secondary"
        :disabled="filter.page <= 1"
        @click="filter.page--"
      >
        Previous page
      </button>
      <span>Page {{ filter.page }} of {{ pages }}</span>
      <button
        class="button small secondary"
        :disabled="filter.page >= pages"
        @click="filter.page++"
      >
        Next page
      </button>
    </div>
  </section>
</template>
