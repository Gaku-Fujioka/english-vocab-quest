export type Rating = 'perfect' | 'knew' | 'unsure' | 'unknown'

export type WordLearningState = {
  wordId: string
  mastered: boolean
  perfectCount: number
  weakPoint: number
  lastReviewedAt: string | null
  nextReviewAt: string | null
  reviewCount: number
}

export type DailyLearningRecord = {
  date: string
  reviewCount: number
  newCount: number
  masteredIncrease: number
}
