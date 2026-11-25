import { useEffect, useState, useCallback } from 'react'
import { supabase, fmtDate, REG_SEASON, ageGroupFor } from '../supabase'
import { useAuth } from '../auth'
import useSettings from '../useSettings'
import { FeesCard } from './About'

const bondText = (v) => { v = (v || '').trim(); if (!v) return ''; return /^\d/.test(v) ? '$' + v.replace(/^\$/, '') : v }
const blank = { first: '', last: '', dob: '', gender: '', medical: '', emergency: '', photo: false, uniform: false, uSize: '', boots: false, bSize: '' }

export default function Family() {
  const { profile } = useAuth()
  const settings = useSettings()
  const [kids, setKids] = useState([])
  const [galas, setGalas] = useState([])
  const [entries, setEntries] = useState({})
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState(blank)
  const [msg, setMsg] = useState(null)
  const [kit, setKit] = useState({})
  const [invites, setInvites] = useState([])
  const [inviteFor, setInviteFor] = useState(null)

  const load = useCallback(async () => {
    const { data: g } = await supabase.from('player_guardians').select('player_id')
    const ids = (g || []).map((r) => r.player_id)
    const { data: p } = ids.length ? await supabase.from('players').select('*, teams(name, coach_names)').in('id', ids).order('season', { ascending: false }) : { data: [] }
    setKids(p || [])
    const today = new Date().toISOString().slice(0, 10)
    const { data: gl } = await supabase.from('galas').select('*').gte('gala_date', today).order('gala_date')
    setGalas(gl || [])
    if (ids.length) {
      const { data: k } = await supabase.from('kit').select('player_id, jersey_label, size').in('player_id', ids)
      setKit(Object.fromEntries((k || []).map((x) => [x.player_id, x])))
      const { data: gi } = await supabase.from('guardian_invites').select('*').in('player_id', ids)
      setInvites(gi || [])
      const { data: e } = await supabase.from('gala_entries').select('*').in('player_id', ids)
      setEntries(Object.fromEntries((e || []).map((x) => [x.gala_id + ':' + x.player_id, x.response])))
    }
  }, [])
  useEffect(() => { load() }, [load])

  async function register(e) {
    e.preventDefault(); setMsg(null)
    const { error } = await supabase.rpc('register_player', {
      p_first: f.first.trim(), p_last: f.last.trim(), p_dob: f.dob, p_gender: f.gender,
      p_medical: f.medical, p_emergency: f.emergency, p_photo: f.photo, p_season: REG_SEASON,
      p_needs_uniform: f.uniform, p_uniform_size: f.uniform ? f.uSize : null, p_needs_boots: f.boots, p_boot_size: f.boots ? f.bSize : null,
    })
    if (error) return setMsg({ ok: false, text: error.message })
    setMsg({ ok: true, text: `${f.first} is registered with MBFC for ${REG_SEASON}. Next step: register with Football Victoria through PlayFootball (we'll email the link). The committee will confirm their team.` })
    setF(blank); setAdding(false); load()
  }

  async function respond(gala, player, response) {
    const key = gala + ':' + player
    setEntries({ ...entries, [key]: response })
    await supabase.from('gala_entries').upsert({ gala_id: gala, player_id: player, response, updated_by: profile?.id, updated_at: new Date().toISOString() })
  }

  const current = kids.filter((k) => k.status !== 'withdrawn')
  return (
    <div className="wrap">
      <h1>My family</h1>
      {msg && <p className={msg.ok ? 'ok card' : 'err card'}>{msg.text}</p>}

      <section>
        <div className="row between"><h2>My children</h2><button className="btn small" onClick={() => setAdding(!adding)}>{adding ? 'Cancel' : `+ Register a child for ${REG_SEASON}`}</button></div>
        {adding && (
          <div className="twosteps">
            <div><span className="stepno">1</span><div><b>Register with MBFC</b> (this form)<p className="small">Tells the club your child is playing, so we can plan squads and coaches, and gives your child's coach their medical needs, emergency contact and photo permission.</p></div></div>
            <div><span className="stepno">2</span><div><b>Register with Football Victoria</b> (PlayFootball)<p className="small">Officially registers your child as a player, covers them with FV insurance, and is where the season fee is paid. We'll email you the link.</p></div></div>
            <p className="small muted full">Both are needed before your child can play.</p>
          </div>
        )}
        {adding && (
          <form className="card form" onSubmit={register}>
            <div className="grid2 tight">
              <label>First name<input value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} required /></label>
              <label>Last name<input value={f.last} onChange={(e) => setF({ ...f, last: e.target.value })} required /></label>
              <label>Date of birth<input type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} required /></label>
              <label>Gender<select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}><option value="">Prefer not to say</option><option>F</option><option>M</option><option>X</option></select></label>
            </div>
            {f.dob && <p className="muted small">Age group for {REG_SEASON}: <b>{ageGroupFor(f.dob, REG_SEASON)}</b> (the committee may place them in a combined squad)</p>}
            <label>Medical conditions, allergies or anything the coach should know<textarea value={f.medical} onChange={(e) => setF({ ...f, medical: e.target.value })} rows={2} /></label>
            <label>Emergency contact (name and phone, if not you)<input value={f.emergency} onChange={(e) => setF({ ...f, emergency: e.target.value })} /></label>
            <label className="check"><input type="checkbox" checked={f.photo} onChange={(e) => setF({ ...f, photo: e.target.checked })} /> Photos of my child may be used on club social media and website</label>
            <fieldset className="kitq">
              <legend>Uniform, and loan boots if available</legend>
              <label className="check"><input type="checkbox" checked={f.uniform} onChange={(e) => setF({ ...f, uniform: e.target.checked })} /> My child needs a club uniform this season</label>
              {f.uniform && <label className="sub">Approximate size (child's age or size, if you know it)<input value={f.uSize} onChange={(e) => setF({ ...f, uSize: e.target.value })} placeholder="e.g. size 10" /></label>}
              {f.uniform && <p className="small muted sub">Uniforms are loaned for the season. A refundable bond{bondText(settings.uniform_bond) && bondText(settings.uniform_bond) !== 'TBA' ? ` of ${bondText(settings.uniform_bond)}` : ' (amount to be confirmed)'} applies – it's returned when the uniform comes back at the end of the season.</p>}
              <label className="check"><input type="checkbox" checked={f.boots} onChange={(e) => setF({ ...f, boots: e.target.checked })} /> Expression of interest: we'd like to be considered for loan boots, if any are available</label>
              {f.boots && <>
                <label className="sub">Shoe size<input value={f.bSize} onChange={(e) => setF({ ...f, bSize: e.target.value })} placeholder="e.g. kids 13 or adult 2" required /></label>
                <p className="small muted sub">We only have a handful of loan boots, so <b>most families won't get a pair</b> – please plan to bring your own. This just puts your child on the list. If a pair in their size turns up, a refundable bond{bondText(settings.boots_bond) && bondText(settings.boots_bond) !== 'TBA' ? ` of ${bondText(settings.boots_bond)}` : ' (amount to be confirmed)'} applies – it's returned in full when the boots come back at the end of the season. The committee will only contact you if a pair is available.</p>
              </>}
            </fieldset>
            <FeesCard s={settings} compact />
            <button className="btn">Register with MBFC</button>
          </form>
        )}
        {current.length === 0 && !adding && <div className="card"><p>No children linked to your account yet. Register a child above. If your child played in {REG_SEASON - 1}, the committee can link their existing record to you – just email the club.</p></div>}
        <div className="cards">
          {current.map((k) => (
            <div key={k.id} className="card">
              <h3>{k.first_name} {k.last_name}</h3>
              <p className="muted">{k.season} season · {k.teams?.name || ageGroupFor(k.dob, k.season) + ' (team TBC)'}</p>
              {k.teams?.coach_names && <p>Coach: {k.teams.coach_names}</p>}
              {k.needs_boots && <p className="small">Loan boots interest (size {k.boot_size || '?'}): <b>{{ requested: "on the list – we'll be in touch only if a pair is available", allocated: 'a pair is set aside for you', waitlist: 'on the waitlist – none free yet', returned: 'returned, thanks!' }[k.boots_status] || 'requested'}</b>{k.boots_status === 'allocated' && (k.bond_paid ? ' · bond paid' : ' · bond to pay on pick-up')}{k.bond_refunded ? ' · bond refunded' : ''}</p>}
              {k.needs_uniform && !kit[k.id] && <p className="small">Uniform requested{k.uniform_size ? ` (${k.uniform_size})` : ''} – the committee will hand it out before the first game.</p>}
              {kit[k.id] && <p className="small">Club jersey: <b>#{kit[k.id].jersey_label}</b> (size {kit[k.id].size}) – please return at season's end</p>}
              <p className="row">
                <span className={'pill ' + (k.status === 'approved' ? 'good' : 'wait')}>{k.status === 'approved' ? 'MBFC registered' : 'MBFC – awaiting committee'}</span>
                <span className={'pill ' + (k.fv_registered ? 'good' : 'wait')}>{k.fv_registered ? 'FV registered' : 'FV registration needed'}</span>
                <span className={'pill ' + (k.fees_paid ? 'good' : 'wait')}>{k.fees_paid ? 'Paid' : 'Payment due'}</span>
              </p>
              {invites.filter((i) => i.player_id === k.id).map((i) => <p key={i.id} className="small muted">Other parent/guardian: {i.name || i.email} – {i.claimed_at ? 'linked' : i.approved ? 'invited, not signed up yet' : 'awaiting executive approval'}</p>)}
              <button className="link" onClick={() => setInviteFor(k)}>+ Add another parent / guardian</button>
            </div>
          ))}
        </div>
      </section>

      {inviteFor && <InviteGuardian child={inviteFor} onClose={(m) => { setInviteFor(null); if (m) setMsg({ ok: true, text: m }); load() }} />}
      <section>
        <h2>Gala days – who's coming?</h2>
        {galas.length === 0 ? <div className="card"><p>No upcoming galas yet. Once dates are set you'll be able to say yes or no for each child here.</p></div> : (
          <div className="table-wrap"><table className="rsvp">
            <thead><tr><th>Gala</th>{current.map((k) => <th key={k.id}>{k.first_name}</th>)}</tr></thead>
            <tbody>{galas.map((g) => (
              <tr key={g.id}><td><b>{fmtDate(g.gala_date)}</b><br /><span className="muted small">{g.host_club}</span></td>
                {current.map((k) => {
                  const v = entries[g.id + ':' + k.id]
                  return <td key={k.id}><div className="seg">
                    {['yes', 'maybe', 'no'].map((r) => <button key={r} className={v === r ? 'on ' + r : ''} onClick={() => respond(g.id, k.id, r)}>{r === 'yes' ? 'Yes' : r === 'no' ? 'No' : '?'}</button>)}
                  </div></td>
                })}
              </tr>))}</tbody>
          </table></div>
        )}
      </section>
    </div>
  )
}

