import type { User } from '@supabase/supabase-js'
import { validateAppStorageSnapshot } from './importExport'
import type { AppStorageSnapshot } from './storage'
import { isSupabaseConfigured, supabase } from './supabase'

type CloudSyncResult<T> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: string
    }

export type CloudSnapshot = {
  snapshot: AppStorageSnapshot
  updatedAt: string
}

export function subscribeToAuthChanges(
  onUserChange: (user: User | null) => void,
): () => void {
  if (!isSupabaseConfigured || supabase === null) {
    onUserChange(null)
    return () => undefined
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onUserChange(session?.user ?? null)
  })

  return () => data.subscription.unsubscribe()
}

function getMissingConfigError(): CloudSyncResult<never> {
  return {
    ok: false,
    error: 'Supabase is not configured.',
  }
}

export async function getCurrentUser(): Promise<CloudSyncResult<User | null>> {
  if (!isSupabaseConfigured || supabase === null) {
    return getMissingConfigError()
  }

  const { data, error } = await supabase.auth.getSession()

  if (error !== null) {
    return {
      ok: false,
      error: error.message,
    }
  }

  return {
    ok: true,
    data: data.session?.user ?? null,
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<CloudSyncResult<User | null>> {
  if (!isSupabaseConfigured || supabase === null) {
    return getMissingConfigError()
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error !== null) {
    return {
      ok: false,
      error: error.message,
    }
  }

  return {
    ok: true,
    data: data.user,
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<CloudSyncResult<User>> {
  if (!isSupabaseConfigured || supabase === null) {
    return getMissingConfigError()
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error !== null) {
    return {
      ok: false,
      error: error.message,
    }
  }

  if (data.user === null) {
    return {
      ok: false,
      error: 'Login succeeded, but no user session was returned.',
    }
  }

  return {
    ok: true,
    data: data.user,
  }
}

export async function signOut(): Promise<CloudSyncResult<null>> {
  if (!isSupabaseConfigured || supabase === null) {
    return getMissingConfigError()
  }

  const { error } = await supabase.auth.signOut()

  if (error !== null) {
    return {
      ok: false,
      error: error.message,
    }
  }

  return {
    ok: true,
    data: null,
  }
}

export async function getCloudSnapshot(): Promise<
  CloudSyncResult<CloudSnapshot | null>
> {
  if (!isSupabaseConfigured || supabase === null) {
    return getMissingConfigError()
  }

  const userResult = await getCurrentUser()

  if (!userResult.ok) {
    return userResult
  }

  if (userResult.data === null) {
    return {
      ok: false,
      error: 'Login is required for cloud sync.',
    }
  }

  const { data, error } = await supabase
    .from('app_snapshots')
    .select('data, updated_at')
    .eq('user_id', userResult.data.id)
    .maybeSingle()

  if (error !== null) {
    return {
      ok: false,
      error: error.message,
    }
  }

  if (data === null) {
    return {
      ok: true,
      data: null,
    }
  }

  const validationResult = validateAppStorageSnapshot(data.data)

  if (!validationResult.ok) {
    return {
      ok: false,
      error: validationResult.error,
    }
  }

  return {
    ok: true,
    data: {
      snapshot: validationResult.snapshot,
      updatedAt: data.updated_at,
    },
  }
}

export async function saveCloudSnapshot(
  snapshot: AppStorageSnapshot,
): Promise<CloudSyncResult<{ updatedAt: string }>> {
  if (!isSupabaseConfigured || supabase === null) {
    return getMissingConfigError()
  }

  const userResult = await getCurrentUser()

  if (!userResult.ok) {
    return userResult
  }

  if (userResult.data === null) {
    return {
      ok: false,
      error: 'Login is required for cloud sync.',
    }
  }

  const { data, error } = await supabase
    .from('app_snapshots')
    .upsert(
      {
        user_id: userResult.data.id,
        data: snapshot,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      },
    )
    .select('updated_at')
    .single()

  if (error !== null) {
    return {
      ok: false,
      error: error.message,
    }
  }

  return {
    ok: true,
    data: {
      updatedAt: data.updated_at,
    },
  }
}

export async function restoreCloudSnapshot(): Promise<
  CloudSyncResult<CloudSnapshot>
> {
  const snapshotResult = await getCloudSnapshot()

  if (!snapshotResult.ok) {
    return snapshotResult
  }

  if (snapshotResult.data === null) {
    return {
      ok: false,
      error: 'No cloud snapshot was found for this user.',
    }
  }

  return {
    ok: true,
    data: snapshotResult.data,
  }
}
