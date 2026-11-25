import { useEffect, useState } from 'react'
import { supabase, ROSTER_SEASON } from '../supabase'
import { AGE_GROUPS } from './About'

export default function Teams() {
  const [teams, setTeams] = useState(null)
  useEffect(() => {
    supabase.from('teams').select('*').eq('season', ROSTER_SEASON).order('sort_order').then(({ data }) => setTeams(data || []))
  }, [])
  return (
    <div className="wrap">
      <h1>Teams & age groups</h1>
      <p className="lead">"Under" means "turning": an Under 9 player turns 9 during the calendar year. Teams follow Football Australia MiniRoos formats.</p>
      {teams && teams.length === 0 ? (
        <>
          <div className="card soft"><p><b>{ROSTER_SEASON} squads and coaches are TBA.</b> They're set once registrations close. We usually run these age groups:</p></div>
          <div className="cards">
            {AGE_GROUPS.map(([g, a, f]) => <div key={g} className="card team"><span className="tag">{g}</span><h3>Under {g.slice(1)}</h3><p>{a}</p><p><b>Format:</b> {f}</p><p><b>Coaches:</b> TBA</p></div>)}
          </div>
        </>
      ) : (
        <div className="cards">
          {(teams || []).map((t) => (
            <div key={t.id} className="card team">
              <span className="tag">{t.age_group}</span>
              <h3>{t.name}</h3>
              <p><b>Format:</b> {t.format}</p>
              <p><b>Coaches:</b> {t.coach_names || 'TBA'}</p>
              <p><b>Training:</b> {t.training}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
