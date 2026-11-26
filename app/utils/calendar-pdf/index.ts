import type { CalEvent } from './types'
import { loadFonts } from './fonts'
import { buildDayMap } from './dayMap'
import { buildOverlayMap } from './overlay'
import { bufToBase64 } from './helpers'
import { BLOCK_H, drawMonth } from './drawMonth'
import { drawBottomColumns, drawLegendPanel } from './drawLegend'
import { drawSmallCaps } from './smallCaps'

export type { CalEvent } from './types'

export interface PdfOptions {
  headerLines?: string[]
  logoUrl?: string  // np. '/images/logo.png'
  crestUrl?: string // np. '/images/herb.png'
  footer?: string   // linia na dole strony (opcjonalnie)
}

const MONTHS = ['wrzesień', 'październik', 'listopad', 'grudzień', 'styczeń', 'luty',
  'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień']

const M = 8         // margines strony
const COL_GAP = 1.5 // odstęp między miesiącami w poziomie
const V_GAP = 4     // odstęp między rzędami miesięcy
const TOP = 34      // początek siatki miesięcy
const LEG_W = 74    // szerokość panelu z legendą
const LEG_GAP = 2.5 // odstęp między miesiącami a panelem

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
    footer,
  } = options

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  await loadFonts(doc)

  const pageW = doc.internal.pageSize.getWidth()  // 297
  const pageH = doc.internal.pageSize.getHeight() // 210

  // --- nagłówek (kapitaliki) ---
  doc.setFont('Roboto', 'bold').setTextColor(0, 0, 0)
  headerLines.forEach((line, i) => {
    drawSmallCaps(doc, line, pageW / 2, 11.5 + i * 6.3, 13, { align: 'center' })
  })
  drawSmallCaps(
    doc,
    `Kalendarz Roku Szkolnego ${startYear}/${startYear + 1}`,
    pageW / 2,
    11.5 + headerLines.length * 6.3 + 2,
    12,
    { align: 'center' },
  )

  const [logo, crest] = await Promise.all([loadImage(logoUrl), loadImage(crestUrl)])
  if (logo) doc.addImage(logo.data, logo.type, 34, 6.5, 24, 24)
  if (crest) doc.addImage(crest.data, crest.type, 240, 7, 18, 23)

  // --- siatka 4x3 miesięcy ---
  const panelX = pageW - M - LEG_W
  const monthsW = panelX - LEG_GAP - M
  const colW = (monthsW - COL_GAP * 3) / 4
  const monthsH = 3 * BLOCK_H + 2 * V_GAP
  const dayMap = buildDayMap(events)
  const overlayMap = buildOverlayMap(events)

  MONTHS.forEach((name, i) => {
    const month = (8 + i) % 12            // wrzesień = 8
    const year = month >= 8 ? startYear : startYear + 1
    drawMonth(doc, {
      x0: M + (i % 4) * (colW + COL_GAP),
      y0: TOP + Math.floor(i / 4) * (BLOCK_H + V_GAP),
      width: colW,
      year,
      month,
      name,
      dayMap,
      overlayMap,
    })
  })

  // --- panel po prawej ---
  drawLegendPanel(doc, events, { x: panelX, y: TOP, w: LEG_W, h: monthsH }, startYear)

  // --- kolumny na dole ---
  const bottomY = TOP + monthsH + 5
  const bottomH = pageH - (footer ? 9 : 5) - bottomY
  drawBottomColumns(doc, events, { x: M, y: bottomY, w: pageW - M * 2, h: bottomH }, startYear)

  if (footer) {
    doc.setFont('Roboto', 'bold').setFontSize(6).setTextColor(0, 0, 0)
    doc.text(footer, pageW / 2, pageH - 4, { align: 'center' })
  }

  doc.save(`kalendarz-${startYear}-${startYear + 1}.pdf`)
}