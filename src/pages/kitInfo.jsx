// Uniform / boots / bond flags from the registration form, shown wherever a child is listed.
const BOOTS = { requested: 'requested', allocated: 'allocated', waitlist: 'waitlist', returned: 'returned' }

export function KitTags({ p, staff = true }) {
  if (!p?.needs_uniform && !p?.needs_boots) return null
  return (
    <div className="kittags">
      {p.needs_uniform && <span className="pill kit">Needs uniform{p.uniform_size ? ` · ${p.uniform_size}` : ''}</span>}
      {p.needs_boots && <span className={'pill kit' + (p.boots_status === 'allocated' ? ' good' : '')}>Loan boots{p.boot_size ? ` · ${p.boot_size}` : ''}{staff && p.boots_status ? ` · ${BOOTS[p.boots_status] || p.boots_status}` : ''}</span>}
      {staff && (p.needs_boots || p.needs_uniform) && (p.bond_paid || p.bond_refunded) && <span className="pill">{p.bond_refunded ? 'bond refunded' : 'bond paid'}</span>}
    </div>
  )
}

export const kitText = (p) => [
  p.needs_uniform ? `Uniform${p.uniform_size ? ' ' + p.uniform_size : ''}` : '',
  p.needs_boots ? `Boots${p.boot_size ? ' ' + p.boot_size : ''} (${p.boots_status || 'requested'})` : '',
  p.bond_refunded ? 'bond refunded' : p.bond_paid ? 'bond paid' : '',
].filter(Boolean).join('; ')
