import type { jsPDF } from 'jspdf'
import { categories, colorForPdf } from '../categories'
import type { CalEvent } from './types'
import { fmtRange, fmtRangeFull, sentence, shortName } from './helpers'
import { getOverlayEvents } from './overlay'
import { drawEntries, fitFont, type Box, type FlowEntry } from './flowText'

// Wydarzenia pokazywane na listach półroczy w panelu (oprócz całej kategorii poniżej)
const PANEL_SLUGS = ['rozpoczecie-zakonczenie', 'krew']
const PANEL_NAME_MATCH = /egzaminy maturalne|dzień otwarty szkoły/i
const BOLD_MATCH = /rozpoczęcie roku|zakończenie roku|dzień otwarty szkoły/i

const isPanelEvent = (e: CalEvent) => PANEL_SLUGS.includes(e.typ) || PANEL_NAME_MATCH.test(e.nazwa)
const byDate = (a: CalEvent, b: CalEvent) => a.start_data.localeCompare(b.start_data)

// "Praktyki zawodowe - klasy 4DH, 4E, 4P" -> "4DH, 4E, 4P"
const classesOf = (name: string) => name.match(/klasy?\s+(.+)$/i)?.[1] ?? name

// ---------- panel po prawej ----------

const PANEL_LEGEND: { slug: string; text: string; bullets?: RegExp }[] = [
  { slug: 'dniwolne', text: 'dni ustawowo wolne' },
  { slug: 'rozpoczecie-zakonczenie', text: 'rozpoczęcie i zakończenie zajęć dydaktycznych:', bullets: /zakończenie II półrocza/i },
  { slug: 'wolneodzajec', text: 'dni wolne od zajęć dydaktycznych, w tym:', bullets: /./ },
]

function panelEntries(events: CalEvent[], startYear: number): FlowEntry[] {
  const out: FlowEntry[] = []

  for (const row of PANEL_LEGEND) {
    const c = categories.find(x => x.slug === row.slug)
    if (!c) continue
    out.push({ kind: 'heading', text: row.text, color: colorForPdf(c), bold: false })
    if (!row.bullets) continue
    events
      .filter(e => e.typ === row.slug && row.bullets!.test(e.nazwa) && !PANEL_NAME_MATCH.test(e.nazwa))
      .sort(byDate)
      .forEach(ev => out.push({
        kind: 'item',
        bullet: true,
        date: fmtRange(ev.start_data, ev.koniec_data),
        text: '– ' + sentence(shortName(ev.nazwa)),
      }))
  }

  const timeline = events.filter(isPanelEvent).sort(byDate)
  const split = `${startYear + 1}-01-16` // granica półroczy
  const semesters = [
    { title: 'Pierwsze półrocze', list: timeline.filter(e => e.start_data < split) },
    { title: 'Drugie półrocze', list: timeline.filter(e => e.start_data >= split) },
  ]
  for (const s of semesters) {
    if (!s.list.length) continue
    out.push({ kind: 'title', text: s.title })
    for (const ev of s.list) {
      out.push({
        kind: 'item',
        date: '',
        text: `${fmtRangeFull(ev.start_data, ev.koniec_data)} – ${sentence(ev.nazwa)}`,
        bold: BOLD_MATCH.test(ev.nazwa),
      })
    }
  }
  return out
}

export function drawLegendPanel(doc: jsPDF, events: CalEvent[], box: Box, startYear: number) {
  doc.setDrawColor(0, 0, 0).setLineWidth(0.4).rect(box.x, box.y, box.w, box.h, 'S')

  const pad = 2.5
  const w = box.w - pad * 2
  const entries = panelEntries(events, startYear)
  const fs = fitFont(doc, [{ entries, w }], box.h - pad * 2, 7.5, 4)
  drawEntries(doc, entries, box.x + pad, box.y + pad, w, fs)
}

// ---------- kolumny na dole ----------

function bottomColumns(events: CalEvent[], startYear: number): FlowEntry[][] {
  const of = (slug: string) => events.filter(e => e.typ === slug).sort(byDate)

  const item = (ev: CalEvent, dash = true): FlowEntry => ({
    kind: 'item',
    date: fmtRange(ev.start_data, ev.koniec_data),
    text: (dash ? '– ' : '') + shortName(ev.nazwa),
  })

  const block = (slug: string): FlowEntry[] => {
    const c = categories.find(x => x.slug === slug)
    const list = of(slug)
    if (!c || !list.length) return []
    const swatch = !c.overlay && c.calendar !== false
    return [
      { kind: 'heading', text: c.label.toLowerCase(), color: swatch ? colorForPdf(c) : undefined },
      ...list.map(ev => item(ev)),
    ]
  }

  const practice = (): FlowEntry[] => {
    const groups = getOverlayEvents(events)
    if (!groups.length) return []
    return [
      { kind: 'heading', text: 'praktyki zawodowe klasy:' },
      ...groups.map((g): FlowEntry => ({ kind: 'item', date: '', hatch: g.hatch, text: classesOf(g.nazwa) })),
    ]
  }

  const examBlock = (list: CalEvent[], title: string, dash: boolean): FlowEntry[] =>
    list.length
      ? [{ kind: 'heading', text: title }, ...list.map(ev => item(ev, dash))]
      : []

  const exams = of('egzaminy').filter(e => !PANEL_NAME_MATCH.test(e.nazwa))
  const written = exams.filter(e => /\(część pisemna\)/i.test(e.nazwa))
  const practical = exams.filter(e => /\(praktyczny\)/i.test(e.nazwa))
  const winterEnd = `${startYear + 1}-03-01`
  const winter = practical.filter(e => e.start_data < winterEnd)
  const summer = practical.filter(e => e.start_data >= winterEnd)
  const other = exams.filter(e => !written.includes(e) && !practical.includes(e))

  return [
    [...block('rada'), ...practice()],
    [...block('zebrania'), ...block('konsultacje')],
    [
      ...examBlock(written, 'egzaminy zawodowe – część pisemna (sesja / klasa):', false),
      ...examBlock(winter, 'egzaminy zawodowe – część praktyczna sesja zimowa, kwalifikacje', true),
    ],
    [
      ...examBlock(summer, 'egzaminy zawodowe – część praktyczna sesja letnia, kwalifikacje', true),
      ...examBlock(other, 'egzaminy', true),
    ],
  ].filter(col => col.length)
}

export function drawBottomColumns(doc: jsPDF, events: CalEvent[], box: Box, startYear: number) {
  const cols = bottomColumns(events, startYear)
  if (!cols.length) return
  const gap = 5
  const w = (box.w - gap * (cols.length - 1)) / cols.length
  const fs = fitFont(doc, cols.map(entries => ({ entries, w })), box.h, 8, 4)
  cols.forEach((entries, i) => drawEntries(doc, entries, box.x + i * (w + gap), box.y, w, fs))
}