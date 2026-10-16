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
  { slug: 'dniwolne', color: '#E5484D' },
  { slug: 'egzaminy', color: '#7C3AED' },
]
const events = []
dane.value.forEach(element => {
  events.push({
    id:element.id,
    title: element.nazwa,
    start_date: element.start_data,
    end_date: element.koniec_data,
    category_slug: element.typ
  })
  console.log(element)
});

</script>

<template>
  <div class="bg-secondary">
  </div>
  <ClientOnly>
    <CalendarMonthCalendar
      year-start="2026-09-01"
      year-end="2027-08-31"
      :categories="categories"
      :events="events"
    />
  </ClientOnly>
  <div>
    <p class="bg-purple-700 text-white text-center m-4" style="width: 150px">egzaminy</p>
    <p class="text-white text-center bg-red-500 m-4" style="width: 150px">dni wolne</p>
  </div>
</template>