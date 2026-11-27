// Executive-only: pulls the list of every email the club has sent through Resend
// (club emails, approval emails, invitations, sign-up confirmations, password resets)
// with its latest delivery status, and stores it in email_events for the Email log.
import { createClient } from 'npm:@supabase/supabase-js@2'

// Club-wide switch (settings.require_2fa). 'off' = password only.
const twoFactorOff = async () => (await createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!).from('settings').select('value').eq('key', 'require_2fa').maybeSingle()).data?.value === 'off'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

function kindOf(subject: string, clubSubjects: Set<string>) {
  const s = subject.toLowerCase()
  if (clubSubjects.has(subject)) return 'Club email'
  if (/you're approved|about your application/.test(s)) return 'Approval email'
  if (/invit/.test(s)) return 'Invitation'
  if (/confirm|verify|welcome/.test(s)) return 'Sign-up confirmation'
  if (/reset|password|recover/.test(s)) return 'Password reset'
  if (/magic|sign in|login|code/.test(s)) return 'Sign-in link'
  if (/email change|change of email/.test(s)) return 'Email change'
  return 'Other'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const key = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('Resend_API_Key')
    if (!key) return json({ error: 'The Resend key isn\'t set up yet.' }, 503)
    const url = Deno.env.get('SUPABASE_URL')!
    const authz = req.headers.get('Authorization') ?? ''
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authz } } })
    const { data: { user } } = await asUser.auth.getUser()
    if (!user) return json({ error: 'Please sign in again.' }, 401)
    const claims = JSON.parse(atob(authz.replace(/^Bearer\s+/i, '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!(claims.aal === 'aal2' || (claims.amr ?? []).some((m: { method: string }) => ['passkey', 'webauthn', 'mfa/webauthn'].includes(m.method)) || (await twoFactorOff()))) return json({ error: 'Two-factor sign-in needed.' }, 403)
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: me } = await db.from('profiles').select('is_executive').eq('id', user.id).single()
    if (!me?.is_executive) return json({ error: 'Only the executive can see the email log.' }, 403)

    const { data: logs } = await db.from('email_log').select('subject')
    const clubSubjects = new Set((logs || []).map((l) => l.subject))
    let after: string | null = null
    let count = 0
    for (let page = 0; page < 5; page++) {
      const r = await fetch(`https://api.resend.com/emails?limit=100${after ? `&after=${after}` : ''}`, { headers: { Authorization: `Bearer ${key}` } })
      if (!r.ok) return json({ error: 'Resend said: ' + (await r.text()).slice(0, 200), synced: count }, 502)
      const body = await r.json()
      const rows = (body.data || []).map((e: any) => ({
        resend_id: e.id, sent_at: e.created_at, to_addr: (e.to || []).join(', '), from_addr: e.from, subject: e.subject || '',
        last_event: e.last_event || null, kind: kindOf(e.subject || '', clubSubjects), synced_at: new Date().toISOString(),
      }))
      if (rows.length) { await db.from('email_events').upsert(rows); count += rows.length }
      if (!body.has_more || !rows.length) break
      after = rows[rows.length - 1].resend_id
    }
    return json({ ok: true, synced: count })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})
