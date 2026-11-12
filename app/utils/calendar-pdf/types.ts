export interface CalEvent {
  id: number
  nazwa: string
  start_data: string          // 'YYYY-MM-DD'
  koniec_data: string | null  // 'YYYY-MM-DD' lub null
  typ: string
}

export type RGB = [number, number, number]