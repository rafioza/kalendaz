import type { jsPDF } from 'jspdf'
import { drawSwatch } from './hatch'
import { drawSmallCaps } from './smallCaps'

export type FlowEntry =
  | { kind: 'heading'; text: string; color?: string; hatches?: string[]; bold?: boolean }
  | { kind: 'title'; text: string } // kapitaliki, np. "Pierwsze półrocze"
  | { kind: 'item'; date: string; text: string; hatch?: string; bold?: boolean; bullet?: boolean }

export interface Box { x: number; y: number; w: number; h: number }

interface Placed { entry: FlowEntry; y: number; lines: string[]; dw: number }

const LH = 0.42   // mm wysokości wiersza na 1 pt czcionki
const INDENT = 2.4 // wcięcie punktorów

function place(doc: jsPDF, entries: FlowEntry[], w: number, fs: number) {
  doc.setFont('Roboto', 'normal').setFontSize(fs)
  const lh = fs * LH
  const sw = lh * 0.85
  const swW = sw + 1.2

  // szerokość kolumny dat liczona osobno dla każdej grupy pozycji (między nagłówkami)
  const groupW: number[] = new Array(entries.length).fill(0)
  let start = 0
  const flush = (end: number) => {
    const ws = entries.slice(start, end).flatMap(e =>
      e.kind === 'item' && e.date ? [doc.getTextWidth(e.date)] : [])
    const m = ws.length ? Math.max(...ws) + 1.4 : 0
    for (let i = start; i < end; i++) groupW[i] = m
  }
  entries.forEach((e, i) => {
    if (e.kind !== 'item') { flush(i); start = i + 1 }
  })
  flush(entries.length)

  const placed: Placed[] = []
  let y = 0
  entries.forEach((e, i) => {
    const bold = e.kind === 'title' || (e.kind === 'heading' && e.bold !== false) || (e.kind === 'item' && !!e.bold)
    doc.setFont('Roboto', bold ? 'bold' : 'normal')

    let lines: string[]
    if (e.kind === 'item') {
      const lead = (e.bullet ? INDENT : 0) + groupW[i] + (e.hatch ? swW : 0)
      lines = doc.splitTextToSize(e.text, w - lead) as string[]
    } else if (e.kind === 'heading') {
      const hasSw = !!(e.color || e.hatches?.length)
      lines = doc.splitTextToSize(e.text, w - (hasSw ? swW : 0)) as string[]
    } else {
      lines = [e.text]
    }

    if (e.kind !== 'item' && y > 0) y += lh * (e.kind === 'title' ? 0.9 : 0.7)
    placed.push({ entry: e, y, lines, dw: groupW[i] })
    y += lines.length * lh
  })

  doc.setFont('Roboto', 'normal')
  return { placed, height: y, lh, sw, swW }
}

export function measureHeight(doc: jsPDF, entries: FlowEntry[], w: number, fs: number) {
  return place(doc, entries, w, fs).height
}

// Największy rozmiar czcionki (pt), przy którym wszystkie bloki mieszczą się w maxH
export function fitFont(
  doc: jsPDF,
  blocks: { entries: FlowEntry[]; w: number }[],
  maxH: number,
  maxFs: number,
  minFs: number,
) {
  let fs = maxFs
  while (fs > minFs && blocks.some(b => measureHeight(doc, b.entries, b.w, fs) > maxH)) {
    fs = Math.round((fs - 0.1) * 10) / 10
  }
  return fs
}

export function drawEntries(doc: jsPDF, entries: FlowEntry[], x: number, y0: number, w: number, fs: number) {
  const L = place(doc, entries, w, fs)

  for (const p of L.placed) {
    const e = p.entry
    const top = y0 + p.y
    const base = top + L.lh * 0.8

    if (e.kind === 'title') {
      doc.setFont('Roboto', 'bold').setTextColor(0, 0, 0)
      drawSmallCaps(doc, e.text, x, base, fs)
    } else if (e.kind === 'heading') {
      const hasSw = !!(e.color || e.hatches?.length)
      if (hasSw) drawSwatch(doc, x, top + L.lh * 0.05, L.sw, { fill: e.color, hatches: e.hatches })
      doc.setFont('Roboto', e.bold === false ? 'normal' : 'bold').setFontSize(fs).setTextColor(0, 0, 0)
      p.lines.forEach((ln, k) => doc.text(ln, x + (hasSw ? L.swW : 0), base + k * L.lh))
    } else {
      let tx = x
      doc.setTextColor(0, 0, 0)
      if (e.bullet) {
        doc.setFillColor(0, 0, 0).circle(x + 0.8, base - L.lh * 0.3, 0.3, 'F')
        tx += INDENT
      }
      doc.setFont('Roboto', 'normal').setFontSize(fs)
      if (e.date) doc.text(e.date, tx, base)
      tx += p.dw
      if (e.hatch) {
        drawSwatch(doc, tx, top + L.lh * 0.05, L.sw, { hatches: [e.hatch] })
        tx += L.swW
      }
      doc.setFont('Roboto', e.bold ? 'bold' : 'normal').setFontSize(fs).setTextColor(0, 0, 0)
      p.lines.forEach((ln, k) => doc.text(ln, tx, base + k * L.lh))
    }
  }
}