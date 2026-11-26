import type { jsPDF } from 'jspdf'

// Kapitaliki: małe litery rysowane jako pomniejszone wielkie
export function drawSmallCaps(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  fs: number,
  { align = 'left', ratio = 0.78 }: { align?: 'left' | 'center'; ratio?: number } = {},
) {
  const runs: { t: string; size: number }[] = []
  for (const ch of text) {
    const small = ch !== ch.toUpperCase()
    const size = small ? fs * ratio : fs
    const t = small ? ch.toUpperCase() : ch
    const last = runs[runs.length - 1]
    if (last && last.size === size) last.t += t
    else runs.push({ t, size })
  }

  const widths = runs.map(r => {
    doc.setFontSize(r.size)
    return doc.getTextWidth(r.t)
  })
  const total = widths.reduce((a, b) => a + b, 0)

  let cx = align === 'center' ? x - total / 2 : x
  runs.forEach((r, i) => {
    doc.setFontSize(r.size)
    doc.text(r.t, cx, y)
    cx += widths[i]
  })
  doc.setFontSize(fs)
  return total
}