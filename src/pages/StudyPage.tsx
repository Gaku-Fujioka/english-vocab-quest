import type {
  LearningSession,
  Rating,
  WordLearningState,
} from '../types/learning'
import type { Word } from '../types/word'

type StudyPageProps = {
  currentStreak: number
  learningStates: WordLearningState[]
  onRate: (rating: Rating) => void
  onReturnHome: () => void
  onReveal: () => void
  session: LearningSession | null
  totalMasteredCount: number
}

const ratingButtons = [
  {
    rating: 'perfect',
    label: 'Perfect',
    className: 'rating-button rating-button--success',
  },
  {
    rating: 'knew',
    label: 'Knew It',
    className: 'rating-button rating-button--info',
  },
  {
    rating: 'unsure',
    label: 'Unsure',
    className: 'rating-button rating-button--muted',
  },
  {
    rating: 'unknown',
    label: "Didn't Know",
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

  return []
}

function getPhaseLabel(session: LearningSession): string {
  if (session.phase === 'review') {
    return '復習'
  }

  if (session.phase === 'new') {
    return '新しい単語'
  }

  return '完了'
}

function getCurrentWord(session: LearningSession): Word | undefined {
  return getCurrentWords(session)[session.currentWordIndex]
}

export function StudyPage({
  currentStreak,
  learningStates,
  onRate,
  onReturnHome,
  onReveal,
  session,
  totalMasteredCount,
}: StudyPageProps) {
  if (session === null) {
    return (
      <div className="page page-study">
        <section className="panel empty-panel">
          <h1>学習</h1>
          <p className="muted-text">Homeから今日の学習を開始できます。</p>
          <button className="secondary-button" onClick={onReturnHome} type="button">
            Homeへ戻る
          </button>
        </section>
      </div>
    )
  }

  if (session.phase === 'complete') {
    return (
      <div className="page page-study page-completion">
        <section className="panel completion-panel">
          <p className="eyebrow">Today's study complete!</p>
          <h1>今日の学習が完了しました</h1>

          <div className="completion-grid" aria-label="学習結果">
            <article>
              <span>Review</span>
              <strong>
                {session.completedReviewCount} / {session.reviewWords.length}
              </strong>
            </article>
            <article>
              <span>New Words</span>
              <strong>
                {session.completedNewCount} / {session.newWords.length}
              </strong>
            </article>
            <article>
              <span>Mastered</span>
              <strong>+{session.masteredIncrease}</strong>
            </article>
            <article>
              <span>Current Streak</span>
              <strong>{currentStreak} days</strong>
            </article>
          </div>

          <p className="muted-text">総習得単語: {totalMasteredCount} words</p>
          <button className="primary-button" onClick={onReturnHome} type="button">
            Homeへ戻る
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
            Homeへ戻る
          </button>
        </section>
      </div>
    )
  }

  const totalWordCount = session.reviewWords.length + session.newWords.length
  const completedWordCount =
    session.completedReviewCount + session.completedNewCount
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
              <span>Meaning</span>
              <strong>{currentWord.meaning}</strong>
            </div>
            <div>
              <span>Part of Speech</span>
              <strong>{currentWord.partOfSpeech}</strong>
            </div>
            <div>
              <span>Mastery</span>
              <small>
                {remainingPerfectReviews === 0
                  ? 'mastered'
                  : `${remainingPerfectReviews} more perfect reviews needed`}
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
    </div>
  )
}
