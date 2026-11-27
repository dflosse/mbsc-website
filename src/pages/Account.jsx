import PasswordInput from '../PasswordInput'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { Link } from 'react-router-dom'

export default function Account() {
  const { profile, refresh, user, twoFactorOn } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '', address: '' })
  const [msg, setMsg] = useState('')
  useEffect(() => { if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '', address: profile.address || '' }) }, [profile])
  async function save(e) {
    e.preventDefault()
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    setMsg(error ? error.message : 'Saved.'); refresh()
  }
  return (
    <div className="wrap narrow">
      <h1>My account</h1>
      <form className="card form" onSubmit={save}>
        <label>Name<input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
        <label>Mobile<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" /></label>
        <label>Home address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
        <ChangePassword />
        {twoFactorOn && <p className="small"><Link to="/security">Two-factor sign-in settings</Link></p>}
        <p className="muted small">Username (email): {profile?.email} · Access: {profile?.role}{profile?.is_executive ? ' · executive committee' : ''}</p>
        <button className="btn">Save</button> {msg && <span className="ok">{msg}</span>}
      </form>
    </div>
  )
}

export const PW_RULE = 'At least 10 characters, with an uppercase letter, a lowercase letter and a number.'
export const strongPw = (p) => p.length >= 10 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p)

function ChangePassword() {
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  async function save() {
    if (!strongPw(pw)) return setMsg(PW_RULE)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setMsg(error ? error.message : 'Password updated.'); setPw('')
  }
  return <label>New password (optional)<div className="row"><PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /><button type="button" className="btn small ghost" onClick={save}>Set password</button></div>{msg && <span className="small">{msg}</span>}</label>
}
