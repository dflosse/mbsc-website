import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'

// Two-factor sign-in (authenticator app). Required for executive, committee, coach and volunteer access.
// Make sure we have a live session before calling the two-factor endpoints
// (straight after an email-confirmation link the session can still be settling).
async function ensureSession() {
  let { data } = await supabase.auth.getSession()
  if (!data.session) ({ data } = await supabase.auth.refreshSession())
  return !!data?.session
}

export default function Security() {
  const { refresh, elevated, mfaEnrolled, needsMfa } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [factors, setFactors] = useState(null)
  const [enroll, setEnroll] = useState(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)

  async function load() {
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors((data?.totp || []).filter((f) => f.status === 'verified'))
  }
  useEffect(() => { load() }, [])

  async function start() {
    setMsg(null)
    if (!(await ensureSession())) return setMsg({ ok: false, text: 'Your sign-in has lapsed. Please sign out, sign back in with your email and password, then try again.' })
    // clear any half-finished setup first
    const { data: all } = await supabase.auth.mfa.listFactors()
    for (const f of (all?.all || []).filter((x) => x.status !== 'verified')) await supabase.auth.mfa.unenroll({ factorId: f.id })
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator ' + new Date().toISOString().slice(0, 10) })
    if (error) return setMsg({ ok: false, text: error.message })
    setEnroll(data)
  }
  async function verify(factorId) {
    setMsg(null)
    if (!(await ensureSession())) return setMsg({ ok: false, text: 'Your sign-in has lapsed. Please sign out, sign back in with your email and password, then try again.' })
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, '') })
    if (error) return setMsg({ ok: false, text: 'That code didn\'t work – check the time on your phone and try the newest code.' })
    setCode(''); setEnroll(null); await load(); await refresh()
    setMsg({ ok: true, text: 'Two-factor sign-in is on. Your access is unlocked.' })
    if (loc.state?.from) setTimeout(() => nav(loc.state.from), 600)
  }
  async function remove(f) {
    if (factors.length === 1 && elevated && !window.confirm('Removing your only authenticator will switch off your coach/committee/volunteer access until you set it up again. Continue?')) return
    const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id })
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Removed.' }); load(); refresh()
  }

  const verified = factors?.[0]
  return (
    <div className="wrap narrow">
      <h1>Two-factor sign-in</h1>
      <p className="lead">Executive, committee, coach and volunteer accounts can see children's details, so they need a second step at sign-in: a 6-digit code from an authenticator app on your phone.</p>
      {msg && <p className={'card ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</p>}

      {needsMfa && mfaEnrolled && verified && (
        <div className="card form">
          <h3>Enter your code</h3>
          <p>Open your authenticator app and type the current code for Mount Beauty FC.</p>
          <label>6-digit code<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={7} autoFocus /></label>
          <button className="btn" onClick={() => verify(verified.id)}>Continue</button>
        </div>
      )}

      {factors && factors.length === 0 && !enroll && (
        <div className="card">
          <h3>Set it up (2 minutes)</h3>
          <ol className="steps">
            <li>Install a free authenticator app – Google Authenticator, Microsoft Authenticator, or your phone's built-in password manager (iPhone Passwords / Google Password Manager).</li>
            <li>Tap the button below, then scan the QR code with the app.</li>
            <li>Type the 6-digit code the app shows.</li>
          </ol>
          <button className="btn" onClick={start}>Set up two-factor sign-in</button>
          {!elevated && <p className="small muted">Optional for parents, but recommended.</p>}
        </div>
      )}

      {enroll && (
        <div className="card form">
          <h3>Scan this with your authenticator app</h3>
          <img src={enroll.totp.qr_code} alt="QR code for your authenticator app" className="qr" />
          <p className="small muted">Can't scan? Enter this key in the app instead: <code>{enroll.totp.secret}</code></p>
          <label>6-digit code from the app<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={7} /></label>
          <button className="btn" onClick={() => verify(enroll.id)}>Turn on</button>
        </div>
      )}

      {verified && !needsMfa && (
        <div className="card">
          <p><span className="pill good">On</span> Two-factor sign-in is active on this account.</p>
          {factors.map((f) => <p key={f.id} className="small">{f.friendly_name || 'Authenticator'} <button className="link danger" onClick={() => remove(f)}>remove</button></p>)}
          <p className="small muted">New phone? Set up the new one first, then remove the old one. Locked out? Ask an executive member – an admin can reset it in Supabase.</p>
        </div>
      )}
    </div>
  )
}
