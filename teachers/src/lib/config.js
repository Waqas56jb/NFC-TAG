/** Deployed NFC-TAG API (Vercel). Overrides any direct Supabase host. */
export const API_URL = (
  import.meta.env.VITE_API_URL ||
  'https://nfc-server-gamma.vercel.app'
).replace(/\/$/, '')

export const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
