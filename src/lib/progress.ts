import type { DailyLearningRecord, WordLearningState } from '../types/learning'
import type { Word, WordSection } from '../types/word'
import { WORD_SECTIONS } from '../types/word'
import { addDaysToDateKey, getDateKey } from './scheduler'

type SessionRecordInput = {
  reviewCount: number
  newCount: number
  masteredIncrease: number
}

export type OverallProgress = {
  masteredCount: number
  totalWordCount: number
  percent: number
}

export type SectionProgress = {
  section: WordSection
  masteredCount: number
  totalWordCount: number
  percent: number
}

export type WeakWordRankingItem = {
  rank: number
  word: Word
  weakPoint: number
}

export type HeatmapDay = {
  date: string
  studyCount: number
  level: 0 | 1 | 2 | 3 | 4
}

export function getMasteredCount(learningStates: WordLearningState[]): number {
  return learningStates.filter((state) => state.mastered).length
}

export function getMasteryPercent(
  masteredCount: number,
  totalWordCount: number,
): number {
  if (totalWordCount === 0) {
    return 0
  }

  return Math.round((masteredCount / totalWordCount) * 100)
}

export function getOverallProgress(
  words: Word[],
  learningStates: WordLearningState[],
): OverallProgress {
  const masteredCount = getMasteredCount(learningStates)

  return {
    masteredCount,
    totalWordCount: words.length,
    percent: getMasteryPercent(masteredCount, words.length),
  }
}

export function getSectionProgress(
  words: Word[],
  learningStates: WordLearningState[],
): SectionProgress[] {
  const masteredIds = new Set(
    learningStates.filter((state) => state.mastered).map((state) => state.wordId),
  )

  return WORD_SECTIONS.map((section) => {
    const sectionWords = words.filter((word) => word.section === section)
    const masteredCount = sectionWords.filter((word) =>
      masteredIds.has(word.id),
    ).length

    return {
      section,
      masteredCount,
      totalWordCount: sectionWords.length,
      percent: getMasteryPercent(masteredCount, sectionWords.length),
    }
  })
}

export function getWeakWordRanking(
  words: Word[],
  learningStates: WordLearningState[],
  limit = 10,
): WeakWordRankingItem[] {
  const wordsById = new Map(words.map((word) => [word.id, word]))

  return learningStates
    .filter((state) => state.weakPoint > 0)
    .sort((firstState, secondState) => {
      if (firstState.weakPoint !== secondState.weakPoint) {
        return secondState.weakPoint - firstState.weakPoint
      }

      return firstState.wordId.localeCompare(secondState.wordId)
    })
    .map((state) => {
      const word = wordsById.get(state.wordId)

      if (word === undefined) {
        return null
      }

      return {
        word,
        weakPoint: state.weakPoint,
      }
    })
    .filter((item): item is { word: Word; weakPoint: number } => item !== null)
    .slice(0, limit)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }))
}

export function getTodayRecord(
  dailyRecords: DailyLearningRecord[],
  today = getDateKey(),
): DailyLearningRecord | undefined {
  return dailyRecords.find((record) => record.date === today)
}

export function getDailyCompletedCount(
  record: DailyLearningRecord | undefined,
): number {
  if (record === undefined) {
    return 0
  }

  return record.reviewCount + record.newCount
}

export function getStudyCount(record: DailyLearningRecord | undefined): number {
  if (record === undefined) {
    return 0
  }

  return record.reviewCount + record.newCount
}

export function getHeatmapLevel(studyCount: number): HeatmapDay['level'] {
  if (studyCount === 0) {
    return 0
  }

  if (studyCount <= 10) {
    return 1
  }

  if (studyCount <= 30) {
    return 2
  }

  if (studyCount <= 60) {
    return 3
  }

  return 4
}

export function getLearningHeatmapDays(
  dailyRecords: DailyLearningRecord[],
  dayCount = 365,
  today = getDateKey(),
): HeatmapDay[] {
  const recordsByDate = new Map(
    dailyRecords.map((record) => [record.date, getStudyCount(record)]),
  )
  const firstDate = addDaysToDateKey(today, -(dayCount - 1))

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDaysToDateKey(firstDate, index)
    const studyCount = recordsByDate.get(date) ?? 0

    return {
      date,
      studyCount,
      level: getHeatmapLevel(studyCount),
    }
  })
}

export function getTodayProgressPercent(
  dailyRecords: DailyLearningRecord[],
  remainingReviewCount: number,
  today = getDateKey(),
): number {
  const completedCount = getDailyCompletedCount(getTodayRecord(dailyRecords, today))
  const targetCount = completedCount + remainingReviewCount

  if (targetCount === 0) {
    return 0
  }

  return Math.round((completedCount / targetCount) * 100)
}

export function mergeDailyLearningRecord(
  dailyRecords: DailyLearningRecord[],
  input: SessionRecordInput,
  today = getDateKey(),
): DailyLearningRecord[] {
  if (
    input.reviewCount === 0 &&
    input.newCount === 0 &&
    input.masteredIncrease === 0
  ) {
    return dailyRecords
  }

  const existingRecord = getTodayRecord(dailyRecords, today)

  if (existingRecord === undefined) {
    return [
      ...dailyRecords,
      {
        date: today,
        reviewCount: input.reviewCount,
        newCount: input.newCount,
        masteredIncrease: input.masteredIncrease,
      },
    ]
  }

  return dailyRecords.map((record) => {
    if (record.date !== today) {
      return record
    }

    return {
      ...record,
      reviewCount: record.reviewCount + input.reviewCount,
      newCount: record.newCount + input.newCount,
      masteredIncrease: record.masteredIncrease + input.masteredIncrease,
    }
  })
}

// If today has no study record, keep showing the streak that ended yesterday.
export function getLearningStreak(
  dailyRecords: DailyLearningRecord[],
  today = getDateKey(),
): number {
  const activeDates = new Set(
    dailyRecords
      .filter((record) => getDailyCompletedCount(record) > 0)
      .map((record) => record.date),
  )

  let currentDate = today

  if (!activeDates.has(currentDate)) {
    currentDate = addDaysToDateKey(today, -1)
  }

  let streak = 0

  while (activeDates.has(currentDate)) {
    streak += 1
    currentDate = addDaysToDateKey(currentDate, -1)
  }

  return streak
}
