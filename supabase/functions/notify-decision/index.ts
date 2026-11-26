// Executive-only: emails a volunteer / coach / committee member when their application is approved or declined.
// Sends through Resend from noreply@mountbeautyfc.org.au. Needs the RESEND_API_KEY secret.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const SITE = 'https://mountbeautyfc.org.au'
const LABEL: Record<string, string> = { coach: 'coach', executive: 'member of the executive committee', committee: 'committee member', volunteer: 'volunteer' }
const ACCESS: Record<string, string> = {
  coach: 'You can now see your team page, squad list (with medical notes and photo permissions), parents\' contact numbers and gala availability, and record gala games and goal scorers.',
  executive: 'You now have full executive access: approvals, registered players, the WWCC register, people and access, finances and settings.',
  committee: 'You can now use the committee pages: action list, galas, uniforms, keys and assets, contacts and documents.',
  volunteer: 'You can now sign up for gala-day jobs and see volunteer messages.',
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const key = Deno.env.get('RESEND_API_KEY')
    if (!key) return json({ skipped: 'Email not set up yet' })
    const url = Deno.env.get('SUPABASE_URL')!
    const authz = req.headers.get('Authorization') ?? ''
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authz } } })
    const { data: { user } } = await asUser.auth.getUser()
    if (!user) return json({ error: 'Please sign in again.' }, 401)
    const claims = JSON.parse(atob(authz.replace(/^Bearer\s+/i, '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (claims.aal !== 'aal2') return json({ error: 'Two-factor sign-in needed.' }, 403)
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: me } = await db.from('profiles').select('is_executive, full_name').eq('id', user.id).single()
    if (!me?.is_executive) return json({ error: 'Only the executive can do this.' }, 403)

    const { id } = await req.json()
    const { data: app } = await db.from('volunteer_roles').select('kind, status, decision_note, profile_id, teams(name)').eq('id', id).single()
    if (!app || !['approved', 'declined'].includes(app.status)) return json({ error: 'No decision to send.' }, 400)
    const { data: p } = await db.from('profiles').select('email, full_name').eq('id', app.profile_id).single()
    if (!p?.email) return json({ error: 'No email address.' }, 400)

    const first = esc((p.full_name || '').split(' ')[0] || 'there')
    const role = LABEL[app.kind] + ((app as any).teams?.name ? ` (${esc((app as any).teams.name)})` : '')
    const note = app.decision_note ? `<p><b>Note from the club:</b> ${esc(app.decision_note)}</p>` : ''
    const ok = app.status === 'approved'
    const subject = ok ? `You're approved – Mount Beauty Football Club` : `About your application – Mount Beauty Football Club`
    const body = ok
      ? `<p>Hi ${first},</p><p>Good news – you've been approved as a <b>${role}</b> at Mount Beauty Football Club.</p><p>${ACCESS[app.kind]}</p>${note}
         <p><a href="${SITE}/start" style="display:inline-block;background:#f08a3c;color:#1e3b2f;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">Sign in</a></p>
         <p>Thanks for helping out.</p>`
      : `<p>Hi ${first},</p><p>Thanks for offering to help as a <b>${role}</b>. The executive committee hasn't approved this application.</p>${note}<p>If you have questions, reply to the club at mtbeautysoccerclub@gmail.com.</p>`
    const html = `<div style="font-family:Arial,sans-serif;color:#1e3b2f;max-width:520px">${body}<p style="color:#666;font-size:13px">Mount Beauty Football Club · mountbeautyfc.org.au</p></div>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Mount Beauty Football Club <noreply@mountbeautyfc.org.au>', to: [p.email], reply_to: 'mtbeautysoccerclub@gmail.com', subject, html }),
    })
    if (!r.ok) return json({ error: 'Email could not be sent: ' + (await r.text()).slice(0, 200) }, 502)
    return json({ ok: true, to: p.email })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})
