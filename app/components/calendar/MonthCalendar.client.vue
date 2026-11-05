<script setup lang="ts">
import { ScheduleXCalendar } from '@schedule-x/vue'
import {
  createCalendar,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { createCalendarControlsPlugin } from '@schedule-x/calendar-controls'
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
const controls = createCalendarControlsPlugin()

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
  plugins: [eventsService, controls],
})

// po zmianie danych (dodanie/edycja/usunięcie) podmień wydarzenia bez przeładowania
watch(
  () => props.events,
  (rows) => eventsService.set(toSxEvents(rows)),
)

// ---------- przesuwanie palcem (tylko w wąskim trybie) ----------
const box = ref<HTMLElement | null>(null)
let startX = 0
let startY = 0

const isNarrow = () => !!box.value?.querySelector('.sx__is-calendar-small')

function shiftMonth(delta: number) {
  let next = controls.getDate().add({ months: delta })
  // nie wychodź poza rok szkolny
  if (Temporal.PlainDate.compare(next, start) < 0) next = start
  if (Temporal.PlainDate.compare(next, end) > 0) next = end
  controls.setDate(next)
}

function onTouchStart(e: TouchEvent) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  if (!isNarrow()) return
  const dx = e.changedTouches[0].clientX - startX
  const dy = e.changedTouches[0].clientY - startY

  // musi być wyraźnie poziomy i wystarczająco długi
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return

  shiftMonth(dx < 0 ? 1 : -1) // w lewo = następny miesiąc, w prawo = poprzedni
}
</script>

<template>
  <div
    ref="box"
    class="calendar-box w-full"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <ScheduleXCalendar :calendar-app="calendarApp" />
  </div>
</template>

<style>
.calendar-box {
  touch-action: pan-y; /* pionowe przewijanie zostaje, poziome obsługujemy sami */
}

/* Kalendarz nie ma własnej wysokości i szerokości, trzeba je ustawić */
.sx-vue-calendar-wrapper {
  width: 100%;
  max-width: 100vw;
  height: 700px;
  max-height: 90vh;
}
.sx-vue-calendar-wrapper:has(.sx__is-calendar-small) {
  height: auto;
  max-height: none;
}
.sx__sunday,
.sx__saturday {
  background-color: #e3e3e3;
}
</style>