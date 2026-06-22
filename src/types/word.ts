export const WORD_SECTIONS = ['600', '700', '850', '950'] as const

export type WordSection = (typeof WORD_SECTIONS)[number]

export type Word = {
  id: string
  word: string
  meaning: string
  partOfSpeech: string
  section: WordSection
}
