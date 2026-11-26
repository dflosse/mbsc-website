// Executive-only: emails someone an invitation to join the club site.
// Being invited gives NO access – they still apply, upload a WWCC and get approved.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const KINDS = ['executive', 'committee', 'coach', 'volunteer', 'parent']
const SITE = 'https://mountbeautyfc.org.au'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const authz = req.headers.get('Authorization') ?? ''
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authz } } })
    const { data: { user } } = await asUser.auth.getUser()
    if (!user) return json({ error: 'Please sign in again.' }, 401)
    const claims = JSON.parse(atob(authz.replace(/^Bearer\s+/i, '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (claims.aal !== 'aal2') return json({ error: 'Two-factor sign-in is needed to invite people.' }, 403)
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: me } = await db.from('profiles').select('is_executive, full_name').eq('id', user.id).single()
    if (!me?.is_executive) return json({ error: 'Only the executive can send invitations.' }, 403)

    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const full_name = String(body.full_name ?? '').trim().slice(0, 120)
    const kind = KINDS.includes(body.kind) ? body.kind : 'volunteer'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'That email address doesn\'t look right.' }, 400)

    const { data: existing } = await db.from('profiles').select('id').ilike('email', email).maybeSingle()
    if (existing) return json({ error: 'That person already has an account. Ask them to sign in and apply on the Volunteer page.' }, 409)

    const { error } = await db.auth.admin.inviteUserByEmail(email, {
      data: { full_name, invited_for: kind, invited_by: me.full_name || user.email, roles: kind === 'parent' ? [] : [kind] },
      redirectTo: `${SITE}/welcome?for=${kind}`,
    })
    if (error) return json({ error: /already/i.test(error.message) ? 'That email already has an account or a pending invitation.' : error.message }, 400)
    return json({ ok: true })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})
