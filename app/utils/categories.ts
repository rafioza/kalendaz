export interface Category {
  slug: string
  label: string
  color: string      // kolor na stronie
  pdfColor?: string  // kolor w PDF (domyślnie color)
  overlay?: boolean  // w PDF: kreskowanie zamiast koloru
  calendar?: boolean // false = bez koloru w kalendarzu PDF
}

export const colorForPdf = (c: Category) => c.pdfColor ?? c.color

// Kolejność = priorytet w PDF, gdy kilka wydarzeń wypada tego samego dnia
export const categories: Category[] = [
  { slug: 'dniwolne', label: 'Dni ustawowo wolne', color: '#FF0000', pdfColor: '#FF0000' },
  { slug: 'wolneodzajec', label: 'Dni wolne od zajęć', color: '#FDBA74', pdfColor: '#F8CBAD' },
  { slug: 'rozpoczecie-zakonczenie', label: 'Rozpoczęcie / zakończenie', color: '#A3A300', pdfColor: '#FFFF00' },
  { slug: 'egzaminy', label: 'Egzaminy', color: '#7C3AED', calendar: false },
  { slug: 'rada', label: 'Rada klasyfikacyjna', color: '#16A34A', pdfColor: '#00B050' },
  { slug: 'zebrania', label: 'Zebrania z rodzicami', color: '#38BDF8', pdfColor: '#00B0F0' },
  { slug: 'konsultacje', label: 'Konsultacje', color: '#0EA5E9', pdfColor: '#00B0F0' },
  { slug: 'krew', label: 'Akcja oddawania krwi', color: '#D946EF', pdfColor: '#FF00FF' },
  { slug: 'praktyki', label: 'Praktyki zawodowe', color: '#6366F1', overlay: true },
]

export const categoryItems = [
  { label: 'Wszystko', value: 'wszystko' },
  ...categories.map(c => ({ label: c.label, value: c.slug })),
]