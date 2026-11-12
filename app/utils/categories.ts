export interface Category {
  slug: string
  label: string
  color: string // hex
}

// Kolejność = priorytet w PDF, gdy kilka wydarzeń wypada tego samego dnia
export const categories: Category[] = [
  { slug: 'dniwolne', label: 'Dni ustawowo wolne', color: '#FF0000' },
  { slug: 'wolneodzajec', label: 'Dni wolne od zajęć', color: '#FDBA74' },
  { slug: 'rozpoczecie-zakonczenie', label: 'Rozpoczęcie / zakończenie', color: '#A3A300' },
  { slug: 'egzaminy', label: 'Egzaminy', color: '#7C3AED' },
  { slug: 'rada', label: 'Rada klasyfikacyjna', color: '#16A34A' },
  { slug: 'zebrania', label: 'Zebrania z rodzicami', color: '#38BDF8' },
  { slug: 'konsultacje', label: 'Konsultacje', color: '#0EA5E9' },
  { slug: 'krew', label: 'Akcja oddawania krwi', color: '#D946EF' },
  { slug: 'praktyki', label: 'Praktyki zawodowe', color: '#6366F1' },
]

export const categoryItems = [
  { label: 'Wszystko', value: 'wszystko' },
  ...categories.map(c => ({ label: c.label, value: c.slug })),
]