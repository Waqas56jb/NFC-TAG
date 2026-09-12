import { createClient } from '@supabase/supabase-js'
import { API_KEY, API_URL } from './config'
import { createDesk } from './desk'
import { createHub } from './hub'
import { createNftagApi } from './nfctagApi'
import { rest } from './rest'

const url = API_URL
const key = API_KEY

export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    })
  : null

export const api = createNftagApi(supabase)
export const hub = createHub(rest)
export const desk = createDesk(rest)
