import type { WordLearningState } from '../types/learning'
import type { AppSettings } from '../types/settings'
import type { Word } from '../types/word'

type HomePageProps = {
  learningStates: WordLearningState[]
  onStartStudy: () => void
  settings: AppSettings
  words: Word[]
}

const getTodayDate = () => new Date().toISOString().slice(0, 10)

export function HomePage({
  learningStates,
  onStartStudy,
  settings,
  words,
}: HomePageProps) {
  const today = getTodayDate()
  const reviewCount = learningStates.filter((state) => {
    if (state.nextReviewAt === null) {
      return false
    }

    return state.nextReviewAt.slice(0, 10) <= today
  }).length
  const masteredCount = learningStates.filter((state) => state.mastered).length
  const masteryPercent =
    words.length === 0 ? 0 : Math.round((masteredCount / words.length) * 100)

  return (
    <div className="page page-home">
      <section className="home-hero">
        <div>
          <p className="eyebrow">おかえりなさい!</p>
          <h1>今日も単語を積み上げよう</h1>
          <p className="muted-text">目標 TOEIC {settings.targetScore}</p>
        </div>
        <div className="streak-pill">
          <strong>0日</strong>
          <span>連続</span>
        </div>
      </section>

      <section className="panel progress-panel" aria-labelledby="today-progress">
        <div className="section-heading">
          <h2 id="today-progress">今日の進捗</h2>
          <strong>{masteryPercent}%</strong>
        </div>
        <div className="progress-track" aria-label={`全体の習得率 ${masteryPercent}%`}>
          <span style={{ width: `${masteryPercent}%` }} />
        </div>
        <p className="panel-note">復習 {reviewCount}語 / 登録 {words.length}語</p>
        <button className="primary-button" onClick={onStartStudy} type="button">
          学習を開始する
        </button>
      </section>

      <section className="metric-grid" aria-label="学習サマリー">
        <article className="metric-card">
          <span className="metric-card__icon metric-card__icon--red">R</span>
          <strong>{reviewCount}</strong>
          <span>今日の復習</span>
        </article>
        <article className="metric-card">
          <span className="metric-card__icon metric-card__icon--green">M</span>
          <strong>{masteredCount}</strong>
          <span>習得した単語</span>
        </article>
      </section>

      <section className="panel compact-panel">
        <div className="circle-progress" aria-hidden="true">
          {masteryPercent}%
        </div>
        <div>
          <h2>全体の習得度</h2>
          <p className="muted-text">
            {masteredCount} / {words.length} words
          </p>
        </div>
      </section>
    </div>
  )
}
