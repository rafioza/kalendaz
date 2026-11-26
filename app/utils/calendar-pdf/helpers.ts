import type { RGB } from './types'

export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const dateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// biały albo czarny tekst, zależnie od jasności tła
export function textColorFor(hex: string): RGB {
  const [r, g, b] = hexToRgb(hex)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? [0, 0, 0] : [255, 255, 255]
}

export function bufToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

const pad = (n: number) => String(n).padStart(2, '0')
const full = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`

// zwięzły zakres: '04–07.05.2027', '28.05–02.06.2027', '01.09.2026'
export function fmtRange(start: string, end: string | null) {
  const s = parse(start)
  if (!end || end === start) return full(s)
  const e = parse(end)
  if (s.getFullYear() !== e.getFullYear()) return `${full(s)}–${full(e)}`
  if (s.getMonth() === e.getMonth()) return `${pad(s.getDate())}–${full(e)}`
  return `${pad(s.getDate())}.${pad(s.getMonth() + 1)}–${full(e)}`
}

// pełny zakres: '18.01.2027 – 31.01.2027'
export function fmtRangeFull(start: string, end: string | null) {
  if (!end || end === start) return full(parse(start))
  return `${full(parse(start))} – ${full(parse(end))}`
}

// "Rada klasyfikacyjna - klasy maturalne (I półrocze)" -> "klasy maturalne"
export function shortName(name: string) {
  const m = name.match(/^[^-–/]+?\s[-–]\s(.+)$/)
  return (m ? m[1] : name).replace(/\s*\((I|II) półrocze\)\s*$/i, '').trim()
}

// do zdań: "Przerwa wakacyjna" -> "przerwa wakacyjna"
export function sentence(name: string) {
  const last = name.split(' / ').pop()!.trim()
  return /^Dzień Otwarty/.test(last) ? last : last.charAt(0).toLowerCase() + last.slice(1)
}

export function schoolDaysLabel(n: number) {
  if (n === 1) return '1 dzień szkolny'
  const last = n % 10
  const lastTwo = n % 100
  const few = last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)
  return `${n} ${few ? 'dni szkolne' : 'dni szkolnych'}`
}