import type {
  NewWordMode,
  Rating,
  WordLearningState,
} from '../types/learning'
import type { AppSettings, TargetScore } from '../types/settings'
import type { Word, WordSection } from '../types/word'

export const NEW_WORD_MODE_COUNTS = {
  skip: 0,
  quick: 20,
  normal: 30,
  intensive: 40,
} satisfies Record<NewWordMode, number>

const REVIEW_LIMIT = 40
const PERFECT_REVIEWS_TO_MASTER = 3

export function getDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)

  return getDateKey(date)
}

export function getActiveSections(targetScore: TargetScore): WordSection[] {
  switch (targetScore) {
    case 600:
      return ['600']
    case 730:
      return ['600', '700']
    case 850:
      return ['600', '700', '850']
    case 950:
      return ['600', '700', '850', '950']
  }
}

export function createInitialLearningState(wordId: string): WordLearningState {
  return {
    wordId,
    mastered: false,
    perfectCount: 0,
    weakPoint: 0,
    lastReviewedAt: null,
    nextReviewAt: null,
    reviewCount: 0,
  }
}

export function selectReviewWords(
  words: Word[],
  learningStates: WordLearningState[],
  today = getDateKey(),
): Word[] {
  const wordsById = new Map(words.map((word) => [word.id, word]))

  return learningStates
    .filter((state) => {
      if (state.nextReviewAt === null) {
        return false
      }

      return state.nextReviewAt.slice(0, 10) <= today
    })
    .sort((firstState, secondState) => {
      if (firstState.weakPoint !== secondState.weakPoint) {
        return secondState.weakPoint - firstState.weakPoint
      }

      return String(firstState.nextReviewAt).localeCompare(
        String(secondState.nextReviewAt),
      )
    })
    .slice(0, REVIEW_LIMIT)
    .map((state) => wordsById.get(state.wordId))
    .filter((word): word is Word => word !== undefined)
}

export function selectNewWords(
  words: Word[],
  learningStates: WordLearningState[],
  settings: AppSettings,
  mode: NewWordMode,
): Word[] {
  const requestedCount = NEW_WORD_MODE_COUNTS[mode]

  if (requestedCount === 0) {
    return []
  }

  const studiedWordIds = new Set(learningStates.map((state) => state.wordId))
  const masteredWordIds = new Set(
    learningStates.filter((state) => state.mastered).map((state) => state.wordId),
  )
  const activeSections = getActiveSections(settings.targetScore)

  const sectionPlans = activeSections
    .map((section) => {
      const sectionWords = words.filter((word) => word.section === section)
      const masteredCount = sectionWords.filter((word) =>
        masteredWordIds.has(word.id),
      ).length
      const masteryRate =
        sectionWords.length === 0 ? 1 : masteredCount / sectionWords.length
      const unstudiedWords = sectionWords.filter(
        (word) => !studiedWordIds.has(word.id),
      )

      return {
        section,
        masteryRate,
        unstudiedWords,
      }
    })
    .filter((plan) => plan.unstudiedWords.length > 0)
    .sort((firstPlan, secondPlan) => {
      if (firstPlan.masteryRate !== secondPlan.masteryRate) {
        return firstPlan.masteryRate - secondPlan.masteryRate
      }

      return activeSections.indexOf(firstPlan.section) -
        activeSections.indexOf(secondPlan.section)
    })

  const selectedWords: Word[] = []

  for (const plan of sectionPlans) {
    for (const word of plan.unstudiedWords) {
      if (selectedWords.length >= requestedCount) {
        return selectedWords
      }

      selectedWords.push(word)
    }
  }

  return selectedWords
}

export function applyRating(
  previousState: WordLearningState | undefined,
  wordId: string,
  rating: Rating,
  today = getDateKey(),
): WordLearningState {
  const baseState = previousState ?? createInitialLearningState(wordId)

  const nextState: WordLearningState = {
    ...baseState,
    lastReviewedAt: today,
    reviewCount: baseState.reviewCount + 1,
  }

  switch (rating) {
    case 'perfect': {
      const perfectCount = baseState.perfectCount + 1
      const mastered = perfectCount >= PERFECT_REVIEWS_TO_MASTER

      return {
        ...nextState,
        perfectCount,
        weakPoint: Math.max(0, baseState.weakPoint - 1),
        mastered,
        nextReviewAt: addDaysToDateKey(today, mastered ? 30 : 7),
      }
    }
    case 'knew':
      return {
        ...nextState,
        mastered: false,
        perfectCount: baseState.mastered ? 0 : baseState.perfectCount,
        nextReviewAt: addDaysToDateKey(today, 7),
      }
    case 'unsure':
      return {
        ...nextState,
        mastered: false,
        perfectCount: 0,
        weakPoint: baseState.weakPoint + 1,
        nextReviewAt: addDaysToDateKey(today, 3),
      }
    case 'unknown':
      return {
        ...nextState,
        mastered: false,
        perfectCount: 0,
        weakPoint: baseState.weakPoint + 2,
        nextReviewAt: addDaysToDateKey(today, 1),
      }
  }
}
