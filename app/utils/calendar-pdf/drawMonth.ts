import type { jsPDF } from 'jspdf'
import { categories, colorForPdf, type Category } from '../categories'
import type { RGB } from './types'
import { dateKey, hexToRgb, schoolDaysLabel } from './helpers'
import { drawHatch, HATCH_SPACING } from './hatch'

const DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
const NON_SCHOOL = new Set(['dniwolne', 'wolneodzajec'])

const HEADER_H = 4.8
const WEEK_H = 4
const ROW_H = 4
const FOOTER_H = 4.6
export const BLOCK_H = HEADER_H + WEEK_H + ROW_H * 6 + FOOTER_H

const MONTH_ORANGE: RGB = [226, 107, 10]
const WEEKEND_GRAY: RGB = [191, 191, 191]
const CAP = 0.254 // wysokość wersalika w mm na 1 pt

// linia bazowa tekstu wyśrodkowanego w pionie w polu o wysokości h
const baseline = (y: number, h: number, fs: number) => y + (h + fs * CAP) / 2

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

// biały albo czarny tekst według średniej jasności kolorów w komórce
function textOn(hexes: string[]): RGB {
  const lum = hexes.reduce((sum, h) => {
    const [r, g, b] = hexToRgb(h)
    return sum + (0.299 * r + 0.587 * g + 0.114 * b) / 255
  }, 0) / hexes.length
  return lum > 0.45 ? [0, 0, 0] : [255, 255, 255]
}

export function drawMonth(
  doc: jsPDF,
  { x0, y0, width, year, month, name, dayMap, overlayMap }: Opts,
) {
  const cellW = width / 7
  const weekY = y0 + HEADER_H
  const gridY = weekY + WEEK_H

  // nagłówek miesiąca
  doc.setFillColor(...MONTH_ORANGE).rect(x0, y0, width, HEADER_H, 'F')
  doc.setFont('Roboto', 'bold').setFontSize(8.5).setTextColor(255, 255, 255)
  doc.text(`${name} ${year}`, x0 + width / 2, baseline(y0, HEADER_H, 8.5), { align: 'center' })

  // dni tygodnia
  doc.setFontSize(5.5).setTextColor(0, 0, 0)
  DAYS.forEach((d, c) => {
    doc.text(d, x0 + c * cellW + cellW / 2, baseline(weekY, WEEK_H, 5.5), { align: 'center' })
  })

  const offset = (new Date(year, month, 1).getDay() + 6) % 7 // tydzień od poniedziałku
  const daysIn = new Date(year, month + 1, 0).getDate()
  let schoolDays = 0

  for (let d = 1; d <= daysIn; d++) {
    const idx = offset + d - 1
    const col = idx % 7
    const row = Math.floor(idx / 7)
    const x = x0 + col * cellW
    const y = gridY + row * ROW_H

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
        doc.setFillColor(...hexToRgb(colorForPdf(c))).rect(x + i * stripW, y, stripW, ROW_H, 'F')
      })
    } else if (col >= 5) {
      doc.setFillColor(...WEEKEND_GRAY).rect(x, y, cellW, ROW_H, 'F')
    }

    // 2. kreskowania nakładane na wierzch
    layers?.forEach((color, j) => {
      drawHatch(doc, x, y, cellW, ROW_H, color, {
        phase: (j * HATCH_SPACING) / layers.length,
      })
    })

    // 3. numer dnia
    doc.setFont('Roboto', 'normal').setFontSize(6.5)
    if (cats.length) doc.setTextColor(...textOn(cats.map(colorForPdf)))
    else doc.setTextColor(0, 0, 0)
    doc.text(String(d), x + cellW / 2, baseline(y, ROW_H, 6.5), { align: 'center' })
  }

  // ramki: dni tygodnia + pełna siatka 7x6 (puste komórki też)
  doc.setDrawColor(0, 0, 0).setLineWidth(0.12)
  for (let i = 0; i < 7; i++) doc.rect(x0 + i * cellW, weekY, cellW, WEEK_H, 'S')
  for (let i = 0; i < 42; i++) {
    doc.rect(x0 + (i % 7) * cellW, gridY + Math.floor(i / 7) * ROW_H, cellW, ROW_H, 'S')
  }

  // licznik dni szkolnych pod miesiącem
  doc.setFont('Roboto', 'normal').setFontSize(6).setTextColor(0, 0, 0)
  doc.text(schoolDaysLabel(schoolDays), x0 + width / 2, gridY + ROW_H * 6 + 3.3, { align: 'center' })
}