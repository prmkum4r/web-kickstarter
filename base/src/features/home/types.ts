export interface HomeStat {
  id: string
  label: string
  value: number
  hint?: string
}

export interface HomeSummary {
  title: string
  subtitle: string
  stats: HomeStat[]
}
