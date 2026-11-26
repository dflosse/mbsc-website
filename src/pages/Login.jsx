import { PW_RULE, strongPw } from './Account.jsx'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import { supabase, REG_SEASON, REMEMBER_KEY } from '../supabase'
import { useAuth } from '../auth'

const ROLE_OPTS = [
  ['parent', 'Parent / guardian', 'Register your children and manage gala days. Starts straight away.'],
  ['coach', 'Coach', 'Needs a WWCC and executive sign-off.'],
  ['executive', 'Executive committee', 'President, Vice President, Secretary or Treasurer. Needs a WWCC and executive sign-off.'],
  ['committee', 'Committee member', 'Needs a WWCC and executive sign-off.'],
  ['volunteer', 'Volunteer', 'Gala days, canteen, BBQ, set-up. Needs a WWCC and executive sign-off.'],
]

export default function Login() {
  const { user } = useAuth()
  const loc = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [roles, setRoles] = useState(['parent'])
  const toggle = (r) => setRoles((rs) => rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r])
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(null)
  const [remember, setRemember] = useState(() => { try { return localStorage.getItem(REMEMBER_KEY) !== 'no' } catch { return true } })
  const { needsMfa, mfaEnrolled } = useAuth()
  if (user && needsMfa && mfaEnrolled) return <Navigate to="/security" state={{ from: loc.state?.from }} replace />
  if (user) return <Navigate to={loc.state?.from || '/family'} replace />

  const redirect = window.location.origin + '/start'
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg(null)
    let error
    if (mode === 'link') {
      ;({ error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' }))
      if (!error) setMsg({ ok: true, text: `If ${email} has an account, we've emailed it a link to set a new password. The link works once and expires after an hour.` })
    } else if (mode === 'signin') {
      try { localStorage.setItem(REMEMBER_KEY, remember ? 'yes' : 'no') } catch { /* ignore */ }
      ;({ error } = await supabase.auth.signInWithPassword({ email, password }))
      if (!error) {
        const { data: lv } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (lv?.nextLevel === 'aal2' && lv.currentLevel !== 'aal2') { setBusy(false); return navigate('/security', { state: { from: loc.state?.from || '/family' } }) }
      }
    } else {
      if (!roles.length) { setBusy(false); return setMsg({ ok: false, text: 'Tick at least one option.' }) }
      if (!strongPw(password)) { setBusy(false); return setMsg({ ok: false, text: PW_RULE }) }
      ;({ error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect, data: { full_name: name, phone, roles, season: REG_SEASON } } }))
      if (!error) { setBusy(false); setPassword(''); window.scrollTo(0, 0); return setSent(email) }
    }
    if (error) setMsg({ ok: false, text: error.message })
    setBusy(false)
  }

  async function faceId() {
    setBusy(true); setMsg(null)
    try { localStorage.setItem(REMEMBER_KEY, 'yes') } catch { /* ignore */ }
    const { error } = await supabase.auth.signInWithPasskey()
    setBusy(false)
    if (error) setMsg({ ok: false, text: /NotAllowed|abort|cancel/i.test(error.name + error.message) ? 'Cancelled – try again, or sign in with your email and password.' : /not found|credential/i.test(error.message) ? 'No Face ID set up for this site on this device yet – sign in with your password, then turn it on under Two-factor sign-in.' : error.message })
  }

  async function resend() {
    setBusy(true); setMsg(null)
    const { error } = await supabase.auth.resend({ type: 'signup', email: sent, options: { emailRedirectTo: redirect } })
    setBusy(false)
    setMsg(error ? { ok: false, text: /rate|seconds/i.test(error.message) ? 'Please wait a minute before sending another email.' : error.message } : { ok: true, text: 'Sent again. It can take a minute or two to arrive.' })
  }
  if (sent) return (
    <div className="wrap narrow">
      <h1>Check your email</h1>
      <div className="card">
        <p>We've sent a confirmation link to <b>{sent}</b>.</p>
        <ol className="small">
          <li>Open the email from <b>Mount Beauty Football Club</b> (noreply@mountbeautyfc.org.au).</li>
          <li>Tap <b>Confirm my email</b>. You'll be signed in and taken to a short "Getting started" checklist.</li>
        </ol>
        <p className="small muted">Not there after a couple of minutes? Check your spam or junk folder. The link lasts 24 hours.</p>
        <div className="row"><button className="btn small ghost" disabled={busy} onClick={resend}>{busy ? 'Sending…' : 'Resend email'}</button><button className="link" onClick={() => { setSent(null); setMsg(null); setMode('signup') }}>Wrong email? Start again</button></div>
        {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
      </div>
    </div>
  )

  return (
    <div className="wrap narrow">
      <h1>Sign in or register</h1>
      <p className="lead">Everyone has their own login – parents, coaches, committee members and volunteers. Your email address is your username.</p>
      <div className="tabs">
        <button className={mode === 'signin' ? 'on' : ''} onClick={() => setMode('signin')}>Sign in</button>
        <button className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Create account</button>
        <button className={mode === 'link' ? 'on' : ''} onClick={() => setMode('link')}>Forgot password?</button>
      </div>
      {mode === 'signin' && typeof window !== 'undefined' && window.PublicKeyCredential && (
        <div className="card form faceid">
          <button type="button" className="btn big" disabled={busy} onClick={faceId}>Sign in with Face ID / fingerprint</button>
          <p className="small muted" style={{ margin: 0 }}>Set it up once under Two-factor sign-in. No password or code needed after that.</p>
        </div>
      )}
      <form className="card form" onSubmit={submit}>
        {mode === 'signup' && <label>Your full name<input value={name} onChange={(e) => setName(e.target.value)} required={mode === 'signup'} /></label>}
        {mode === 'signup' && <label>Mobile<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></label>}
        {mode === 'signup' && (
          <fieldset className="roles-pick">
            <legend>What are you applying for? <span className="muted small">(tick all that apply – one account covers everything)</span></legend>
            {ROLE_OPTS.map(([k, l, d]) => <label key={k} className="check"><input type="checkbox" checked={roles.includes(k)} onChange={() => toggle(k)} /><span><b>{l}</b><br /><span className="small muted">{d}</span></span></label>)}
          </fieldset>
        )}
        <label>Email (your username)<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        {mode !== 'link' && <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === 'signup' ? 10 : 6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />{mode === 'signup' && <span className="small muted">{PW_RULE}</span>}</label>}
        {mode === 'signin' && <label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>Keep me signed in on this device<br /><span className="small muted">You'll only need your two-factor code once on this device. Untick on a shared computer.</span></span></label>}
        <button className="btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'link' ? 'Email me a reset link' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
      </form>
      <p className="muted small">Coaching or volunteering? Create an account, then go to <b>Volunteer</b> to apply and upload your Working With Children Check. We only use your details to run the club – see our <Link to="/privacy">privacy statement</Link>. Children's details are visible only to you, your child's coach and the committee.</p>
    </div>
  )
}
