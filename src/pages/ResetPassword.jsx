import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { PW_RULE, strongPw } from './Account'

// Landing page for the "Forgot password?" email: the link signs the person in for this one purpose.
export default function ResetPassword() {
  const { user, loading, mfaEnrolled, aalCurrent, refresh, endRecovery } = useAuth()
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const needCode = mfaEnrolled && aalCurrent !== 'aal2'

  if (loading) return <div className="wrap narrow"><h1>Set a new password</h1><p className="muted">Checking your link…</p></div>
  if (!user) return (
    <div className="wrap narrow">
      <h1>Set a new password</h1>
      <div className="card"><p>This reset link has expired or has already been used. Links work once and last an hour.</p>
        <Link className="btn" to="/login">Request a new link</Link></div>
    </div>
  )

  async function submit(e) {
    e.preventDefault(); setMsg(null)
    if (!strongPw(pw)) return setMsg({ ok: false, text: PW_RULE })
    if (pw !== pw2) return setMsg({ ok: false, text: "The two passwords don't match." })
    setBusy(true)
    if (needCode) {
      const { data: f } = await supabase.auth.mfa.listFactors()
      const factor = (f?.totp || []).find((x) => x.status === 'verified')
      const { error: me } = factor ? await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() }) : { error: { message: 'No authenticator found on this account.' } }
      if (me) { setBusy(false); return setMsg({ ok: false, text: 'That 6-digit code didn\'t work. Check your authenticator app and try the current code.' }) }
    }
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setMsg({ ok: false, text: error.message })
    endRecovery(); await refresh()
    setMsg({ ok: true, text: 'Password changed. Taking you to your family page…' })
    setTimeout(() => nav('/family', { replace: true }), 1200)
  }

  return (
    <div className="wrap narrow">
      <h1>Set a new password</h1>
      <p className="muted">For {user.email}</p>
      <form className="card" onSubmit={submit}>
        <label>New password<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required /><span className="small muted">{PW_RULE}</span></label>
        <label>Type it again<input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required /></label>
        {needCode && <label>6-digit code from your authenticator app<input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required /></label>}
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
        {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
      </form>
    </div>
  )
}
