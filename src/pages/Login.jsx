import { PW_RULE, strongPw } from './Account.jsx'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import { supabase, REG_SEASON } from '../supabase'
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
  const { needsMfa, mfaEnrolled } = useAuth()
  if (user && needsMfa && mfaEnrolled) return <Navigate to="/security" state={{ from: loc.state?.from }} replace />
  if (user) return <Navigate to={loc.state?.from || '/family'} replace />

  const redirect = window.location.origin + '/family'
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg(null)
    let error
    if (mode === 'link') {
      ;({ error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, data: { full_name: name } } }))
      if (!error) setMsg({ ok: true, text: `Check ${email} for a sign-in link. It works once and expires after an hour.` })
    } else if (mode === 'signin') {
      ;({ error } = await supabase.auth.signInWithPassword({ email, password }))
      if (!error) {
        const { data: lv } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (lv?.nextLevel === 'aal2' && lv.currentLevel !== 'aal2') { setBusy(false); return navigate('/security', { state: { from: loc.state?.from || '/family' } }) }
      }
    } else {
      if (!roles.length) { setBusy(false); return setMsg({ ok: false, text: 'Tick at least one option.' }) }
      if (!strongPw(password)) { setBusy(false); return setMsg({ ok: false, text: PW_RULE }) }
      ;({ error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect, data: { full_name: name, phone, roles, season: REG_SEASON } } }))
      const helper = roles.some((r) => r !== 'parent')
      if (!error) setMsg({ ok: true, text: 'Account created. Check your email to confirm, then sign in.' + (helper ? ' Then go to Volunteer to upload your Working With Children Check so the executive can sign you off.' : '') })
    }
    if (error) setMsg({ ok: false, text: error.message })
    setBusy(false)
  }

  return (
    <div className="wrap narrow">
      <h1>Sign in or register</h1>
      <p className="lead">Everyone has their own login – parents, coaches, committee members and volunteers. Your email address is your username.</p>
      <div className="tabs">
        <button className={mode === 'signin' ? 'on' : ''} onClick={() => setMode('signin')}>Sign in</button>
        <button className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Create account</button>
        <button className={mode === 'link' ? 'on' : ''} onClick={() => setMode('link')}>Forgot password? Email me a link</button>
      </div>
      <form className="card form" onSubmit={submit}>
        {mode !== 'signin' && <label>Your full name<input value={name} onChange={(e) => setName(e.target.value)} required={mode === 'signup'} /></label>}
        {mode === 'signup' && <label>Mobile<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></label>}
        {mode === 'signup' && (
          <fieldset className="roles-pick">
            <legend>I am a… <span className="muted small">(tick all that apply – one account covers everything)</span></legend>
            {ROLE_OPTS.map(([k, l, d]) => <label key={k} className="check"><input type="checkbox" checked={roles.includes(k)} onChange={() => toggle(k)} /><span><b>{l}</b><br /><span className="small muted">{d}</span></span></label>)}
          </fieldset>
        )}
        <label>Email (your username)<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        {mode !== 'link' && <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === 'signup' ? 10 : 6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />{mode === 'signup' && <span className="small muted">{PW_RULE}</span>}</label>}
        <button className="btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'link' ? 'Send sign-in link' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
      </form>
      <p className="muted small">Coaching or volunteering? Create an account, then go to <b>Volunteer</b> to apply and upload your Working With Children Check. We only use your details to run the club – see our <Link to="/privacy">privacy statement</Link>. Children's details are visible only to you, your child's coach and the committee.</p>
    </div>
  )
}
