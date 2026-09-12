/** School database host — prefer direct Supabase (stable). Vercel proxy is optional fallback. */
export const API_URL = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://swcagtkcxyqxdizeipfz.supabase.co'
).replace(/\/$/, '')

export const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
