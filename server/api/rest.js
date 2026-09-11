const FORWARD_HEADERS = [
  'accept',
  'accept-profile',
  'content-profile',
  'content-type',
  'prefer',
  'range',
  'x-upsert',
]

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': !origin || origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD',
    'Access-Control-Allow-Headers':
      'authorization,apikey,content-type,prefer,range,accept,accept-profile,content-profile,x-client-info,x-supabase-api-version',
    'Access-Control-Expose-Headers': 'content-range,prefer',
    Vary: 'Origin',
  }
}

function readBody(req) {
  if (['GET', 'HEAD'].includes(req.method)) return undefined
  if (req.body === undefined || req.body === null) return undefined
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) return req.body
  return JSON.stringify(req.body)
}

/**
 * Proxies /rest/v1/:path* → Supabase (rewrite in vercel.json).
 */
export default async function handler(req, res) {
  Object.entries(cors(req.headers.origin)).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const supabaseKey = process.env.SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ message: 'Server missing SUPABASE_URL or SUPABASE_ANON_KEY env vars.' })
    return
  }

  let restPath = req.query.path
  if (Array.isArray(restPath)) restPath = restPath.filter(Boolean).join('/')
  restPath = typeof restPath === 'string' ? restPath.replace(/^\/+/, '') : ''

  if (!restPath) {
    res.status(400).json({ message: 'Missing /rest/v1 table path.' })
    return
  }

  // Preserve original query string except our rewrite `path` param.
  const incoming = new URL(req.url, 'http://localhost')
  incoming.searchParams.delete('path')
  const search = incoming.searchParams.toString()
  const target = `${supabaseUrl}/rest/v1/${restPath}${search ? `?${search}` : ''}`

  const upstreamHeaders = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  }
  for (const name of FORWARD_HEADERS) {
    const value = req.headers[name]
    if (value) upstreamHeaders[name] = value
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: upstreamHeaders,
      body: readBody(req),
    })

    res.status(upstream.status)
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    const contentRange = upstream.headers.get('content-range')
    if (contentRange) res.setHeader('Content-Range', contentRange)

    res.send(await upstream.text())
  } catch (err) {
    res.status(502).json({ message: err.message || 'Upstream request failed.' })
  }
}
