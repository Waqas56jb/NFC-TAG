import { createClient } from '@supabase/supabase-js'
import { createDesk } from './desk'
import { createHub } from './hub'
import { createNftagApi } from './nfctagApi'
import { rest } from './rest'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { apikey: key },
        fetch: (input, init = {}) => {
          const headers = new Headers(init.headers || {})
          headers.set('apikey', key)
          const auth = headers.get('Authorization') || ''
          if (auth.includes('sb_publishable_') || auth === `Bearer ${key}`) {
            headers.delete('Authorization')
          }
          return fetch(input, { ...init, headers })
        },
      },
    })
  : null

export const api = createNftagApi(supabase)
export const hub = createHub(rest)
export const desk = createDesk(rest)
