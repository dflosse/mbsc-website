import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase, fmtDate } from '../supabase'
import { useAuth } from '../auth'

export default function Galas() {
  const { user } = useAuth()
  const [galas, setGalas] = useState([])
  useEffect(() => { supabase.from('galas').select('*').order('gala_date', { ascending: false }).then(({ data }) => setGalas(data || [])) }, [])
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = galas.filter((g) => g.gala_date >= today).reverse()
  const past = galas.filter((g) => g.gala_date < today)
  const bySeason = past.reduce((a, g) => ((a[g.season] = a[g.season] || []).push(g), a), {})
  return (
    <div className="wrap">
      <h1>Gala days</h1>
      <p className="lead">Our teams play in the Alpine Valleys gala series with Myrtleford, Yackandandah and Bright. Each gala is a morning of short games – no ladders, just fun football.</p>
      <h2>Upcoming</h2>
      {upcoming.length === 0 && <div className="card"><p>2027 dates are still being set with the other clubs. Check back soon.</p></div>}
      {upcoming.map((g) => <GalaCard key={g.id} g={g} user={user} />)}
      {user ? <p><Link className="btn" to="/family">Tell us who's coming</Link></p> : <p className="muted">Families: <Link to="/login">sign in</Link> to tell us if your child can play each gala.</p>}
      {Object.keys(bySeason).sort().reverse().map((s) => <SeasonResults key={s} season={Number(s)} galas={bySeason[s].slice().reverse()} />)}
    </div>
  )
}

function GalaCard({ g, user }) {
  return (<>
    <div className="card gala">
      <div className="date"><b>{fmtDate(g.gala_date, { day: 'numeric' })}</b><span>{fmtDate(g.gala_date, { month: 'short' })}</span></div>
      <div>
        <h3>{g.host_club}</h3>
        <p>{fmtDate(g.gala_date)}{g.start_time ? ` · ${g.start_time}` : ''}</p>
        <p className="muted">{[g.venue, g.address].filter(Boolean).join(', ')}</p>
        {g.info && <p className="pre">{g.info}</p>}
        {g.draw_url && <a href={g.draw_url} target="_blank" rel="noreferrer">Draw and pitch map</a>}
        {g.signup_closes && <p className="small">Let us know by {fmtDate(g.signup_closes)}</p>}
        {user && <Roster gala={g} />}
      </div>
    </div>
  </>)
}

function Roster({ gala }) {
  const { user, isVolunteer } = useAuth()
  const [jobs, setJobs] = useState([])
  const [signups, setSignups] = useState([])
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data } = await supabase.from('gala_jobs').select('*').eq('gala_id', gala.id).order('sort_order')
    setJobs(data || [])
    const ids = (data || []).map((j) => j.id)
    const { data: s } = ids.length ? await supabase.from('gala_job_signups').select('*').in('job_id', ids) : { data: [] }
    setSignups(s || [])
  }, [gala.id])
  useEffect(() => { load() }, [load])
  if (!jobs.length) return null
  async function take(j) { setErr(''); const { error } = await supabase.from('gala_job_signups').insert({ job_id: j.id, profile_id: user.id }); if (error) setErr(error.message.includes('row-level') ? 'Only approved volunteers with a checked WWCC can sign up – see the Volunteer page.' : error.message); load() }
  async function drop(j) { await supabase.from('gala_job_signups').delete().eq('job_id', j.id).eq('profile_id', user.id); load() }
  return (
    <div className="roster">
      <b>Volunteer roster</b>
      <ul>{jobs.map((j) => { const s = signups.filter((x) => x.job_id === j.id); const mine = s.some((x) => x.profile_id === user.id); return (
        <li key={j.id}><span>{j.job}{j.time_slot ? ` · ${j.time_slot}` : ''}<br /><span className="small muted">{s.map((x) => x.display_name).join(', ') || 'No one yet'}</span></span>
          <span className="nowrap">{s.length}/{j.slots} {mine ? <button className="link danger" onClick={() => drop(j)}>Remove me</button> : s.length < j.slots && (isVolunteer ? <button className="btn small" onClick={() => take(j)}>I'll help</button> : <Link className="small" to="/volunteer">Volunteer to help</Link>)}</span></li>) })}</ul>
      {err && <p className="err small">{err}</p>}
    </div>
  )
}

const AGE_N = (a) => parseInt(String(a).replace(/\D/g, ''), 10) || 99
const TEAM_N = { Red: 1, Green: 2, Blue: 3 }
const tally = (rs) => rs.reduce((t, r) => ({ ...t, [r.outcome]: (t[r.outcome] || 0) + 1 }), {})
const Rec = ({ t }) => <span className="rec"><b className="w">{t.win || 0}W</b> <b className="d">{t.draw || 0}D</b> <b className="l">{t.loss || 0}L</b></span>

function SeasonResults({ season, galas }) {
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [details, setDetails] = useState({})
  const [awards, setAwards] = useState([])
  const [open, setOpen] = useState(null)
  useEffect(() => {
    const ids = galas.map((g) => g.id)
    supabase.from('gala_results').select('*').in('gala_id', ids).then(({ data }) => setResults(data || []))
    if (user) {
      supabase.from('gala_result_details').select('*').then(({ data }) => setDetails(Object.fromEntries((data || []).map((d) => [d.result_id, d]))))
      supabase.from('season_awards').select('*').eq('season', season).order('sort').then(({ data }) => setAwards(data || []))
    }
  }, [galas, season, user])
  const all = tally(results)
  const games = results.filter((r) => r.outcome !== 'pending').length
  return (
    <section>
      <h2>{season} season</h2>
      {results.length > 0 && <p className="muted">Mount Beauty across {galas.length} gala days: {games} games – {all.win || 0} wins, {all.draw || 0} draws, {all.loss || 0} losses.</p>}
      <div className="galarecs">
        {galas.map((g, i) => {
          const rs = results.filter((r) => r.gala_id === g.id).sort((a, b) => AGE_N(a.age_group) - AGE_N(b.age_group) || (TEAM_N[a.team] || 0) - (TEAM_N[b.team] || 0) || a.sort - b.sort)
          const groups = rs.reduce((a, r) => { const k = r.age_group + (r.team ? ' ' + r.team : ''); (a[k] = a[k] || []).push(r); return a }, {})
          const isOpen = open === g.id
          return (
            <div key={g.id} className="card galarec">
              <button className="galarec-head" onClick={() => setOpen(isOpen ? null : g.id)} aria-expanded={isOpen}>
                <span><b>Gala {i + 1} – {g.host_club.replace(/ (SC|FC)$/, '')}</b><span className="muted small"> {fmtDate(g.gala_date)}{g.venue ? `, ${g.venue}` : ''}</span></span>
                {rs.length > 0 ? <Rec t={tally(rs)} /> : <span className="muted small">no results</span>}
              </button>
              {isOpen && Object.entries(groups).map(([k, list]) => (
                <div key={k} className="resgroup">
                  <h3>{k}</h3>
                  {list.map((r) => {
                    const d = details[r.id]
                    return (
                      <div key={r.id} className={'result ' + r.outcome}>
                        <div className="result-line"><span>{r.opponent ? `v ${r.opponent}` : 'Game'}</span><b>{r.score || (r.outcome === 'pending' ? 'not recorded' : 'score not recorded')}</b><span className={'pill ' + ({ win: 'good', draw: 'wait', loss: 'bad' }[r.outcome] || '')}>{{ win: 'Win', draw: 'Draw', loss: 'Loss', pending: '–' }[r.outcome]}</span></div>
                        {d?.scorers && <div className="small">Goals: {d.scorers}</div>}
                        {d?.highlight && <div className="small hl">{d.highlight}</div>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )
        })}
      </div>
      {user ? (awards.length > 0 && (
        <div className="card">
          <h3>{season} awards</h3>
          <ul className="roles">{awards.map((a) => <li key={a.id}><span>{a.award}</span><b>{a.recipients}</b>{a.note && <span className="small muted"> {a.note}</span>}</li>)}</ul>
        </div>
      )) : <p className="muted small">Club families can <Link to="/login">sign in</Link> to see goal scorers and end-of-season awards.</p>}
    </section>
  )
}
