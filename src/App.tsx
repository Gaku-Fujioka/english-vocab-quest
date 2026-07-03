import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import './App.css'
import { AppLayout, type AppTab } from './components/layout/AppLayout'
import { fixedVocabulary } from './data/fixedVocabulary'
import {
  getCloudSnapshot,
  getCurrentUser,
  saveCloudSnapshot,
  subscribeToAuthChanges,
} from './lib/cloudSync'
import {
  getLearningStreak,
  getMasteredCount,
  mergeDailyLearningRecord,
} from './lib/progress'
import {
  applyRating,
  getDateKey,
  selectCustomTestWords,
  selectNewWords,
  selectReviewWords,
} from './lib/scheduler'
import {
  loadActiveLearningSession,
  loadUserStorageSnapshot,
  hasUserStorageData,
  migrateLegacyStorageToUser,
  createResetSnapshot,
  removeActiveLearningSession,
  saveActiveLearningSession,
  saveAppStorageSnapshot,
  saveDailyRecords,
  saveLearningStates,
  saveSettings,
} from './lib/storage'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { MyPage } from './pages/MyPage'
import { SettingsPage } from './pages/SettingsPage'
import { StudyPage } from './pages/StudyPage'
import type { AppStorageSnapshot } from './lib/storage'
import type {
  CustomTestFilters,
  LearningSession,
  NewWordMode,
  Rating,
  SessionPhase,
  WordLearningState,
} from './types/learning'
import type { AppSettings } from './types/settings'
import type { Word } from './types/word'

const fixedVocabularyIds = new Set(fixedVocabulary.map((word) => word.id))

function normalizeSnapshot(snapshot: AppStorageSnapshot): AppStorageSnapshot {
  return {
    ...snapshot,
    words: fixedVocabulary,
    learningStates: snapshot.learningStates.filter((state) =>
      fixedVocabularyIds.has(state.wordId),
    ),
  }
}

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
    kind: 'daily',
    reviewWords,
    newWords,
    customWords: [],
    currentWordIndex: 0,
    isCurrentCardRevealed: false,
    phase: getInitialSessionPhase(reviewWords, newWords),
    completedReviewCount: 0,
    completedNewCount: 0,
    completedCustomCount: 0,
    completedCustomNewCount: 0,
    masteredIncrease: 0,
  }
}

