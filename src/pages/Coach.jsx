import { KitTags } from './kitInfo'
import { useEffect, useState } from 'react'
import { supabase, fmtDate, ROSTER_SEASON } from '../supabase'
import { ForumLatest } from './Forum'
import { useAuth } from '../auth'
import { GameEditor } from './GalaGames'

export default function Coach() {
  const { isStaff, coachTeams } = useAuth()
  const [teams, setTeams] = useState([])
  const [teamId, setTeamId] = useState('')
  const [players, setPlayers] = useState([])
  const [galas, setGalas] = useState([])
  const [entries, setEntries] = useState({})
  const [docs, setDocs] = useState([])
  const [allGalas, setAllGalas] = useState([])
  const [galaId, setGalaId] = useState('')

  useEffect(() => {
    supabase.from('teams').select('*').eq('season', ROSTER_SEASON).order('sort_order').then(({ data }) => {
      const mine = (data || []).filter((t) => isStaff || coachTeams.includes(t.id))
      setTeams(mine); if (mine[0]) setTeamId((id) => id || mine[0].id)
    })
    supabase.from('galas').select('*').gte('gala_date', new Date().toISOString().slice(0, 10)).order('gala_date').then(({ data }) => setGalas(data || []))
    supabase.from('galas').select('*').order('gala_date').then(({ data }) => setAllGalas(data || []))
    supabase.from('documents').select('*').in('audience', ['coaches', 'public']).order('title').then(({ data }) => setDocs(data || []))
  }, [isStaff, coachTeams])

  useEffect(() => {
    if (!teamId) return
    supabase.from('players').select('*').eq('team_id', teamId).eq('status', 'approved').order('last_name').order('first_name').then(async ({ data }) => {
      const ids = (data || []).map((p) => p.id)
      const { data: gs } = ids.length ? await supabase.from('player_guardians').select('player_id, profile_id').in('player_id', ids) : { data: [] }
      const pids = [...new Set((gs || []).map((g) => g.profile_id))]
      const { data: pr } = pids.length ? await supabase.from('profiles').select('id, full_name, phone, email').in('id', pids) : { data: [] }
      const pm = Object.fromEntries((pr || []).map((x) => [x.id, x]))
      setPlayers((data || []).map((p) => ({ ...p, guardians: (gs || []).filter((g) => g.player_id === p.id).map((g) => pm[g.profile_id]).filter(Boolean) })))
      if (!ids.length) return setEntries({})
      const { data: e } = await supabase.from('gala_entries').select('*').in('player_id', ids)
      setEntries(Object.fromEntries((e || []).map((x) => [x.gala_id + ':' + x.player_id, x.response])))
    })
  }, [teamId])

  const team = teams.find((t) => t.id === teamId)
  const seasonGalas = allGalas.filter((g) => !team || g.season === team.season)
  const today = new Date().toISOString().slice(0, 10)
  const gala = seasonGalas.find((g) => g.id === galaId) || seasonGalas.find((g) => g.gala_date >= today) || seasonGalas[seasonGalas.length - 1]
  const count = (g, r) => players.filter((p) => entries[g + ':' + p.id] === r).length
  return (
    <div className="wrap">
      <h1>Coaches</h1>
      <ForumLatest limit={3} title="Latest in the forum" />
      {teams.length === 0 ? <div className="card"><p>You're not linked to a team yet. Ask the committee to add you as a coach.</p></div> : (
        <>
          <div className="tabs">{teams.map((t) => <button key={t.id} className={t.id === teamId ? 'on' : ''} onClick={() => setTeamId(t.id)}>{t.name}</button>)}</div>
          {team && <p className="muted">{team.format} · {team.training} · {players.length} players</p>}
          {galas.length > 0 && (
            <section><h2>Gala availability</h2>
              <div className="cards">{galas.map((g) => <div key={g.id} className="card"><h3>{fmtDate(g.gala_date)}</h3><p className="muted">{g.host_club}</p><p><span className="pill good">{count(g.id, 'yes')} yes</span> <span className="pill wait">{count(g.id, 'maybe')} maybe</span> <span className="pill bad">{count(g.id, 'no')} no</span> <span className="pill">{players.length - count(g.id, 'yes') - count(g.id, 'maybe') - count(g.id, 'no')} no reply</span></p></div>)}</div>
            </section>
          )}
          {team && gala && (
            <section><h2>Gala games</h2>
              <p className="muted small">Add your team's games from the draw – time, pitch and opponent – then the score and who scored. Times and scores show publicly on Gala days; scorers show only to signed-in club families, coaches and volunteers (first name and initial).</p>
              <div className="tabs">{seasonGalas.map((g) => <button key={g.id} className={g.id === gala.id ? 'on' : ''} onClick={() => setGalaId(g.id)}>{fmtDate(g.gala_date, { day: 'numeric', month: 'short' })} · {g.host_club.replace(/ (SC|FC)$/, '')}</button>)}</div>
              <p className="small">{fmtDate(gala.gala_date)}{gala.start_time ? ` · starts ${gala.start_time}` : ''}{gala.venue ? ` · ${gala.venue}` : ''}{gala.address ? `, ${gala.address}` : ''}{gala.draw_url ? <> · <a href={gala.draw_url} target="_blank" rel="noreferrer">Draw</a></> : null}</p>
              <GameEditor key={gala.id + team.id} gala={gala} team={team} squad={players} />
            </section>
          )}
          <section><h2>Squad</h2>
            <div className="table-wrap"><table>
              <thead><tr><th>Player</th><th>Born</th><th>Parent</th><th>Medical / notes</th><th>Photos OK</th>{galas.map((g) => <th key={g.id}>{fmtDate(g.gala_date, { day: 'numeric', month: 'short' })}</th>)}</tr></thead>
              <tbody>{players.map((p) => <tr key={p.id}>
                <td><b>{p.first_name} {p.last_name}</b>{p.release_check && <div className="release">⚠ Check with the executive before releasing</div>}<KitTags p={p} staff={false} /></td><td>{p.dob ? fmtDate(p.dob, { year: 'numeric' }) : ''}</td>
                <td className="small">{p.guardians?.length ? p.guardians.map((g) => <div key={g.id}>{g.full_name || g.email}{g.phone ? <> · <a href={'tel:' + g.phone.replace(/\s/g, '')}>{g.phone}</a></> : ''}</div>) : <span className="muted">—</span>}</td>
                <td className={p.medical_notes ? 'alert' : 'muted'}>{p.medical_notes || '—'}</td><td>{p.photo_consent ? 'Yes' : 'No'}</td>
                {galas.map((g) => { const v = entries[g.id + ':' + p.id]; return <td key={g.id} className={'rs ' + (v || '')}>{v === 'yes' ? '✓' : v === 'no' ? '✗' : v === 'maybe' ? '?' : ''}</td> })}
              </tr>)}</tbody>
            </table></div>
          </section>
        </>
      )}
      <section><h2>Coaching resources</h2><ul className="links">{docs.map((d) => <li key={d.id}><a href={d.url} target="_blank" rel="noreferrer">{d.title}</a></li>)}</ul></section>
    </div>
  )
}
