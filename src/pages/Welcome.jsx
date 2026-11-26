import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { PW_RULE, strongPw } from './Account'

const FOR = { executive: 'the executive committee', committee: 'the committee', coach: 'a coach', volunteer: 'a volunteer', parent: 'a club family' }

// Landing page for the invitation email: the link signs the person in once so they can choose a password.
export default function Welcome() {
  const { user, profile, loading, refresh } = useAuth()
  const [sp] = useSearchParams()
  const kind = FOR[sp.get('for')] ? sp.get('for') : 'volunteer'
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  if (loading) return <div className="wrap narrow"><h1>Welcome</h1><p className="muted">Checking your invitation…</p></div>
  if (!user) return (
    <div className="wrap narrow">
      <h1>Welcome</h1>
      <div className="card"><p>This invitation link has expired or has already been used. Invitation links last 24 hours and work once.</p>
        <p>If you already set a password, just sign in. Otherwise use "Forgot password?" on the sign-in page with the email your invitation went to.</p>
        <Link className="btn" to="/login">Sign in</Link></div>
    </div>
  )

  async function submit(e) {
    e.preventDefault(); setMsg(null)
    if (!strongPw(pw)) return setMsg({ ok: false, text: PW_RULE })
    if (pw !== pw2) return setMsg({ ok: false, text: "The two passwords don't match." })
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setMsg({ ok: false, text: error.message })
    await refresh?.()
    nav(kind === 'parent' ? '/family' : '/volunteer', { replace: true })
  }

  const first = (profile?.full_name || '').split(' ')[0]
  return (
    <div className="wrap narrow">
      <h1>Welcome{first ? ', ' + first : ''}</h1>
      <p className="lead">You've been invited to join Mount Beauty Football Club's website as {FOR[kind]}.</p>
      {kind !== 'parent' && <div className="card callout"><p style={{ margin: 0 }}><b>What happens next:</b> choose a password, then add your mobile, address and Working With Children Check. The executive checks your card and connects you to the club in WWC Connect. Your access switches on once they've approved you.</p></div>}
      <form className="card" onSubmit={submit}>
        <p className="small muted">Signed in as <b>{user.email}</b></p>
        <label>Choose a password<input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
        <label>Type it again<input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></label>
        <p className="small muted">{PW_RULE}</p>
        {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save password and continue'}</button>
      </form>
    </div>
  )
}
