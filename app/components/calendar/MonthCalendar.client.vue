<script setup lang="ts">
import { ScheduleXCalendar } from '@schedule-x/vue'
import {
  createCalendar,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import '@schedule-x/theme-default/dist/index.css'
import 'temporal-polyfill/global'

type Category = { slug: string; color: string }
type EventRow = {
  id: string
  title: string
  description: string | null
  start_date: string // 'YYYY-MM-DD'
  end_date: string
  category_slug: string
}

const props = defineProps<{
  yearStart: string // 'YYYY-MM-DD'
  yearEnd: string
  categories: Category[]
  events: EventRow[]
}>()

// kolory kategorii z bazy -> format wymagany przez Schedule-X
const calendars = Object.fromEntries(
  props.categories.map((c) => [
    c.slug,
    {
      colorName: c.slug, // tylko małe litery
      lightColors: {
        main: c.color,
        container: `color-mix(in srgb, ${c.color} 18%, white)`,
        onContainer: `color-mix(in srgb, ${c.color} 70%, black)`,
      },
    },
  ]),
)

const toSxEvents = (rows: EventRow[]) =>
  rows.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description ?? undefined,
    start: Temporal.PlainDate.from(e.start_date),
    end: Temporal.PlainDate.from(e.end_date),
    calendarId: e.category_slug,
  }))

const eventsService = createEventsServicePlugin()

// Bez ref(): instancja kalendarza nie jest reaktywna (ostrzega o tym dokumentacja)
const today = Temporal.Now.plainDateISO()
const start = Temporal.PlainDate.from(props.yearStart)
const end = Temporal.PlainDate.from(props.yearEnd)
const inYear =
  Temporal.PlainDate.compare(today, start) >= 0 &&
  Temporal.PlainDate.compare(today, end) <= 0

const calendarApp = createCalendar({
  locale: 'pl-PL',
  firstDayOfWeek: 1,
  views: [createViewMonthGrid(), createViewMonthAgenda()],
  defaultView: 'month-grid',
  selectedDate: inYear ? today : start,
  minDate: start,
  maxDate: end,
  calendars,
  events: toSxEvents(props.events),
  plugins: [eventsService],
})

// po zmianie danych (dodanie/edycja/usunięcie) podmień wydarzenia bez przeładowania
watch(
  () => props.events,
  (rows) => eventsService.set(toSxEvents(rows)),
)
</script>

<template>
  <div class="calendar-box">
    <ScheduleXCalendar :calendar-app="calendarApp" />
  </div>
</template>

<style>
/* Kalendarz nie ma własnej wysokości i szerokości, trzeba je ustawić */
.sx-vue-calendar-wrapper {
  width: 100%;
  max-width: 100vw;
  height: 800px;
  max-height: 90vh;
}
</style>