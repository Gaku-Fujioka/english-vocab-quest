import type {
  DailyLearningRecord,
  LearningSession,
  StoredLearningSession,
  WordLearningState,
} from '../types/learning'
import type { AppSettings } from '../types/settings'
import { DEFAULT_SETTINGS } from '../types/settings'
import type { Word } from '../types/word'

export const STORAGE_KEYS = {
  words: 'toeic_vocab_words',
  learningStates: 'toeic_vocab_learning_states',
  dailyRecords: 'toeic_vocab_daily_records',
  settings: 'toeic_vocab_settings',
  activeSession: 'toeic_vocab_active_session',
} as const

export type AppStorageSnapshot = {
  words: Word[]
  learningStates: WordLearningState[]
  dailyRecords: DailyLearningRecord[]
  settings: AppSettings
}

const canUseLocalStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export function loadFromStorage<T>(key: string, fallbackValue: T): T {
  if (!canUseLocalStorage()) {
    return fallbackValue
  }

  const rawValue = window.localStorage.getItem(key)

  if (rawValue === null) {
    return fallbackValue
  }

  try {
    return JSON.parse(rawValue) as T
  } catch (error) {
    console.warn(`Failed to parse LocalStorage value for ${key}.`, error)
    return fallbackValue
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeFromStorage(key: string): void {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.removeItem(key)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function parseStoredLearningSession(
  value: unknown,
): StoredLearningSession | null {
  if (!isRecord(value)) {
    return null
  }

  const kind = value.kind === undefined ? 'daily' : value.kind
  const customWordIds = value.customWordIds ?? []
  const completedCustomCount = value.completedCustomCount ?? 0
  const completedCustomNewCount = value.completedCustomNewCount ?? 0

  if (
    (kind !== 'daily' && kind !== 'custom') ||
    typeof value.id !== 'string' ||
    !Array.isArray(value.reviewWordIds) ||
    !value.reviewWordIds.every((wordId) => typeof wordId === 'string') ||
    !Array.isArray(value.newWordIds) ||
    !value.newWordIds.every((wordId) => typeof wordId === 'string') ||
    !Array.isArray(customWordIds) ||
    !customWordIds.every((wordId) => typeof wordId === 'string') ||
    !isNonNegativeInteger(value.currentWordIndex) ||
    typeof value.isCurrentCardRevealed !== 'boolean' ||
    (value.phase !== 'review' &&
      value.phase !== 'new' &&
      value.phase !== 'custom' &&
      value.phase !== 'complete') ||
    !isNonNegativeInteger(value.completedReviewCount) ||
    !isNonNegativeInteger(value.completedNewCount) ||
    !isNonNegativeInteger(completedCustomCount) ||
    !isNonNegativeInteger(completedCustomNewCount) ||
    !isNonNegativeInteger(value.masteredIncrease) ||
    (kind === 'custom' && value.phase !== 'custom' && value.phase !== 'complete') ||
    (kind === 'daily' && value.phase === 'custom')
  ) {
    return null
  }

  return {
    id: value.id,
    kind,
    reviewWordIds: value.reviewWordIds,
    newWordIds: value.newWordIds,
    customWordIds,
    currentWordIndex: value.currentWordIndex,
    isCurrentCardRevealed: value.isCurrentCardRevealed,
    phase: value.phase,
    completedReviewCount: value.completedReviewCount,
    completedNewCount: value.completedNewCount,
    completedCustomCount,
    completedCustomNewCount,
    masteredIncrease: value.masteredIncrease,
  }
}

function getUserStorageKey(
  key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS],
  userId: string,
): string {
  return `${key}:${userId}`
}

export function migrateLegacyStorageToUser(userId: string): void {
  if (!canUseLocalStorage()) {
    return
  }

  const migratableKeys = [
    STORAGE_KEYS.learningStates,
    STORAGE_KEYS.dailyRecords,
    STORAGE_KEYS.settings,
    STORAGE_KEYS.activeSession,
  ] as const

  for (const legacyKey of migratableKeys) {
    const legacyValue = window.localStorage.getItem(legacyKey)
    const userKey = getUserStorageKey(legacyKey, userId)

    if (legacyValue !== null && window.localStorage.getItem(userKey) === null) {
      window.localStorage.setItem(userKey, legacyValue)
    }

    window.localStorage.removeItem(legacyKey)
  }
}

export function hasUserStorageData(userId: string): boolean {
  if (!canUseLocalStorage()) {
    return false
  }

  return [
    STORAGE_KEYS.learningStates,
    STORAGE_KEYS.dailyRecords,
    STORAGE_KEYS.settings,
  ].some(
    (key) =>
      window.localStorage.getItem(getUserStorageKey(key, userId)) !== null,
  )
}

export function loadActiveLearningSession(
  words: Word[],
  userId: string,
): LearningSession | null {
  const storedValue = loadFromStorage<unknown>(
    getUserStorageKey(STORAGE_KEYS.activeSession, userId),
    null,
  )
  const storedSession = parseStoredLearningSession(storedValue)

  if (storedSession === null || storedSession.phase === 'complete') {
    removeActiveLearningSession(userId)
    return null
  }

  const wordsById = new Map(words.map((word) => [word.id, word]))
  const reviewWords = storedSession.reviewWordIds
    .map((wordId) => wordsById.get(wordId))
    .filter((word): word is Word => word !== undefined)
  const newWords = storedSession.newWordIds
    .map((wordId) => wordsById.get(wordId))
    .filter((word): word is Word => word !== undefined)
  const customWords = storedSession.customWordIds
    .map((wordId) => wordsById.get(wordId))
    .filter((word): word is Word => word !== undefined)
  const currentWords =
    storedSession.phase === 'review'
      ? reviewWords
      : storedSession.phase === 'new'
        ? newWords
        : customWords
  const hasMissingWords =
    reviewWords.length !== storedSession.reviewWordIds.length ||
    newWords.length !== storedSession.newWordIds.length ||
    customWords.length !== storedSession.customWordIds.length

  if (
    hasMissingWords ||
    currentWords.length === 0 ||
    storedSession.currentWordIndex >= currentWords.length ||
    storedSession.completedReviewCount > reviewWords.length ||
    storedSession.completedNewCount > newWords.length ||
    storedSession.completedCustomCount > customWords.length ||
    storedSession.completedCustomNewCount > storedSession.completedCustomCount
  ) {
    removeActiveLearningSession(userId)
    return null
  }

  return {
    id: storedSession.id,
    kind: storedSession.kind,
    reviewWords,
    newWords,
    customWords,
    currentWordIndex: storedSession.currentWordIndex,
    isCurrentCardRevealed: storedSession.isCurrentCardRevealed,
    phase: storedSession.phase,
    completedReviewCount: storedSession.completedReviewCount,
    completedNewCount: storedSession.completedNewCount,
    completedCustomCount: storedSession.completedCustomCount,
    completedCustomNewCount: storedSession.completedCustomNewCount,
    masteredIncrease: storedSession.masteredIncrease,
  }
}

export function saveActiveLearningSession(
  session: LearningSession,
  userId: string,
): void {
  if (session.phase === 'complete') {
    removeActiveLearningSession(userId)
    return
  }

  const storedSession: StoredLearningSession = {
    id: session.id,
    kind: session.kind,
    reviewWordIds: session.reviewWords.map((word) => word.id),
    newWordIds: session.newWords.map((word) => word.id),
    customWordIds: session.customWords.map((word) => word.id),
    currentWordIndex: session.currentWordIndex,
    isCurrentCardRevealed: session.isCurrentCardRevealed,
    phase: session.phase,
    completedReviewCount: session.completedReviewCount,
    completedNewCount: session.completedNewCount,
    completedCustomCount: session.completedCustomCount,
    completedCustomNewCount: session.completedCustomNewCount,
    masteredIncrease: session.masteredIncrease,
  }

  saveToStorage(
    getUserStorageKey(STORAGE_KEYS.activeSession, userId),
    storedSession,
  )
}

export function removeActiveLearningSession(userId: string): void {
  removeFromStorage(getUserStorageKey(STORAGE_KEYS.activeSession, userId))
}

export function loadWords(fallbackValue: Word[] = []): Word[] {
  return loadFromStorage(STORAGE_KEYS.words, fallbackValue)
}

export function saveWords(words: Word[]): void {
  saveToStorage(STORAGE_KEYS.words, words)
}

export function loadOrSeedSampleWords(sampleWords: Word[]): Word[] {
  const storedWords = loadWords()

  if (storedWords.length > 0) {
    return storedWords
  }

  saveWords(sampleWords)
  return sampleWords
}

export function loadLearningStates(
  userId: string,
  fallbackValue: WordLearningState[] = [],
): WordLearningState[] {
  return loadFromStorage(
    getUserStorageKey(STORAGE_KEYS.learningStates, userId),
    fallbackValue,
  )
}

export function saveLearningStates(
  learningStates: WordLearningState[],
  userId: string,
): void {
  saveToStorage(
    getUserStorageKey(STORAGE_KEYS.learningStates, userId),
    learningStates,
  )
}

export function loadDailyRecords(
  userId: string,
  fallbackValue: DailyLearningRecord[] = [],
): DailyLearningRecord[] {
  return loadFromStorage(
    getUserStorageKey(STORAGE_KEYS.dailyRecords, userId),
    fallbackValue,
  )
}

export function saveDailyRecords(
  dailyRecords: DailyLearningRecord[],
  userId: string,
): void {
  saveToStorage(
    getUserStorageKey(STORAGE_KEYS.dailyRecords, userId),
    dailyRecords,
  )
}

export function loadSettings(
  userId: string,
  fallbackValue: AppSettings = DEFAULT_SETTINGS,
): AppSettings {
  return loadFromStorage(
    getUserStorageKey(STORAGE_KEYS.settings, userId),
    fallbackValue,
  )
}

export function saveSettings(settings: AppSettings, userId: string): void {
  saveToStorage(getUserStorageKey(STORAGE_KEYS.settings, userId), settings)
}

export function loadUserStorageSnapshot(
  userId: string,
  words: Word[],
): AppStorageSnapshot {
  return {
    words,
    learningStates: loadLearningStates(userId),
    dailyRecords: loadDailyRecords(userId),
    settings: loadSettings(userId),
  }
}

export function saveAppStorageSnapshot(
  snapshot: AppStorageSnapshot,
  userId: string,
): void {
  saveWords(snapshot.words)
  saveLearningStates(snapshot.learningStates, userId)
  saveDailyRecords(snapshot.dailyRecords, userId)
  saveSettings(snapshot.settings, userId)
}

export function createResetSnapshot(sampleWords: Word[]): AppStorageSnapshot {
  return {
    words: sampleWords,
    learningStates: [],
    dailyRecords: [],
    settings: DEFAULT_SETTINGS,
  }
}
