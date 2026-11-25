import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'

export default function Login() {
  const { user } = useAuth()
  const loc = useLocation()
  const [mode, setMode] = useState('link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
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
    } else {
      ;({ error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect, data: { full_name: name } } }))
      if (!error) setMsg({ ok: true, text: 'Account created. Check your email to confirm, then sign in.' })
    }
    if (error) setMsg({ ok: false, text: error.message })
    setBusy(false)
  }

  return (
    <div className="wrap narrow">
      <h1>Sign in or register</h1>
      <p className="lead">One account per parent or carer. Once you're in you can add your children, register them for the season and tell us who's coming to each gala.</p>
      <div className="tabs">
        <button className={mode === 'link' ? 'on' : ''} onClick={() => setMode('link')}>Email me a link</button>
        <button className={mode === 'signin' ? 'on' : ''} onClick={() => setMode('signin')}>Password</button>
        <button className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>New account</button>
      </div>
      <form className="card form" onSubmit={submit}>
        {mode !== 'signin' && <label>Your name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Parent / carer name" required={mode === 'signup'} /></label>}
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        {mode !== 'link' && <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>}
        <button className="btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'link' ? 'Send sign-in link' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
      </form>
      <p className="muted small">We only use your details to run the club. Children's details are visible only to you, your child's coach and the committee.</p>
    </div>
  )
}
