import { useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail,
} from '../lib/cloudSync'
import { isSupabaseConfigured, supabaseConfigMessage } from '../lib/supabase'

type AuthMode = 'login' | 'signUp'

type AuthPageProps = {
  initialError?: string | null
  onAuthenticated: (user: User) => void
}

export function AuthPage({
  initialError = null,
  onAuthenticated,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(initialError)
  const [isBusy, setIsBusy] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (email.trim() === '' || password === '') {
      setMessage('メールアドレスとパスワードを入力してください。')
      return
    }

    setIsBusy(true)
    setMessage(null)

    if (mode === 'login') {
      const result = await signInWithEmail(email.trim(), password)

      if (!result.ok) {
        setMessage(result.error)
        setIsBusy(false)
        return
      }

      onAuthenticated(result.data)
      return
    }

    const result = await signUpWithEmail(email.trim(), password)

    if (!result.ok) {
      setMessage(result.error)
      setIsBusy(false)
      return
    }

    const userResult = await getCurrentUser()

    if (userResult.ok && userResult.data !== null) {
      onAuthenticated(userResult.data)
      return
    }

    setMessage('確認メールを送信しました。メール確認後にログインしてください。')
    setMode('login')
    setPassword('')
    setIsBusy(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand" aria-hidden="true">
          V
        </div>
        <div className="auth-heading">
          <p className="eyebrow">TOEIC Vocabulary Quest</p>
          <h1 id="auth-title">
            {mode === 'login' ? 'ログイン' : 'アカウント作成'}
          </h1>
          <p className="muted-text">
            学習データをあなたのアカウントに安全に保存します。
          </p>
        </div>

        {!isSupabaseConfigured ? (
          <p className="auth-message auth-message--error" role="alert">
            {supabaseConfigMessage}
          </p>
        ) : null}

        {message !== null ? (
          <p className="auth-message" role="status">
            {message}
          </p>
        ) : null}

        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            <span>メールアドレス</span>
            <input
              autoComplete="email"
              disabled={isBusy || !isSupabaseConfigured}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            <span>パスワード</span>
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={isBusy || !isSupabaseConfigured}
              minLength={6}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button
            className="primary-button"
            disabled={isBusy || !isSupabaseConfigured}
            type="submit"
          >
            {isBusy
              ? '処理中…'
              : mode === 'login'
                ? 'ログインする'
                : 'アカウントを作成する'}
          </button>
        </form>

        <button
          className="auth-mode-button"
          disabled={isBusy}
          onClick={() => {
            setMode((currentMode) =>
              currentMode === 'login' ? 'signUp' : 'login',
            )
            setMessage(null)
          }}
          type="button"
        >
          {mode === 'login'
            ? '初めての方はこちら'
            : 'アカウントをお持ちの方はこちら'}
        </button>
      </section>
    </main>
  )
}
