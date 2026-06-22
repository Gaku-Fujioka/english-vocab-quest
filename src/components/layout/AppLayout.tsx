import type { ReactNode } from 'react'
import { BottomNavigation } from './BottomNavigation'

export type AppTab = 'home' | 'study' | 'mypage' | 'settings'

const tabTitles: Record<AppTab, string> = {
  home: 'VocabMaster',
  study: '学習セッション',
  mypage: 'マイページ',
  settings: '設定',
}

type AppLayoutProps = {
  activeTab: AppTab
  children: ReactNode
  onTabChange: (tab: AppTab) => void
}

export function AppLayout({
  activeTab,
  children,
  onTabChange,
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand" aria-label="VocabMaster">
          <span className="app-header__mark">V</span>
          <span>{tabTitles[activeTab]}</span>
        </div>
        <button className="icon-button" type="button" aria-label="通知">
          <span aria-hidden="true">!</span>
        </button>
      </header>

      <main className="app-main">{children}</main>

      <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  )
}
