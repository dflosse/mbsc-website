// Receives Stripe events and records bond payments and refunds. Verifies Stripe's signature.
import { createClient } from 'npm:@supabase/supabase-js@2'

const enc = new TextEncoder()
async function verified(body: string, header: string | null, secret: string) {
  if (!header) return false
  const parts = header.split(',').map((x) => x.split('='))
  const t = parts.find(([k]) => k === 't')?.[1]
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v)
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${body}`)))
  const hex = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('')
  return sigs.some((s) => s.length === hex.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0)
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const body = await req.text()
  if (!secret || !(await verified(body, req.headers.get('stripe-signature'), secret))) return new Response('bad signature', { status: 400 })
  const event = JSON.parse(body)
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const o = event.data?.object ?? {}

  if ((event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') && o.payment_status === 'paid') {
    await db.from('payments').update({ status: 'paid', stripe_payment_intent: o.payment_intent, paid_at: new Date().toISOString() }).eq('stripe_session_id', o.id)
    if (o.metadata?.kind === 'uniform_bond' && o.metadata?.player_id) await db.from('players').update({ bond_paid: true }).eq('id', o.metadata.player_id)
  } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    await db.from('payments').update({ status: event.type.endsWith('expired') ? 'expired' : 'failed' }).eq('stripe_session_id', o.id).eq('status', 'pending')
  } else if (event.type === 'charge.refunded' && o.payment_intent) {
    const { data: pay } = await db.from('payments').select('id, player_id, refundable_cents, amount_cents').eq('stripe_payment_intent', o.payment_intent).maybeSingle()
    if (pay) {
      const refunded = o.amount_refunded ?? 0
      await db.from('payments').update({ refunded_cents: refunded, refunded_at: new Date().toISOString(), status: refunded >= pay.amount_cents ? 'refunded' : 'partially_refunded' }).eq('id', pay.id)
      if (refunded >= pay.refundable_cents && pay.player_id) await db.from('players').update({ bond_refunded: true }).eq('id', pay.player_id)
    }
  }
  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
})
