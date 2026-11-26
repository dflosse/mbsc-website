import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, REG_SEASON } from '../supabase'
import { useAuth } from '../auth'

const KIND = { executive: 'Executive committee', committee: 'Committee member', coach: 'Coach', volunteer: 'Volunteer' }

// Works out where a signed-in person is up to. Shared by the Getting started page and the menu link.
export function useSetup() {
  const { user, profile, mfaEnrolled } = useAuth()
  const [s, setS] = useState(null)
  useEffect(() => {
    if (!user) return setS(null)
    let live = true
    ;(async () => {
      const [{ data: apps }, { data: w }, { data: kids }] = await Promise.all([
        supabase.from('volunteer_roles').select('kind, status').eq('profile_id', user.id).in('status', ['pending', 'approved']).gte('season', REG_SEASON),
        supabase.from('wwcc').select('pending, status_checked_at, wwc_connected_at').eq('profile_id', user.id).maybeSingle(),
        supabase.from('player_guardians').select('player_id').eq('profile_id', user.id),
      ])
      if (!live) return
      const wanted = user.user_metadata?.roles || []
      const helper = (apps || []).length > 0 || ['coach', 'committee', 'admin', 'volunteer'].includes(profile?.role)
      const parent = wanted.includes('parent') || (kids || []).length > 0
      const steps = []
      if (helper) {
        steps.push({ key: 'mfa', done: mfaEnrolled, title: 'Turn on two-factor sign-in', why: 'Anyone who can see children\'s details signs in with a code from their phone. About 2 minutes.', to: '/security', cta: 'Set it up' })
        steps.push({ key: 'details', done: !!(profile?.phone && profile?.address), title: 'Add your mobile and home address', why: 'The club must give these to the Regulator when it connects you in WWC Connect.', to: '/account', cta: 'Add details' })
        steps.push({ key: 'wwcc', done: !!w, title: w?.pending ? 'WWCC applied for – add the card when it arrives' : 'Add your Working With Children Check', why: w?.pending ? 'You\'re covered while it\'s processed. When the card arrives, update it on the Apply to Volunteer page.' : 'Upload your card, or tick "I\'ve applied" and add your application number. Volunteer checks are free.', to: '/volunteer', cta: w ? 'Update' : 'Add WWCC' })
        const pend = (apps || []).filter((a) => a.status === 'pending')
        const appr = (apps || []).filter((a) => a.status === 'approved')
        steps.push({ key: 'approve', done: pend.length === 0 && appr.length > 0, wait: true,
          title: pend.length ? `Executive sign-off: ${pend.map((a) => KIND[a.kind]).join(', ')}` : appr.length ? `Approved: ${appr.map((a) => KIND[a.kind]).join(', ')}` : 'Apply for a role',
          why: pend.length ? (w && w.status_checked_at && w.wwc_connected_at ? 'Your WWCC is checked – waiting for an executive member to approve you.' : 'Once your WWCC is in, the executive checks it, connects you in WWC Connect and approves you. Nothing for you to do.') : appr.length ? 'Your access is switched on.' : 'Choose what you\'d like to help with.',
          to: '/volunteer', cta: pend.length || appr.length ? 'View' : 'Apply' })
      }
      if (parent) steps.push({ key: 'kids', done: (kids || []).length > 0, title: 'Register your child for ' + REG_SEASON, why: 'Medical info, emergency contact, uniform and boots – about 5 minutes per child.', to: '/family', cta: 'Register' })
      const todo = steps.filter((x) => !x.done && !x.wait).length
      setS({ steps, todo, allDone: steps.every((x) => x.done) })
    })()
    return () => { live = false }
  }, [user, profile, mfaEnrolled])
  return s
}

export default function Start() {
  const { profile } = useAuth()
  const s = useSetup()
  const first = (profile?.full_name || '').split(' ')[0]
  return (
    <div className="wrap narrow">
      <h1>{first ? `Welcome, ${first}` : 'Getting started'}</h1>
      <p className="lead">{!s ? 'Loading…' : s.allDone ? "You're all set up." : 'A few steps to finish setting up your account. This page ticks itself off as you go.'}</p>
      {s && <ol className="setup">
        <li className="done"><span className="tick" aria-hidden="true">✓</span><div><b>Email confirmed</b><p className="small muted">Your account is active.</p></div></li>
        {s.steps.map((x) => (
          <li key={x.key} className={x.done ? 'done' : x.wait ? 'wait' : ''}>
            <span className="tick" aria-hidden="true">{x.done ? '✓' : x.wait ? '…' : ''}</span>
            <div><b>{x.title}</b><p className="small muted">{x.why}</p>
              {!x.done && <Link className={'btn small' + (x.wait ? ' ghost' : '')} to={x.to}>{x.cta}</Link>}</div>
          </li>
        ))}
      </ol>}
      {s?.allDone && <div className="row"><Link className="btn" to="/family">Go to My family</Link></div>}
    </div>
  )
}
