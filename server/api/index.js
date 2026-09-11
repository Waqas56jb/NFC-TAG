/**
 * NFC-TAG Vercel entry — health + status.
 * App data lives on Supabase REST (not this Node process).
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
      message: 'Backend is up. Frontends talk to Supabase REST for data.',
      supabase: process.env.SUPABASE_URL || null,
      time: new Date().toISOString(),
    }

    return new Response(JSON.stringify(body), { status: 200, headers })
  },
}
