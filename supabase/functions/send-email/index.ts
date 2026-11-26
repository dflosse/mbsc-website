// Executive-only: sends a club email from noreply@mountbeautyfc.org.au through Resend.
// Each person gets their own copy (no one sees anyone else's address). Logged in email_log.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const CLUB_INBOX = 'mtbeautysoccerclub@gmail.com'
const MAX = 300
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const linkify = (s: string) => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#1e3b2f">$1</a>')
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

function html(body: string, first: string) {
  const text = body.replace(/\{first_name\}/g, first || 'there')
  const paras = text.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${linkify(esc(p)).replace(/\n/g, '<br>')}</p>`).join('')
  return `<div style="font-family:Arial,sans-serif;color:#1e3b2f;max-width:560px;font-size:15px;line-height:1.5">${paras}<p style="color:#666;font-size:13px;border-top:1px solid #ddd;padding-top:10px;margin-top:20px">Mount Beauty Football Club · mountbeautyfc.org.au<br>Please reply to this email if you have questions.</p></div>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const key = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('Resend_API_Key')
    if (!key) return json({ error: 'Email sending isn\'t switched on yet – the RESEND_API_KEY secret needs adding in Supabase.' }, 503)
    const url = Deno.env.get('SUPABASE_URL')!
    const authz = req.headers.get('Authorization') ?? ''
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authz } } })
    const { data: { user } } = await asUser.auth.getUser()
    if (!user) return json({ error: 'Please sign in again.' }, 401)
    const claims = JSON.parse(atob(authz.replace(/^Bearer\s+/i, '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!(claims.aal === 'aal2' || (claims.amr ?? []).some((m: { method: string }) => ['passkey', 'webauthn', 'mfa/webauthn'].includes(m.method)))) return json({ error: 'Two-factor sign-in is needed to send club emails.' }, 403)
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: me } = await db.from('profiles').select('is_executive, full_name, email').eq('id', user.id).single()
    if (!me?.is_executive) return json({ error: 'Only the executive can send club emails.' }, 403)

    const b = await req.json()
    const subject = String(b.subject ?? '').trim().slice(0, 200)
    const body = String(b.body ?? '').trim().slice(0, 20000)
    if (!subject || !body) return json({ error: 'Add a subject and a message.' }, 400)
    const seen = new Set<string>()
    const to: { email: string; name: string }[] = []
    for (const r of Array.isArray(b.recipients) ? b.recipients : []) {
      const email = String(r?.email ?? '').trim().toLowerCase()
      if (!isEmail(email) || seen.has(email)) continue
      seen.add(email); to.push({ email, name: String(r?.name ?? '').trim().slice(0, 120) })
    }
    if (!to.length) return json({ error: 'Choose at least one person to send to.' }, 400)
    if (to.length > MAX) return json({ error: `That's ${to.length} people – the limit is ${MAX} per email.` }, 400)
    const replyTo = b.reply_to === 'me' && me.email ? me.email : CLUB_INBOX

    const failed: string[] = []
    let sent = 0
    for (let i = 0; i < to.length; i += 100) {
      const chunk = to.slice(i, i + 100)
      const r = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk.map((p) => ({
          from: 'Mount Beauty Football Club <noreply@mountbeautyfc.org.au>', to: [p.email], reply_to: replyTo, subject,
          html: html(body, p.name.split(' ')[0]), text: body.replace(/\{first_name\}/g, p.name.split(' ')[0] || 'there'),
        }))),
      })
      if (r.ok) sent += chunk.length
      else { failed.push(...chunk.map((p) => p.email)); if (i === 0) { const t = (await r.text()).slice(0, 300); await log(); return json({ error: 'Email service said: ' + t, sent, failed }, 502) } }
    }
    await log()
    return json({ ok: true, sent, failed })

    async function log() {
      await db.from('email_log').insert({ sent_by: user!.id, sent_by_name: me!.full_name || user!.email, subject, body, reply_to: replyTo, audience: String(b.audience ?? '').slice(0, 300), recipients: to, sent_count: sent, failed })
    }
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})
