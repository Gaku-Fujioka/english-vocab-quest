export const TARGET_SCORES = [600, 730, 850, 950] as const

export type TargetScore = (typeof TARGET_SCORES)[number]

export type AppSettings = {
  targetScore: TargetScore
}

export const DEFAULT_SETTINGS: AppSettings = {
  targetScore: 730,
}
