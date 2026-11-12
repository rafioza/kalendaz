<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { categories, categoryItems } from '~/utils/categories'
import { generateCalendarPdf, type CalEvent } from '~/utils/calendar-pdf'

const SCHOOL_YEAR_START = 2026

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const isMobile = useMediaQuery('(max-width: 768px)')
const value = ref('wszystko')
const loading = ref(false)

const { data: dane } = await useAsyncData('events', async () => {
  const { data, error } = await supabase.from('events').select('*')
  if (error) throw error
  return data as CalEvent[]
})

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

// PDF zawsze zawiera cały kalendarz, niezależnie od wybranego filtra
async function downloadPdf() {
  loading.value = true
  try {
    await generateCalendarPdf(dane.value ?? [], SCHOOL_YEAR_START)
  } catch (e) {
    console.error('Błąd generowania PDF:', e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UHeader title="kalendarz" :toggle="false" class="bg-secondary">
    <template #right>
      <UButton v-if="!user" label="Zaloguj" to="/login" />
      <UButton v-else label="Panel" to="/admin" />
    </template>
  </UHeader>

  <div class="p-3 flex items-center gap-2">
    filtry: <USelect v-model="value" :items="categoryItems" class="w-64" />
  </div>

  <div class="flex flex-wrap w-full">
    <template v-if="!isMobile">
      <small
        v-for="c in categories"
        :key="c.slug"
        class="text-center m-2 rounded-xl"
        :style="{ color: c.color, border: '1px solid ' + c.color, padding: '0.5rem 1rem', display: 'inline-block' }"
      >
        {{ c.label }}
      </small>
    </template>
  </div>

  <section class="flex justify-center items-center w-full p-3">
    <ClientOnly>
      <CalendarMonthCalendar
        :year-start="`${SCHOOL_YEAR_START}-09-01`"
        :year-end="`${SCHOOL_YEAR_START + 1}-08-31`"
        :categories="categories"
        :events="events ?? []"
      />
    </ClientOnly>
  </section>

  <ul v-if="isMobile" class="flex flex-wrap w-full">
    <li
      v-for="c in categories"
      :key="c.slug"
      class="text-center m-2 rounded-xl"
      :style="{ color: c.color }"
    >
      {{ c.label }}
    </li>
  </ul>

  <div class="w-full text-center">
    <UButton :loading="loading" :disabled="!dane?.length" @click="downloadPdf">
      pobierz kalendarz w PDF
    </UButton>
  </div>
</template>