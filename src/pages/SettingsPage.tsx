import { useEffect, useState, type ChangeEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  getCloudSnapshot,
  restoreCloudSnapshot,
  saveCloudSnapshot,
  signOut,
} from '../lib/cloudSync'
import {
  downloadAppBackup,
  parseAppBackupJson,
} from '../lib/importExport'
import type { AppStorageSnapshot } from '../lib/storage'
import { isSupabaseConfigured, supabaseConfigMessage } from '../lib/supabase'
import type { AppSettings, TargetScore } from '../types/settings'
import { TARGET_SCORES } from '../types/settings'

type SettingsMessage = {
  type: 'success' | 'error' | 'info'
  text: string
}

type SettingsPageProps = {
  appSnapshot: AppStorageSnapshot
  currentUser: User
  onAppDataReplace: (snapshot: AppStorageSnapshot) => void
  onResetAllData: () => void
  onSettingsChange: (settings: AppSettings) => void
  settings: AppSettings
  wordCount: number
}

export function SettingsPage({
  appSnapshot,
  currentUser,
  onAppDataReplace,
  onResetAllData,
  onSettingsChange,
  settings,
  wordCount,
}: SettingsPageProps) {
  const [message, setMessage] = useState<SettingsMessage | null>(null)
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null)
  const [isCloudBusy, setIsCloudBusy] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    let shouldUpdate = true

    void getCloudSnapshot().then((snapshotResult) => {
      if (!shouldUpdate) {
        return
      }

      if (!snapshotResult.ok) {
        setCloudUpdatedAt(null)
        return
      }

      setCloudUpdatedAt(snapshotResult.data?.updatedAt ?? null)
    })

    return () => {
      shouldUpdate = false
    }
  }, [])

  const handleTargetScoreChange = (targetScore: TargetScore) => {
    onSettingsChange({
      ...settings,
      targetScore,
    })
    setMessage({
      type: 'success',
      text: `目標スコアを TOEIC ${targetScore} に更新しました。`,
    })
  }

  const handleCloudLogout = async () => {
    setIsCloudBusy(true)
    const signOutResult = await signOut()

    if (!signOutResult.ok) {
      setMessage({
        type: 'error',
        text: signOutResult.error,
      })
      setIsCloudBusy(false)
      return
    }

    setCloudUpdatedAt(null)
    setMessage({
      type: 'success',
      text: 'ログアウトしました。',
    })
    setIsCloudBusy(false)
  }

  const handleSaveToCloud = async () => {
    setIsCloudBusy(true)
    const saveResult = await saveCloudSnapshot(appSnapshot)

    if (!saveResult.ok) {
      setMessage({
        type: 'error',
        text: saveResult.error,
      })
      setIsCloudBusy(false)
      return
    }

    setCloudUpdatedAt(saveResult.data.updatedAt)
    setMessage({
      type: 'success',
      text: 'このブラウザのデータをクラウドに保存しました。',
    })
    setIsCloudBusy(false)
  }

  const handleRestoreFromCloud = async () => {
    setIsCloudBusy(true)
    const restoreResult = await restoreCloudSnapshot()

    if (!restoreResult.ok) {
      setMessage({
        type: 'error',
        text: restoreResult.error,
      })
      setIsCloudBusy(false)
      return
    }

    const shouldRestore = window.confirm(
      'クラウドから学習データと設定を復元します。固定語彙は変更されません。続行しますか？',
    )

    if (!shouldRestore) {
      setMessage({
        type: 'info',
        text: 'クラウド復元をキャンセルしました。',
      })
      setIsCloudBusy(false)
      return
    }

    onAppDataReplace(restoreResult.data.snapshot)
    setCloudUpdatedAt(restoreResult.data.updatedAt)
    setMessage({
      type: 'success',
      text: 'クラウドデータをこのブラウザに復元しました。',
    })
    setIsCloudBusy(false)
  }

  const handleJsonExport = () => {
    downloadAppBackup(appSnapshot)
    setMessage({
      type: 'success',
      text: 'バックアップJSONを書き出しました。',
    })
  }

  const handleJsonImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]

    if (file === undefined) {
      return
    }

    try {
      const importResult = parseAppBackupJson(await file.text())

      if (!importResult.ok) {
        setMessage({
          type: 'error',
          text: importResult.error,
        })
        return
      }

      const shouldReplace = window.confirm(
        'バックアップJSONからアプリデータを復元します。' +
          `\n学習状態: ${importResult.snapshot.learningStates.length}件` +
          `\n学習記録: ${importResult.snapshot.dailyRecords.length}件` +
          '\n\n固定語彙は変更せず、学習データを置き換えます。続行しますか？',
      )

      if (!shouldReplace) {
        setMessage({
          type: 'info',
          text: 'JSONインポートをキャンセルしました。',
        })
        return
      }

      onAppDataReplace(importResult.snapshot)
      setMessage({
        type: 'success',
        text: 'バックアップJSONから復元しました。',
      })
    } catch {
      setMessage({
        type: 'error',
        text: 'JSONファイルを読み込めませんでした。',
      })
    } finally {
      input.value = ''
    }
  }

  const handleResetAllData = () => {
    const shouldReset = window.confirm(
      '学習状態、学習記録、設定をリセットします。固定語彙は変更されません。続行しますか？',
    )

    if (!shouldReset) {
      setMessage({
        type: 'info',
        text: 'リセットをキャンセルしました。',
      })
      return
    }

    onResetAllData()
    setMessage({
      type: 'success',
      text: '学習データと設定をリセットしました。固定語彙は維持されます。',
    })
  }

  const formattedCloudUpdatedAt =
    cloudUpdatedAt === null
      ? 'Not saved yet'
      : new Intl.DateTimeFormat(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(cloudUpdatedAt))

  return (
    <div className="page page-settings">
      <section className="settings-heading">
        <h1>設定</h1>
        <p className="muted-text">学習目標とデータ管理</p>
        {message !== null ? (
          <p
            className={`settings-message settings-message--${message.type}`}
            role={message.type === 'error' ? 'alert' : 'status'}
          >
            {message.text}
          </p>
        ) : null}
      </section>

      <section className="panel settings-section">
        <div className="section-heading">
          <h2>Goal Settings</h2>
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

      <section className="panel settings-section">
        <div className="section-heading">
          <h2>Backup / Restore</h2>
          <span>JSON</span>
        </div>
        <div className="action-list">
          <button className="action-row" onClick={handleJsonExport} type="button">
            <span>データをエクスポート</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <label className="file-picker">
          <span>
            <strong>JSONバックアップをインポート</strong>
            <small>有効なバックアップだけ復元できます。</small>
          </span>
          <input
            accept=".json,application/json"
            onChange={handleJsonImport}
            type="file"
          />
        </label>
      </section>

      <section className="panel settings-section">
        <div className="section-heading">
          <h2>Cloud Sync</h2>
          <span>{isSupabaseConfigured ? 'Configured' : 'Not configured'}</span>
        </div>

        {!isSupabaseConfigured ? (
          <p className="settings-message settings-message--info" role="status">
            Supabase is not configured. {supabaseConfigMessage}
          </p>
        ) : (
          <>
            <div className="cloud-status-grid">
              <article>
                <span>Account</span>
                <strong>{currentUser.email ?? currentUser.id}</strong>
              </article>
              <article>
                <span>Last cloud save</span>
                <strong>{formattedCloudUpdatedAt}</strong>
              </article>
            </div>

            <div className="cloud-actions">
              <p className="cloud-warning">
                学習データは自動同期されます。復元すると、この端末の学習データと設定が置き換わります。
              </p>
              <button
                className="primary-button"
                disabled={isCloudBusy}
                onClick={() => void handleSaveToCloud()}
                type="button"
              >
                今すぐクラウドへ保存
              </button>
              <button
                className="secondary-button"
                disabled={isCloudBusy}
                onClick={() => void handleRestoreFromCloud()}
                type="button"
              >
                クラウドデータを復元
              </button>
              <button
                className="action-row action-row--standalone"
                disabled={isCloudBusy}
                onClick={() => void handleCloudLogout()}
                type="button"
              >
                <span>ログアウト</span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </>
        )}
      </section>

      <section className="danger-panel">
        <div>
          <h2>Danger Zone</h2>
          <p className="muted-text">
            固定語彙は維持したまま、学習データと設定を初期化します。
          </p>
        </div>
        <button className="danger-button" onClick={handleResetAllData} type="button">
          全データをリセット
        </button>
      </section>
    </div>
  )
}
