import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase, REG_SEASON, fmtDate } from '../supabase'
import { useAuth } from '../auth'
import { useLive } from './EditTable'

const KINDS = [
  ['coach', 'Coach or assistant coach'],
  ['executive', 'Executive committee (President, VP, Secretary, Treasurer)'],
  ['committee', 'Committee role'],
  ['volunteer', 'General volunteer (gala days, canteen, BBQ, set-up, field marking…)'],
]
export const WWCC_APPLY_URL = 'https://service.vic.gov.au/workingwithchildren'
export const WWCC_RENEW_URL = 'https://service.vic.gov.au/renewwwcc'

export function ApplyWWCC() {
  return (
    <div className="card callout">
      <h3 style={{ marginTop: 0 }}>Need a Working With Children Check?</h3>
      <ul className="small">
        <li><b>Volunteer check: free.</b> Choose Volunteer – coaching and helping at the club is unpaid. (A paid "Employee" check costs $139.20 in 2026–27.)</li>
        <li>About 15 minutes online with your licence or Medicare card, plus a 45-minute online child safety course that's now compulsory.</li>
        <li>Cards take 3 to 12 weeks. You'll get an <b>application number</b> straight away – enter it below and tick "I've applied". In most cases you can start volunteering once you've applied.</li>
        <li>Card expired less than 3 months ago? You can renew instead. More than 3 months? Apply for a new check.</li>
      </ul>
      <div className="row"><a className="btn small" href={WWCC_APPLY_URL} target="_blank" rel="noreferrer">Apply for a WWCC</a><a className="btn small ghost" href={WWCC_RENEW_URL} target="_blank" rel="noreferrer">Renew my WWCC</a></div>
    </div>
  )
}

export const wwccState = (w) => {
  if (!w) return ['bad', 'No WWCC on file']
  if (w.pending) return [w.status_checked_at && w.wwc_connected_at ? 'wait' : 'wait', w.status_checked_at && w.wwc_connected_at ? 'Applied – card not issued yet' : 'Applied – awaiting executive check']
  if (!w.expiry) return ['wait', w.status_checked_at && w.wwc_connected_at ? 'Card checked – expiry date not recorded' : 'Card – expiry date not recorded']
  const days = (new Date(w.expiry) - new Date()) / 86400000
  if (days < 0) return ['bad', 'Expired ' + fmtDate(w.expiry)]
  if (!w.status_checked_at || !w.wwc_connected_at) return ['wait', 'Awaiting executive check']
  if (days < 60) return ['wait', 'Expires ' + fmtDate(w.expiry)]
  return ['good', 'Verified · expires ' + fmtDate(w.expiry)]
}

const BLANK_W = { card_number: '', expiry: '', card_type: 'Volunteer', pending: false }
const BLANK_REQ = { kind: '', detail: '', team_id: '' }
const roleName = (k) => KINDS.find((x) => x[0] === k)?.[1].split(' (')[0] || k

