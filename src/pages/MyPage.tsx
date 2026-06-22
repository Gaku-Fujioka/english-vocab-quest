import {
  getLearningHeatmapDays,
  getLearningStreak,
  getOverallProgress,
  getSectionProgress,
  getWeakWordRanking,
} from '../lib/progress'
import type { DailyLearningRecord, WordLearningState } from '../types/learning'
import type { AppSettings } from '../types/settings'
import type { Word } from '../types/word'
import type { CSSProperties } from 'react'

type MyPageProps = {
  dailyRecords: DailyLearningRecord[]
  learningStates: WordLearningState[]
  settings: AppSettings
  words: Word[]
}

export function MyPage({
  dailyRecords,
  learningStates,
  settings,
  words,
}: MyPageProps) {
  const overallProgress = getOverallProgress(words, learningStates)
  const sectionProgress = getSectionProgress(words, learningStates)
  const weakWords = getWeakWordRanking(words, learningStates)
  const heatmapDays = getLearningHeatmapDays(dailyRecords)
  const currentStreak = getLearningStreak(dailyRecords)
  const ringStyle = {
    '--progress-percent': `${overallProgress.percent}%`,
  } as CSSProperties

  return (
    <div className="page page-mypage">
      <section className="profile-summary">
        <div className="avatar" aria-hidden="true">
          VM
        </div>
        <div>
          <p className="eyebrow">学習進捗</p>
          <h1>目標 TOEIC {settings.targetScore}</h1>
          <p className="muted-text">
            {overallProgress.masteredCount} / {overallProgress.totalWordCount} words
          </p>
        </div>
        <div className="ring-progress" style={ringStyle}>
          {overallProgress.percent}%
        </div>
      </section>

      <section className="score-row" aria-label="学習サマリー">
        <article>
          <span>総習得</span>
          <strong>{overallProgress.masteredCount}</strong>
        </article>
        <article>
          <span>登録単語</span>
          <strong>{overallProgress.totalWordCount}</strong>
        </article>
        <article>
          <span>連続日数</span>
          <strong>{currentStreak} Days</strong>
        </article>
        <article>
          <span>習得率</span>
          <strong>{overallProgress.percent}%</strong>
        </article>
      </section>

      <section className="panel progress-panel">
        <div className="section-heading">
          <h2>全体の習得度</h2>
          <span>
            {overallProgress.masteredCount} / {overallProgress.totalWordCount}
          </span>
        </div>
        <div
          className="progress-track"
          aria-label={`全体の習得率 ${overallProgress.percent}%`}
        >
          <span style={{ width: `${overallProgress.percent}%` }} />
        </div>
        <p className="muted-text">
          登録済みの単語に対して、習得済みになった単語の割合です。
        </p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Section Progress</h2>
          <span>{overallProgress.percent}% total</span>
        </div>
        <div className="section-list">
          {sectionProgress.map((section) => (
              <div className="section-progress" key={section.section}>
                <div>
                  <strong>{section.section} Level</strong>
                  <span>
                    {section.masteredCount} / {section.totalWordCount} ·{' '}
                    {section.percent}%
                  </span>
                </div>
                <div
                  className="progress-track progress-track--mini"
                  aria-label={`${section.section} Level ${section.percent}%`}
                >
                  <span style={{ width: `${section.percent}%` }} />
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Weak Word Ranking</h2>
          <span>Top 10</span>
        </div>
        {weakWords.length > 0 ? (
          <div className="weak-list">
            {weakWords.map((item) => (
              <article className="weak-card" key={item.word.id}>
                <span className="weak-card__rank">{item.rank}</span>
                <div>
                  <strong>{item.word.word}</strong>
                  <span>
                    {item.word.meaning} · {item.word.partOfSpeech}
                  </span>
                </div>
                <span className="weak-card__score">{item.weakPoint}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">
            No weak words yet. Keep studying to discover what needs review.
          </p>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Learning Heatmap</h2>
          <span>365 days</span>
        </div>
        <div className="heatmap-scroller">
          <div className="heatmap" aria-label="365日間の学習記録" role="list">
            {heatmapDays.map((day) => {
              const label = `${day.date}: ${day.studyCount} words studied`

              return (
                <span
                  aria-label={label}
                  className="heatmap-cell"
                  data-level={day.level}
                  key={day.date}
                  role="listitem"
                  title={label}
                />
              )
            })}
          </div>
        </div>
        <div className="heatmap-legend" aria-label="学習量の凡例">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              aria-hidden="true"
              className="heatmap-cell heatmap-cell--legend"
              data-level={level}
              key={level}
            />
          ))}
          <span>More</span>
        </div>
      </section>
    </div>
  )
}
