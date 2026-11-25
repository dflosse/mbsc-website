import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'

export default function Account() {
  const { profile, refresh, user } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [msg, setMsg] = useState('')
  useEffect(() => { if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '' }) }, [profile])
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
        <p className="muted small">Email: {profile?.email} · Access: {profile?.role}</p>
        <button className="btn">Save</button> {msg && <span className="ok">{msg}</span>}
      </form>
    </div>
  )
}
