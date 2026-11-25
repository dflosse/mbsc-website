import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import useSettings from '../useSettings'

export const AGE_GROUPS = [
  ['U5', 'Turning 5', '4v4, no goalkeeper'],
  ['U6', 'Turning 6', '4v4, no goalkeeper'],
  ['U7', 'Turning 7', '4v4, no goalkeeper'],
  ['U9', 'Turning 8–9', '7v7 with goalkeeper'],
  ['U11', 'Turning 10–11', '9v9 with goalkeeper'],
  ['U13', 'Turning 12–13', '9v9 with goalkeeper'],
]

export function FeesCard({ s, compact }) {
  return (
    <div className="card fees" id="fees">
      <h3>Fees & registration</h3>
      <dl>
        <dt>Season fee</dt><dd>{s.fees || 'TBA'}</dd>
        {!compact && s.fees_includes && <><dt>What it covers</dt><dd>{s.fees_includes}</dd></>}
        <dt>How to pay</dt><dd>{s.payment || 'TBA'}</dd>
        {!compact && <><dt>Loan uniform bond</dt><dd>{s.uniform_bond || 'TBA'} – refundable when the uniform is returned</dd>
        <dt>Loan boots bond</dt><dd>{s.boots_bond || 'TBA'} – refundable when the boots are returned (boots subject to availability)</dd></>}
      </dl>
      {!compact && <p className="muted small">Football Victoria requires member clubs to publish all fees and charges.</p>}
    </div>
  )
}

export default function About() {
  const s = useSettings()
  const loc = useLocation()
  const [roles, setRoles] = useState([])
  useEffect(() => {
    supabase.from('committee_roles').select('*').order('season', { ascending: false }).order('sort_order').then(({ data }) => {
      const latest = data?.[0]?.season
      setRoles((data || []).filter((r) => r.season === latest))
    })
  }, [])
  useEffect(() => { if (loc.hash === '#fees') setTimeout(() => document.getElementById('fees')?.scrollIntoView({ behavior: 'smooth' }), 300) }, [loc.hash])
  const groups = roles.reduce((a, r) => ((a[r.grp || 'Committee'] = a[r.grp || 'Committee'] || []).push(r), a), {})
  const vacant = roles.filter((r) => !r.person).length

  return (
    <>
      <section className="band green">
        <div className="wrap">
          <h1>About the club</h1>
          <p className="lead">{'Mount Beauty Football Club has run junior soccer in the Kiewa Valley since 2003. We\'re a small, volunteer-run club: parents coach, parents run the canteen, and kids from 4 to 13 learn the game in a fun, safe and friendly way.'}</p>
        </div>
      </section>
      <div className="wrap">
        <div className="facts">
          <div><b>Who</b><span>Boys and girls aged 4–13 (born 2014–2022 for 2027)</span></div>
          <div><b>When</b><span>School Term 2 (April–June), training Wednesdays 4–5pm</span></div>
          <div><b>Where</b><span>Les Peart Oval, Pool Road, Mount Beauty</span></div>
          <div><b>Games</b><span>Alpine Valleys gala days with Bright, Myrtleford and Yackandandah</span></div>
        </div>

        <div className="grid2">
          <section>
            <h2>How a season works</h2>
            <ol className="steps">
              <li><b>Register</b> – sign in here, add your child, then complete Football Victoria registration and payment (link emailed by the club).</li>
              <li><b>Come n Try day</b> – new families welcome before the season starts.</li>
              <li><b>Training</b> – one hour a week, run by volunteer parent coaches in age-group squads.</li>
              <li><b>Gala days</b> – about five Sunday or Saturday mornings across the valley. Short games, no ladders, all about having a go.</li>
              <li><b>End of season</b> – a celebration with awards for every age group.</li>
            </ol>
            <h2>Age groups</h2>
            <p className="muted small">"Under" means "turning" – an Under 9 player turns 9 (or 8) during the year. We follow Football Australia MiniRoos formats.</p>
            <div className="table-wrap"><table><thead><tr><th>Group</th><th>Age in the year</th><th>Format</th></tr></thead>
              <tbody>{AGE_GROUPS.map(([g, a, f]) => <tr key={g}><td><b>{g}</b></td><td>{a}</td><td>{f}</td></tr>)}</tbody></table></div>
          </section>
          <aside>
            <FeesCard s={s} />
            <div className="card soft">
              <h3>Key dates</h3>
              <dl><dt>AGM</dt><dd>{s.agm || 'TBA'}</dd><dt>Come n Try</dt><dd>{s.come_n_try || 'TBA'}</dd><dt>Gala days</dt><dd><Link to="/galas">TBA – see Gala days</Link></dd></dl>
            </div>
            <div className="card"><h3>Contact</h3><p>mtbeautysoccerclub@gmail.com</p><p className="muted small">Or message the committee once you've signed in.</p></div>
          </aside>
        </div>

        <h2>Committee {roles[0]?.season}</h2>
        {vacant > 0 && <div className="card callout"><p><b>We need you.</b> {vacant} roles are open. The club only runs because parents put their hand up – most roles are a few hours a term. <Link to="/volunteer">Apply to volunteer →</Link></p></div>}
        <div className="cards">
          {Object.entries(groups).map(([g, rs]) => (
            <div key={g} className="card">
              <h3>{g}</h3>
              <ul className="roles">{rs.map((r) => <li key={r.id}><span>{r.role}</span><b className={r.person ? '' : 'vacant'}>{r.person || 'Vacant'}</b>{r.notes && <small>{r.notes}</small>}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
