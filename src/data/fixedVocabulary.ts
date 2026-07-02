import vocabularyCsv from '../toeic_vocab_quest_combined_1000.csv?raw'
import { parseVocabularyCsv } from '../lib/importExport'
import type { Word } from '../types/word'

function loadFixedVocabulary(): Word[] {
  const result = parseVocabularyCsv(vocabularyCsv)

  if (!result.ok) {
    throw new Error(`固定語彙CSVを読み込めませんでした: ${result.error}`)
  }

  if (result.importedCount === 0) {
    throw new Error('固定語彙CSVに有効な単語がありません。')
  }

  if (result.skippedCount > 0) {
    console.warn(
      `固定語彙CSVで${result.skippedCount}行をスキップしました。`,
    )
  }

  return result.words
}

export const fixedVocabulary = loadFixedVocabulary()
