import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase, REG_SEASON, fmtDate } from '../supabase'
import { useAuth } from '../auth'

const KINDS = [
  ['coach', 'Coach or assistant coach'],
  ['executive', 'Executive committee (President, VP, Secretary, Treasurer)'],
  ['committee', 'Committee role'],
  ['volunteer', 'General volunteer (gala days, canteen, BBQ, set-up, field marking…)'],
]
export const wwccState = (w) => {
  if (!w) return ['bad', 'No WWCC on file']
  const days = (new Date(w.expiry) - new Date()) / 86400000
  if (days < 0) return ['bad', 'Expired ' + fmtDate(w.expiry)]
  if (!w.status_checked_at || !w.wwc_connected_at) return ['wait', 'Awaiting executive check']
  if (days < 60) return ['wait', 'Expires ' + fmtDate(w.expiry)]
  return ['good', 'Verified · expires ' + fmtDate(w.expiry)]
}

export default function Volunteer() {
  const { user, profile, refresh } = useAuth()
  const [me, setMe] = useState({ full_name: '', phone: '', address: '' })
  const [w, setW] = useState(null)
  const [wf, setWf] = useState({ card_number: '', expiry: '', card_type: 'Volunteer' })
  const [file, setFile] = useState(null)
  const [apps, setApps] = useState([])
  const [teams, setTeams] = useState([])
  const [req, setReq] = useState({ kind: 'coach', detail: '', team_id: '' })
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    const { data: ww } = await supabase.from('wwcc').select('*').eq('profile_id', user.id).maybeSingle()
    setW(ww); if (ww) setWf({ card_number: ww.card_number, expiry: ww.expiry, card_type: ww.card_type || 'Volunteer' })
    const { data: a } = await supabase.from('volunteer_roles').select('*, teams(name)').eq('profile_id', user.id).order('created_at', { ascending: false })
    setApps(a || [])
  }, [user.id])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (profile) setMe({ full_name: profile.full_name || '', phone: profile.phone || '', address: profile.address || '' }) }, [profile])
  useEffect(() => { supabase.from('teams').select('id,name').eq('season', REG_SEASON).order('sort_order').then(({ data }) => setTeams(data || [])) }, [])

  async function saveAll(e) {
    e.preventDefault(); setMsg(null)
    if (!me.full_name || !me.phone || !me.address) return setMsg({ ok: false, text: 'Please fill in your full name, mobile and address – the club needs these to link you in WWC Connect.' })
    const { error: pe } = await supabase.from('profiles').update(me).eq('id', user.id)
    if (pe) return setMsg({ ok: false, text: pe.message })
    let file_path = w?.file_path || null
    if (file) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      file_path = `${user.id}/wwcc-${Date.now()}.${ext}`
      const { error: ue } = await supabase.storage.from('wwcc').upload(file_path, file, { upsert: true })
      if (ue) return setMsg({ ok: false, text: 'Upload failed: ' + ue.message })
    }
    if (!file_path) return setMsg({ ok: false, text: 'Please upload a photo or PDF of your WWCC card (front), or a screenshot of your digital card.' })
    const row = { profile_id: user.id, card_number: wf.card_number.trim().toUpperCase(), expiry: wf.expiry, card_type: wf.card_type, file_path }
    const { error } = w ? await supabase.from('wwcc').update(row).eq('profile_id', user.id) : await supabase.from('wwcc').insert(row)
    if (error) return setMsg({ ok: false, text: error.message })
    setFile(null); refresh(); load()
    setMsg({ ok: true, text: 'Saved. The executive committee will check your WWCC.' })
  }

  async function apply(e) {
    e.preventDefault(); setMsg(null)
    const { error } = await supabase.from('volunteer_roles').insert({ profile_id: user.id, season: REG_SEASON, kind: req.kind, detail: req.detail, team_id: req.kind === 'coach' && req.team_id ? req.team_id : null })
    if (error) return setMsg({ ok: false, text: error.message })
    setReq({ kind: 'coach', detail: '', team_id: '' }); load()
    setMsg({ ok: true, text: 'Thanks! Your application is with the executive committee.' })
  }
  async function withdraw(id) { await supabase.from('volunteer_roles').update({ status: 'withdrawn' }).eq('id', id); load() }

  const [cls, label] = wwccState(w)
  return (
    <div className="wrap">
      <h1>Volunteer with MBFC</h1>
      <p className="lead">The club runs on volunteers. Every coach, committee member and volunteer – including casual gala-day helpers – needs a current Working With Children Check and sign-off from the executive committee before they start.</p>
      {msg && <p className={'card ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</p>}

      <div className="grid2">
        <section>
          <h2>1. Your details & WWCC</h2>
          <form className="card form" onSubmit={saveAll}>
            <p className="row"><span className={'pill ' + cls}>{label}</span></p>
            <label>Full name<input value={me.full_name} onChange={(e) => setMe({ ...me, full_name: e.target.value })} required /></label>
            <div className="grid2 tight">
              <label>Mobile<input value={me.phone} onChange={(e) => setMe({ ...me, phone: e.target.value })} inputMode="tel" required /></label>
              <label>Email<input value={profile?.email || ''} disabled /></label>
            </div>
            <label>Home address<input value={me.address} onChange={(e) => setMe({ ...me, address: e.target.value })} required /></label>
            <div className="grid2 tight">
              <label>WWCC card number<input value={wf.card_number} onChange={(e) => setWf({ ...wf, card_number: e.target.value })} required placeholder="e.g. 01234567A-01" /></label>
              <label>Expiry date<input type="date" value={wf.expiry} onChange={(e) => setWf({ ...wf, expiry: e.target.value })} required /></label>
              <label>Card type<select value={wf.card_type} onChange={(e) => setWf({ ...wf, card_type: e.target.value })}><option>Volunteer</option><option>Employee</option></select></label>
              <label>Photo or PDF of card<input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
            </div>
            {w?.file_path && !file && <p className="small muted">Card image on file. Upload a new one only if your card has changed.</p>}
            <button className="btn">Save details & WWCC</button>
            <p className="small muted">Your card image is private: only you and the executive committee can see it. Changing your card details means it has to be re-checked. Don't have a WWCC? Volunteer checks are free – apply at <a href="https://service.vic.gov.au/workchecks" target="_blank" rel="noreferrer">Service Victoria</a> and list Mount Beauty Football Club as your organisation.</p>
          </form>
        </section>

        <section>
          <h2>2. What are you applying for?</h2>
          <form className="card form" onSubmit={apply}>
            <label>Role<select value={req.kind} onChange={(e) => setReq({ ...req, kind: e.target.value })}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            {req.kind === 'coach' && <label>Team (if you know)<select value={req.team_id} onChange={(e) => setReq({ ...req, team_id: e.target.value })}><option value="">Not sure yet</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
            <label>{['committee', 'executive'].includes(req.kind) ? 'Which role? (see About us for open roles)' : 'Anything we should know?'}<input value={req.detail} onChange={(e) => setReq({ ...req, detail: e.target.value })} /></label>
            <button className="btn">Apply</button>
          </form>
          <h3>My applications</h3>
          {apps.length === 0 && <p className="muted">None yet.</p>}
          {apps.map((a) => (
            <div key={a.id} className="card">
              <div className="row between"><b>{KINDS.find((k) => k[0] === a.kind)?.[1].split(' (')[0]}{a.teams?.name ? ` – ${a.teams.name}` : ''}</b>
                <span className={'pill ' + ({ approved: 'good', pending: 'wait', declined: 'bad' }[a.status] || '')}>{a.status === 'pending' ? 'Awaiting executive sign-off' : a.status}</span></div>
              {a.detail && <p className="small">{a.detail}</p>}
              {a.decision_note && <p className="small muted">Note: {a.decision_note}</p>}
              {a.status === 'pending' && <button className="link" onClick={() => withdraw(a.id)}>Withdraw</button>}
            </div>
          ))}
          <p className="small muted">Questions? See <Link to="/about">About us</Link> for who's on the committee.</p>
        </section>
      </div>
    </div>
  )
}
