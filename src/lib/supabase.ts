import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function normalizeEnvValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim().replace(/^['"]|['"]$/g, '')

  return trimmedValue.length > 0 ? trimmedValue : null
}

function normalizeSupabaseUrl(value: unknown): string | null {
  const envValue = normalizeEnvValue(value)

  if (envValue === null) {
    return null
  }

  const urlWithProtocol = /^https?:\/\//.test(envValue)
    ? envValue
    : `https://${envValue}`

  try {
    const parsedUrl = new URL(urlWithProtocol)

    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return null
    }

    return parsedUrl.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl)
const supabaseAnonKey = normalizeEnvValue(rawSupabaseAnonKey)

export const isSupabaseConfigured =
  supabaseUrl !== null && supabaseAnonKey !== null

export const supabaseConfigMessage = isSupabaseConfigured
  ? 'Supabase is configured.'
  : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable cloud sync.'

export const supabase = supabaseUrl !== null && supabaseAnonKey !== null
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
