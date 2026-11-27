import { useEffect, useState } from 'react'
import { supabase, ROSTER_SEASON } from '../supabase'
import { AGE_GROUPS, gameLength } from './About'

// One simple table: each team (or the usual age groups before teams are set).
export default function Teams() {
  const [teams, setTeams] = useState(null)
  useEffect(() => {
    supabase.from('teams').select('*').eq('season', ROSTER_SEASON).order('sort_order').then(({ data }) => setTeams(data || []))
  }, [])
  const ageOf = (g) => AGE_GROUPS.find((a) => a[0] === g)?.[1] || ''
  const rows = teams === null ? [] : teams.length
    ? teams.map((t) => ({ key: t.id, team: t.name, group: t.age_group, age: ageOf(t.age_group), format: t.format, length: gameLength(t.age_group), coaches: t.coach_names || 'TBA', training: t.training || 'TBA' }))
    : AGE_GROUPS.map(([g, a, f, l]) => ({ key: g, team: `Under ${g.slice(1)}`, group: g, age: a, format: f, length: l, coaches: 'TBA', training: 'TBA' }))
  return (
    <div className="wrap">
      <h1>Teams & age groups</h1>
      <p className="lead">"Under" means "turning": an Under 9 player turns 9 during the calendar year. Teams follow Football Australia MiniRoos formats.</p>
      {teams && teams.length === 0 && <p className="muted">{ROSTER_SEASON} squads and coaches are set once registrations close. These are the age groups we usually run.</p>}
      <div className="card flush">
        <div className="table-wrap">
          <table className="stack teams-table">
            <thead><tr><th>Team</th><th>Age in {ROSTER_SEASON}</th><th>Format</th><th>Game length</th><th>Coaches</th><th>Training</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td data-label="Team"><b>{r.team}</b></td>
                  <td data-label={`Age in ${ROSTER_SEASON}`}>{r.age}</td>
                  <td data-label="Format">{r.format}</td>
                  <td data-label="Game length">{r.length}</td>
                  <td data-label="Coaches" className={r.coaches === 'TBA' ? 'muted' : ''}>{r.coaches}</td>
                  <td data-label="Training">{r.training}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="muted small">Game lengths follow Football Victoria's MiniRoos guidelines (Under 6 to Under 11), with a 5-minute half-time and equal game time for every player. Under 5 and Under 13 times are confirmed by the gala host on the day.</p>
    </div>
  )
}