export default function Volunteer() {
  const { user, profile, refresh } = useAuth()
  const [w, setW] = useState(null)
  const [apps, setApps] = useState([])
  const [teams, setTeams] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [msg, setMsg] = useState(null)
  const [updatingCard, setUpdatingCard] = useState(false)

  const load = useCallback(async () => {
    const { data: ww } = await supabase.from('wwcc').select('*').eq('profile_id', user.id).maybeSingle()
    setW(ww)
    const { data: a } = await supabase.from('volunteer_roles').select('*, teams(name)').eq('profile_id', user.id).order('created_at', { ascending: false })
    setApps(a || []); setLoaded(true)
  }, [user.id])
  useEffect(() => { load() }, [load])
  useLive(['wwcc', 'volunteer_roles'], load)
  useEffect(() => { supabase.from('teams').select('id,name').eq('season', REG_SEASON).order('sort_order').then(({ data }) => setTeams(data || [])) }, [])
  async function withdraw(id) { if (window.confirm('Withdraw this application?')) { await supabase.from('volunteer_roles').update({ status: 'withdrawn' }).eq('id', id); load() } }

  const current = apps.filter((a) => a.season === REG_SEASON && ['pending', 'approved'].includes(a.status))
  const past = apps.filter((a) => !current.includes(a))
  const taken = new Set(current.map((a) => a.kind))
  const open = KINDS.filter(([k]) => !taken.has(k) && !(taken.has('executive') && ['committee', 'volunteer'].includes(k)))
  const [cls, label] = wwccState(w)
  const cardOk = w && (w.pending || (w.expiry && new Date(w.expiry) >= new Date()))
  if (!loaded) return <div className="wrap"><p className="muted">Loading…</p></div>

  return (
    <div className="wrap vol">
      <h1>Apply to Volunteer</h1>
      <p className="lead">The club runs on volunteers. Every coach, committee member and volunteer – including casual gala-day helpers – needs a current Working With Children Check and sign-off from the executive committee before they start.</p>
      {msg && <p className={'card ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</p>}

      {(current.length > 0 || w) && (
        <section className="card vol-status">
          <h2>Where you're at</h2>
          <div className="vs-grid">
            <div>
              <h3>Your roles for {REG_SEASON}</h3>
              {current.length === 0 ? <p className="muted small">No applications yet.</p> : current.map((a) => (
                <div key={a.id} className="vs-row">
                  <span><b>{roleName(a.kind)}</b>{a.teams?.name ? ` – ${a.teams.name}` : ''}{a.detail ? <span className="small muted"> · {a.detail}</span> : null}</span>
                  <span className="vs-right"><span className={'pill ' + (a.status === 'approved' ? 'good' : 'wait')}>{a.status === 'approved' ? 'Approved' : 'Awaiting sign-off'}</span>{a.status === 'pending' && <button className="link small" onClick={() => withdraw(a.id)}>Withdraw</button>}</span>
                </div>
              ))}
            </div>
            <div>
              <h3>Working With Children Check</h3>
              <div className="vs-row"><span className={'pill ' + cls}>{label}</span>{(w || open.length === 0) && !updatingCard && <button className="link small" onClick={() => setUpdatingCard(true)}>{w ? 'Update my WWCC' : 'Add my WWCC'}</button>}</div>
              {w?.pending && <p className="small muted">When your card arrives (3 to 12 weeks), choose "Update my WWCC" and add the card number, expiry and a photo.</p>}
            </div>
          </div>
          {past.length > 0 && <details className="small vs-past"><summary>Past applications ({past.length})</summary>{past.map((a) => <p key={a.id}>{a.season} · {roleName(a.kind)}{a.teams?.name ? ` – ${a.teams.name}` : ''} · {a.status}{a.decision_note ? ` – ${a.decision_note}` : ''}</p>)}</details>}
        </section>
      )}

      {updatingCard && <WWCCUpdate w={w} onDone={(m) => { setUpdatingCard(false); if (m) setMsg(m); refresh(); load() }} />}

      {open.length > 0 ? (
        <ApplicationForm key={apps.length} open={open} teams={teams} profile={profile} needCard={!cardOk} hasAny={current.length > 0} onDone={(m) => { setMsg(m); refresh(); load(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
      ) : (
        <p className="card muted">You've applied for every role that applies to you. Thanks for helping out!</p>
      )}
      <p className="small muted">Questions? See <Link to="/about">About us</Link> for who's on the committee.</p>
    </div>
  )
}

// One form for a new application – always starts blank.
function ApplicationForm({ open, teams, profile, needCard, hasAny, onDone }) {
  const { user } = useAuth()
  const [req, setReq] = useState(BLANK_REQ)
  const detailsOnFile = !!(profile?.full_name && profile?.phone && profile?.address)
  const [me, setMe] = useState({ full_name: '', phone: '', address: '' })
  const [wf, setWf] = useState(BLANK_W)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  async function submit(e) {
    e.preventDefault(); setErr(null)
    if (!req.kind) return setErr('Choose a role.')
    if (!detailsOnFile && (!me.full_name || !me.phone || !me.address)) return setErr('Please fill in your full name, mobile and home address – the club needs these to link you in WWC Connect.')
    setBusy(true)
    if (!detailsOnFile) { const { error } = await supabase.from('profiles').update(me).eq('id', user.id); if (error) { setBusy(false); return setErr(error.message) } }
    if (needCard) {
      const e2 = await saveCard(user.id, null, wf, file)
      if (e2) { setBusy(false); return setErr(e2) }
    }
    const { error } = await supabase.from('volunteer_roles').insert({ profile_id: user.id, season: REG_SEASON, kind: req.kind, detail: req.detail.trim() || null, team_id: req.kind === 'coach' && req.team_id ? req.team_id : null })
    setBusy(false)
    if (error) return setErr(/duplicate|unique/i.test(error.message) ? "You've already applied for that role." : /already covers/i.test(error.message) ? 'Your executive role already covers committee and volunteer work – no need to apply separately.' : error.message)
    setReq(BLANK_REQ); setWf(BLANK_W); setFile(null)
    onDone({ ok: true, text: `Thanks! Your application to be a ${roleName(req.kind).toLowerCase()} is with the executive committee. You'll get an email when it's approved.` })
  }
  return (
    <form className="card form vol-form" onSubmit={submit}>
      <h2>{hasAny ? 'Apply for another role' : 'Your application'}</h2>
      <fieldset className="vol-step"><legend><span className="n">1</span> What would you like to do?</legend>
        <label>Role<select value={req.kind} onChange={(e) => setReq({ ...req, kind: e.target.value })} required><option value="">Choose a role…</option>{open.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        {req.kind === 'coach' && <label>Team (if you know)<select value={req.team_id} onChange={(e) => setReq({ ...req, team_id: e.target.value })}><option value="">Not sure yet</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
        <label>{['committee', 'executive'].includes(req.kind) ? 'Which role? (see About us for open roles)' : 'Anything we should know? (optional)'}<input value={req.detail} onChange={(e) => setReq({ ...req, detail: e.target.value })} /></label>
      </fieldset>
      <fieldset className="vol-step"><legend><span className="n">2</span> Your details</legend>
        {detailsOnFile ? <p className="on-file">✓ Using the name, mobile and address on your account. <Link to="/account">Change them</Link></p> : <>
          <label>Full name<input value={me.full_name} onChange={(e) => setMe({ ...me, full_name: e.target.value })} required /></label>
          <div className="grid2 tight"><label>Mobile<input value={me.phone} onChange={(e) => setMe({ ...me, phone: e.target.value })} inputMode="tel" required /></label><label>Email<input value={profile?.email || ''} disabled /></label></div>
          <label>Home address<input value={me.address} onChange={(e) => setMe({ ...me, address: e.target.value })} required /></label>
        </>}
      </fieldset>
      <fieldset className="vol-step"><legend><span className="n">3</span> Working With Children Check</legend>
        {needCard ? <><ApplyWWCC /><CardFields wf={wf} setWf={setWf} setFile={setFile} /></> : <p className="on-file">✓ Using the WWCC already on file. If it has changed, use "Update my WWCC" above.</p>}
      </fieldset>
      {err && <p className="err">{err}</p>}
      <button className="btn big" disabled={busy}>{busy ? 'Sending…' : 'Send application'}</button>
      <p className="small muted">Your card image is private: only you and the executive committee can see it.</p>
    </form>
  )
}

function CardFields({ wf, setWf, setFile }) {
  return (
    <>
      <div className="choice">
        <label className="check"><input type="radio" name="wwcc-kind" checked={!wf.pending} onChange={() => setWf({ ...wf, pending: false })} /><span><b>I have a WWCC card</b> <span className="small muted">(physical or digital, with an expiry date)</span></span></label>
        <label className="check"><input type="radio" name="wwcc-kind" checked={wf.pending} onChange={() => setWf({ ...wf, pending: true })} /><span><b>I've applied and I'm still waiting for my card</b> <span className="small muted">(you have an application number)</span></span></label>
      </div>
      <div className="grid2 tight">
        <label>{wf.pending ? 'Application number' : 'WWCC card number'}<input value={wf.card_number} onChange={(e) => setWf({ ...wf, card_number: e.target.value })} required placeholder={wf.pending ? 'From your Service Victoria receipt' : 'e.g. 01234567A-01'} /></label>
        {!wf.pending && <label>Expiry date<input type="date" value={wf.expiry} onChange={(e) => setWf({ ...wf, expiry: e.target.value })} required /></label>}
        <label>Check type<select value={wf.card_type} onChange={(e) => setWf({ ...wf, card_type: e.target.value })}><option>Volunteer</option><option>Employee</option></select></label>
        <label>{wf.pending ? 'Screenshot of your application receipt' : 'Photo or PDF of card'}<input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required /></label>
      </div>
    </>
  )
}

async function saveCard(uid, existing, wf, file) {
  if (!file) return wf.pending ? 'Please upload a screenshot of your application receipt email from Service Victoria.' : 'Please upload a photo or PDF of your WWCC card (front), or a screenshot of your digital card.'
  if (!wf.pending && !wf.expiry) return 'Please enter the expiry date on your card.'
  if (wf.pending && /^\d{7}[A-Z]-\d{2}$/i.test(wf.card_number.trim()) && !window.confirm('That looks like a WWCC card number. If you already have your card, choose "I have a WWCC card" and add its expiry date instead. Keep it as "applied"?')) return 'Cancelled.'
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const file_path = `${uid}/wwcc-${Date.now()}.${ext}`
  const { error: ue } = await supabase.storage.from('wwcc').upload(file_path, file, { upsert: true })
  if (ue) return 'Upload failed: ' + ue.message
  const row = { profile_id: uid, card_number: wf.card_number.trim().toUpperCase(), expiry: wf.pending ? null : wf.expiry, card_type: wf.card_type, pending: wf.pending, file_path }
  const { error } = existing ? await supabase.from('wwcc').update(row).eq('profile_id', uid) : await supabase.from('wwcc').upsert(row)
  return error ? error.message : null
}

// Update an existing card – blank form, nothing prefilled.
function WWCCUpdate({ w, onDone }) {
  const { user } = useAuth()
  const [wf, setWf] = useState(BLANK_W)
  const [file, setFile] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr(null)
    const e2 = await saveCard(user.id, w, wf, file)
    setBusy(false)
    if (e2) return setErr(e2)
    onDone({ ok: true, text: wf.pending ? 'Saved. The executive will check your application.' : 'Saved. The executive committee will check your new card.' })
  }
  return (
    <form className="card form vol-form" onSubmit={submit}>
      <div className="row between"><h2>Update my WWCC</h2><button type="button" className="link" onClick={() => onDone(null)}>Cancel</button></div>
      <p className="small muted">Enter your new card or application details. Changing them means the executive re-checks your card.</p>
      <CardFields wf={wf} setWf={setWf} setFile={setFile} />
      {err && <p className="err">{err}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save my WWCC'}</button>
    </form>
  )
}
