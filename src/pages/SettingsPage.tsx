import { useState, type ChangeEvent } from 'react'
import {
  downloadAppBackup,
  parseAppBackupJson,
  parseVocabularyCsv,
  type VocabularyCsvImportResult,
} from '../lib/importExport'
import type { AppStorageSnapshot } from '../lib/storage'
import type { AppSettings, TargetScore } from '../types/settings'
import { TARGET_SCORES } from '../types/settings'
import type { Word } from '../types/word'

type SettingsMessage = {
  type: 'success' | 'error' | 'info'
  text: string
}

type SettingsPageProps = {
  appSnapshot: AppStorageSnapshot
  onAppDataReplace: (snapshot: AppStorageSnapshot) => void
  onResetAllData: () => void
  onSettingsChange: (settings: AppSettings) => void
  onVocabularyReplace: (words: Word[]) => void
  settings: AppSettings
  wordCount: number
}

type CsvPreview = Extract<VocabularyCsvImportResult, { ok: true }> & {
  fileName: string
}

export function SettingsPage({
  appSnapshot,
  onAppDataReplace,
  onResetAllData,
  onSettingsChange,
  onVocabularyReplace,
  settings,
  wordCount,
}: SettingsPageProps) {
  const [message, setMessage] = useState<SettingsMessage | null>(null)
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null)

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

  const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]

    if (file === undefined) {
      return
    }

    try {
      const importResult = parseVocabularyCsv(await file.text())

      if (!importResult.ok) {
        setCsvPreview(null)
        setMessage({
          type: 'error',
          text: importResult.error,
        })
        return
      }

      if (importResult.importedCount === 0) {
        setCsvPreview(null)
        setMessage({
          type: 'error',
          text: `有効な単語がありませんでした。スキップ: ${importResult.skippedCount}行`,
        })
        return
      }

      setCsvPreview({
        ...importResult,
        fileName: file.name,
      })
      setMessage({
        type: 'info',
        text: 'CSVを解析しました。プレビューを確認してから取り込んでください。',
      })
    } catch {
      setCsvPreview(null)
      setMessage({
        type: 'error',
        text: 'CSVファイルを読み込めませんでした。',
      })
    } finally {
      input.value = ''
    }
  }

  const handleConfirmCsvImport = () => {
    if (csvPreview === null) {
      return
    }

    onVocabularyReplace(csvPreview.words)
    setMessage({
      type: 'success',
      text: `${csvPreview.importedCount}語をインポートしました。スキップ: ${csvPreview.skippedCount}行`,
    })
    setCsvPreview(null)
  }

  const handleCancelCsvImport = () => {
    setCsvPreview(null)
    setMessage({
      type: 'info',
      text: 'CSVインポートをキャンセルしました。',
    })
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
          `\n単語: ${importResult.snapshot.words.length}語` +
          `\n学習状態: ${importResult.snapshot.learningStates.length}件` +
          `\n学習記録: ${importResult.snapshot.dailyRecords.length}件` +
          '\n\n現在のデータは置き換えられます。続行しますか？',
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
      '全データをリセットします。単語、学習状態、学習記録、設定が初期化されます。続行しますか？',
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
      text: '全データをリセットし、サンプル単語を再登録しました。',
    })
  }

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
          <h2>Vocabulary Import</h2>
          <span>CSV</span>
        </div>
        <p className="muted-text">
          必須カラム: word, meaning, partOfSpeech, section
        </p>
        <label className="file-picker">
          <span>
            <strong>CSVファイルを選択</strong>
            <small>既存の単語と学習記録は確認後に置き換えます。</small>
          </span>
          <input
            accept=".csv,text/csv"
            onChange={handleCsvImport}
            type="file"
          />
        </label>

        {csvPreview !== null ? (
          <section className="import-preview" aria-labelledby="csv-preview-title">
            <div>
              <p className="eyebrow">Import Preview</p>
              <h3 id="csv-preview-title">{csvPreview.fileName}</h3>
            </div>

            <div className="import-preview__metrics" aria-label="CSV解析結果">
              <article>
                <span>Valid</span>
                <strong>{csvPreview.importedCount}</strong>
              </article>
              <article>
                <span>Skipped</span>
                <strong>{csvPreview.skippedCount}</strong>
              </article>
              <article>
                <span>Duplicates</span>
                <strong>{csvPreview.duplicateCount}</strong>
              </article>
            </div>

            <div className="section-count-grid" aria-label="セクション別件数">
              {(['600', '700', '850', '950'] as const).map((section) => (
                <article key={section}>
                  <span>{section}</span>
                  <strong>{csvPreview.sectionCounts[section]}</strong>
                </article>
              ))}
            </div>

            <div className="preview-table-wrap">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>word</th>
                    <th>meaning</th>
                    <th>partOfSpeech</th>
                    <th>section</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.words.slice(0, 10).map((word) => (
                    <tr key={word.id}>
                      <td>{word.word}</td>
                      <td>{word.meaning}</td>
                      <td>{word.partOfSpeech}</td>
                      <td>{word.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="import-warning">
              Importing vocabulary will replace the current vocabulary list and
              reset learning states and daily records.
            </p>

            <div className="import-preview__actions">
              <button
                className="secondary-button"
                onClick={handleCancelCsvImport}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="danger-button"
                onClick={handleConfirmCsvImport}
                type="button"
              >
                Replace vocabulary and reset progress
              </button>
            </div>
          </section>
        ) : null}
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

      <section className="danger-panel">
        <div>
          <h2>Danger Zone</h2>
          <p className="muted-text">初期状態に戻してサンプル単語を再登録します。</p>
        </div>
        <button className="danger-button" onClick={handleResetAllData} type="button">
          全データをリセット
        </button>
      </section>
    </div>
  )
}
