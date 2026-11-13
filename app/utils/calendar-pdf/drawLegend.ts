import type { jsPDF } from 'jspdf'
import { categories } from '../categories'
import type { CalEvent } from './types'
import { fmtRange } from './helpers'
import { drawSwatch } from './hatch'
import { getOverlayEvents } from './overlay'
import { flowEntries, type Box, type FlowEntry } from './flowText'

// co ląduje w ramce po prawej, a co w kolumnach na dole
const BOX_SLUGS = ['rozpoczecie-zakonczenie', 'dniwolne', 'wolneodzajec']
const BOTTOM_SLUGS = ['rada', 'zebrania', 'konsultacje', 'krew', 'praktyki', 'egzaminy']

// "Praktyki zawodowe - klasy 4DH, 4E, 4P" -> "4DH, 4E, 4P"
const classesOf = (name: string) => name.match(/klasy?\s+(.+)$/i)?.[1] ?? name

function buildEntries(events: CalEvent[], slugs: string[]): FlowEntry[] {
  const hatchOf = new Map(getOverlayEvents(events).map(e => [e.id, e.hatch] as const))

  const out: FlowEntry[] = []
  for (const slug of slugs) {
    const cat = categories.find(c => c.slug === slug)
    if (!cat) continue
    const list = events
      .filter(e => e.typ === slug)
      .sort((a, b) => a.start_data.localeCompare(b.start_data))
    if (!list.length) continue

    out.push(
      cat.overlay
        ? { kind: 'heading', text: cat.label }               // bez zbiorczego kwadracika
        : { kind: 'heading', text: cat.label, color: cat.color },
    )
    for (const ev of list) {
      out.push({
        kind: 'item',
        date: fmtRange(ev.start_data, ev.koniec_data),
        text: ev.nazwa,
        hatch: cat.overlay ? hatchOf.get(ev.id) : undefined,
      })
    }
  }
  return out
}

// ramka po prawej: legenda kolorów + najważniejsze terminy
export function drawLegendBox(doc: jsPDF, events: CalEvent[], box: Box) {
  doc.setDrawColor(0, 0, 0).setLineWidth(0.4).rect(box.x, box.y, box.w, box.h, 'S')

  const groups = getOverlayEvents(events)
  const STEP = 3.5
  let y = box.y + 4.5

  for (const c of categories) {
    if (c.calendar === false) continue // kategorie niewidoczne w kalendarzu nie mają koloru w legendzie

    if (c.overlay) {
      // nagłówek + po jednym wierszu na każdą grupę klas, każda z własnym kreskowaniem
      doc.setFont('Roboto', 'bold').setFontSize(6).setTextColor(0, 0, 0)
      doc.text(`${c.label} – klasy:`, box.x + 2.5, y)
      y += STEP
      for (const g of groups.filter(e => e.typ === c.slug)) {
        drawSwatch(doc, box.x + 4, y - 2.6, 3.2, { hatches: [g.hatch] })
        doc.setFont('Roboto', 'normal').setFontSize(6).setTextColor(0, 0, 0)
        doc.text(classesOf(g.nazwa), box.x + 9, y, { maxWidth: box.w - 11 })
        y += STEP
      }
      continue
    }

    drawSwatch(doc, box.x + 2.5, y - 2.6, 3.2, { fill: c.color })
    doc.setFont('Roboto', 'normal').setFontSize(6).setTextColor(0, 0, 0)
    doc.text(c.label, box.x + 7.5, y)
    y += STEP
  }

  y += 0.5
  doc.setDrawColor(150, 150, 150).setLineWidth(0.15).line(box.x + 2, y, box.x + box.w - 2, y)

  flowEntries(
    doc,
    buildEntries(events, BOX_SLUGS),
    { x: box.x + 2.5, y: y + 1.5, w: box.w - 5, h: box.y + box.h - y - 3 },
    1,
  )
}

// pozostałe wydarzenia w kolumnach pod kalendarzem
export function drawEventColumns(doc: jsPDF, events: CalEvent[], box: Box) {
  flowEntries(doc, buildEntries(events, BOTTOM_SLUGS), box, 4, 5)
}