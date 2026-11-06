<script setup lang="ts">
const supabase = useSupabaseClient()
const toast = useToast()

const items = [
  { label: 'Dni ustawowo wolne', value: 'dniwolne' },
  { label: 'Dni wolne od zajęć', value: 'wolneodzajec' },
  { label: 'Rozpoczęcie / zakończenie', value: 'rozpoczecie-zakonczenie' },
  { label: 'Egzaminy', value: 'egzaminy' },
  { label: 'Rada klasyfikacyjna', value: 'rada' },
  { label: 'Zebrania z rodzicami', value: 'zebrania' },
  { label: 'Konsultacje', value: 'konsultacje' },
  { label: 'Akcja oddawania krwi', value: 'krew' },
  { label: 'Praktyki zawodowe', value: 'praktyki' },
]
const filterItems = [{ label: 'Wszystkie', value: 'wszystkie' }, ...items]
const filter = ref('wszystkie')

type EventRow = {
  id: string | number
  nazwa: string
  start_data: string
  koniec_data: string
  typ: string
}

// ---------- dane ----------
const { data: events, refresh } = await useAsyncData('admin-events', async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_data', { ascending: true })
  if (error) throw error
  return data as EventRow[]
})

const filtered = computed(() =>
  (events.value ?? []).filter(e => filter.value === 'wszystkie' || e.typ === filter.value),
)

const labelOf = (slug: string) => items.find(i => i.value === slug)?.label ?? slug


const state = reactive({
  nazwa: '',
  start_data: '',
  koniec_data: '',
  typ: undefined as string | undefined,
})

async function onSubmit() {
  const { error } = await supabase.from('events').insert(state)
  if (error) {
    toast.add({ title: 'Nie udało się dodać', description: error.message, color: 'error' })
    return
  }
  Object.assign(state, { nazwa: '', start_data: '', koniec_data: '', typ: undefined })
  await refresh()
}


const columns = [
  { accessorKey: 'nazwa', header: 'Nazwa' },
  { accessorKey: 'start_data', header: 'Początek' },
  { accessorKey: 'koniec_data', header: 'Koniec' },
  { accessorKey: 'typ', header: 'Kategoria' },
  { id: 'actions', header: '' },
]

const editingId = ref<string | number | null>(null)
const draft = reactive({ nazwa: '', start_data: '', koniec_data: '', typ: '' })
const saving = ref(false)

function startEdit(row: EventRow) {
  editingId.value = row.id
  Object.assign(draft, {
    nazwa: row.nazwa,
    start_data: row.start_data,
    koniec_data: row.koniec_data,
    typ: row.typ,
  })
}

function cancelEdit() {
  editingId.value = null
}

async function finishEdit() {
  if (editingId.value === null) return
  saving.value = true
  const { error } = await supabase
    .from('events')
    .update({ ...draft })
    .eq('id', editingId.value)
  saving.value = false

  if (error) {
    toast.add({ title: 'Nie udało się zapisać', description: error.message, color: 'error' })
    return
  }
  editingId.value = null
  await refresh()
}

async function remove(row: EventRow) {
  if (!confirm(`Usunąć wydarzenie "${row.nazwa}"?`)) return
  const { error } = await supabase.from('events').delete().eq('id', row.id)
  if (error) {
    toast.add({ title: 'Nie udało się usunąć', description: error.message, color: 'error' })
    return
  }
  await refresh()
}
</script>

<template>
  <UHeader title="kalendarz" :toggle="false" class="bg-secondary" />

  <div class="p-4 space-y-6">
    <section>
      <h1 class="text-xl font-semibold mb-3">Dodaj wydarzenie</h1>
      <UForm :state="state" class="space-y-4 flex flex-wrap" @submit="onSubmit">
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
    </section>

    <section class="space-y-3">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-semibold">Wydarzenia</h2>
        <USelect v-model="filter" :items="filterItems" class="w-64 ml-auto" />
      </div>

      <UTable :data="filtered" :columns="columns">
        <template #nazwa-cell="{ row }">
          <UInput v-if="editingId === row.original.id" v-model="draft.nazwa" class="w-full" />
          <span v-else>{{ row.original.nazwa }}</span>
        </template>

        <template #start_data-cell="{ row }">
          <UInput v-if="editingId === row.original.id" v-model="draft.start_data" type="date" />
          <span v-else>{{ row.original.start_data }}</span>
        </template>

        <template #koniec_data-cell="{ row }">
          <UInput v-if="editingId === row.original.id" v-model="draft.koniec_data" type="date" />
          <span v-else>{{ row.original.koniec_data }}</span>
        </template>

        <template #typ-cell="{ row }">
          <USelect
            v-if="editingId === row.original.id"
            v-model="draft.typ"
            :items="items"
            class="w-64"
          />
          <span v-else>{{ labelOf(row.original.typ) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex gap-2 justify-end">
            <template v-if="editingId === row.original.id">
              <UButton label="Zakończ" :loading="saving" @click="finishEdit" />
              <UButton label="Anuluj" color="neutral" variant="outline" @click="cancelEdit" />
            </template>
            <template v-else>
              <UButton label="Edytuj" variant="outline" @click="startEdit(row.original)" />
              <UButton label="Usuń" color="error" variant="outline" @click="remove(row.original)" />
            </template>
          </div>
        </template>
      </UTable>
    </section>
  </div>
</template>