function InviteGuardian({ child, onClose }) {
  const { user } = useAuth()
  const [f, setF] = useState({ name: '', email: '', relationship: '' })
  const [err, setErr] = useState('')
  async function send(e) {
    e.preventDefault()
    const { error } = await supabase.from('guardian_invites').insert({ player_id: child.id, email: f.email, name: f.name, relationship: f.relationship, invited_by: user.id, approved: false })
    if (error) return setErr(error.message)
    onClose(`Request sent. Once the executive approves it, ${f.name || f.email} just needs to create an account with ${f.email} and ${child.first_name} will appear for them.`)
  }
  return (
    <div className="modal" onClick={() => onClose()}><form className="card form" onClick={(e) => e.stopPropagation()} onSubmit={send}>
      <h3>Add another parent or guardian for {child.first_name}</h3>
      <p className="small">They'll get their own login and can see {child.first_name}'s details and gala days. Your contact details stay private from each other. The executive committee approves every link.</p>
      <label>Their name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></label>
      <label>Their email (they'll sign up with this)<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></label>
      <label>Relationship to {child.first_name}<input value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value })} placeholder="e.g. Dad, Mum, step-parent, grandparent" /></label>
      <p className="small muted">If there are court orders or custody arrangements the club should know about, please email the executive privately – don't put them here.</p>
      {err && <p className="err">{err}</p>}
      <div className="row"><button className="btn">Send request</button><button type="button" className="btn ghost small" onClick={() => onClose()}>Cancel</button></div>
    </form></div>
  )
}
