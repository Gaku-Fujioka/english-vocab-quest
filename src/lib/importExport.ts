import type { DailyLearningRecord, WordLearningState } from '../types/learning'
import type { AppSettings } from '../types/settings'
import { TARGET_SCORES } from '../types/settings'
import type { Word, WordSection } from '../types/word'
import { WORD_SECTIONS } from '../types/word'
import type { AppStorageSnapshot } from './storage'

type CsvParseResult =
  | {
      ok: true
      rows: string[][]
    }
  | {
      ok: false
      error: string
    }

export type VocabularyCsvImportResult =
  | {
      ok: true
      words: Word[]
      importedCount: number
      skippedCount: number
    }
  | {
      ok: false
      error: string
    }

export type BackupImportResult =
  | {
      ok: true
      snapshot: AppStorageSnapshot
    }
  | {
      ok: false
      error: string
    }

const REQUIRED_CSV_COLUMNS = [
  'word',
  'meaning',
  'partOfSpeech',
  'section',
] as const

function parseCsvRows(csvText: string): CsvParseResult {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let isInsideQuotes = false
  const text = csvText.replace(/^\uFEFF/, '')

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (character === '"') {
      if (isInsideQuotes && nextCharacter === '"') {
        currentCell += '"'
        index += 1
      } else {
        isInsideQuotes = !isInsideQuotes
      }

      continue
    }

    if (character === ',' && !isInsideQuotes) {
      currentRow.push(currentCell)
      currentCell = ''
      continue
    }

    if ((character === '\n' || character === '\r') && !isInsideQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }

      currentRow.push(currentCell)
      rows.push(currentRow)
      currentRow = []
      currentCell = ''
      continue
    }

    currentCell += character
  }

  if (isInsideQuotes) {
    return {
      ok: false,
      error: 'CSVの引用符が閉じられていません。',
    }
  }

  currentRow.push(currentCell)
  rows.push(currentRow)

  return {
    ok: true,
    rows: rows.filter((row) => row.some((cell) => cell.trim() !== '')),
  }
}

function isWordSection(value: string): value is WordSection {
  return WORD_SECTIONS.includes(value as WordSection)
}

function normalizeWordForDuplicateCheck(word: string): string {
  return word.trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizeWordForId(word: string): string {
  return word.trim().replace(/\s+/g, '-').toLowerCase()
}

function createImportedWordId(section: WordSection, word: string): string {
  return `${section}-${normalizeWordForId(word)}`
}

export function parseVocabularyCsv(csvText: string): VocabularyCsvImportResult {
  const parseResult = parseCsvRows(csvText)

  if (!parseResult.ok) {
    return parseResult
  }

  const [headerRow, ...dataRows] = parseResult.rows

  if (headerRow === undefined) {
    return {
      ok: false,
      error: 'CSVにヘッダー行がありません。',
    }
  }

  const headerIndexes = new Map(
    headerRow.map((header, index) => [header.trim(), index]),
  )
  const missingColumn = REQUIRED_CSV_COLUMNS.find(
    (column) => !headerIndexes.has(column),
  )

  if (missingColumn !== undefined) {
    return {
      ok: false,
      error: `CSVに必須カラム ${missingColumn} がありません。`,
    }
  }

  const importedWords: Word[] = []
  const importedWordKeys = new Set<string>()
  let skippedCount = 0

  for (const row of dataRows) {
    const word = row[headerIndexes.get('word') ?? -1]?.trim() ?? ''
    const meaning = row[headerIndexes.get('meaning') ?? -1]?.trim() ?? ''
    const partOfSpeech =
      row[headerIndexes.get('partOfSpeech') ?? -1]?.trim() ?? ''
    const section = row[headerIndexes.get('section') ?? -1]?.trim() ?? ''

    if (
      word === '' ||
      meaning === '' ||
      partOfSpeech === '' ||
      !isWordSection(section)
    ) {
      skippedCount += 1
      continue
    }

    const duplicateKey = normalizeWordForDuplicateCheck(word)

    if (importedWordKeys.has(duplicateKey)) {
      skippedCount += 1
      continue
    }

    importedWordKeys.add(duplicateKey)
    importedWords.push({
      id: createImportedWordId(section, word),
      word,
      meaning,
      partOfSpeech,
      section,
    })
  }

  return {
    ok: true,
    words: importedWords,
    importedCount: importedWords.length,
    skippedCount,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isTargetScore(value: unknown): value is AppSettings['targetScore'] {
  return TARGET_SCORES.includes(value as AppSettings['targetScore'])
}

function isWord(value: unknown): value is Word {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.word === 'string' &&
    typeof value.meaning === 'string' &&
    typeof value.partOfSpeech === 'string' &&
    typeof value.section === 'string' &&
    isWordSection(value.section)
  )
}

function isLearningState(value: unknown): value is WordLearningState {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.wordId === 'string' &&
    typeof value.mastered === 'boolean' &&
    isNonNegativeNumber(value.perfectCount) &&
    isNonNegativeNumber(value.weakPoint) &&
    isNullableString(value.lastReviewedAt) &&
    isNullableString(value.nextReviewAt) &&
    isNonNegativeNumber(value.reviewCount)
  )
}

function isDailyRecord(value: unknown): value is DailyLearningRecord {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.date === 'string' &&
    isNonNegativeNumber(value.reviewCount) &&
    isNonNegativeNumber(value.newCount) &&
    isNonNegativeNumber(value.masteredIncrease)
  )
}

function isAppSettings(value: unknown): value is AppSettings {
  return isRecord(value) && isTargetScore(value.targetScore)
}

export function validateAppStorageSnapshot(value: unknown): BackupImportResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      error: 'JSONの形式が正しくありません。',
    }
  }

  if (
    !Array.isArray(value.words) ||
    !Array.isArray(value.learningStates) ||
    !Array.isArray(value.dailyRecords) ||
    !isAppSettings(value.settings)
  ) {
    return {
      ok: false,
      error: 'JSONに必要なデータが含まれていません。',
    }
  }

  if (!value.words.every(isWord)) {
    return {
      ok: false,
      error: 'JSONのwordsデータが正しくありません。',
    }
  }

  if (!value.learningStates.every(isLearningState)) {
    return {
      ok: false,
      error: 'JSONのlearningStatesデータが正しくありません。',
    }
  }

  if (!value.dailyRecords.every(isDailyRecord)) {
    return {
      ok: false,
      error: 'JSONのdailyRecordsデータが正しくありません。',
    }
  }

  return {
    ok: true,
    snapshot: {
      words: value.words,
      learningStates: value.learningStates,
      dailyRecords: value.dailyRecords,
      settings: value.settings,
    },
  }
}

export function parseAppBackupJson(jsonText: string): BackupImportResult {
  try {
    return validateAppStorageSnapshot(JSON.parse(jsonText))
  } catch {
    return {
      ok: false,
      error: 'JSONを読み込めませんでした。',
    }
  }
}

export function downloadAppBackup(
  snapshot: AppStorageSnapshot,
  filename = 'toeic-vocab-quest-backup.json',
): void {
  const jsonText = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([jsonText], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
