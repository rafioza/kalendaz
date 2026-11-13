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

// '02.11–27.11.2026' albo '01.09.2026' (krótsze zakresy oszczędzają miejsce)
export function fmtRange(start: string, end: string | null) {
  const s = parse(start)
  const full = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
  if (!end || end === start) return full(s)
  const e = parse(end)
  if (s.getFullYear() === e.getFullYear()) {
    return `${pad(s.getDate())}.${pad(s.getMonth() + 1)}–${full(e)}`
  }
  return `${full(s)}–${full(e)}`
}

export function schoolDaysLabel(n: number) {
  if (n === 1) return '1 dzień szkolny'
  const last = n % 10
  const lastTwo = n % 100
  const few = last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)
  return `${n} ${few ? 'dni szkolne' : 'dni szkolnych'}`
}