import { useState } from 'react'
import { getCustomTestCandidates } from '../lib/scheduler'
import type {
  CustomTestFilters,
  CustomTestLevel,
  CustomTestMastery,
  LearningSession,
  Rating,
  WordLearningState,
} from '../types/learning'
import type { Word } from '../types/word'

type StudyPageProps = {
  currentStreak: number
  learningStates: WordLearningState[]
  onEndSession: () => void
  onPause: () => void
  onRate: (rating: Rating) => void
  onReturnHome: () => void
  onReveal: () => void
  onStartCustomTest: (
    filters: CustomTestFilters,
  ) => 'started' | 'empty' | 'cancelled'
  session: LearningSession | null
  totalMasteredCount: number
  words: Word[]
}

const levelOptions = [
  { value: 'all', label: 'すべてのレベル' },
  { value: '600', label: '600レベル' },
  { value: '700', label: '700レベル' },
  { value: '850', label: '850レベル' },
  { value: '950', label: '950レベル' },
] satisfies { value: CustomTestLevel; label: string }[]

const masteryOptions = [
  { value: 'all', label: 'すべての習熟度' },
  { value: 'unlearned', label: '未学習' },
  { value: 'learning', label: '学習中' },
  { value: 'mastered', label: '習得済み' },
  { value: 'weak', label: '苦手な単語' },
] satisfies { value: CustomTestMastery; label: string }[]

const ratingButtons = [
  {
    rating: 'perfect',
    label: '完璧',
    className: 'rating-button rating-button--success',
  },
  {
    rating: 'knew',
    label: 'わかった',
    className: 'rating-button rating-button--info',
  },
  {
    rating: 'unsure',
    label: '自信なし',
    className: 'rating-button rating-button--muted',
  },
  {
    rating: 'unknown',
    label: 'わからなかった',
    className: 'rating-button rating-button--danger',
  },
] satisfies {
  rating: Rating
  label: string
  className: string
}[]

function getCurrentWords(session: LearningSession): Word[] {
  if (session.phase === 'review') {
    return session.reviewWords
  }

  if (session.phase === 'new') {
    return session.newWords
  }

  if (session.phase === 'custom') {
    return session.customWords
  }

  return []
}

function getPhaseLabel(session: LearningSession): string {
  if (session.phase === 'review') {
    return '復習'
  }

  if (session.phase === 'new') {
    return '新しい単語'
  }

  if (session.phase === 'custom') {
    return 'ランダムテスト'
  }

  return '完了'
}

function getCurrentWord(session: LearningSession): Word | undefined {
  return getCurrentWords(session)[session.currentWordIndex]
}

