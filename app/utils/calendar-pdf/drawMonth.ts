import type { jsPDF } from 'jspdf'
import { categories, type Category } from '../categories'
import type { RGB } from './types'
import { dateKey, hexToRgb, schoolDaysLabel } from './helpers'
import { drawHatch, HATCH_SPACING } from './hatch'

const DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
const NON_SCHOOL = new Set(['dniwolne', 'wolneodzajec'])

const HEADER_H = 4.2
const WEEK_H = 3.2
const ROW_H = 3.5
const FOOTER_H = 3.6
export const BLOCK_H = HEADER_H + WEEK_H + ROW_H * 6 + FOOTER_H

interface Opts {
  x0: number
  y0: number
  width: number
  year: number
  month: number // 0-11
  name: string
  dayMap: Map<string, string[]>
  overlayMap: Map<string, string[]>
}

// biały albo czarny tekst według średniej jasności wszystkich kolorów w komórce
function textOn(hexes: string[]): RGB {
  const lum = hexes.reduce((sum, h) => {
    const [r, g, b] = hexToRgb(h)
    return sum + (0.299 * r + 0.587 * g + 0.114 * b) / 255
  }, 0) / hexes.length
  return lum > 0.6 ? [0, 0, 0] : [255, 255, 255]
}

export function drawMonth(
  doc: jsPDF,
  { x0, y0, width, year, month, name, dayMap, overlayMap }: Opts,
) {
  const cellW = width / 7

  // nagłówek miesiąca
  doc.setFillColor(230, 120, 0).rect(x0, y0, width, HEADER_H, 'F')
  doc.setFont('Roboto', 'bold').setFontSize(7).setTextColor(255, 255, 255)
  doc.text(`${name} ${year}`, x0 + width / 2, y0 + 3, { align: 'center' })

  // dni tygodnia
  doc.setFontSize(5).setTextColor(0, 0, 0)
  DAYS.forEach((d, c) => {
    doc.text(d, x0 + c * cellW + cellW / 2, y0 + HEADER_H + 2.4, { align: 'center' })
  })

  const offset = (new Date(year, month, 1).getDay() + 6) % 7 // tydzień od poniedziałku
  const daysIn = new Date(year, month + 1, 0).getDate()
  let schoolDays = 0

  doc.setFont('Roboto', 'normal').setFontSize(5.5)

  for (let d = 1; d <= daysIn; d++) {
    const idx = offset + d - 1
    const col = idx % 7
    const row = Math.floor(idx / 7)
    const x = x0 + col * cellW
    const y = y0 + HEADER_H + WEEK_H + row * ROW_H

    const key = dateKey(year, month, d)
    const slugs = dayMap.get(key) ?? []
    const cats = slugs
      .map(s => categories.find(c => c.slug === s))
      .filter((c): c is Category => !!c && !c.overlay)
    const layers = col < 5 ? overlayMap.get(key) : undefined // kreskowanie tylko w dni robocze

    if (col < 5 && !slugs.some(s => NON_SCHOOL.has(s))) schoolDays++

    // 1. kolor dnia: kilka wydarzeń = równe pasy obok siebie
    if (cats.length) {
      const stripW = cellW / cats.length
      cats.forEach((c, i) => {
        doc.setFillColor(...hexToRgb(c.color)).rect(x + i * stripW, y, stripW, ROW_H, 'F')
      })
    } else if (col >= 5) {
      doc.setFillColor(210, 210, 210).rect(x, y, cellW, ROW_H, 'F')
    }

    // 2. kreskowania nakładane na wierzch
    layers?.forEach((color, j) => {
      drawHatch(doc, x, y, cellW, ROW_H, color, {
        phase: (j * HATCH_SPACING) / layers.length,
      })
    })

    // 3. ramka i numer dnia
    doc.setDrawColor(150, 150, 150).setLineWidth(0.1).rect(x, y, cellW, ROW_H, 'S')
    if (cats.length) doc.setTextColor(...textOn(cats.map(c => c.color)))
    else doc.setTextColor(0, 0, 0)
    doc.text(String(d), x + cellW / 2, y + 2.6, { align: 'center' })
  }

  // licznik dni szkolnych pod miesiącem
  doc.setFontSize(5).setTextColor(0, 0, 0)
  doc.text(
    schoolDaysLabel(schoolDays),
    x0 + width / 2,
    y0 + HEADER_H + WEEK_H + ROW_H * 6 + 2.6,
    { align: 'center' },
  )
}