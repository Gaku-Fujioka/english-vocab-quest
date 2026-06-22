import { useState } from 'react'
import './App.css'
import { AppLayout, type AppTab } from './components/layout/AppLayout'
import { sampleWords } from './data/sampleWords'
import {
  getLearningStreak,
  getMasteredCount,
  mergeDailyLearningRecord,
} from './lib/progress'
import {
  applyRating,
  getDateKey,
  selectNewWords,
  selectReviewWords,
} from './lib/scheduler'
import {
  loadDailyRecords,
  loadLearningStates,
  loadSettings,
  loadOrSeedSampleWords,
  saveDailyRecords,
  saveLearningStates,
  saveSettings,
} from './lib/storage'
import { HomePage } from './pages/HomePage'
import { MyPage } from './pages/MyPage'
import { SettingsPage } from './pages/SettingsPage'
import { StudyPage } from './pages/StudyPage'
import type {
  LearningSession,
  NewWordMode,
  Rating,
  SessionPhase,
  WordLearningState,
} from './types/learning'
import type { AppSettings } from './types/settings'
import type { Word } from './types/word'

function getInitialSessionPhase(
  reviewWords: Word[],
  newWords: Word[],
): SessionPhase {
  if (reviewWords.length > 0) {
    return 'review'
  }

  if (newWords.length > 0) {
    return 'new'
  }

  return 'complete'
}

function createLearningSession(
  reviewWords: Word[],
  newWords: Word[],
): LearningSession {
  return {
    id: `${Date.now()}`,
    reviewWords,
    newWords,
    currentWordIndex: 0,
    isCurrentCardRevealed: false,
    phase: getInitialSessionPhase(reviewWords, newWords),
    completedReviewCount: 0,
    completedNewCount: 0,
    masteredIncrease: 0,
  }
}

function getCurrentSessionWords(session: LearningSession): Word[] {
  if (session.phase === 'review') {
    return session.reviewWords
  }

  if (session.phase === 'new') {
    return session.newWords
  }

  return []
}

function getCurrentSessionWord(session: LearningSession): Word | undefined {
  return getCurrentSessionWords(session)[session.currentWordIndex]
}

function upsertLearningState(
  learningStates: WordLearningState[],
  nextState: WordLearningState,
): WordLearningState[] {
  const stateExists = learningStates.some(
    (state) => state.wordId === nextState.wordId,
  )

  if (!stateExists) {
    return [...learningStates, nextState]
  }

  return learningStates.map((state) =>
    state.wordId === nextState.wordId ? nextState : state,
  )
}

function advanceSession(
  session: LearningSession,
  masteredIncrease: number,
): LearningSession {
  const completedReviewCount =
    session.phase === 'review'
      ? session.completedReviewCount + 1
      : session.completedReviewCount
  const completedNewCount =
    session.phase === 'new'
      ? session.completedNewCount + 1
      : session.completedNewCount
  const nextSession: LearningSession = {
    ...session,
    completedReviewCount,
    completedNewCount,
    masteredIncrease: session.masteredIncrease + masteredIncrease,
    isCurrentCardRevealed: false,
  }

  if (session.phase === 'review') {
    const nextReviewIndex = session.currentWordIndex + 1

    if (nextReviewIndex < session.reviewWords.length) {
      return {
        ...nextSession,
        currentWordIndex: nextReviewIndex,
      }
    }

    if (session.newWords.length > 0) {
      return {
        ...nextSession,
        phase: 'new',
        currentWordIndex: 0,
      }
    }

    return {
      ...nextSession,
      phase: 'complete',
      currentWordIndex: 0,
    }
  }

  if (session.phase === 'new') {
    const nextNewIndex = session.currentWordIndex + 1

    if (nextNewIndex < session.newWords.length) {
      return {
        ...nextSession,
        currentWordIndex: nextNewIndex,
      }
    }
  }

  return {
    ...nextSession,
    phase: 'complete',
    currentWordIndex: 0,
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [words] = useState(() => loadOrSeedSampleWords(sampleWords))
  const [learningStates, setLearningStates] = useState(() =>
    loadLearningStates(),
  )
  const [dailyRecords, setDailyRecords] = useState(() => loadDailyRecords())
  const [settings, setSettings] = useState(() => loadSettings())
  const [session, setSession] = useState<LearningSession | null>(null)

  const handleSettingsChange = (nextSettings: AppSettings) => {
    setSettings(nextSettings)
    saveSettings(nextSettings)
  }

  const handleStartStudy = (mode: NewWordMode) => {
    const today = getDateKey()
    const reviewWords = selectReviewWords(words, learningStates, today)
    const newWords = selectNewWords(words, learningStates, settings, mode)

    setSession(createLearningSession(reviewWords, newWords))
    setActiveTab('study')
  }

  const saveCompletedSessionRecord = (completedSession: LearningSession) => {
    setDailyRecords((currentRecords) => {
      const nextRecords = mergeDailyLearningRecord(currentRecords, {
        reviewCount: completedSession.completedReviewCount,
        newCount: completedSession.completedNewCount,
        masteredIncrease: completedSession.masteredIncrease,
      })

      saveDailyRecords(nextRecords)
      return nextRecords
    })
  }

  const handleRevealCurrentCard = () => {
    setSession((currentSession) => {
      if (currentSession === null || currentSession.phase === 'complete') {
        return currentSession
      }

      return {
        ...currentSession,
        isCurrentCardRevealed: true,
      }
    })
  }

  const handleRateCurrentWord = (rating: Rating) => {
    if (session === null || session.phase === 'complete') {
      return
    }

    const currentWord = getCurrentSessionWord(session)

    if (currentWord === undefined) {
      return
    }

    const previousState = learningStates.find(
      (state) => state.wordId === currentWord.id,
    )
    const nextState = applyRating(previousState, currentWord.id, rating)
    const nextLearningStates = upsertLearningState(learningStates, nextState)
    const masteredIncrease =
      previousState?.mastered === true || !nextState.mastered ? 0 : 1
    const nextSession = advanceSession(session, masteredIncrease)

    setLearningStates(nextLearningStates)
    saveLearningStates(nextLearningStates)
    setSession(nextSession)

    if (nextSession.phase === 'complete') {
      saveCompletedSessionRecord(nextSession)
    }
  }

  const handleReturnHome = () => {
    setSession(null)
    setActiveTab('home')
  }

  const masteredCount = getMasteredCount(learningStates)
  const currentStreak = getLearningStreak(dailyRecords)

  const currentPage = (() => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            dailyRecords={dailyRecords}
            learningStates={learningStates}
            onStartStudy={handleStartStudy}
            settings={settings}
            words={words}
          />
        )
      case 'study':
        return (
          <StudyPage
            currentStreak={currentStreak}
            learningStates={learningStates}
            onRate={handleRateCurrentWord}
            onReturnHome={handleReturnHome}
            onReveal={handleRevealCurrentCard}
            session={session}
            totalMasteredCount={masteredCount}
          />
        )
      case 'mypage':
        return (
          <MyPage
            dailyRecords={dailyRecords}
            learningStates={learningStates}
            settings={settings}
            words={words}
          />
        )
      case 'settings':
        return (
          <SettingsPage
            onSettingsChange={handleSettingsChange}
            settings={settings}
            wordCount={words.length}
          />
        )
    }
  })()

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {currentPage}
    </AppLayout>
  )
}

export default App
