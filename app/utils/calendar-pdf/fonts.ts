import type { jsPDF } from 'jspdf'
import { bufToBase64 } from './helpers'

export async function loadFonts(doc: jsPDF) {
  const files = [
    ['Roboto-Regular', 'normal'],
    ['Roboto-Bold', 'bold'],
  ] as const

  for (const [file, style] of files) {
    const res = await fetch(`/fonts/${file}.ttf`)
    if (!res.ok) throw new Error(`Nie znaleziono czcionki /fonts/${file}.ttf`)
    doc.addFileToVFS(`${file}.ttf`, bufToBase64(await res.arrayBuffer()))
    doc.addFont(`${file}.ttf`, 'Roboto', style)
  }
}