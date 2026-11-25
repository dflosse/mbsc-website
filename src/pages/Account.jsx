import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'

export default function Account() {
  const { profile, refresh, user } = useAuth()
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
        <p className="muted small">Username (email): {profile?.email} · Access: {profile?.role}{profile?.is_executive ? ' · executive committee' : ''}</p>
        <button className="btn">Save</button> {msg && <span className="ok">{msg}</span>}
      </form>
    </div>
  )
}

function ChangePassword() {
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  async function save() {
    if (pw.length < 8) return setMsg('At least 8 characters.')
    const { error } = await supabase.auth.updateUser({ password: pw })
    setMsg(error ? error.message : 'Password updated.'); setPw('')
  }
  return <label>New password (optional)<div className="row"><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /><button type="button" className="btn small ghost" onClick={save}>Set password</button></div>{msg && <span className="small">{msg}</span>}</label>
}
