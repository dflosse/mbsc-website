// Executive-only: refunds a child's uniform bond through Stripe.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'Online payments are not switched on yet.' }, 503)
    const url = Deno.env.get('SUPABASE_URL')!
    const authz = req.headers.get('Authorization') ?? ''
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authz } } })
    const { data: { user } } = await asUser.auth.getUser()
    if (!user) return json({ error: 'Please sign in again.' }, 401)
    const claims = JSON.parse(atob(authz.replace(/^Bearer\s+/i, '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (claims.aal !== 'aal2') return json({ error: 'Two-factor sign-in is needed to refund bonds.' }, 403)
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: me } = await db.from('profiles').select('is_executive').eq('id', user.id).single()
    if (!me?.is_executive) return json({ error: 'Only the executive can refund bonds.' }, 403)

    const { player_id } = await req.json()
    const { data: pay } = await db.from('payments').select('*').eq('player_id', player_id).eq('kind', 'uniform_bond').eq('status', 'paid').order('paid_at', { ascending: false }).limit(1).maybeSingle()
    if (!pay?.stripe_payment_intent) return json({ error: 'No online bond payment found for this child. If they paid another way, tick "bond refunded" by hand.' }, 404)
    const amount = pay.refundable_cents - (pay.refunded_cents ?? 0)
    if (amount <= 0) return json({ error: 'Already refunded.' }, 400)

    const form = new URLSearchParams({ payment_intent: pay.stripe_payment_intent, amount: String(amount), 'metadata[player_id]': player_id, 'metadata[refunded_by]': user.id })
    const r = await fetch('https://api.stripe.com/v1/refunds', { method: 'POST', headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `bond-refund-${pay.id}` }, body: form })
    const refund = await r.json()
    if (!r.ok) return json({ error: refund?.error?.message ?? 'Stripe could not make the refund.' }, 502)

    const total = (pay.refunded_cents ?? 0) + amount
    await db.from('payments').update({ refunded_cents: total, refunded_at: new Date().toISOString(), refunded_by: user.id, status: total >= pay.amount_cents ? 'refunded' : 'partially_refunded' }).eq('id', pay.id)
    await db.from('players').update({ bond_refunded: true }).eq('id', player_id)
    return json({ ok: true, refunded: amount / 100 })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})
