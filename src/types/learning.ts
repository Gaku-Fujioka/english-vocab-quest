import type { Word } from './word'

export type Rating = 'perfect' | 'knew' | 'unsure' | 'unknown'

export type NewWordMode = 'skip' | 'quick' | 'normal' | 'intensive'

export type SessionPhase = 'review' | 'new' | 'complete'

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

export type LearningSession = {
  id: string
  reviewWords: Word[]
  newWords: Word[]
  currentWordIndex: number
  isCurrentCardRevealed: boolean
  phase: SessionPhase
  completedReviewCount: number
  completedNewCount: number
  masteredIncrease: number
}