export function StudyPage({
  currentStreak,
  learningStates,
  onEndSession,
  onPause,
  onRate,
  onReturnHome,
  onReveal,
  onStartCustomTest,
  session,
  totalMasteredCount,
  words,
}: StudyPageProps) {
  const [customTestFilters, setCustomTestFilters] = useState<CustomTestFilters>({
    level: 'all',
    mastery: 'all',
  })
  const [showEmptyTestState, setShowEmptyTestState] = useState(false)
  const customTestWordCount = getCustomTestCandidates(
    words,
    learningStates,
    customTestFilters,
  ).length

  if (session === null && showEmptyTestState) {
    return (
      <div className="page page-study">
        <section className="panel empty-panel" aria-labelledby="empty-test-title">
          <p className="eyebrow">自由テスト</p>
          <h1 id="empty-test-title">該当する単語がありません</h1>
          <p className="muted-text">
            条件を変更して、もう一度テストを開始してください。
          </p>
          <button
            className="primary-button"
            onClick={() => setShowEmptyTestState(false)}
            type="button"
          >
            条件選択に戻る
          </button>
          <button
            className="secondary-button"
            onClick={onReturnHome}
            type="button"
          >
            ホームへ戻る
          </button>
        </section>
      </div>
    )
  }

  if (session === null) {
    return (
      <div className="page page-study">
        <section className="panel test-setup" aria-labelledby="test-setup-title">
          <div>
            <p className="eyebrow">自由テスト</p>
            <h1 id="test-setup-title">ランダムテスト</h1>
            <p className="muted-text">
              レベルと習熟度を選び、該当する単語をランダムな順番でテストします。
            </p>
          </div>

          <div className="test-filter-grid">
            <label>
              <span>レベル</span>
              <select
                onChange={(event) =>
                  setCustomTestFilters((currentFilters) => ({
                    ...currentFilters,
                    level: event.currentTarget.value as CustomTestLevel,
                  }))
                }
                value={customTestFilters.level}
              >
                {levelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>習熟度</span>
              <select
                onChange={(event) =>
                  setCustomTestFilters((currentFilters) => ({
                    ...currentFilters,
                    mastery: event.currentTarget.value as CustomTestMastery,
                  }))
                }
                value={customTestFilters.mastery}
              >
                {masteryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="test-word-count" aria-live="polite">
            <span>今回の出題数</span>
            <strong>{customTestWordCount}語</strong>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              const result = onStartCustomTest(customTestFilters)

              if (result === 'empty') {
                setShowEmptyTestState(true)
              }
            }}
            type="button"
          >
            ランダムテストを開始する
          </button>
          {customTestWordCount === 0 ? (
            <p className="test-empty-message" role="status">
              選択した条件に該当する単語がありません。
            </p>
          ) : null}
        </section>
      </div>
    )
  }

  if (session.phase === 'complete') {
    const isCustomTest = session.kind === 'custom'

    return (
      <div className="page page-study page-completion">
        <section className="panel completion-panel">
          <p className="eyebrow">
            {isCustomTest ? 'ランダムテスト完了！' : '今日の学習完了！'}
          </p>
          <h1>{isCustomTest ? 'テストが完了しました' : '今日の学習が完了しました'}</h1>

          <div className="completion-grid" aria-label="学習結果">
            {isCustomTest ? (
              <article>
                <span>テスト完了</span>
                <strong>
                  {session.completedCustomCount} / {session.customWords.length}
                </strong>
              </article>
            ) : (
              <>
                <article>
                  <span>復習</span>
                  <strong>
                    {session.completedReviewCount} / {session.reviewWords.length}
                  </strong>
                </article>
                <article>
                  <span>新しい単語</span>
                  <strong>
                    {session.completedNewCount} / {session.newWords.length}
                  </strong>
                </article>
              </>
            )}
            <article>
              <span>新たに習得</span>
              <strong>+{session.masteredIncrease}</strong>
            </article>
            <article>
              <span>連続学習</span>
              <strong>{currentStreak}日</strong>
            </article>
          </div>

          <p className="muted-text">総習得単語: {totalMasteredCount}語</p>
          <button className="primary-button" onClick={onReturnHome} type="button">
            ホームへ戻る
          </button>
        </section>
      </div>
    )
  }

  const currentWord = getCurrentWord(session)

  if (currentWord === undefined) {
    return (
      <div className="page page-study">
        <section className="panel empty-panel">
          <h1>学習</h1>
          <p className="muted-text">このセッションに単語がありません。</p>
          <button className="secondary-button" onClick={onReturnHome} type="button">
            ホームへ戻る
          </button>
        </section>
      </div>
    )
  }

  const totalWordCount =
    session.kind === 'custom'
      ? session.customWords.length
      : session.reviewWords.length + session.newWords.length
  const completedWordCount =
    session.kind === 'custom'
      ? session.completedCustomCount
      : session.completedReviewCount + session.completedNewCount
  const currentLearningState = learningStates.find(
    (state) => state.wordId === currentWord.id,
  )
  const remainingPerfectReviews = currentLearningState?.mastered
    ? 0
    : Math.max(0, 3 - (currentLearningState?.perfectCount ?? 0))
  const progressPercent =
    totalWordCount === 0
      ? 100
      : Math.round((completedWordCount / totalWordCount) * 100)

  return (
    <div className="page page-study">
      <div className="study-progress">
        <span>{getPhaseLabel(session)}</span>
        <strong>
          {completedWordCount + 1} / {totalWordCount}
        </strong>
      </div>
      <div className="progress-track progress-track--thin" aria-hidden="true">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <button
        aria-label={
          session.isCurrentCardRevealed
            ? `${currentWord.word} の答え`
            : `${currentWord.word} の答えを見る`
        }
        className="flashcard"
        onClick={() => {
          if (!session.isCurrentCardRevealed) {
            onReveal()
          }
        }}
        type="button"
      >
        <span className="flashcard__word">{currentWord.word}</span>
        {session.isCurrentCardRevealed ? (
          <div className="flashcard__answer">
            <div>
              <span>意味</span>
              <strong>{currentWord.meaning}</strong>
            </div>
            <div>
              <span>品詞</span>
              <strong>{currentWord.partOfSpeech}</strong>
            </div>
            <div>
              <span>習得状況</span>
              <small>
                {remainingPerfectReviews === 0
                  ? '習得済み'
                  : `習得まで「完璧」があと${remainingPerfectReviews}回`}
              </small>
            </div>
          </div>
        ) : null}
      </button>

      {session.isCurrentCardRevealed ? (
        <div className="rating-grid" aria-label="回答評価">
          {ratingButtons.map((button) => (
            <button
              className={button.className}
              key={button.rating}
              onClick={() => onRate(button.rating)}
              type="button"
            >
              {button.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="flashcard__hint">カードをタップして答えを見る</p>
      )}

      <div className="study-exit-actions">
        <button className="study-pause-button" onClick={onPause} type="button">
          中断してホームへ
        </button>
        {session.kind === 'custom' ? (
          <button
            className="study-end-button"
            onClick={onEndSession}
            type="button"
          >
            ここでテストを終了する
          </button>
        ) : null}
      </div>
    </div>
  )
}
