import type { jsPDF } from 'jspdf'
import { hexToRgb } from './helpers'

export const HATCH_SPACING = 2.1

// Kreski "/" liczone we współrzędnych strony, więc łączą się między sąsiednimi komórkami
export function drawHatch(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  color: string,
  { spacing = HATCH_SPACING, phase = 0, lineWidth = 0.22 } = {},
) {
  doc.setDrawColor(...hexToRgb(color)).setLineWidth(lineWidth)
  const kMax = x + w + y + h
  let k = Math.ceil((x + y - phase) / spacing) * spacing + phase

  for (; k < kMax; k += spacing) {
    const u1 = Math.max(x, k - y - h)
    const u2 = Math.min(x + w, k - y)
    if (u2 - u1 > 0.05) doc.line(u1, k - u1, u2, k - u2)
  }
}

// kwadracik do legendy: jednolity kolor albo (nałożone na siebie) kreskowania
export function drawSwatch(
  doc: jsPDF,
  x: number, y: number, size: number,
  { fill = '#FFFFFF', hatches = [] as string[] } = {},
) {
  doc.setFillColor(...hexToRgb(fill)).rect(x, y, size, size, 'F')
  hatches.forEach((c, j) => {
    drawHatch(doc, x, y, size, size, c, {
      spacing: 1.9,
      phase: (j * 0.9) / hatches.length,
      lineWidth: 0.18,
    })
  })
  doc.setDrawColor(120, 120, 120).setLineWidth(0.15).rect(x, y, size, size, 'S')
}