function createCustomTestSession(customWords: Word[]): LearningSession {
  return {
    id: `${Date.now()}`,
    kind: 'custom',
    reviewWords: [],
    newWords: [],
    customWords,
    currentWordIndex: 0,
    isCurrentCardRevealed: false,
    phase: customWords.length > 0 ? 'custom' : 'complete',
    completedReviewCount: 0,
    completedNewCount: 0,
    completedCustomCount: 0,
    completedCustomNewCount: 0,
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

  if (session.phase === 'custom') {
    return session.customWords
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
  wasUnlearned: boolean,
): LearningSession {
  const completedReviewCount =
    session.phase === 'review'
      ? session.completedReviewCount + 1
      : session.completedReviewCount
  const completedNewCount =
    session.phase === 'new'
      ? session.completedNewCount + 1
      : session.completedNewCount
  const completedCustomCount =
    session.phase === 'custom'
      ? session.completedCustomCount + 1
      : session.completedCustomCount
  const completedCustomNewCount =
    session.phase === 'custom' && wasUnlearned
      ? session.completedCustomNewCount + 1
      : session.completedCustomNewCount
  const nextSession: LearningSession = {
    ...session,
    completedReviewCount,
    completedNewCount,
    completedCustomCount,
    completedCustomNewCount,
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

  if (session.phase === 'custom') {
    const nextCustomIndex = session.currentWordIndex + 1

    if (nextCustomIndex < session.customWords.length) {
      return {
        ...nextSession,
        currentWordIndex: nextCustomIndex,
      }
    }
  }

  return {
    ...nextSession,
    phase: 'complete',
    currentWordIndex: 0,
  }
}

function AuthenticatedApp({ user }: { user: User }) {
  const [initialUserData] = useState(() => {
    migrateLegacyStorageToUser(user.id)
    const hasLocalData = hasUserStorageData(user.id)

    return {
      hasLocalData,
      snapshot: normalizeSnapshot(
        loadUserStorageSnapshot(user.id, fixedVocabulary),
      ),
      session: loadActiveLearningSession(fixedVocabulary, user.id),
    }
  })
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const words = fixedVocabulary
  const [learningStates, setLearningStates] = useState(
    initialUserData.snapshot.learningStates,
  )
  const [dailyRecords, setDailyRecords] = useState(
    initialUserData.snapshot.dailyRecords,
  )
  const [settings, setSettings] = useState(initialUserData.snapshot.settings)
  const [session, setSession] = useState<LearningSession | null>(
    initialUserData.session,
  )
  const [isDataLoading, setIsDataLoading] = useState(true)

  const handleSettingsChange = (nextSettings: AppSettings) => {
    setSettings(nextSettings)
    saveSettings(nextSettings, user.id)
  }

  const replaceAppData = (snapshot: AppStorageSnapshot) => {
    const nextSnapshot = normalizeSnapshot(snapshot)

    setLearningStates(nextSnapshot.learningStates)
    setDailyRecords(snapshot.dailyRecords)
    setSettings(snapshot.settings)
    setSession(null)
    removeActiveLearningSession(user.id)
    saveAppStorageSnapshot(nextSnapshot, user.id)
  }

  useEffect(() => {
    let isCancelled = false

    const initializeData = async () => {
      if (initialUserData.hasLocalData) {
        const saveResult = await saveCloudSnapshot(initialUserData.snapshot)

        if (!saveResult.ok) {
          console.warn('初回クラウド保存に失敗しました。', saveResult.error)
        }

        if (!isCancelled) {
          setIsDataLoading(false)
        }
        return
      }

      const result = await getCloudSnapshot()

      if (isCancelled) {
        return
      }

      if (result.ok && result.data !== null) {
        const cloudSnapshot = normalizeSnapshot(result.data.snapshot)

        setLearningStates(cloudSnapshot.learningStates)
        setDailyRecords(cloudSnapshot.dailyRecords)
        setSettings(cloudSnapshot.settings)
        saveAppStorageSnapshot(cloudSnapshot, user.id)
      } else if (result.ok) {
        const saveResult = await saveCloudSnapshot(initialUserData.snapshot)

        if (!saveResult.ok) {
          console.warn('初回クラウド保存に失敗しました。', saveResult.error)
        }
      } else {
        console.warn(
          'クラウドデータを読み込めなかったため、端末データを使用します。',
          result.error,
        )
      }

      if (!isCancelled) {
        setIsDataLoading(false)
      }
    }

    void initializeData()

    return () => {
      isCancelled = true
    }
  }, [initialUserData.hasLocalData, initialUserData.snapshot, user.id])

  useEffect(() => {
    if (isDataLoading) {
      return
    }

    let isCancelled = false
    const timeoutId = window.setTimeout(() => {
      void saveCloudSnapshot({
        words,
        learningStates,
        dailyRecords,
        settings,
      }).then((result) => {
        if (!isCancelled && !result.ok) {
          console.warn('クラウド自動同期に失敗しました。', result.error)
        }
      })
    }, 800)

    return () => {
      isCancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [dailyRecords, isDataLoading, learningStates, settings, words])

  const handleResetAllData = () => {
    replaceAppData(createResetSnapshot(fixedVocabulary))
  }

  function saveCompletedSessionRecord(completedSession: LearningSession) {
    const reviewCount =
      completedSession.kind === 'custom'
        ? completedSession.completedCustomCount -
          completedSession.completedCustomNewCount
        : completedSession.completedReviewCount
    const newCount =
      completedSession.kind === 'custom'
        ? completedSession.completedCustomNewCount
        : completedSession.completedNewCount

    setDailyRecords((currentRecords) => {
      const nextRecords = mergeDailyLearningRecord(currentRecords, {
        reviewCount,
        newCount,
        masteredIncrease: completedSession.masteredIncrease,
      })

      saveDailyRecords(nextRecords, user.id)
      return nextRecords
    })
  }

  const finishPreviousSessionIfNeeded = (): boolean => {
    if (session === null || session.phase === 'complete') {
      return true
    }

    const shouldReplace = window.confirm(
      '保存中の学習があります。ここまでの結果を記録して、新しい学習を始めますか？',
    )

    if (!shouldReplace) {
      return false
    }

    saveCompletedSessionRecord(session)
    return true
  }

  const handleStartStudy = (mode: NewWordMode) => {
    if (!finishPreviousSessionIfNeeded()) {
      return
    }

    const today = getDateKey()
    const reviewWords = selectReviewWords(words, learningStates, today)
    const newWords = selectNewWords(words, learningStates, settings, mode)
    const nextSession = createLearningSession(reviewWords, newWords)

    setSession(nextSession)

    if (nextSession.phase === 'complete') {
      removeActiveLearningSession(user.id)
    } else {
      saveActiveLearningSession(nextSession, user.id)
    }

    setActiveTab('study')
  }

  const handleStartCustomTest = (filters: CustomTestFilters) => {
    if (!finishPreviousSessionIfNeeded()) {
      return 'cancelled' as const
    }

    const customWords = selectCustomTestWords(words, learningStates, filters)

    if (customWords.length === 0) {
      return 'empty' as const
    }

    const nextSession = createCustomTestSession(customWords)

    setSession(nextSession)
    saveActiveLearningSession(nextSession, user.id)
    setActiveTab('study')
    return 'started' as const
  }

  const handleRevealCurrentCard = () => {
    setSession((currentSession) => {
      if (currentSession === null || currentSession.phase === 'complete') {
        return currentSession
      }

      const nextSession = {
        ...currentSession,
        isCurrentCardRevealed: true,
      }

      saveActiveLearningSession(nextSession, user.id)
      return nextSession
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
    const nextSession = advanceSession(
      session,
      masteredIncrease,
      previousState === undefined,
    )

    setLearningStates(nextLearningStates)
    saveLearningStates(nextLearningStates, user.id)
    setSession(nextSession)

    if (nextSession.phase === 'complete') {
      removeActiveLearningSession(user.id)
      saveCompletedSessionRecord(nextSession)
    } else {
      saveActiveLearningSession(nextSession, user.id)
    }
  }

  const handleReturnHome = () => {
    setSession(null)
    removeActiveLearningSession(user.id)
    setActiveTab('home')
  }

  const handlePauseStudy = () => {
    if (session !== null && session.phase !== 'complete') {
      saveActiveLearningSession(session, user.id)
    }

    setActiveTab('home')
  }

  const handleEndCurrentSession = () => {
    if (session === null || session.phase === 'complete') {
      return
    }

    const shouldEnd = window.confirm(
      'ここまでの結果を記録して、このテストを終了しますか？',
    )

    if (!shouldEnd) {
      return
    }

    saveCompletedSessionRecord(session)
    setSession(null)
    removeActiveLearningSession(user.id)
    setActiveTab('home')
  }

  const handleResumeStudy = () => {
    if (session !== null && session.phase !== 'complete') {
      setActiveTab('study')
    }
  }

  const masteredCount = getMasteredCount(learningStates)
  const currentStreak = getLearningStreak(dailyRecords)

  if (isDataLoading) {
    return (
      <main className="auth-page">
        <p className="auth-loading" role="status">
          学習データを読み込んでいます…
        </p>
      </main>
    )
  }

  const currentPage = (() => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            activeSession={session?.phase === 'complete' ? null : session}
            dailyRecords={dailyRecords}
            learningStates={learningStates}
            onResumeStudy={handleResumeStudy}
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
            onEndSession={handleEndCurrentSession}
            onPause={handlePauseStudy}
            onRate={handleRateCurrentWord}
            onReturnHome={handleReturnHome}
            onReveal={handleRevealCurrentCard}
            onStartCustomTest={handleStartCustomTest}
            session={session}
            totalMasteredCount={masteredCount}
            words={words}
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
            appSnapshot={{
              words,
              learningStates,
              dailyRecords,
              settings,
            }}
            currentUser={user}
            onAppDataReplace={replaceAppData}
            onResetAllData={handleResetAllData}
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

type AuthState =
  | { status: 'loading'; user: null; error: null }
  | { status: 'unauthenticated'; user: null; error: string | null }
  | { status: 'authenticated'; user: User; error: null }

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    status: 'loading',
    user: null,
    error: null,
  })

  useEffect(() => {
    let isCancelled = false
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (isCancelled) {
        return
      }

      setAuthState(
        user === null
          ? { status: 'unauthenticated', user: null, error: null }
          : { status: 'authenticated', user, error: null },
      )
    })

    void getCurrentUser().then((result) => {
      if (isCancelled) {
        return
      }

      if (!result.ok) {
        setAuthState({
          status: 'unauthenticated',
          user: null,
          error: result.error,
        })
        return
      }

      setAuthState(
        result.data === null
          ? { status: 'unauthenticated', user: null, error: null }
          : { status: 'authenticated', user: result.data, error: null },
      )
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [])

  if (authState.status === 'loading') {
    return (
      <main className="auth-page">
        <p className="auth-loading" role="status">
          ログイン状態を確認しています…
        </p>
      </main>
    )
  }

  if (authState.status === 'unauthenticated') {
    return (
      <AuthPage
        initialError={authState.error}
        onAuthenticated={(user) =>
          setAuthState({ status: 'authenticated', user, error: null })
        }
      />
    )
  }

  return <AuthenticatedApp key={authState.user.id} user={authState.user} />
}

export default App
