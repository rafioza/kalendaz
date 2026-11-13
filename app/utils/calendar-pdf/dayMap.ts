import { categories } from '../categories'
import type { CalEvent } from './types'
import { dateKey, parse } from './helpers'

// data -> lista slugów kategorii (kolejność wg priorytetu z listy categories).
// Kategorie overlay (kreskowanie) i calendar:false (np. egzaminy) są pomijane.
export function buildDayMap(events: CalEvent[]) {
  const map = new Map<string, string[]>()
  const base = categories.filter(c => !c.overlay && c.calendar !== false)
  const prio = (slug: string) => base.findIndex(c => c.slug === slug)
  const sorted = [...events]
    .filter(e => prio(e.typ) !== -1)
    .sort((a, b) => prio(a.typ) - prio(b.typ))

  for (const ev of sorted) {
    const cur = parse(ev.start_data)
    const end = parse(ev.koniec_data ?? ev.start_data)
    while (cur <= end) {
      const k = dateKey(cur.getFullYear(), cur.getMonth(), cur.getDate())
      const list = map.get(k) ?? []
      if (!list.includes(ev.typ)) list.push(ev.typ) // ta sama kategoria dwa razy = jeden pas
      map.set(k, list)
      cur.setDate(cur.getDate() + 1)
    }
  }
  return map
}