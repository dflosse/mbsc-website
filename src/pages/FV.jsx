import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'

// Summarised from FV's 2026 Annual Club Membership Criteria, Renewal Checklist and Process documents (Oct 2026).
const CRITERIA = [
  ['Incorporated association', 'The club must be incorporated (Associations Incorporation Reform Act 2012).'],
  ['Members can vote', 'All players (or their parent/guardian) are club members who can vote for office-bearers.'],
  ['Follows the rules', 'FA and FV rules and policies, Victoria\'s Child Safe Standards and ATO requirements.'],
  ['Solvent', 'The club can pay its debts and owes nothing to FV.'],
  ['Fees published', 'All fees, costs and charges must be publicly disclosed – see About us.'],
  ['AGM held', 'Within 18 months before 1 December, with the Annual Statement lodged with Consumer Affairs Victoria.'],
  ['Renewal by 31 December', 'Annual Club Membership renewal form submitted every year.'],
]
const NOMINATE = [
  ['Authorised Applicant', 'Completes and signs the renewal form'],
  ['Primary & Secondary FV Contact', 'Receive all FV communications'],
  ['Game Day Contact', 'Published on the FV website for other clubs'],
  ['MPIO', 'Member Protection Information Officer (if the club has one)'],
  ['Committee of Management', 'Contact details for every elected member'],
  ['Authorised Club Delegate', 'Attends and votes at the FV AGM'],
  ['PlayFootball administrators', 'Run registrations; must hold a current WWCC'],
]

export default function FV() {
  const { isStaff, isCoach } = useAuth()
  const [docs, setDocs] = useState([])
  useEffect(() => { supabase.from('documents').select('*').eq('category', 'Football Victoria').order('title').then(({ data }) => setDocs(data || [])) }, [])
  const pub = docs.filter((d) => d.audience === 'public' || d.audience === 'members')
  const coach = docs.filter((d) => d.audience === 'coaches')
  const comm = docs.filter((d) => d.audience === 'committee')
  const List = ({ items }) => <ul className="doclist">{items.map((d) => <li key={d.id}><a href={d.url} target="_blank" rel="noreferrer">{d.title}</a>{d.notes && <span className="muted small"> – {d.notes}</span>}</li>)}</ul>

  return (
    <div className="wrap">
      <h1>Football Victoria</h1>
      <p className="lead">Mt Beauty FC is a member club of Football Victoria (FV), the governing body for soccer in Victoria. FV registration gives every player insurance cover and lets them play in FV-sanctioned competitions like our Alpine Valleys gala days.</p>
      <div className="grid2">
        <section>
          <h2>For families</h2>
          <div className="card">
            <h3>Registering with FV</h3>
            <p>Each season every player is registered through FV's <b>PlayFootball</b> system, which is also where the fee is paid. The club emails the link when registrations open. Register your child on this site too so coaches and the committee have their details.</p>
            <p><Link to="/about#fees">See fees and how to pay →</Link></p>
          </div>
          <h3>Links</h3>
          <List items={pub} />
          {(isCoach || isStaff) && coach.length > 0 && <><h3>For coaches</h3><List items={coach} /></>}
        </section>
        <aside>
          <div className="card soft">
            <h3>Child safety</h3>
            <p>As an FV member club we follow Victoria's Child Safe Standards. Volunteers working with children, and our PlayFootball administrators, need a current Working With Children Check.</p>
            <p className="small">Concerns can be raised with any committee member, or with FV directly.</p>
          </div>
        </aside>
      </div>

      {isStaff && (
        <section className="committee-only">
          <h2>Committee: FV membership & compliance</h2>
          <p className="muted small">Visible to committee only. Summarised from FV's 2026 membership documents (Oct 2026) – check the originals below before submitting.</p>
          <div className="grid2">
            <div>
              <h3>What the club must meet (Associate Member Club)</h3>
              <ul className="checks">{CRITERIA.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}</ul>
            </div>
            <div>
              <h3>People to nominate on the renewal form</h3>
              <ul className="checks">{NOMINATE.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}</ul>
              <p className="small">Fill these on the <Link to="/committee/roles">Committee roles</Link> tab – they show publicly on About us.</p>
              <div className="card callout"><b>Upload with the renewal:</b> minutes of the most recent AGM. Also the constitution, logo or ABN if any changed.</div>
            </div>
          </div>
          <h3>FV documents & forms</h3>
          <List items={comm} />
        </section>
      )}
    </div>
  )
}
