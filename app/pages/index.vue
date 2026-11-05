<script setup lang="ts">
const supabase = useSupabaseClient()

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
  { slug: 'dniwolne', color: '#FF0000' },
  { slug: 'egzaminy', color: '#7C3AED' },
  { slug: 'rozpoczecie-zakonczenie' , color:'#FFFF00'},
]

const items = [
  { label: 'Wszystko', value: 'wszystko' },
  { label: 'Egzaminy', value: 'egzaminy' },
  { label: 'Dni wolne', value: 'dniwolne' },
  { label: 'Rozpoczęcie / zakończenie', value: 'rozpoczecie-zakonczenie' },
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
  <div class="bg-secondary p-3">
     filtry: <USelect v-model="value" :items="items" />
  </div>
  <ClientOnly>
    <CalendarMonthCalendar
      year-start="2026-09-01"
      year-end="2027-08-31"
      :categories="categories"
      :events="events??[]"
    />
  </ClientOnly>
  <div class="flex flex-wrap w-full" >
    <p class="bg-purple-700 text-white text-center m-4 p-2 rounded-xl" >egzaminy</p>
    <p class="text-white text-center bg-red-500 m-4 p-2 rounded-xl" >dni ustawowo wolne</p>
    <p class="text-white bg-yellow-400 m-4 p-2 rounded-xl" >rozpoczęcie/zakończenie</p>
  </div>
</template>