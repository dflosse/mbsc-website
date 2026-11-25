// Uniform bond amounts come from Committee → Fees & settings.
const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? n : null }
const aud = (n) => '$' + (Number.isInteger(n) ? n : n.toFixed(2))
export function bondInfo(s) {
  const charge = num(s.uniform_bond_charge)
  const refund = charge ? Math.min(num(s.uniform_bond_refund) ?? charge, charge) : null
  return {
    charge, refund, set: !!charge,
    text: charge ? (refund < charge ? `${aud(charge)} (${aud(refund)} refunded when the uniform is returned)` : `${aud(charge)}, refunded in full when the uniform is returned`) : 'to be confirmed',
    chargeText: charge ? aud(charge) : '',
  }
}
