import { API_KEY, API_URL } from './config'

const url = API_URL
const key = API_KEY

function headers(extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  }
}

function errorMessage(payload, status) {
  if (payload && typeof payload === 'object') {
    return payload.message || payload.error_description || payload.error || `Database error ${status}`
  }
  const text = String(payload || '').trim()
  if (/gateway timeout/i.test(text) || status === 504) {
    return 'School server is busy (timeout). Tap Try again in a few seconds.'
  }
  if (/bad gateway|service unavailable/i.test(text) || status === 502 || status === 503) {
    return 'School server is waking up. Tap Try again.'
  }
  if (/failed to fetch/i.test(text)) {
    return 'Could not reach the school database. Check your connection and try again.'
  }
  if (text && text.length < 180 && !text.startsWith('<')) return text
  return `Database error ${status}`
}

function shouldRetry(status, err) {
  if (err?.name === 'AbortError') return true
  if (err && /failed to fetch|networkerror|load failed/i.test(err.message || '')) return true
  return status === 502 || status === 503 || status === 504 || status === 429
}

async function requestOnce(path, options = {}) {
  if (!url || !key) {
    return { data: null, error: { message: 'Missing API URL or key in .env' }, status: 0 }
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 45000)
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
      return { data: null, error: { message: errorMessage(payload, res.status) }, status: res.status }
    }
    return { data: payload, error: null, status: res.status }
  } catch (err) {
    const raw = err.message || 'Could not reach the school database.'
    const message =
      err.name === 'AbortError'
        ? 'Could not reach the school database. Refresh and try again.'
        : errorMessage(raw, 0)
    return { data: null, error: { message }, status: 0, err }
  } finally {
    clearTimeout(timer)
  }
}

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const retries = options.retries ?? (method === 'GET' || method === 'HEAD' ? 2 : 1)
  let last = null
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    last = await requestOnce(path, options)
    if (!last.error) return { data: last.data, error: null }
    if (attempt < retries && shouldRetry(last.status, last.err)) {
      await new Promise((r) => setTimeout(r, 350 * (attempt + 1)))
      continue
    }
    return { data: null, error: last.error }
  }
  return { data: null, error: last?.error || { message: 'Request failed.' } }
}

export const rest = {
  get(table, query = '', options = {}) {
    return request(`${table}${query}`, options)
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
