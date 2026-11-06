<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const { data: dane, error } = await useAsyncData('events', async () => {
  const { data, error } = await supabase.from('events').select('*')
  if (error) {
    console.error('Supabase error:', error)
    throw error
  }
  return data
})

console.log(dane.value, error.value)


const categories = [
  { slug: 'dniwolne', label: 'Dni ustawowo wolne', color: '#FF0000' },
  { slug: 'wolneodzajec', label: 'Dni wolne od zajęć', color: '#FDBA74' },
  { slug: 'rozpoczecie-zakonczenie', label: 'Rozpoczęcie / zakończenie', color: '#FFFF00' },
  { slug: 'egzaminy', label: 'Egzaminy', color: '#7C3AED' },
  { slug: 'rada', label: 'Rada klasyfikacyjna', color: '#16A34A' },
  { slug: 'zebrania', label: 'Zebrania z rodzicami', color: '#38BDF8' },
  { slug: 'konsultacje', label: 'Konsultacje', color: '#0EA5E9' },
  { slug: 'krew', label: 'Akcja oddawania krwi', color: '#D946EF' },
  { slug: 'praktyki', label: 'Praktyki zawodowe', color: '#6366F1' },
]

const items = [
  { label: 'Wszystko', value: 'wszystko' },
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
const value = ref('wszystko')

const events = computed(() =>
  (dane.value ?? [])
    .filter(e => value.value === 'wszystko' || e.typ === value.value)
    .map(e => ({
      id: e.id,
      title: e.nazwa,
      start_date: e.start_data,
      end_date: e.koniec_data,
      category_slug: e.typ,
    }))
)
</script>

<template>
  <UHeader title="kalendarz" :toggle="false" class="bg-secondary">
    <template #right>
       <UButton v-if="!user" label="Zaloguj" to="/login" />
        <UButton v-else label="Panel" to="/admin" />
    </template>
  </UHeader>

  <div class="p-3 flex items-center gap-2">
    filtry: <USelect v-model="value" :items="items" class="w-64" />
  </div>
  <div class="flex flex-wrap w-full">
  <small
    v-for="c in categories"
    :key="c.slug"
    class="text-center m-2 p-2 rounded-xl"
    :style="{ backgroundColor: c.color, color: 'black' }"
  >
    {{ c.label }}
  </small>
 
</div>
  <section class="flex justify-center items-center w-full p-3">
    <ClientOnly>
    <CalendarMonthCalendar
      year-start="2026-09-01"
      year-end="2027-08-31"
      :categories="categories"
      :events="events??[]"
    />
  </ClientOnly>
  </section>
  
  
</template>