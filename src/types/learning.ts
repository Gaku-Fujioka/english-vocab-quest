import type { Word, WordSection } from './word'

export type Rating = 'perfect' | 'knew' | 'unsure' | 'unknown'

export type NewWordMode = 'skip' | 'quick' | 'normal' | 'intensive'

export type SessionPhase = 'review' | 'new' | 'custom' | 'complete'

export type LearningSessionKind = 'daily' | 'custom'

export type CustomTestLevel = WordSection | 'all'

export type CustomTestMastery =
  | 'all'
  | 'unlearned'
  | 'learning'
  | 'mastered'
  | 'weak'

export type CustomTestFilters = {
  level: CustomTestLevel
  mastery: CustomTestMastery
}

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
  kind: LearningSessionKind
  reviewWords: Word[]
  newWords: Word[]
  customWords: Word[]
  currentWordIndex: number
  isCurrentCardRevealed: boolean
  phase: SessionPhase
  completedReviewCount: number
  completedNewCount: number
  completedCustomCount: number
  completedCustomNewCount: number
  masteredIncrease: number
}

export type StoredLearningSession = Omit<
  LearningSession,
  'reviewWords' | 'newWords' | 'customWords'
> & {
  reviewWordIds: string[]
  newWordIds: string[]
  customWordIds: string[]
}
