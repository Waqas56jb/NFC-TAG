/**
 * NFC-TAG Vercel entry — health + status.
 * Data traffic: /rest/v1/* → Supabase (see api/rest/[...path].js).
 */
export default {
  async fetch(request) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      'Content-Type': 'application/json; charset=utf-8',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    const body = {
      ok: true,
      service: 'nfc-tag-server',
      message: 'Backend is up. Use /rest/v1/* from the frontends.',
      rest: '/rest/v1',
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      time: new Date().toISOString(),
    }

    return new Response(JSON.stringify(body), { status: 200, headers })
  },
}
