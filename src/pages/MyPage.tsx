import {
  getLearningStreak,
  getMasteredCount,
  getMasteryPercent,
} from '../lib/progress'
import type { DailyLearningRecord, WordLearningState } from '../types/learning'
import type { AppSettings } from '../types/settings'
import type { Word } from '../types/word'
import { WORD_SECTIONS } from '../types/word'

type MyPageProps = {
  dailyRecords: DailyLearningRecord[]
  learningStates: WordLearningState[]
  settings: AppSettings
  words: Word[]
}

type WeakWord = {
  state: WordLearningState
  word: Word
}

const isWeakWord = (item: { state: WordLearningState; word: Word | undefined }): item is WeakWord =>
  item.word !== undefined

export function MyPage({
  dailyRecords,
  learningStates,
  settings,
  words,
}: MyPageProps) {
  const masteredIds = new Set(
    learningStates.filter((state) => state.mastered).map((state) => state.wordId),
  )
  const masteredCount = getMasteredCount(learningStates)
  const masteryPercent = getMasteryPercent(masteredCount, words.length)
  const currentStreak = getLearningStreak(dailyRecords)
  const weakWords = learningStates
    .filter((state) => state.weakPoint > 0)
    .sort((firstState, secondState) => secondState.weakPoint - firstState.weakPoint)
    .slice(0, 10)
    .map((state) => ({
      state,
      word: words.find((word) => word.id === state.wordId),
    }))
    .filter(isWeakWord)
  const activeDates = new Set(dailyRecords.map((record) => record.date))

  return (
    <div className="page page-mypage">
      <section className="profile-summary">
        <div className="avatar" aria-hidden="true">
          VM
        </div>
        <div>
          <p className="eyebrow">学習進捗</p>
          <h1>目標 TOEIC {settings.targetScore}</h1>
          <p className="muted-text">{masteredCount} words mastered</p>
        </div>
        <div className="ring-progress">{masteryPercent}%</div>
      </section>

      <section className="score-row" aria-label="学習サマリー">
        <article>
          <span>総習得</span>
          <strong>{masteredCount}</strong>
        </article>
        <article>
          <span>連続日数</span>
          <strong>{currentStreak} Days</strong>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>レベル別進捗</h2>
          <span>{masteredCount} / {words.length}</span>
        </div>
        <div className="section-list">
          {WORD_SECTIONS.map((section) => {
            const sectionWords = words.filter((word) => word.section === section)
            const sectionMastered = sectionWords.filter((word) =>
              masteredIds.has(word.id),
            ).length
            const sectionPercent =
              sectionWords.length === 0
                ? 0
                : Math.round((sectionMastered / sectionWords.length) * 100)

            return (
              <div className="section-progress" key={section}>
                <div>
                  <strong>{section}点レベル</strong>
                  <span>{sectionMastered} / {sectionWords.length}</span>
                </div>
                <div className="progress-track progress-track--mini">
                  <span style={{ width: `${sectionPercent}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>優先復習単語</h2>
        </div>
        {weakWords.length > 0 ? (
          <div className="weak-list">
            {weakWords.map((item) => (
              <article className="weak-card" key={item.word.id}>
                <div>
                  <strong>{item.word.word}</strong>
                  <span>{item.word.meaning}</span>
                </div>
                <span>{item.state.weakPoint}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">まだ弱点単語はありません。</p>
        )}
      </section>

      <section className="panel">
        <h2>学習記録</h2>
        <div className="heatmap" aria-label="学習記録">
          {Array.from({ length: 42 }, (_, index) => {
            const cellDate = `day-${index + 1}`
            const hasActivity = activeDates.has(cellDate)

            return (
              <span
                className={hasActivity ? 'heatmap-cell is-active' : 'heatmap-cell'}
                key={cellDate}
              />
            )
          })}
        </div>
      </section>
    </div>
  )
}
