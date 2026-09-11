import { API_KEY, API_URL } from './config'

const url = API_URL
const key = API_KEY

function headers(extra = {}) {
  return {
    apikey: key,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  }
}

async function request(path, options = {}) {
  if (!url || !key) {
    return { data: null, error: { message: 'Missing API URL or key in .env' } }
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 15000)
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      method: options.method || 'GET',
      headers: headers(options.headers),
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })
    const text = await res.text()
    let payload = null
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        payload = text
      }
    }
    if (!res.ok) {
      const message = payload?.message || payload?.error_description || payload?.error || `Database error ${res.status}`
      return { data: null, error: { message } }
    }
    return { data: payload, error: null }
  } catch (err) {
    const message =
      err.name === 'AbortError'
        ? 'Could not reach the school database. Refresh and try again.'
        : err.message || 'Could not reach the school database.'
    return { data: null, error: { message } }
  } finally {
    clearTimeout(timer)
  }
}

export const rest = {
  get(table, query = '', options = {}) {
    return request(`${table}${query}`, options)
  },
  async getAll(table, query = '', pageSize = 1000) {
    const all = []
    let from = 0
    const join = query.includes('?') ? '&' : '?'
    while (from < 20000) {
      const res = await request(`${table}${query}${join}limit=${pageSize}&offset=${from}`)
      if (res.error) return res
      const rows = Array.isArray(res.data) ? res.data : []
      all.push(...rows)
      if (rows.length < pageSize) return { data: all, error: null }
      from += pageSize
    }
    return { data: all, error: null }
  },
  insert(table, body) {
    return request(table, { method: 'POST', body: Array.isArray(body) ? body : [body] })
  },
  patch(table, query, body) {
    return request(`${table}${query}`, { method: 'PATCH', body })
  },
  remove(table, query) {
    return request(`${table}${query}`, { method: 'DELETE' })
  },
}
