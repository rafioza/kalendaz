import { categories } from '../categories'
import type { CalEvent } from './types'
import { dateKey, parse } from './helpers'

export const HATCH_PALETTE = ['#16A34A', '#0EA5E9', '#7C3AED', '#D946EF', '#F59E0B']

export type OverlayEvent = CalEvent & { hatch: string }

// wydarzenia z kategorii overlay, każde z własnym kolorem kreskowania
export function getOverlayEvents(events: CalEvent[]): OverlayEvent[] {
  const slugs = new Set(categories.filter(c => c.overlay).map(c => c.slug))
  return events
    .filter(e => slugs.has(e.typ))
    .sort((a, b) => a.start_data.localeCompare(b.start_data))
    .map((e, i) => ({ ...e, hatch: HATCH_PALETTE[i % HATCH_PALETTE.length] }))
}

// data -> lista kolorów kreskowania (kilka warstw w jednym dniu)
export function buildOverlayMap(events: CalEvent[]) {
  const map = new Map<string, string[]>()
  for (const ev of getOverlayEvents(events)) {
    const cur = parse(ev.start_data)
    const end = parse(ev.koniec_data ?? ev.start_data)
    while (cur <= end) {
      const k = dateKey(cur.getFullYear(), cur.getMonth(), cur.getDate())
      const list = map.get(k) ?? []
      list.push(ev.hatch)
      map.set(k, list)
      cur.setDate(cur.getDate() + 1)
    }
  }
  return map
}