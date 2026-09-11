const FORWARD_HEADERS = [
  'accept',
  'accept-profile',
  'content-profile',
  'content-type',
  'prefer',
  'range',
  'x-upsert',
]

function corsHeaders(request) {
  const origin = request.headers.get('origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD',
    'Access-Control-Allow-Headers':
      'authorization,apikey,content-type,prefer,range,accept,accept-profile,content-profile,x-client-info,x-supabase-api-version',
    'Access-Control-Expose-Headers': 'content-range,prefer',
    Vary: 'Origin',
  }
}

/**
 * Proxies /rest/v1/* (and rewritten paths) to Supabase PostgREST.
 * Frontends set VITE_SUPABASE_URL to this Vercel backend.
 */
export default {
  async fetch(request) {
    const cors = corsHeaders(request)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
    const supabaseKey = process.env.SUPABASE_ANON_KEY || ''

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({
          message: 'Server missing SUPABASE_URL or SUPABASE_ANON_KEY env vars.',
        }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    const incoming = new URL(request.url)
    // /api/rest/...  or  /rest/v1/... after rewrite
    let restPath = incoming.pathname
    if (restPath.startsWith('/api/rest/')) {
      restPath = restPath.slice('/api/rest/'.length)
    } else if (restPath.startsWith('/rest/v1/')) {
      restPath = restPath.slice('/rest/v1/'.length)
    } else if (restPath === '/api/rest' || restPath === '/rest/v1') {
      restPath = ''
    }

    const target = `${supabaseUrl}/rest/v1/${restPath}${incoming.search}`
    const headers = new Headers()
    for (const name of FORWARD_HEADERS) {
      const value = request.headers.get(name)
      if (value) headers.set(name, value)
    }
    headers.set('apikey', supabaseKey)
    headers.set('Authorization', `Bearer ${supabaseKey}`)

    const init = { method: request.method, headers }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.arrayBuffer()
    }

    try {
      const upstream = await fetch(target, init)
      const out = new Headers(cors)
      const contentType = upstream.headers.get('content-type')
      if (contentType) out.set('Content-Type', contentType)
      const contentRange = upstream.headers.get('content-range')
      if (contentRange) out.set('Content-Range', contentRange)
      const prefer = upstream.headers.get('preference-applied')
      if (prefer) out.set('Preference-Applied', prefer)

      return new Response(await upstream.arrayBuffer(), {
        status: upstream.status,
        headers: out,
      })
    } catch (err) {
      return new Response(
        JSON.stringify({ message: err.message || 'Upstream request failed.' }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }
  },
}
