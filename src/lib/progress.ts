import type { DailyLearningRecord, WordLearningState } from '../types/learning'
import { addDaysToDateKey, getDateKey } from './scheduler'

type SessionRecordInput = {
  reviewCount: number
  newCount: number
  masteredIncrease: number
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
