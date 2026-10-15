<script setup lang="ts">
const categories = [
  { slug: 'dniwolne', color: '#E5484D' },
  { slug: 'egzaminy', color: '#7C3AED' },
]
const events = [
  {
    id: '1',
    title: 'Ferie zimowe',
    description: null,
    start_date: '2027-01-18',
    end_date: '2027-01-31',
    category_slug: 'dniwolne',
  },
  {
    id: '2',
    title: 'Egzamin próbny',
    description: null,
    start_date: '2026-10-20',
    end_date: '2026-10-20',
    category_slug: 'egzaminy',
  },
]
</script>

<template>
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