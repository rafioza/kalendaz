import type { jsPDF } from 'jspdf'
import { drawSwatch } from './hatch'

export type FlowEntry =
  | { kind: 'heading'; text: string; color?: string; hatches?: string[] }
  | { kind: 'item'; date: string; text: string; hatch?: string }

export interface Box { x: number; y: number; w: number; h: number }

interface Placed { entry: FlowEntry; col: number; y: number; lines: string[] }

function layout(doc: jsPDF, entries: FlowEntry[], box: Box, cols: number, gap: number, fs: number) {
  doc.setFont('Roboto', 'normal').setFontSize(fs)
  const lh = fs * 0.42
  const swW = lh * 0.8 + 0.8 // szerokość kwadracika z kreskowaniem przy pozycji listy
  const colW = (box.w - gap * (cols - 1)) / cols

  const dateWidths = entries.flatMap(e => (e.kind === 'item' ? [doc.getTextWidth(e.date)] : []))
  const dateW = (dateWidths.length ? Math.max(...dateWidths) : 0) + 1.5

  const wrapped = entries.map(e =>
    e.kind === 'heading'
      ? [e.text]
      : (doc.splitTextToSize(e.text, colW - dateW - (e.hatch ? swW : 0)) as string[]),
  )

  const placed: Placed[] = []
  let col = 0
  let y = 0
  let fits = true

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    const lines = wrapped[i]
    const own = lines.length * lh
    const pre = e.kind === 'heading' && y > 0 ? lh * 0.7 : 0
    // nagłówek nie może zostać sam na dole kolumny
    const nextH = e.kind === 'heading' && wrapped[i + 1] ? wrapped[i + 1].length * lh : 0

    if (y + pre + own + nextH > box.h) {
      col++
      y = 0
      if (col >= cols) { fits = false; break }
      placed.push({ entry: e, col, y, lines })
      y += own
    } else {
      y += pre
      placed.push({ entry: e, col, y, lines })
      y += own
    }
  }
  return { placed, fits, lh, colW, dateW, swW }
}

// Wybiera największą czcionkę, przy której całość mieści się w ramce
export function flowEntries(
  doc: jsPDF,
  entries: FlowEntry[],
  box: Box,
  cols: number,
  gap = 4,
  maxFs = 6.5,
  minFs = 3.6,
) {
  let fs = maxFs
  let res = layout(doc, entries, box, cols, gap, fs)
  while (!res.fits && fs - 0.2 >= minFs) {
    fs -= 0.2
    res = layout(doc, entries, box, cols, gap, fs)
  }

  const { placed, lh, colW, dateW, swW } = res
  doc.setFontSize(fs)

  for (const p of placed) {
    const x = box.x + p.col * (colW + gap)
    const top = box.y + p.y
    const base = top + lh * 0.8
    const e = p.entry

      if (e.kind === 'heading') {
        const hasSwatch = !!(e.color || e.hatches?.length)
        if (hasSwatch) drawSwatch(doc, x, top + lh * 0.05, lh * 0.8, { fill: e.color, hatches: e.hatches })
          doc.setFont('Roboto', 'bold').setFontSize(fs).setTextColor(0, 0, 0)
          doc.text(e.text, x + (hasSwatch ? lh + 0.8 : 0), base)
      } else {
      doc.setFont('Roboto', 'normal').setFontSize(fs).setTextColor(0, 0, 0)
      doc.text(e.date, x, base)
      let tx = x + dateW
      if (e.hatch) {
        drawSwatch(doc, tx, top + lh * 0.05, lh * 0.8, { hatches: [e.hatch] })
        tx += swW
        doc.setFont('Roboto', 'normal').setFontSize(fs).setTextColor(0, 0, 0)
      }
      p.lines.forEach((ln, k) => doc.text(ln, tx, base + k * lh))
    }
  }
  return res.fits
}