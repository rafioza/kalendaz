import type { CalEvent } from './types'
import { loadFonts } from './fonts'
import { buildDayMap } from './dayMap'
import { bufToBase64 } from './helpers'
import { BLOCK_H, drawMonth } from './drawMonth'
import { drawEventColumns, drawLegendBox } from './drawLegend'
import { buildOverlayMap } from './overlay'

export type { CalEvent } from './types'

export interface PdfOptions {
  headerLines?: string[]
  logoUrl?: string   // np. '/images/logo.png' (opcjonalnie)
  crestUrl?: string  // np. '/images/herb.png' (opcjonalnie)
}

const MONTHS = ['wrzesień', 'październik', 'listopad', 'grudzień', 'styczeń', 'luty',
  'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień']

const M = 8          // margines strony
const GAP = 3        // odstęp między miesiącami
const TOP = 30       // początek siatki miesięcy
const LEG_W = 60     // szerokość ramki z legendą

async function loadImage(url?: string) {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const type = url.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG'
    const b64 = bufToBase64(await res.arrayBuffer())
    return { data: `data:image/${type.toLowerCase()};base64,${b64}`, type }
  } catch {
    return null
  }
}

export async function generateCalendarPdf(
  events: CalEvent[],
  startYear: number,
  options: PdfOptions = {},
) {
  const {
    headerLines = ['Zespół Szkół nr 4 im. Janusza Groszkowskiego', 'w Tychach'],
    logoUrl,
    crestUrl,
  } = options

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  await loadFonts(doc)

  const pageW = doc.internal.pageSize.getWidth()   // 297
  const pageH = doc.internal.pageSize.getHeight()  // 210

  // --- nagłówek ---
  doc.setFont('Roboto', 'bold').setFontSize(11).setTextColor(0, 0, 0)
  headerLines.forEach((line, i) => doc.text(line, pageW / 2, 12 + i * 5.2, { align: 'center' }))
  doc.setFontSize(10)
  doc.text(
    `Kalendarz Roku Szkolnego ${startYear}/${startYear + 1}`,
    pageW / 2,
    12 + headerLines.length * 5.2 + 2.5,
    { align: 'center' },
  )

  const [logo, crest] = await Promise.all([loadImage(logoUrl), loadImage(crestUrl)])
  if (logo) doc.addImage(logo.data, logo.type, M + 40, 7, 20, 20)
  if (crest) doc.addImage(crest.data, crest.type, pageW - M - 60, 7, 17, 20)

  // --- siatka 4x3 miesięcy ---
  const monthsW = pageW - M * 2 - LEG_W - 4
  const colW = (monthsW - GAP * 3) / 4
  const monthsH = 3 * BLOCK_H + 2 * GAP
  const dayMap = buildDayMap(events)
  const overlayMap = buildOverlayMap(events)

  MONTHS.forEach((name, i) => {
    const month = (8 + i) % 12            // wrzesień = 8
    const year = month >= 8 ? startYear : startYear + 1
    drawMonth(doc, {
      x0: M + (i % 4) * (colW + GAP),
      y0: TOP + Math.floor(i / 4) * (BLOCK_H + GAP),
      width: colW,
      year,
      month,
      name,
      dayMap,
      overlayMap,   
    })
  })

  // --- ramka z legendą po prawej ---
  drawLegendBox(doc, events, { x: M + monthsW + 4, y: TOP, w: LEG_W, h: monthsH })

  // --- wydarzenia w kolumnach na dole ---
  const bottomY = TOP + monthsH + 5
  drawEventColumns(doc, events, { x: M, y: bottomY, w: pageW - M * 2, h: pageH - 6 - bottomY })

  doc.save(`kalendarz-${startYear}-${startYear + 1}.pdf`)
}