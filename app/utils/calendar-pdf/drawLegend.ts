import type { jsPDF } from 'jspdf'
import { categories } from '../categories'
import type { CalEvent } from './types'
import { hexToRgb, parse } from './helpers'

const fmt = (s: string) =>
  parse(s).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function drawLegend(doc: jsPDF, events: CalEvent[], y: number, margin: number) {
  const pageW = doc.internal.pageSize.getWidth()

  // legenda (lewa strona)
  doc.setFont('Roboto', 'bold').setFontSize(8).setTextColor(0, 0, 0)
  doc.text('Legenda', margin, y)
  doc.setFont('Roboto', 'normal').setFontSize(7)
  categories.forEach((c, i) => {
    const x = margin + (i % 3) * 62
    const ly = y + 5 + Math.floor(i / 3) * 5
    doc.setFillColor(...hexToRgb(c.color)).rect(x, ly - 3, 4, 3.5, 'F')
    doc.setTextColor(0, 0, 0).text(c.label, x + 6, ly)
  })

  // lista wydarzeń (prawa strona, a gdy zabraknie miejsca – kolejna strona)
  let lx = margin + 190
  let ly = y
  doc.setFont('Roboto', 'bold').setFontSize(8).text('Wydarzenia', lx, ly)
  doc.setFont('Roboto', 'normal').setFontSize(6.5)
  ly += 4

  const sorted = [...events].sort((a, b) => a.start_data.localeCompare(b.start_data))
  for (const ev of sorted) {
    if (ly > 205) {
      doc.addPage()
      lx = margin
      ly = 15
      doc.setFont('Roboto', 'normal').setFontSize(6.5)
    }
    const cat = categories.find(c => c.slug === ev.typ)
    const range = ev.koniec_data && ev.koniec_data !== ev.start_data
      ? `${fmt(ev.start_data)} – ${fmt(ev.koniec_data)}`
      : fmt(ev.start_data)

    if (cat) doc.setFillColor(...hexToRgb(cat.color)).rect(lx, ly - 2.4, 2.4, 2.4, 'F')
    doc.setTextColor(0, 0, 0)
    doc.text(`${range}  ${ev.nazwa}`, lx + 4, ly, { maxWidth: pageW - lx - margin - 4 })
    ly += 3.2
  }
}