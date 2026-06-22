import { useState } from 'react'
import type { Word } from '../types/word'

type StudyPageProps = {
  word: Word | undefined
}

export function StudyPage({ word }: StudyPageProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  if (word === undefined) {
    return (
      <div className="page page-study">
        <section className="panel empty-panel">
          <h1>学習</h1>
          <p className="muted-text">単語データがありません。</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page page-study">
      <div className="study-progress">
        <span>学習セッション</span>
        <strong>1 / 1</strong>
      </div>
      <div className="progress-track progress-track--thin" aria-hidden="true">
        <span style={{ width: isRevealed ? '100%' : '45%' }} />
      </div>

      <button
        className="flashcard"
        onClick={() => setIsRevealed((currentValue) => !currentValue)}
        type="button"
      >
        <span className="flashcard__word">{word.word}</span>
        {isRevealed ? (
          <div className="flashcard__answer">
            <strong>{word.meaning}</strong>
            <span>{word.partOfSpeech}</span>
            <small>習得まであと 3 perfect</small>
          </div>
        ) : (
          <span className="flashcard__hint">tap to reveal</span>
        )}
      </button>

      <div className="rating-grid" aria-label="回答評価">
        <button className="rating-button rating-button--muted" disabled type="button">
          不安
        </button>
        <button className="rating-button rating-button--danger" disabled type="button">
          わからない
        </button>
        <button className="rating-button rating-button--info" disabled type="button">
          覚えている
        </button>
        <button className="rating-button rating-button--success" disabled type="button">
          完璧
        </button>
      </div>
    </div>
  )
}
