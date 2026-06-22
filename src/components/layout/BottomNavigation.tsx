import type { AppTab } from './AppLayout'

type NavigationItem = {
  tab: AppTab
  label: string
}

const navigationItems = [
  { tab: 'home', label: 'ホーム' },
  { tab: 'study', label: '学習' },
  { tab: 'mypage', label: 'マイページ' },
  { tab: 'settings', label: '設定' },
] satisfies NavigationItem[]

type BottomNavigationProps = {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

function TabIcon({ tab }: { tab: AppTab }) {
  switch (tab) {
    case 'home':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4z" />
        </svg>
      )
    case 'study':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H20v16H8.5A3.5 3.5 0 0 0 5 21.5z" />
          <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H9v16h-.5A3.5 3.5 0 0 0 5 21.5z" />
        </svg>
      )
    case 'mypage':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0z" />
        </svg>
      )
    case 'settings':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M13.4 3 14 5.5a7 7 0 0 1 1.4.6l2.2-1.3 1.4 2.4-1.9 1.7a7 7 0 0 1 .1 1.6l2.2 1.3-1.4 2.4-2.4-.8a7 7 0 0 1-1.3.8L13.4 17h-2.8L10 14.5a7 7 0 0 1-1.4-.6l-2.2 1.3L5 12.8l1.9-1.7a7 7 0 0 1-.1-1.6L4.6 8.2 6 5.8l2.4.8a7 7 0 0 1 1.3-.8L10.6 3z" />
          <path d="M12 12.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z" />
        </svg>
      )
  }
}

export function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  return (
    <nav className="bottom-navigation" aria-label="Primary navigation">
      {navigationItems.map((item) => {
        const isActive = item.tab === activeTab

        return (
          <button
            aria-current={isActive ? 'page' : undefined}
            className="bottom-navigation__item"
            data-active={isActive}
            key={item.tab}
            onClick={() => onTabChange(item.tab)}
            type="button"
          >
            <span className="bottom-navigation__icon">
              <TabIcon tab={item.tab} />
            </span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
