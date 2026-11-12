import type { CalEvent } from './types'
import { loadFonts } from './fonts'
import { buildDayMap } from './dayMap'
import { BLOCK_H, drawMonth } from './drawMonth'
import { drawLegend } from './drawLegend'

export type { CalEvent } from './types'

const MONTHS = ['Wrzesień', 'Październik', 'Listopad', 'Grudzień', 'Styczeń', 'Luty',
  'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień']

const MARGIN = 8
const GAP = 4
const TOP = 18

export async function generateCalendarPdf(events: CalEvent[], startYear: number) {
  // dynamiczny import, bo jsPDF potrzebuje przeglądarki (SSR)
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  await loadFonts(doc)

  const pageW = doc.internal.pageSize.getWidth()
  const colW = (pageW - MARGIN * 2 - GAP * 3) / 4
  const dayMap = buildDayMap(events)

  doc.setFont('Roboto', 'bold').setFontSize(14).setTextColor(0, 0, 0)
  doc.text(`Kalendarz roku szkolnego ${startYear}/${startYear + 1}`, pageW / 2, 12, { align: 'center' })

  MONTHS.forEach((name, i) => {
    const month = (8 + i) % 12            // wrzesień = 8
    const year = month >= 8 ? startYear : startYear + 1
    drawMonth(doc, {
      x0: MARGIN + (i % 4) * (colW + GAP),
      y0: TOP + Math.floor(i / 4) * (BLOCK_H + GAP),
      width: colW,
      year,
      month,
      name,
      dayMap,
    })
  })

  const legendY = TOP + 3 * (BLOCK_H + GAP) + 2
  drawLegend(doc, events, legendY, MARGIN)

  doc.save(`kalendarz-${startYear}-${startYear + 1}.pdf`)
}