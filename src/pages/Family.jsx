import { useEffect, useState, useCallback } from 'react'
import { supabase, fmtDate, REG_SEASON, ageGroupFor } from '../supabase'
import { useAuth } from '../auth'
import useSettings from '../useSettings'
import { FeesCard } from './About'

const blank = { first: '', last: '', dob: '', gender: '', medical: '', emergency: '', photo: false }

export default function Family() {
  const { profile } = useAuth()
  const settings = useSettings()
  const [kids, setKids] = useState([])
  const [galas, setGalas] = useState([])
  const [entries, setEntries] = useState({})
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState(blank)
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    const { data: g } = await supabase.from('player_guardians').select('player_id')
    const ids = (g || []).map((r) => r.player_id)
    const { data: p } = ids.length ? await supabase.from('players').select('*, teams(name, coach_names)').in('id', ids).order('season', { ascending: false }) : { data: [] }
    setKids(p || [])
    const today = new Date().toISOString().slice(0, 10)
    const { data: gl } = await supabase.from('galas').select('*').gte('gala_date', today).order('gala_date')
    setGalas(gl || [])
    if (ids.length) {
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
              <p className="row">
                <span className={'pill ' + (k.status === 'approved' ? 'good' : 'wait')}>{k.status === 'approved' ? 'MBFC registered' : 'MBFC – awaiting committee'}</span>
                <span className={'pill ' + (k.fv_registered ? 'good' : 'wait')}>{k.fv_registered ? 'FV registered' : 'FV registration needed'}</span>
                <span className={'pill ' + (k.fees_paid ? 'good' : 'wait')}>{k.fees_paid ? 'Paid' : 'Payment due'}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

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
