import { useState } from 'react'
import './App.css'
import { AppLayout, type AppTab } from './components/layout/AppLayout'
import { sampleWords } from './data/sampleWords'
import {
  loadDailyRecords,
  loadLearningStates,
  loadSettings,
  loadOrSeedSampleWords,
  saveSettings,
} from './lib/storage'
import { HomePage } from './pages/HomePage'
import { MyPage } from './pages/MyPage'
import { SettingsPage } from './pages/SettingsPage'
import { StudyPage } from './pages/StudyPage'
import type { AppSettings } from './types/settings'

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [words] = useState(() => loadOrSeedSampleWords(sampleWords))
  const [learningStates] = useState(() => loadLearningStates())
  const [dailyRecords] = useState(() => loadDailyRecords())
  const [settings, setSettings] = useState(() => loadSettings())

  const handleSettingsChange = (nextSettings: AppSettings) => {
    setSettings(nextSettings)
    saveSettings(nextSettings)
  }

  const currentPage = (() => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            learningStates={learningStates}
            onStartStudy={() => setActiveTab('study')}
            settings={settings}
            words={words}
          />
        )
      case 'study':
        return <StudyPage word={words[0]} />
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
