import { categories } from '../categories'
import type { CalEvent } from './types'
import { dateKey, parse } from './helpers'

// data -> slug kategorii (przy kolizji wygrywa wyższy priorytet z listy categories)
export function buildDayMap(events: CalEvent[]) {
  const map = new Map<string, string>()
  const prio = (slug: string) => categories.findIndex(c => c.slug === slug)
  const sorted = [...events]
    .filter(e => prio(e.typ) !== -1)
    .sort((a, b) => prio(a.typ) - prio(b.typ))

  for (const ev of sorted) {
    const cur = parse(ev.start_data)
    const end = parse(ev.koniec_data ?? ev.start_data)
    while (cur <= end) {
      const k = dateKey(cur.getFullYear(), cur.getMonth(), cur.getDate())
      if (!map.has(k)) map.set(k, ev.typ)
      cur.setDate(cur.getDate() + 1)
    }
  }
  return map
}