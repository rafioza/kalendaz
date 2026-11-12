import type { jsPDF } from 'jspdf'
import { categories } from '../categories'
import { dateKey, hexToRgb, textColorFor } from './helpers'

const DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']

const HEADER_H = 5
const WEEK_H = 4
const ROW_H = 4.2
export const BLOCK_H = HEADER_H + WEEK_H + ROW_H * 6

interface Opts {
  x0: number
  y0: number
  width: number
  year: number
  month: number // 0-11
  name: string
  dayMap: Map<string, string>
}

export function drawMonth(doc: jsPDF, { x0, y0, width, year, month, name, dayMap }: Opts) {
  const cellW = width / 7

  // nagłówek miesiąca
  doc.setFillColor(55, 65, 81).rect(x0, y0, width, HEADER_H, 'F')
  doc.setFont('Roboto', 'bold').setFontSize(8).setTextColor(255, 255, 255)
  doc.text(`${name} ${year}`, x0 + width / 2, y0 + 3.6, { align: 'center' })

  // dni tygodnia
  doc.setFontSize(6).setTextColor(0, 0, 0)
  DAYS.forEach((d, c) => {
    doc.text(d, x0 + c * cellW + cellW / 2, y0 + HEADER_H + 3, { align: 'center' })
  })

  // dni miesiąca
  const offset = (new Date(year, month, 1).getDay() + 6) % 7 // tydzień od poniedziałku
  const daysIn = new Date(year, month + 1, 0).getDate()
  doc.setFont('Roboto', 'normal').setFontSize(6.5)

  for (let d = 1; d <= daysIn; d++) {
    const idx = offset + d - 1
    const col = idx % 7
    const row = Math.floor(idx / 7)
    const x = x0 + col * cellW
    const y = y0 + HEADER_H + WEEK_H + row * ROW_H

    const slug = dayMap.get(dateKey(year, month, d))
    const cat = slug ? categories.find(c => c.slug === slug) : undefined

    if (cat) doc.setFillColor(...hexToRgb(cat.color)).rect(x, y, cellW, ROW_H, 'F')
    doc.setDrawColor(200, 200, 200).setLineWidth(0.1).rect(x, y, cellW, ROW_H, 'S')

    if (cat) doc.setTextColor(...textColorFor(cat.color))
    else if (col >= 5) doc.setTextColor(200, 0, 0) // weekend
    else doc.setTextColor(0, 0, 0)

    doc.text(String(d), x + cellW / 2, y + 3, { align: 'center' })
  }
}