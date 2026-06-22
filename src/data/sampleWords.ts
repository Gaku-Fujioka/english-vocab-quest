import type { Word } from '../types/word'

export const sampleWords = [
  {
    id: 'sample-001',
    word: 'inventory',
    meaning: '在庫',
    partOfSpeech: 'noun',
    section: '600',
  },
  {
    id: 'sample-002',
    word: 'schedule',
    meaning: '予定',
    partOfSpeech: 'noun',
    section: '600',
  },
  {
    id: 'sample-003',
    word: 'estimate',
    meaning: '見積もる',
    partOfSpeech: 'verb',
    section: '700',
  },
  {
    id: 'sample-004',
    word: 'receipt',
    meaning: '領収書',
    partOfSpeech: 'noun',
    section: '700',
  },
  {
    id: 'sample-005',
    word: 'substantial',
    meaning: 'かなりの',
    partOfSpeech: 'adjective',
    section: '850',
  },
  {
    id: 'sample-006',
    word: 'authorize',
    meaning: '許可する',
    partOfSpeech: 'verb',
    section: '850',
  },
  {
    id: 'sample-007',
    word: 'procurement',
    meaning: '調達',
    partOfSpeech: 'noun',
    section: '950',
  },
  {
    id: 'sample-008',
    word: 'compliance',
    meaning: '遵守',
    partOfSpeech: 'noun',
    section: '950',
  },
] satisfies Word[]
