import { useState } from 'react'
import {
  getDailyCompletedCount,
  getLearningStreak,
  getMasteredCount,
  getMasteryPercent,
  getTodayProgressPercent,
  getTodayRecord,
} from '../lib/progress'
import {
  getDateKey,
  NEW_WORD_MODE_COUNTS,
  selectReviewWords,
} from '../lib/scheduler'
import type {
  DailyLearningRecord,
  LearningSession,
  NewWordMode,
  WordLearningState,
} from '../types/learning'
import type { AppSettings } from '../types/settings'
import type { Word } from '../types/word'

type HomePageProps = {
  activeSession: LearningSession | null
  dailyRecords: DailyLearningRecord[]
  learningStates: WordLearningState[]
  onResumeStudy: () => void
  onStartStudy: (mode: NewWordMode) => void
  settings: AppSettings
  words: Word[]
}

const newWordModeOptions = [
  {
    mode: 'skip',
    label: 'Skip',
    description: '復習だけ',
  },
  {
    mode: 'quick',
    label: 'Quick',
    description: '軽めに追加',
  },
  {
    mode: 'normal',
    label: 'Normal',
    description: 'いつもの量',
  },
  {
    mode: 'intensive',
    label: 'Intensive',
    description: 'しっかり追加',
  },
] satisfies {
  mode: NewWordMode
  label: string
  description: string
}[]

export function HomePage({
  activeSession,
  dailyRecords,
  learningStates,
  onResumeStudy,
  onStartStudy,
  settings,
  words,
}: HomePageProps) {
  const [isStartPanelOpen, setIsStartPanelOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<NewWordMode>('normal')
  const today = getDateKey()
  const reviewCount = selectReviewWords(words, learningStates, today).length
  const masteredCount = getMasteredCount(learningStates)
  const masteryPercent = getMasteryPercent(masteredCount, words.length)
  const todayRecord = getTodayRecord(dailyRecords, today)
  const completedTodayCount = getDailyCompletedCount(todayRecord)
  const todayProgressPercent = getTodayProgressPercent(
    dailyRecords,
    reviewCount,
    today,
  )
  const currentStreak = getLearningStreak(dailyRecords, today)
  const activeSessionCompletedCount =
    activeSession?.kind === 'custom'
      ? activeSession.completedCustomCount
      : (activeSession?.completedReviewCount ?? 0) +
        (activeSession?.completedNewCount ?? 0)
  const activeSessionWordCount =
    activeSession?.kind === 'custom'
      ? activeSession.customWords.length
      : (activeSession?.reviewWords.length ?? 0) +
        (activeSession?.newWords.length ?? 0)

  const handleConfirmStart = () => {
    setIsStartPanelOpen(false)
    onStartStudy(selectedMode)
  }

  return (
    <div className="page page-home">
      <section className="home-hero">
        <div>
          <p className="eyebrow">おかえりなさい!</p>
          <h1>今日も単語を積み上げよう</h1>
          <p className="muted-text">目標 TOEIC {settings.targetScore}</p>
        </div>
        <div className="streak-pill">
          <strong>{currentStreak}日</strong>
          <span>連続</span>
        </div>
      </section>

      {activeSession !== null ? (
        <section className="panel resume-panel" aria-labelledby="resume-title">
          <div>
            <p className="eyebrow">
              {activeSession.kind === 'custom'
                ? '保存中のランダムテスト'
                : '保存中の学習'}
            </p>
            <h2 id="resume-title">前回の続きから再開できます</h2>
          </div>
          <div
            aria-label={`学習進捗 ${activeSessionCompletedCount} / ${activeSessionWordCount}`}
            className="progress-track progress-track--thin"
          >
            <span
              style={{
                width: `${
                  activeSessionWordCount === 0
                    ? 0
                    : Math.round(
                        (activeSessionCompletedCount / activeSessionWordCount) *
                          100,
                      )
                }%`,
              }}
            />
          </div>
          <p className="muted-text">
            {activeSessionCompletedCount} / {activeSessionWordCount}語 完了
          </p>
          <button className="primary-button" onClick={onResumeStudy} type="button">
            学習を再開する
          </button>
        </section>
      ) : null}

      <section className="panel progress-panel" aria-labelledby="today-progress">
        <div className="section-heading">
          <h2 id="today-progress">今日の進捗</h2>
          <strong>{todayProgressPercent}%</strong>
        </div>
        <div
          className="progress-track"
          aria-label={`今日の進捗 ${todayProgressPercent}%`}
        >
          <span style={{ width: `${todayProgressPercent}%` }} />
        </div>
        <p className="panel-note">
          完了 {completedTodayCount}語 / 復習待ち {reviewCount}語
        </p>
        <button
          className="primary-button"
          onClick={() => setIsStartPanelOpen(true)}
          type="button"
        >
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

      {isStartPanelOpen ? (
        <div className="start-panel-backdrop">
          <section
            aria-labelledby="start-panel-title"
            aria-modal="true"
            className="start-panel"
            role="dialog"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">今日のセッション</p>
                <h2 id="start-panel-title">学習内容を選ぶ</h2>
              </div>
              <strong>復習 {reviewCount}語</strong>
            </div>

            <div className="mode-list" aria-label="新しい単語の追加量">
              {newWordModeOptions.map((option) => {
                const isSelected = selectedMode === option.mode
                const newWordCount = NEW_WORD_MODE_COUNTS[option.mode]

                return (
                  <button
                    aria-pressed={isSelected}
                    className="mode-option"
                    data-selected={isSelected}
                    key={option.mode}
                    onClick={() => setSelectedMode(option.mode)}
                    type="button"
                  >
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                    <span>{newWordCount}語</span>
                  </button>
                )
              })}
            </div>

            <div className="start-panel__actions">
              <button
                className="secondary-button"
                onClick={() => setIsStartPanelOpen(false)}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="primary-button"
                onClick={handleConfirmStart}
                type="button"
              >
                この内容で始める
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
