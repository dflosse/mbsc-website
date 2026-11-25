// Starts a Stripe Checkout payment for a child's uniform bond (Apple Pay, Google Pay, cards).
import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED = ['https://mountbeautyfc.org.au', 'https://www.mountbeautyfc.org.au', 'https://mountbeautyfc.netlify.app']
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const toCents = (v: unknown) => { const n = parseFloat(String(v ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return json({ error: 'Online payments are not switched on yet.' }, 503)
    const url = Deno.env.get('SUPABASE_URL')!
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const { data: { user } } = await asUser.auth.getUser()
    if (!user) return json({ error: 'Please sign in again.' }, 401)
    const { player_id } = await req.json()
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: link } = await db.from('player_guardians').select('player_id').eq('player_id', player_id).eq('profile_id', user.id).maybeSingle()
    if (!link) return json({ error: 'You can only pay for your own children.' }, 403)
    const { data: p } = await db.from('players').select('id, first_name, last_name, season, needs_uniform, bond_paid, status').eq('id', player_id).single()
    if (!p || p.status === 'withdrawn') return json({ error: 'Registration not found.' }, 404)
    if (!p.needs_uniform) return json({ error: 'This child has not asked for a club uniform.' }, 400)
    if (p.bond_paid) return json({ error: 'The uniform bond is already paid.' }, 400)

    const { data: s } = await db.from('settings').select('key, value').in('key', ['uniform_bond_charge', 'uniform_bond_refund'])
    const set = Object.fromEntries((s ?? []).map((r) => [r.key, r.value]))
    const charge = toCents(set.uniform_bond_charge)
    if (!charge) return json({ error: 'The uniform bond amount has not been set yet.' }, 400)
    const refundable = Math.min(toCents(set.uniform_bond_refund) ?? charge, charge)

    const origin = req.headers.get('origin') ?? ''
    const base = ALLOWED.includes(origin) ? origin : ALLOWED[0]
    const name = `Uniform bond – ${p.first_name} ${p.last_name} (${p.season})`
    const form = new URLSearchParams({
      mode: 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'aud',
      'line_items[0][price_data][unit_amount]': String(charge),
      'line_items[0][price_data][product_data][name]': name,
      'line_items[0][price_data][product_data][description]': `Refundable bond – $${(refundable / 100).toFixed(2)} is refunded when the uniform is returned.`,
      success_url: `${base}/family?paid=1`,
      cancel_url: `${base}/family`,
      client_reference_id: p.id,
      'metadata[player_id]': p.id,
      'metadata[kind]': 'uniform_bond',
      'payment_intent_data[description]': name,
      'payment_intent_data[metadata][player_id]': p.id,
    })
    if (user.email) form.set('customer_email', user.email)
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form })
    const session = await r.json()
    if (!r.ok) return json({ error: session?.error?.message ?? 'Stripe could not start the payment.' }, 502)

    await db.from('payments').insert({ player_id: p.id, payer_id: user.id, season: p.season, amount_cents: charge, refundable_cents: refundable, stripe_session_id: session.id })
    return json({ url: session.url })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})
