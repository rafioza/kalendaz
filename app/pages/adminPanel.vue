<script setup lang="ts">
const items = [
  { label: 'Egzaminy', value: 'egzaminy' },
  { label: 'Dni wolne', value: 'dniwolne' },
  { label: 'Rozpoczęcie / zakończenie', value: 'rozpoczecie-zakonczenie' },
]

const state = reactive({
  nazwa: '',
  start_data: '',
  koniec_data: '',
  typ: undefined as string | undefined,
})

async function onSubmit() {
    console.log(state)
    const supabase = useSupabaseClient()
    const { error } = await supabase.from('events').insert(state)
    if (error) console.error(error)  
}
</script>

<template>
  <h1>Dodaj wydarzenie</h1>
  <UForm :state="state" @submit="onSubmit" class="space-y-4">
    <UFormField label="Nazwa wydarzenia" name="nazwa">
      <UInput v-model="state.nazwa" placeholder="nazwa" />
    </UFormField>
    <UFormField label="Data rozpoczęcia" name="start_data">
      <UInput v-model="state.start_data" type="date" />
    </UFormField>
    <UFormField label="Data zakończenia" name="koniec_data">
      <UInput v-model="state.koniec_data" type="date" />
    </UFormField>
    <UFormField label="Kategoria" name="typ">
      <USelect v-model="state.typ" :items="items" placeholder="Wybierz kategorię" class="w-64" />
    </UFormField>
    <UButton type="submit">Dodaj</UButton>
  </UForm>
</template>