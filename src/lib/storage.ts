import type { DailyLearningRecord, WordLearningState } from '../types/learning'
import type { AppSettings } from '../types/settings'
import { DEFAULT_SETTINGS } from '../types/settings'
import type { Word } from '../types/word'

export const STORAGE_KEYS = {
  words: 'toeic_vocab_words',
  learningStates: 'toeic_vocab_learning_states',
  dailyRecords: 'toeic_vocab_daily_records',
  settings: 'toeic_vocab_settings',
} as const

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

export type AppStorageSnapshot = {
  words: Word[]
  learningStates: WordLearningState[]
  dailyRecords: DailyLearningRecord[]
  settings: AppSettings
}

const canUseLocalStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export function loadFromStorage<T>(key: StorageKey, fallbackValue: T): T {
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

export function saveToStorage<T>(key: StorageKey, value: T): void {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeFromStorage(key: StorageKey): void {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.removeItem(key)
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
  fallbackValue: WordLearningState[] = [],
): WordLearningState[] {
  return loadFromStorage(STORAGE_KEYS.learningStates, fallbackValue)
}

export function saveLearningStates(learningStates: WordLearningState[]): void {
  saveToStorage(STORAGE_KEYS.learningStates, learningStates)
}

export function loadDailyRecords(
  fallbackValue: DailyLearningRecord[] = [],
): DailyLearningRecord[] {
  return loadFromStorage(STORAGE_KEYS.dailyRecords, fallbackValue)
}

export function saveDailyRecords(dailyRecords: DailyLearningRecord[]): void {
  saveToStorage(STORAGE_KEYS.dailyRecords, dailyRecords)
}

export function loadSettings(
  fallbackValue: AppSettings = DEFAULT_SETTINGS,
): AppSettings {
  return loadFromStorage(STORAGE_KEYS.settings, fallbackValue)
}

export function saveSettings(settings: AppSettings): void {
  saveToStorage(STORAGE_KEYS.settings, settings)
}
