<script setup lang="ts">
const supabase = useSupabaseClient()
const toast = useToast()

const state = reactive({ email: '', password: '' })
const loading = ref(false)

const validate = (s: typeof state) => {
  const errors = []
  if (!s.email) errors.push({ name: 'email', message: 'Podaj adres email' })
  if (!s.password) errors.push({ name: 'password', message: 'Podaj hasło' })
  return errors
}

async function onSubmit() {
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: state.email,
    password: state.password,
  })
  loading.value = false

  if (error) {
    toast.add({
      title: 'Nie udało się zalogować',
      description: 'Nieprawidłowy email lub hasło',
      color: 'error',
    })
    return
  }
  await navigateTo('/admin')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-xl font-semibold">Logowanie administratora</h1>
      </template>

      <UForm :state="state" :validate="validate" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" autocomplete="email" class="w-full" />
        </UFormField>

        <UFormField label="Hasło" name="password">
          <UInput v-model="state.password" type="password" autocomplete="current-password" class="w-full" />
        </UFormField>

        <UButton type="submit" label="Zaloguj" :loading="loading" block />
      </UForm>

      <template #footer>
        <NuxtLink to="/" class="text-sm underline">← Wróć do kalendarza</NuxtLink>
      </template>
    </UCard>
  </div>
</template>