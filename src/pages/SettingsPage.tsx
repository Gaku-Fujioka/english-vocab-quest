import type { AppSettings, TargetScore } from '../types/settings'
import { TARGET_SCORES } from '../types/settings'

type SettingsPageProps = {
  onSettingsChange: (settings: AppSettings) => void
  settings: AppSettings
  wordCount: number
}

export function SettingsPage({
  onSettingsChange,
  settings,
  wordCount,
}: SettingsPageProps) {
  const handleTargetScoreChange = (targetScore: TargetScore) => {
    onSettingsChange({
      ...settings,
      targetScore,
    })
  }

  return (
    <div className="page page-settings">
      <section className="settings-heading">
        <h1>設定</h1>
        <p className="muted-text">学習目標とデータ管理</p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>目標スコア</h2>
          <span>{wordCount} words</span>
        </div>
        <div className="option-list">
          {TARGET_SCORES.map((targetScore) => {
            const isSelected = targetScore === settings.targetScore

            return (
              <button
                aria-pressed={isSelected}
                className="option-row"
                key={targetScore}
                onClick={() => handleTargetScoreChange(targetScore)}
                type="button"
              >
                <span>TOEIC {targetScore}</span>
                <span className="radio-dot" data-selected={isSelected} />
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <h2>データ管理</h2>
        <div className="action-list">
          <button
            aria-label="CSVインポートは後続マイルストーンで実装します"
            className="action-row"
            disabled
            type="button"
          >
            CSVインポート
          </button>
          <button
            aria-label="JSONエクスポートは後続マイルストーンで実装します"
            className="action-row"
            disabled
            type="button"
          >
            JSONエクスポート
          </button>
          <button
            aria-label="JSONインポートは後続マイルストーンで実装します"
            className="action-row"
            disabled
            type="button"
          >
            JSONインポート
          </button>
        </div>
      </section>

      <section className="danger-panel">
        <h2>危険な操作</h2>
        <button className="danger-button" disabled type="button">
          全データをリセット
        </button>
      </section>
    </div>
  )
}
