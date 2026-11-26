import { useEffect, useState, useCallback, useMemo, Fragment } from 'react'
import { NavLink, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { supabase, REG_SEASON, PREV_SEASON, fmtDate, ageGroupFor } from '../supabase'
import { useAuth } from '../auth'
import EditTable, { useLive } from './EditTable'
import useSettings, { refreshSettings } from '../useSettings'
import { KitTags, kitText } from './kitInfo'
import { wwccState } from './Volunteer'
import Treasurer from './Treasurer'
import Assets from './Assets'
import Preseason, { STAGES, GROUPS } from './Preseason'
import Email from './Email'
import { bondInfo } from './bond'
import { sortPlayers, TEAM_SEL } from './sortPlayers'

// Committee pages grouped into sections. Each page has a one-line "what this is for".
const PAGES = {
  overview: ['Home', 'What needs doing now, at a glance.'],
  preseason: [`${REG_SEASON} Preseason`, 'Everything to get the season ready: key dates, where we\'re at, and the checklist.'],
  galas: ['Galas', 'Gala dates, team entries, gala-day jobs and results.'],
  teams: ['Teams', 'This season\'s teams, coaches and squads. Move players between teams here.'],
  tasks: ['Action list', 'Every club job in one list, including the preseason checklist.'],
  approvals: ['Approve applications', 'Approve new player registrations and volunteer, coach and committee applications.'],
  players: ['Players', 'All registered players: edit details, link parents, check PlayFootball and fees.'],
  wwcc: ['WWCC register', 'Working With Children Checks: check, connect in WWC Connect, and track expiry.'],
  people: ['People & access', 'Who has an account and what they can see. Invite new people here.'],
  kit: ['Uniforms', 'Uniforms for this season, and jerseys still out from last season.'],
  registers: ['Keys & assets', 'Who holds which key, and the club\'s equipment and assets.'],
  email: ['Send email', 'Email families, coaches, the committee or key contacts from the club address.'],
  contacts: ['Contacts & handover', 'Key contacts (Shire, Football Victoria, suppliers) and handover notes.'],
  docs: ['Documents', 'Club documents and useful links.'],
  roles: ['Committee roles', 'Who holds each committee and Football Victoria role. Shown on About the club.'],
  treasurer: ['Treasurer', 'Money in and out, grants and bonds.'],
  settings: ['Fees & settings', 'Fees, training times and contact details shown across the public site.'],
  audit: ['Change log', 'A record of every change made on the site.'],
  start: ['Start here', 'How the committee pages work. Start here if you\'re new.'],
}
const SECTIONS = [
  { key: 'home', label: 'Home', pages: ['overview'] },
  { key: 'season', label: 'This season', pages: ['preseason', 'galas', 'teams', 'tasks'] },
  { key: 'people', label: 'People', pages: ['approvals', 'players', 'wwcc', 'people'], exec: true },
  { key: 'gear', label: 'Gear', pages: ['kit', 'registers'] },
  { key: 'admin', label: 'Club admin', pages: ['email', 'contacts', 'docs', 'roles', 'treasurer', 'settings', 'audit'] },
  { key: 'start', label: 'Start here', pages: ['start'] },
]
const EXEC_ONLY = ['approvals', 'wwcc', 'players', 'people', 'email', 'audit']

export default function Committee() {
  const { isExec } = useAuth()
  const loc = useLocation()
  const page = loc.pathname.split('/')[2] || 'overview'
  const can = (p) => isExec || !EXEC_ONLY.includes(p)
  const sections = SECTIONS.map((x) => ({ ...x, pages: x.pages.filter(can) })).filter((x) => x.pages.length && (!x.exec || isExec))
  const current = sections.find((x) => x.pages.includes(page)) || sections[0]
  const [menu, setMenu] = useState(false)
  useEffect(() => { setMenu(false) }, [page])
  const link = (p) => (
    <NavLink key={p} to={'/committee/' + p} className={'cn-link' + (p === 'preseason' ? ' feature' : '')}>
      <span>{PAGES[p][0]}</span>{EXEC_ONLY.includes(p) && <em>Exec</em>}
    </NavLink>
  )
  return (
    <div className="wrap wide">
      <h1 className="cmte-title">Committee</h1>
      <div className="cmte">
        <aside className={'cmte-nav' + (menu ? ' open' : '')} aria-label="Committee pages">
          <button className="cn-toggle" onClick={() => setMenu(!menu)} aria-expanded={menu}>
            <span className="muted small">{current.key === 'home' || current.key === 'start' ? 'Committee' : current.label}</span>
            <b>{PAGES[page]?.[0] || 'Home'}</b><span className="chev" aria-hidden>{menu ? '▴' : '▾'}</span>
          </button>
          <div className="cn-list">
            <NavLink to="/committee/start" className="cn-start"><b>Start here</b><span>New to the committee? How it all works.</span></NavLink>
            <NavLink to="/committee/overview" className="cn-link home"><span>Home</span></NavLink>
            {sections.filter((x) => x.key !== 'home' && x.key !== 'start').map((x) => (
              <div key={x.key} className="cn-group">
                <h4>{x.label}</h4>
                {x.pages.map(link)}
              </div>
            ))}
            {!isExec && <p className="muted small cn-note">Players, approvals, the WWCC register and club emails are for the executive only.</p>}
          </div>
        </aside>
        <div className="cmte-main">
          {page !== 'overview' && page !== 'start' && PAGES[page] && (
            <div className="page-head">
              <p className="crumb">{current.label} <span aria-hidden>›</span> {PAGES[page][0]}{EXEC_ONLY.includes(page) && <span className="pill">Executive only</span>}</p>
              <p className="page-desc">{PAGES[page][1]}</p>
            </div>
          )}
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="preseason" element={<Preseason />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="directory" element={<Navigate to="/committee/players" replace />} />
        <Route path="wwcc" element={<WWCCRegister />} />
        <Route path="players" element={<PlayersTab />} />
        <Route path="galas" element={<Galas />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="email" element={<Email />} />
        <Route path="kit" element={<Kit />} />
        <Route path="registers" element={<Registers />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="teams" element={<Teams />} />
        <Route path="people" element={<People />} />
        <Route path="docs" element={<Docs />} />
        <Route path="roles" element={<Roles />} />
        <Route path="treasurer" element={<Treasurer />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit" element={<Audit />} />
        <Route path="start" element={<CommitteeStart />} />
      </Routes>
        </div>
      </div>
    </div>
  )
}

function Overview() {
  const { isExec } = useAuth()
  const [s, setS] = useState(null)
  const [att, setAtt] = useState(null)
  const [dates, setDates] = useState([])
  const load = useCallback(async () => {
    const c = async (t, f) => { let q = supabase.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q); return (await q).count ?? 0 }
    const today = new Date().toISOString().slice(0, 10)
    const soon = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
    const [{ data: tasks }, { data: teams }, { data: roles }, { data: kd }] = await Promise.all([
      supabase.from('tasks').select('id, due, status').eq('season', REG_SEASON).neq('status', 'done'),
      supabase.from('teams').select('coach_names').eq('season', REG_SEASON).or('active.is.null,active.eq.true'),
      supabase.from('committee_roles').select('grp, role, person').eq('season', REG_SEASON).in('grp', ['Executive', 'Football Victoria contacts']),
      supabase.from('key_dates').select('*').eq('season', REG_SEASON).order('on_date', { nullsFirst: false }),
    ])
    setDates((kd || []).filter((d) => d.on_date && d.on_date >= today).slice(0, 4))
    const items = []
    const add = (n, text, to, urgent) => n > 0 && items.push({ n, text, to, urgent })
    if (isExec) {
      add(await c('players', (q) => q.eq('status', 'pending')), 'player registrations waiting for approval', 'approvals', true)
      add(await c('volunteer_roles', (q) => q.eq('status', 'pending')), 'volunteer, coach or committee applications waiting', 'approvals', true)
      const { data: w } = await supabase.from('wwcc').select('*')
      const { data: active } = await supabase.from('volunteer_roles').select('profile_id').in('status', ['approved', 'pending'])
      const ids = new Set((active || []).map((x) => x.profile_id))
      const mine = (w || []).filter((x) => ids.has(x.profile_id))
      add(mine.filter((x) => !x.status_checked_at || !x.wwc_connected_at).length, 'WWCCs to check or connect in WWC Connect', 'wwcc', true)
      add(mine.filter((x) => x.expiry && x.expiry < today).length, 'WWCCs expired', 'wwcc', true)
      add(mine.filter((x) => x.expiry && x.expiry >= today && x.expiry <= new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)).length, 'WWCCs expiring in the next 2 months', 'wwcc')
    }
    add((tasks || []).filter((t) => t.due && t.due < today).length, 'jobs overdue', 'preseason', true)
    add((tasks || []).filter((t) => t.due && t.due >= today && t.due <= soon).length, 'jobs due in the next 2 weeks', 'preseason')
    add((teams || []).filter((t) => !t.coach_names?.trim()).length, `${REG_SEASON} teams without a coach`, 'teams')
    const vac = (roles || []).filter((r) => !r.person?.trim())
    add(vac.filter((r) => r.grp === 'Executive').length, 'executive roles vacant', 'roles')
    add(vac.filter((r) => r.grp !== 'Executive').length, 'Football Victoria contact roles to fill', 'roles')
    setAtt(items)
    setS({
      reg: isExec ? await c('players', (q) => q.eq('season', REG_SEASON).neq('status', 'withdrawn')) : null,
      unpaid: isExec ? await c('players', (q) => q.eq('season', REG_SEASON).neq('status', 'withdrawn').eq('fees_paid', false)) : null,
      open: (tasks || []).length,
      uniReq: isExec ? await c('players', (q) => q.eq('season', REG_SEASON).neq('status', 'withdrawn').eq('needs_uniform', true)) : null,
      kitOut: await c('kit', (q) => q.eq('season', PREV_SEASON).in('status', ['Loaned Out', 'Outstanding'])),
      users: isExec ? await c('profiles') : null,
    })
  }, [isExec])
  useEffect(() => { load() }, [load])
  useLive(isExec ? ['players', 'volunteer_roles', 'wwcc', 'tasks', 'teams', 'committee_roles', 'key_dates'] : ['tasks', 'teams', 'committee_roles', 'key_dates'], load)
  if (!s) return <p className="muted">Loading…</p>
  return (
    <>
    <StartPanel />
    <div className="dash">
      <div className="dash-main">
        <section className="card attention">
          <h2>Needs your attention</h2>
          {att.length === 0 ? <p className="ok-line">✓ Nothing urgent right now.</p> : (
            <ul>{att.map((a) => <li key={a.text}><Link to={'/committee/' + a.to} className={a.urgent ? 'urgent' : ''}><b>{a.n}</b> {a.text}<span aria-hidden>→</span></Link></li>)}</ul>
          )}
        </section>
        <PreseasonBanner />
        <div className="stats">
          {isExec && <Stat n={s.reg} l={`${REG_SEASON} players registered`} to="players" />}
          {isExec && <Stat n={s.unpaid} l={`${REG_SEASON} fees not yet paid`} to="players" warn={s.unpaid > 0} />}
          <Stat n={s.open} l="open jobs" to="tasks" />
          {isExec && <Stat n={s.uniReq} l="children needing a uniform" to="kit" />}
          <Stat n={s.kitOut} l={`${PREV_SEASON} jerseys still out`} to="kit" />
          {isExec && <Stat n={s.users} l="site accounts" to="people" />}
        </div>
      </div>
      <aside className="dash-side">
        <section className="card">
          <h3>Coming up</h3>
          {dates.length === 0 ? <p className="muted small">No dates set yet. <Link to="/committee/preseason">Add key dates</Link></p> : (
            <ul className="plain upcoming">{dates.map((d) => <li key={d.id}><b>{fmtDate(d.on_date, { weekday: 'short', day: 'numeric', month: 'short' })}</b><span>{d.label}{d.public === false && <span className="muted small"> · committee only</span>}</span></li>)}</ul>
          )}
          <Link to="/committee/preseason" className="small">All key dates →</Link>
        </section>
      </aside>
    </div>
    </>
  )
}

function StartPanel() {
  const { isExec } = useAuth()
  const quick = START_JOBS.filter(([, , ex, top]) => top && (isExec || !ex)).slice(0, 6)
  return (
    <section className="start-panel">
      <div className="sp-head">
        <div><h2>Start here</h2><p>New to the committee, or not sure where something is? Pick what you want to do.</p></div>
        <Link to="/committee/start" className="btn">Full guide</Link>
      </div>
      <div className="sp-grid">
        {quick.map(([t, to]) => <Link key={t} to={'/committee/' + to} className="sp-tile"><span>{t}</span><b aria-hidden>→</b></Link>)}
      </div>
    </section>
  )
}

const START_JOBS = [
    ['Approve a new family or volunteer', 'approvals', true, true],
    ['Check a coach\'s Working With Children Check', 'wwcc', true, true],
    ['Find a player, fix their details or link a second parent', 'players', true],
    ['Put players into teams, or add a coach to a team', 'teams', false, true],
    ['See what needs doing before the season, and tick jobs off', 'preseason', false, true],
    ['Set or change the key dates (AGM, Come n Try, first training)', 'preseason'],
    ['Email families, coaches or the committee', 'email', true, true],
    ['Hand out or record a uniform', 'kit', false, true],
    ['Record who has a key, or update the equipment list', 'registers', false, true],
    ['Change fees, training times or the club email shown on the site', 'settings', false, true],
    ['Update who holds a committee role', 'roles'],
    ['Add a gala, or record gala-day jobs', 'galas', false, true],
    ['Find a phone number (Shire, Football Victoria, suppliers)', 'contacts', false, true],
    ['See who changed something', 'audit', true],
]

function CommitteeStart() {
  const { isExec } = useAuth()
  const jobs = START_JOBS
  return (
    <div className="start-guide">
      <section className="card">
        <h2>How these pages work</h2>
        <ul>
          <li><b>The website is the one place club information is kept.</b> Change things here, not in old spreadsheets – Google Drive copies are read-only.</li>
          <li><b>Changes save straight away</b> and show for everyone, everywhere on the site. For example, change the fee in Fees & settings and it updates on the home page, About the club and the registration form.</li>
          <li><b>Every change is logged</b> with who made it, so nothing can go missing.</li>
          <li><b>Children's details are protected.</b> Only the executive sees them, and everyone with access signs in with two-factor (Face ID or a 6-digit code).</li>
          <li>The buttons at the top group the pages: <b>This season</b>, <b>People</b> (exec only), <b>Gear</b> and <b>Club admin</b>. Each page says what it's for at the top.</li>
        </ul>
      </section>
      <section className="card">
        <h2>I want to…</h2>
        <ul className="plain jobs">
          {jobs.filter(([, , ex]) => isExec || !ex).map(([t, to]) => <li key={t}><Link to={'/committee/' + to}>{t}<span aria-hidden>→</span></Link></li>)}
        </ul>
        {!isExec && <p className="muted small">Some jobs (approvals, players, WWCC, emails) are for the executive only. Ask the President or Secretary.</p>}
      </section>
    </div>
  )
}

function PreseasonBanner() {
  const [c, setC] = useState(null)
  useEffect(() => { supabase.from('tasks').select('status').eq('season', REG_SEASON).not('stage', 'is', null).then(({ data }) => setC({ done: (data || []).filter((t) => t.status === 'done').length, total: (data || []).length })) }, [])
  if (!c || !c.total) return null
  return <NavLink to="/committee/preseason" className="pre-banner"><b>{REG_SEASON} preseason</b><span className="bar"><span style={{ width: `${(c.done / c.total) * 100}%` }} /></span><span>{c.done} of {c.total} done · open checklist →</span></NavLink>
}
const Stat = ({ n, l, to, warn }) => <NavLink to={'/committee/' + to} className={'stat' + (warn ? ' warn' : '')}><b>{n ?? '–'}</b><span>{l}</span></NavLink>

function useTeams() {
  const [teams, setTeams] = useState([])
  useEffect(() => { supabase.from('teams').select('id,name,season').order('season', { ascending: false }).order('sort_order').then(({ data }) => setTeams(data || [])) }, [])
  return teams
}

function PlayersGrid({ season }) {
  const teams = useTeams()
  const [linkFor, setLinkFor] = useState(null)
  const filter = useCallback((q) => q.eq('season', season), [season])
  const order = useMemo(() => [['status', false], ['last_name']], [])
  const teamOpts = teams.filter((t) => t.season === season).map((t) => [t.id, t.name])
  const [note, setNote] = useState('')
  async function rollOver(r) {
    const { data: exists } = await supabase.from('players').select('id').eq('season', REG_SEASON).eq('first_name', r.first_name).eq('last_name', r.last_name).eq('dob', r.dob)
    if (exists?.length) return setNote(`${r.first_name} ${r.last_name} is already on the ${REG_SEASON} list.`)
    const { data: ins, error } = await supabase.from('players').insert({ season: REG_SEASON, first_name: r.first_name, last_name: r.last_name, dob: r.dob, gender: r.gender, medical_notes: r.medical_notes, photo_consent: r.photo_consent, status: 'pending', committee_notes: `Returning from ${PREV_SEASON}` }).select()
    if (error) return setNote(error.message)
    const { data: g } = await supabase.from('player_guardians').select('profile_id').eq('player_id', r.id)
    if (ins?.[0] && g?.length) await supabase.from('player_guardians').insert(g.map((x) => ({ player_id: ins[0].id, profile_id: x.profile_id })))
    setNote(`${r.first_name} ${r.last_name} copied to ${REG_SEASON} as pending${g?.length ? ' and linked to their parents' : ''}.`)
  }
  return (
    <>
      {note && <p className="ok">{note}</p>}
      <p className="muted small">Spreadsheet view for quick bulk changes – edits save as you go. {season === PREV_SEASON ? `Use ➜${REG_SEASON} to carry a returning player over. ` : ''}Use 🔗 to link a parent's account.</p>
      <EditTable live key={season} table="players" filter={filter} order={order} select={'*, ' + TEAM_SEL} sortRows={sortPlayers} search={['first_name', 'last_name']}
        defaults={{ season, first_name: 'New', last_name: 'Player', status: 'pending' }}
        cols={[
          { key: 'first_name', label: 'First', width: 100 }, { key: 'last_name', label: 'Last', width: 110 },
          { key: 'dob', label: 'DOB', type: 'date', width: 140 },
          { key: 'gender', label: 'G', type: 'select', options: [['F', 'F'], ['M', 'M'], ['X', 'X']] },
          { key: 'team_id', label: 'Team', type: 'select', options: teamOpts, width: 140 },
          { key: 'status', label: 'Status', type: 'select', options: [['pending', 'Pending'], ['approved', 'Approved'], ['withdrawn', 'Withdrawn']], width: 115 },
          { key: 'fv_registered', label: 'FV reg', type: 'bool' }, { key: 'fees_paid', label: 'Paid', type: 'bool' },
          { key: 'medical_notes', label: 'Medical', type: 'textarea', width: 140 },
          { key: 'photo_consent', label: 'Photos', type: 'bool' },
          { key: 'needs_uniform', label: 'Uniform', type: 'bool' }, { key: 'uniform_size', label: 'U size', width: 60 },
          { key: 'needs_boots', label: 'Boots', type: 'bool' }, { key: 'boot_size', label: 'Boot size', width: 60 },
          { key: 'boots_status', label: 'Boots status', type: 'select', options: [['none', '—'], ['requested', 'Interested'], ['allocated', 'Allocated'], ['waitlist', 'Waitlist'], ['returned', 'Returned']], width: 105 },
          { key: 'bond_paid', label: 'Bond paid', type: 'bool' }, { key: 'bond_refunded', label: 'Bond back', type: 'bool' },
          { key: 'committee_notes', label: 'Committee notes', type: 'textarea', width: 140 },
        ]}
        rowActions={(r, reload) => <>
          <button className="link" title="Link parent account" onClick={() => setLinkFor(r)}>🔗</button>
          {season === PREV_SEASON && <button className="link" title={`Copy to ${REG_SEASON} as a returning player`} onClick={() => rollOver(r)}>➜{REG_SEASON}</button>}
        </>}
      />
      {linkFor && <LinkParent player={linkFor} onClose={() => setLinkFor(null)} />}
    </>
  )
}

// One child's details in a form (Players tab → Edit).
function PlayerEditor({ p, teams, onDone }) {
  const F = ['first_name', 'last_name', 'dob', 'gender', 'team_id', 'status', 'fv_registered', 'fees_paid', 'medical_notes', 'photo_consent', 'emergency_contact', 'needs_uniform', 'uniform_size', 'needs_boots', 'boot_size', 'boots_status', 'bond_paid', 'bond_refunded', 'committee_notes']
  const [f, setF] = useState(Object.fromEntries(F.map((k) => [k, p[k] ?? (typeof p[k] === 'boolean' ? false : '')])))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const t = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const b = (k) => (e) => setF({ ...f, [k]: e.target.checked })
  async function save(e) {
    e.preventDefault(); setBusy(true)
    const row = Object.fromEntries(F.map((k) => [k, f[k] === '' ? null : f[k]]))
    const { error } = await supabase.from('players').update(row).eq('id', p.id)
    setBusy(false)
    if (error) return setErr(error.message)
    onDone()
  }
  async function rollOver() {
    const { data: exists } = await supabase.from('players').select('id').eq('season', REG_SEASON).eq('first_name', p.first_name).eq('last_name', p.last_name).eq('dob', p.dob)
    if (exists?.length) return setErr(`${p.first_name} is already on the ${REG_SEASON} list.`)
    const { data: ins, error } = await supabase.from('players').insert({ season: REG_SEASON, first_name: p.first_name, last_name: p.last_name, dob: p.dob, gender: p.gender, medical_notes: p.medical_notes, photo_consent: p.photo_consent, status: 'pending', committee_notes: `Returning from ${PREV_SEASON}` }).select()
    if (error) return setErr(error.message)
    const { data: g } = await supabase.from('player_guardians').select('profile_id').eq('player_id', p.id)
    if (ins?.[0] && g?.length) await supabase.from('player_guardians').insert(g.map((x) => ({ player_id: ins[0].id, profile_id: x.profile_id })))
    onDone()
  }
  return (
    <form className="player-edit" onSubmit={save}>
      <div className="ae-grid">
        <label>First name<input value={f.first_name} onChange={t('first_name')} required /></label>
        <label>Surname<input value={f.last_name} onChange={t('last_name')} required /></label>
        <label>Date of birth<input type="date" value={f.dob} onChange={t('dob')} /></label>
        <label>Gender<select value={f.gender} onChange={t('gender')}><option value="">—</option><option value="F">Girl</option><option value="M">Boy</option><option value="X">Other / prefer not to say</option></select></label>
        <label>Team<select value={f.team_id} onChange={t('team_id')}><option value="">No team yet</option>{teams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label>Status<select value={f.status} onChange={t('status')}><option value="pending">Awaiting sign-off</option><option value="approved">Approved</option><option value="withdrawn">Withdrawn</option></select></label>
        <label className="wide">Medical / allergies<input value={f.medical_notes} onChange={t('medical_notes')} /></label>
        <label className="half">Emergency contact<input value={f.emergency_contact} onChange={t('emergency_contact')} /></label>
        <label className="half">Committee notes (exec only)<input value={f.committee_notes} onChange={t('committee_notes')} /></label>
        <label>Uniform size<input value={f.uniform_size} onChange={t('uniform_size')} /></label>
        <label>Boot size<input value={f.boot_size} onChange={t('boot_size')} /></label>
        <label>Loan boots<select value={f.boots_status} onChange={t('boots_status')}><option value="none">—</option><option value="requested">Interested</option><option value="allocated">Allocated</option><option value="waitlist">Waitlist</option><option value="returned">Returned</option></select></label>
      </div>
      <div className="ticks-row">
        {[['fv_registered', 'FV registered'], ['fees_paid', 'Fees paid'], ['photo_consent', 'Photos OK'], ['needs_uniform', 'Needs a uniform'], ['needs_boots', 'Wants loan boots'], ['bond_paid', 'Bond paid'], ['bond_refunded', 'Bond refunded']].map(([k, l]) => <label key={k} className="check"><input type="checkbox" checked={!!f[k]} onChange={b(k)} /> {l}</label>)}
      </div>
      {err && <p className="err small">{err}</p>}
      <div className="row"><button className="btn small" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="btn small ghost" onClick={onDone}>Cancel</button>{p.season === PREV_SEASON && <button type="button" className="link small" onClick={rollOver}>Copy to {REG_SEASON} as returning player</button>}</div>
    </form>
  )
}

function PlayersTab() {
  const [season, setSeason] = useState(REG_SEASON)
  const [view, setView] = useState('list')
  const bar = <>
    <span>Season:</span>{[PREV_SEASON, REG_SEASON].map((x) => <button key={x} className={'btn small ' + (x === season ? '' : 'ghost')} onClick={() => setSeason(x)}>{x}</button>)}
    <span className="seg"><button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>List</button><button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}>Spreadsheet</button></span>
  </>
  return view === 'list' ? <PlayersList key={season} season={season} toolbarExtra={bar} /> : <><div className="row">{bar}</div><PlayersGrid key={season} season={season} /></>
}

function LinkParent({ player, onClose }) {
  const { user } = useAuth()
  const [links, setLinks] = useState([])
  const [invites, setInvites] = useState([])
  const [people, setPeople] = useState([])
  const [q, setQ] = useState('')
  const [inv, setInv] = useState({ name: '', email: '', relationship: '' })
  const [msg, setMsg] = useState(null)
  const load = useCallback(async () => {
    const { data } = await supabase.from('player_guardians').select('profile_id, profiles(email, full_name, phone)').eq('player_id', player.id)
    setLinks(data || [])
    const { data: gi } = await supabase.from('guardian_invites').select('*').eq('player_id', player.id).is('claimed_at', null)
    setInvites(gi || [])
  }, [player.id])
  useEffect(() => { load() }, [load])
  useEffect(() => { supabase.from('profiles').select('id, full_name, email').order('full_name').then(({ data }) => setPeople(data || [])) }, [])
  const linked = new Set(links.map((l) => l.profile_id))
  const matches = q.trim().length < 2 ? [] : people.filter((p) => !linked.has(p.id) && `${p.full_name} ${p.email}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6)
  async function link(pid) {
    const { error } = await supabase.from('player_guardians').insert({ player_id: player.id, profile_id: pid })
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Linked – they can see ' + player.first_name + ' under My family now.' }); setQ(''); load()
  }
  async function unlink(l) {
    if (!window.confirm(`Unlink ${l.profiles?.full_name || l.profiles?.email} from ${player.first_name}? They'll no longer see ${player.first_name} on the site.`)) return
    await supabase.from('player_guardians').delete().eq('player_id', player.id).eq('profile_id', l.profile_id); load()
  }
  async function cancelInvite(i) { await supabase.from('guardian_invites').delete().eq('id', i.id); load() }
  async function sendInvite(email, name) {
    setMsg(null)
    const { data, error: fe } = await supabase.functions.invoke('invite-member', { body: { email, full_name: name || '', kind: 'parent' } })
    let err = data?.error
    if (fe && !err) { try { err = (await fe.context.json()).error } catch { err = fe.message } }
    setMsg(err ? { ok: false, text: `Email not sent: ${err}` } : { ok: true, text: `Invitation emailed to ${email}.` })
    return err
  }
  async function invite(e) {
    e.preventDefault(); setMsg(null)
    const email = inv.email.trim().toLowerCase()
    const existing = people.find((p) => (p.email || '').toLowerCase() === email)
    if (existing) return link(existing.id)
    const { error } = await supabase.from('guardian_invites').insert({ player_id: player.id, email, name: inv.name.trim(), relationship: inv.relationship.trim() || null, invited_by: user.id, approved: true })
    if (error) return setMsg({ ok: false, text: error.message })
    const { data, error: fe } = await supabase.functions.invoke('invite-member', { body: { email, full_name: inv.name.trim(), kind: 'parent' } })
    let err = data?.error
    if (fe && !err) { try { err = (await fe.context.json()).error } catch { err = fe.message } }
    setMsg(err ? { ok: true, text: `Saved – ${email} will be linked as soon as they sign up (the email didn't send: ${err}).` } : { ok: true, text: `Invitation emailed to ${email}. ${player.first_name} will appear for them as soon as they set a password.` })
    setInv({ name: '', email: '', relationship: '' }); load()
  }
  return (
    <div className="modal" onClick={onClose}><div className="card form parents-modal" onClick={(e) => e.stopPropagation()}>
      <h3>Parents and guardians of {player.first_name} {player.last_name}</h3>
      {links.length === 0 && invites.length === 0 && <p className="muted small">No one linked yet.</p>}
      <ul className="plain">
        {links.map((l) => <li key={l.profile_id}><span><b>{l.profiles?.full_name || l.profiles?.email}</b><br /><span className="small muted">{l.profiles?.email}{l.profiles?.phone ? ` · ${l.profiles.phone}` : ''}</span></span><button className="link danger small" onClick={() => unlink(l)}>Unlink</button></li>)}
        {invites.map((i) => <li key={i.id}><span><b>{i.name || i.email}</b> <span className="pill wait small-pill">invited – not signed up yet</span><br /><span className="small muted">{i.email}{i.relationship ? ` · ${i.relationship}` : ''}</span></span><span className="row small-gap"><button className="link small" onClick={() => sendInvite(i.email, i.name)}>Send email</button><button className="link danger small" onClick={() => cancelInvite(i)}>Cancel</button></span></li>)}
      </ul>
      <label>Link someone who already has an account<input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      {matches.length > 0 && <ul className="plain picks">{matches.map((p) => <li key={p.id}><span>{p.full_name || p.email}<br /><span className="small muted">{p.email}</span></span><button className="btn small" onClick={() => link(p.id)}>Link</button></li>)}</ul>}
      {q.trim().length >= 2 && matches.length === 0 && <p className="small muted">No account matches – invite them below.</p>}
      <form onSubmit={invite} className="invite-parent">
        <b className="small">Not on the site yet? Invite them</b>
        <div className="ae-grid">
          <label>Name<input value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} required /></label>
          <label>Email<input type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} required /></label>
          <label>Relationship<input value={inv.relationship} onChange={(e) => setInv({ ...inv, relationship: e.target.value })} placeholder="Mum, Dad, grandparent…" /></label>
        </div>
        <button className="btn small">Send invitation</button>
      </form>
      {msg && <p className={msg.ok ? 'ok small' : 'err small'}>{msg.text}</p>}
      <p className="small muted">Each parent's contact details stay hidden from the other. For custody arrangements, use the custody note.</p>
      <button className="btn ghost small" onClick={onClose}>Done</button>
    </div></div>
  )
}

function Galas() {
  const order = useMemo(() => [['gala_date', false]], [])
  const [sel, setSel] = useState(null)
  const [jobs, setJobs] = useState(null)
  return (
    <>
      <EditTable table="galas" order={order} defaults={{ season: REG_SEASON, gala_date: `${REG_SEASON}-05-01`, host_club: 'TBC' }}
        cols={[
          { key: 'season', label: 'Season', type: 'number', width: 70 }, { key: 'gala_date', label: 'Date', type: 'date' },
          { key: 'host_club', label: 'Host', width: 120 }, { key: 'venue', label: 'Venue', width: 120 }, { key: 'address', label: 'Address', width: 140 },
          { key: 'start_time', label: 'Start', width: 70 }, { key: 'signup_closes', label: 'RSVP by', type: 'date' },
          { key: 'draw_url', label: 'Draw link', width: 120 }, { key: 'info', label: 'Info for families', type: 'textarea', width: 180 },
        ]}
        rowActions={(r) => <><button className="link" title="Who's coming" onClick={() => setSel(r)}>👥</button><button className="link" title="Volunteer jobs" onClick={() => setJobs(r)}>🧰</button></>} />
      {sel && <GalaEntries gala={sel} onClose={() => setSel(null)} />}
      {jobs && <GalaJobs gala={jobs} onClose={() => setJobs(null)} />}
    </>
  )
}

function GalaEntries({ gala, onClose }) {
  const [rows, setRows] = useState([])
  useEffect(() => {
    supabase.from('gala_entries').select('response, note, players(first_name,last_name, teams(name))').eq('gala_id', gala.id).then(({ data }) => setRows(data || []))
  }, [gala.id])
  const by = rows.reduce((a, r) => { const t = r.players?.teams?.name || 'No team'; (a[t] = a[t] || []).push(r); return a }, {})
  const copy = () => navigator.clipboard.writeText(Object.entries(by).map(([t, rs]) => t + ':\n' + rs.filter((r) => r.response === 'yes').map((r) => r.players.first_name + ' ' + r.players.last_name).join('\n')).join('\n\n'))
  return (
    <div className="modal" onClick={onClose}><div className="card" onClick={(e) => e.stopPropagation()}>
      <h3>{gala.host_club} – {fmtDate(gala.gala_date)}</h3>
      {rows.length === 0 && <p className="muted">No responses yet.</p>}
      {Object.entries(by).map(([t, rs]) => <div key={t}><h4>{t} – {rs.filter((r) => r.response === 'yes').length} playing</h4><p className="small">{rs.map((r) => <span key={r.players.first_name + r.players.last_name} className={'pill ' + (r.response === 'yes' ? 'good' : r.response === 'no' ? 'bad' : 'wait')}>{r.players.first_name} {r.players.last_name}</span>)}</p></div>)}
      <div className="row"><button className="btn small" onClick={copy}>Copy team lists</button><button className="btn ghost small" onClick={onClose}>Close</button></div>
    </div></div>
  )
}

function Tasks() {
  const [season, setSeason] = useState(REG_SEASON)
  const filter = useCallback((q) => q.eq('season', season), [season])
  const order = useMemo(() => [['status'], ['due', true]], [])
  return (
    <>
      <div className="row"><span>Season:</span>{[PREV_SEASON, REG_SEASON].map((s) => <button key={s} className={'btn small ' + (s === season ? '' : 'ghost')} onClick={() => setSeason(s)}>{s}</button>)}</div>
      <EditTable key={season} table="tasks" filter={filter} order={order} search={['title', 'owner', 'notes']} defaults={{ season, title: 'New action', owner: 'Exec' }}
        cols={[
          { key: 'title', label: 'Action', type: 'textarea', width: 220 }, { key: 'owner', label: 'Who', type: 'select', options: GROUPS.map((g) => [g, g]), width: 100 },
          { key: 'due', label: 'Due', type: 'date' },
          { key: 'status', label: 'Status', type: 'select', options: [['todo', 'To do'], ['doing', 'Doing'], ['done', 'Done']] },
          { key: 'category', label: 'Area', width: 90 }, { key: 'stage', label: 'Preseason section', type: 'select', options: STAGES.map((x) => [x.key, x.title]), width: 130 }, { key: 'notes', label: 'Notes', type: 'textarea', width: 260 },
        ]} />
    </>
  )
}

function KitRequests() {
  const { isExec } = useAuth()
  const s = useSettings()
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data } = await supabase.from('players').select('id, first_name, last_name, dob, season, uniform_size, boot_size, needs_uniform, needs_boots, boots_status, bond_paid, bond_refunded, created_at, ' + TEAM_SEL)
      .eq('season', REG_SEASON).neq('status', 'withdrawn').or('needs_uniform.eq.true,needs_boots.eq.true')
    setRows(sortPlayers(data))
  }, [])
  useEffect(() => { load() }, [load])
  async function set(id, patch) { const { error } = await supabase.from('players').update(patch).eq('id', id); setErr(error?.message || ''); load() }
  const [pays, setPays] = useState({})
  useEffect(() => { (async () => {
    const { data } = await supabase.from('payments').select('player_id, status, amount_cents, refundable_cents, refunded_cents').eq('kind', 'uniform_bond').in('status', ['paid', 'refunded', 'partially_refunded'])
    setPays(Object.fromEntries((data || []).map((x) => [x.player_id, x])))
  })() }, [rows])
  async function refund(r) {
    const p = pays[r.id]
    if (!confirm(`Refund $${(p.refundable_cents / 100).toFixed(2)} to ${r.first_name} ${r.last_name}'s family through Stripe? Only do this once the uniform is back.`)) return
    const { data, error } = await supabase.functions.invoke('refund-bond', { body: { player_id: r.id } })
    let m = data?.error; if (error && !m) { try { m = (await error.context.json()).error } catch { m = error.message } }
    setErr(m || ''); load()
  }
  const boots = rows.filter((r) => r.needs_boots)
  const out = boots.filter((r) => r.boots_status === 'allocated').length
  return (
    <section className="card">
      <h3>{REG_SEASON} uniform and boots requests</h3>
      <p className="small muted">Asked for on the registration form. Loan boots: {boots.length} families interested, {out} allocated (very limited supply). Bonds: boots {s.boots_bond || 'TBA'}, uniform {bondInfo(s).text}. Sorted by team, youngest first. {isExec ? '' : 'Only the executive can allocate boots or record bonds.'}</p>
      {err && <p className="err">{err}</p>}
      {rows.length === 0 ? <p className="muted">No requests yet.</p> : (
        <div className="table-wrap"><table className="stack auto-label">
          <thead><tr><th>Child</th><th>Uniform</th><th>Boots interest</th><th>Boots status</th><th>Bond paid</th><th>Bond refunded</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}>
            <td>{r.first_name} {r.last_name} <span className="muted small">{ageGroupFor(r.dob, REG_SEASON)}</span></td>
            <td>{r.needs_uniform ? (r.uniform_size || 'yes') : ''}</td>
            <td>{r.needs_boots ? (r.boot_size || 'size ?') : ''}</td>
            <td>{r.needs_boots && (isExec ? <select value={r.boots_status} onChange={(e) => set(r.id, { boots_status: e.target.value })}>
              {[['requested', 'Interested'], ['allocated', 'Allocated'], ['waitlist', 'Waitlist'], ['returned', 'Returned']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select> : r.boots_status)}</td>
            <td>{pays[r.id] ? <span className="pill good">Paid online</span> : isExec ? <label className="check small"><input type="checkbox" checked={r.bond_paid} onChange={(e) => set(r.id, { bond_paid: e.target.checked })} /> paid another way</label> : (r.bond_paid ? 'Yes' : '')}</td>
            <td>{r.bond_refunded ? <span className="pill">Refunded</span> : pays[r.id]?.status === 'paid' && isExec ? <button className="btn small ghost" onClick={() => refund(r)}>Refund ${(pays[r.id].refundable_cents / 100).toFixed(0)}</button> : isExec ? <input type="checkbox" checked={r.bond_refunded} onChange={(e) => set(r.id, { bond_refunded: e.target.checked })} /> : ''}</td>
          </tr>)}</tbody>
        </table></div>
      )}
    </section>
  )
}

const OUT = ['Loaned Out', 'Outstanding']
const kitNow = (q) => q.eq('season', REG_SEASON)
const kitPrevOut = (q) => q.eq('season', PREV_SEASON).in('status', OUT)
const kitPrevAll = (q) => q.eq('season', PREV_SEASON)
const KIT_STATUS = [['Shed Tub', 'In the shed'], ['Loaned Out', 'Still out'], ['Outstanding', 'Overdue'], ['Returned', 'Returned'], ['Written off', 'Written off']]

function Kit() {
  const order = useMemo(() => [['sort_order'], ['jersey_label']], [])
  const { isExec } = useAuth()
  const [players, setPlayers] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [outCount, setOutCount] = useState(null)
  const countOut = useCallback(() => { supabase.from('kit').select('*', { count: 'exact', head: true }).eq('season', PREV_SEASON).in('status', OUT).then(({ count }) => setOutCount(count ?? 0)) }, [])
  useEffect(() => { countOut() }, [countOut])
  useLive(['kit'], countOut)
  useEffect(() => { supabase.from('players').select('id, first_name, last_name, season, dob, ' + TEAM_SEL).gte('season', PREV_SEASON).neq('status', 'withdrawn').then(({ data }) => setPlayers(sortPlayers(data))) }, [])
  const popts = players.map((p) => [p.id, `${p.first_name} ${p.last_name} (${p.season})`])
  const markReturned = (r, reload) => r.status !== 'Returned' && <button className="btn small ghost" onClick={async () => { await supabase.from('kit').update({ status: 'Returned', returned_on: new Date().toISOString().slice(0, 10) }).eq('id', r.id); reload() }}>Returned</button>
  return (
    <>
      <h2>{REG_SEASON} uniforms</h2>
      <div className="card callout"><p style={{ margin: 0 }}><b>New uniforms for {REG_SEASON}.</b> Numbers and sizes are still to be confirmed. Once they arrive, add each jersey below (+ Add row) and link it to a child so their family sees it under My family.</p></div>
      <KitRequests />
      <h3>{REG_SEASON} jerseys</h3>
      <EditTable live table="kit" filter={kitNow} order={order} search={['holder_name', 'jersey_label', 'notes']} defaults={{ season: REG_SEASON, jersey_label: 'TBA', size: 'TBA', status: 'Shed Tub', sort_order: 999 }}
        cols={[
          { key: 'jersey_label', label: '#', width: 60 }, { key: 'size', label: 'Size', width: 70 },
          ...(isExec ? [{ key: 'player_id', label: 'Child', type: 'select', options: popts.filter(([, l]) => l.endsWith(`(${REG_SEASON})`)), width: 180 }] : []),
          { key: 'status', label: 'Where it is', type: 'select', options: KIT_STATUS, width: 120 },
          { key: 'bond_paid', label: 'Bond paid', type: 'bool' }, { key: 'bond_refunded', label: 'Bond refunded', type: 'bool' },
          { key: 'notes', label: 'Notes', width: 180 },
        ]} />

      <details className="past">
        <summary>{PREV_SEASON} jerseys – {outCount === null ? '…' : outCount === 0 ? 'all returned' : `${outCount} still to come back`}</summary>
        <p className="muted small">{showAll ? `Every ${PREV_SEASON} jersey.` : `Only jerseys that haven't come back yet.`} Click <b>Returned</b> when one comes back – it drops off this list. Tick <b>Bond refunded</b> once the family's bond has been paid back. <button className="link" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show only outstanding' : `Show all ${PREV_SEASON} jerseys`}</button></p>
        <EditTable live key={showAll ? 'all' : 'out'} table="kit" filter={showAll ? kitPrevAll : kitPrevOut} order={order} search={['holder_name', 'jersey_label', 'notes']} noAdd
          cols={[
            { key: 'jersey_label', label: '#', width: 50 }, { key: 'size', label: 'Size', width: 60 },
            { key: 'holder_name', label: 'Who has it', width: 160 },
            { key: 'status', label: 'Returned?', type: 'select', options: KIT_STATUS, width: 120 },
            { key: 'returned_on', label: 'Returned on', type: 'date', width: 140 },
            { key: 'bond_paid', label: 'Bond paid', type: 'bool' }, { key: 'bond_refunded', label: 'Bond refunded', type: 'bool' },
            { key: 'notes', label: 'Notes', width: 160 },
          ]}
          rowActions={markReturned} />
        <p className="small muted">Jersey numbers repeat across print runs: plain numbers are the first run (1–55), R = repeated run, N = newer size-14 run.</p>
      </details>
    </>
  )
}

const TEAM_COLS = [
  { key: 'season', label: 'Season', type: 'number', width: 70 }, { key: 'name', label: 'Name', width: 120 }, { key: 'age_group', label: 'Age', width: 60 },
  { key: 'format', label: 'Format', width: 150 }, { key: 'coach_names', label: 'Coaches (shown publicly)', width: 150 },
  { key: 'training', label: 'Training', width: 170 }, { key: 'sort_order', label: 'Order', type: 'number', width: 60 },
]
const thisSeason = (q) => q.eq('season', REG_SEASON)
const pastSeasons = (q) => q.lt('season', REG_SEASON)
async function teamDeleteWarning(t) {
  const c = async (tbl) => (await supabase.from(tbl).select('*', { count: 'exact', head: true }).eq('team_id', t.id)).count || 0
  const [players, coaches, games] = await Promise.all([c('players'), c('team_coaches'), c('gala_games')])
  const lines = [`Delete the team "${t.name}" (${t.season})?`, '']
  if (players) lines.push(`• ${players} player${players > 1 ? 's' : ''} will be left without a team.`)
  if (coaches) lines.push(`• ${coaches} coach${coaches > 1 ? 'es' : ''} will lose access to this team.`)
  if (games) lines.push(`• ${games} gala game${games > 1 ? 's' : ''} and their goal scorers will be deleted.`)
  if (!players && !coaches && !games) lines.push('Nothing is linked to this team yet.')
  lines.push('', 'This can\'t be undone. Press OK only if you mean to delete it.')
  return lines.join('\n')
}

// Players under each team. Moving a player here or on the Players tab updates both straight away.
function Squads() {
  const { isExec } = useAuth()
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data: t } = await supabase.from('teams').select('id, name, age_group, sort_order').eq('season', REG_SEASON).order('sort_order')
    setTeams(t || [])
    const { data: p } = await supabase.from('players').select('id, first_name, last_name, dob, status, team_id, ' + TEAM_SEL).eq('season', REG_SEASON).neq('status', 'withdrawn')
    setPlayers(sortPlayers(p || []))
  }, [])
  useEffect(() => { load() }, [load])
  useLive(['players', 'teams'], load)
  async function move(p, team_id) {
    setPlayers((ps) => ps.map((x) => x.id === p.id ? { ...x, team_id: team_id || null } : x))
    const { error } = await supabase.from('players').update({ team_id: team_id || null }).eq('id', p.id)
    setErr(error?.message || ''); if (error) load()
  }
  if (!isExec) return <p className="muted small">Squad lists (children's names) are visible to the executive only.</p>
  const groups = [...teams.map((t) => ({ t, list: players.filter((p) => p.team_id === t.id) })), { t: null, list: players.filter((p) => !p.team_id || !teams.some((t) => t.id === p.team_id)) }]
  return (
    <section className="squads">
      <h2>{REG_SEASON} squads</h2>
      <p className="muted small">Move a child by choosing a different team. It saves straight away and shows on the Players tab too. Pending registrations are included and marked.</p>
      {err && <p className="err">{err}</p>}
      <div className="squad-grid">
        {groups.map(({ t, list }) => (
          <div key={t?.id || 'none'} className={'card squad' + (t ? '' : ' unassigned')}>
            <div className="row between"><h3>{t ? t.name : 'Not in a team yet'}</h3><span className="pill">{list.length}</span></div>
            {list.length === 0 ? <p className="muted small">{t ? 'No players yet.' : 'Everyone has a team.'}</p> : (
              <ul className="squad-list">{list.map((p) => (
                <li key={p.id}>
                  <span><b>{p.first_name} {p.last_name}</b>{p.status === 'pending' && <span className="pill wait small-pill">pending</span>}<br /><span className="small muted">{p.dob ? `born ${p.dob.slice(0, 4)} · ${ageGroupFor(p.dob, REG_SEASON)}` : ''}</span></span>
                  <select aria-label={`Team for ${p.first_name} ${p.last_name}`} value={t ? t.id : ''} onChange={(e) => move(p, e.target.value)}><option value="">No team</option>{teams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                </li>
              ))}</ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function Teams() {
  const order = useMemo(() => [['sort_order'], ['name']], [])
  const pastOrder = useMemo(() => [['season', false], ['sort_order']], [])
  return (
    <>
      <h2>{REG_SEASON} teams</h2>
      <p className="muted small">Add, rename or split teams here (e.g. "Under 9 Red" and "Under 9 Green"), then assign children below or on the Players tab, and coaches under People &amp; access. Coaches' names show on the public Teams page.</p>
      <EditTable live table="teams" filter={thisSeason} order={order} defaults={{ season: REG_SEASON, name: 'New team', age_group: 'U?', sort_order: 99 }} cols={TEAM_COLS} confirmDelete={teamDeleteWarning} deleteLabel="Delete" />
      <Squads />
      <details className="past">
        <summary>Past seasons</summary>
        <EditTable table="teams" filter={pastSeasons} order={pastOrder} cols={TEAM_COLS} noAdd confirmDelete={teamDeleteWarning} deleteLabel="Delete" />
      </details>
    </>
  )
}

function Invite({ onSent }) {
  const [f, setF] = useState({ full_name: '', email: '', kind: 'coach' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  async function send(e) {
    e.preventDefault(); setMsg(null); setBusy(true)
    const { data, error } = await supabase.functions.invoke('invite-member', { body: f })
    setBusy(false)
    let text = data?.error
    if (error && !text) { try { text = (await error.context.json()).error } catch { text = error.message } }
    if (text) return setMsg({ ok: false, text })
    setMsg({ ok: true, text: `Invitation sent to ${f.email}. Their application will appear in Approve applications once they've added their WWCC.` })
    setF({ full_name: '', email: '', kind: f.kind }); onSent?.()
  }
  return (
    <form className="card" onSubmit={send}>
      <h3 style={{ marginTop: 0 }}>Invite someone</h3>
      <p className="small muted">Emails them a link to join, with their role already chosen. It gives them no access on its own – they still add their WWCC and you approve them as usual.</p>
      <div className="invite-grid">
        <label>Name<input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required /></label>
        <label>Email<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></label>
        <label>Joining as<select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
          <option value="executive">Executive (President, VP, Secretary, Treasurer)</option><option value="committee">Committee member</option>
          <option value="coach">Coach</option><option value="volunteer">Volunteer</option><option value="parent">Parent / family</option></select></label>
        <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send invitation'}</button>
      </div>
      {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
    </form>
  )
}

// One "Access" choice per person. Executive = President, VP, Secretary or Treasurer: full admin access.
const ACCESS_OPTS = [['exec', 'Executive (full access)'], ['committee', 'Committee'], ['coach', 'Coach'], ['volunteer', 'Volunteer'], ['parent', 'Parent / family']]
const accessOf = (p) => (p.is_executive || p.role === 'admin' ? 'exec' : p.role)
const ACCESS_RANK = { exec: 0, committee: 1, coach: 2, volunteer: 3, parent: 4 }
const KIND_LABEL = { executive: 'Executive', committee: 'Committee', coach: 'Coach', volunteer: 'Volunteer' }

function People() {
  const { isAdmin, isExec, user } = useAuth()
  const teams = useTeams()
  const [people, setPeople] = useState([])
  const [tc, setTc] = useState([])
  const [apps, setApps] = useState([])
  const [acct, setAcct] = useState({})
  const [posts, setPosts] = useState([])
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*')
    setPeople(data || [])
    const { data: t } = await supabase.from('team_coaches').select('*')
    setTc(t || [])
    const { data: v } = await supabase.from('volunteer_roles').select('profile_id, kind, status, detail, teams(name)').eq('season', REG_SEASON).in('status', ['pending', 'approved'])
    setApps(v || [])
    const { data: cr } = await supabase.from('committee_roles').select('role, person, sort_order').eq('season', REG_SEASON).eq('grp', 'Executive').order('sort_order')
    setPosts(cr || [])
    if ((data || []).length) {
      const { data: st } = await supabase.rpc('account_status', { p_ids: data.map((x) => x.id) })
      setAcct(Object.fromEntries((st || []).map((x) => [x.id, x])))
    }
  }, [])
  useEffect(() => { load() }, [load])
  async function setAccess(p, v) {
    if (v === accessOf(p)) return
    if (v === 'exec' && !window.confirm(`Give ${p.full_name || p.email} full executive access? They'll see all children's details, approve people and change settings. Only for the President, Vice President, Secretary and Treasurer.`)) return load()
    if (accessOf(p) === 'exec' && !window.confirm(`Remove ${p.full_name || p.email}'s executive access?`)) return load()
    const patch = v === 'exec' ? { role: 'admin', is_executive: true } : { role: v, is_executive: false }
    const { error } = await supabase.from('profiles').update(patch).eq('id', p.id)
    setErr(error?.message || ''); load()
  }
  async function addCoach(profile_id, team_id) { if (!team_id) return; const { error } = await supabase.from('team_coaches').insert({ profile_id, team_id }); setErr(error?.message || ''); load() }
  async function rmCoach(profile_id, team_id) { await supabase.from('team_coaches').delete().eq('profile_id', profile_id).eq('team_id', team_id); load() }
  const tname = (id) => { const t = teams.find((x) => x.id === id); return t ? `${t.name} ${t.season}` : '' }
  const postOf = (p) => posts.filter((r) => r.person && p.full_name && r.person.toLowerCase().includes(p.full_name.toLowerCase())).map((r) => r.role)
  const sorted = [...people].sort((x, y) => (ACCESS_RANK[accessOf(x)] - ACCESS_RANK[accessOf(y)]) || ((posts.findIndex((r) => postOf(x).includes(r.role)) + 99) % 99 - (posts.findIndex((r) => postOf(y).includes(r.role)) + 99) % 99) || (x.full_name || x.email).localeCompare(y.full_name || y.email))
  const execCount = people.filter((p) => accessOf(p) === 'exec').length
  return (
    <>
      <p className="muted small note-wide">Choose each person's <b>Access</b>. <b>Executive</b> is for the President, Vice President, Secretary and Treasurer ({execCount} of 4 filled{execCount >= 4 ? '' : ` – ${4 - execCount} to go`}) and gives full access. Everyone else starts with family access; coach, committee and volunteer access is normally added by approving their application. Only the executive sees children's personal details.</p>
      {err && <p className="err">{err}</p>}
      {isExec ? <Invite onSent={load} /> : <div className="card"><h3 style={{ marginTop: 0 }}>Invite someone</h3><p className="small">Inviting is for the executive and needs your two-factor code for this sign-in. <a href="/security">Enter your code</a>, then come back here.</p></div>}
      <div className="table-wrap"><table className="people stack auto-label">
        <thead><tr><th>Name</th><th>Joined</th><th>Access</th><th>Applications ({REG_SEASON})</th><th>Coaches team</th></tr></thead>
        <tbody>{sorted.map((p) => {
          const st = acct[p.id]
          const mine = apps.filter((x) => x.profile_id === p.id)
          const invitedBy = mine.find((x) => /^Invited by/.test(x.detail || ''))?.detail
          const post = postOf(p)
          return <tr key={p.id}>
            <td><b>{p.full_name || '—'}</b>{post.length > 0 && <span className="pill good small-pill">{post.join(', ')}</span>}<br /><span className="small muted">{p.email}{p.phone ? ` · ${p.phone}` : ''}</span></td>
            <td className="small">{st?.invited_at ? <>{invitedBy || 'Invited'}<br /><span className={st.confirmed_at ? 'muted' : 'warn-text'}>{st.confirmed_at ? `Accepted ${fmtDate(st.confirmed_at.slice(0, 10), { day: 'numeric', month: 'short' })}` : 'Hasn\'t accepted yet'}</span></> : <>Signed up themselves<br /><span className="muted">{p.created_at ? fmtDate(p.created_at.slice(0, 10), { day: 'numeric', month: 'short' }) : ''}</span></>}</td>
            <td>{isAdmin && p.id !== user.id ? <select value={accessOf(p)} onChange={(e) => setAccess(p, e.target.value)}>{ACCESS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select> : ACCESS_OPTS.find(([v]) => v === accessOf(p))?.[1]}</td>
            <td className="small">{mine.length === 0 ? <span className="muted">—</span> : mine.map((x, i) => <span key={i} className={'pill ' + (x.status === 'approved' ? 'good' : 'wait')}>{KIND_LABEL[x.kind]}{x.teams?.name ? ` · ${x.teams.name}` : ''}: {x.status === 'approved' ? 'approved' : 'pending'}</span>)}</td>
            <td>{tc.filter((t) => t.profile_id === p.id).map((t) => <span key={t.team_id} className="pill">{tname(t.team_id)} <button className="link danger" onClick={() => rmCoach(p.id, t.team_id)}>×</button></span>)}
              <select value="" onChange={(e) => addCoach(p.id, e.target.value)}><option value="">+ team</option>{teams.filter((t) => t.season === REG_SEASON).map((t) => <option key={t.id} value={t.id}>{t.name} {t.season}</option>)}</select></td>
          </tr>
        })}</tbody>
      </table></div>
    </>
  )
}

function Docs() {
  const order = useMemo(() => [['category'], ['title']], [])
  return <EditTable table="documents" order={order} defaults={{ title: 'New link', url: 'https://', audience: 'committee' }}
    cols={[
      { key: 'title', label: 'Title', width: 200 }, { key: 'url', label: 'Link (Google Drive, website…)', width: 260 }, { key: 'category', label: 'Category', type: 'select', options: [['Football Victoria', 'Football Victoria'], ['Committee', 'Committee'], ['Coaching', 'Coaching'], ['Families', 'Families'], ['Galas', 'Galas'], ['Rules', 'Rules']], width: 130 },
      { key: 'audience', label: 'Who can see', type: 'select', options: [['public', 'Public'], ['members', 'Families'], ['coaches', 'Coaches'], ['committee', 'Committee']] },
      { key: 'notes', label: 'Note', width: 180 },
    ]} />
}

function Roles() {
  const order = useMemo(() => [['season', false], ['sort_order']], [])
  return <EditTable table="committee_roles" order={order} defaults={{ season: REG_SEASON, role: 'New role', grp: 'Club volunteer roles', sort_order: 99 }}
    cols={[{ key: 'season', label: 'Season', type: 'number', width: 70 },
      { key: 'grp', label: 'Group', type: 'select', options: [['Executive', 'Executive'], ['General committee', 'General committee'], ['Football Victoria contacts', 'Football Victoria contacts'], ['Club volunteer roles', 'Club volunteer roles']], width: 170 },
      { key: 'role', label: 'Role', width: 220 }, { key: 'person', label: 'Person (blank = vacant)', width: 180 }, { key: 'notes', label: 'Note (shown publicly)', width: 220 }, { key: 'sort_order', label: 'Order', type: 'number', width: 50 }]} />
}

function Settings() {
  const order = useMemo(() => [['key']], [])
  useEffect(() => () => { refreshSettings() }, [])
  return (
    <>
      <p className="muted small">Change something here and it updates everywhere it's shown – the home page, About the club, the footer, the privacy statement and the registration form. Football Victoria requires the club to publish all fees and charges. Key dates (AGM, Come n Try, first training) are set on the <Link to="/committee/preseason">Preseason</Link> page.</p>
      <EditTable table="settings" order={order} defaults={{ key: 'new_' + Date.now(), label: 'New setting' }}
        cols={[{ key: 'label', label: 'Setting', width: 160 }, { key: 'value', label: 'Text shown on the site', type: 'textarea', width: 520 }]} />
    </>
  )
}

function Approvals() {
  const { isExec } = useAuth()
  const [players, setPlayers] = useState([])
  const [apps, setApps] = useState([])
  const [wwcc, setWwcc] = useState({})
  const [people, setPeople] = useState({})
  const [msg, setMsg] = useState('')
  const [open, setOpen] = useState(null)
  const [gInv, setGInv] = useState([])
  const [dupes, setDupes] = useState({})
  const [acct, setAcct] = useState({})
  const [fixing, setFixing] = useState(null)
  const load = useCallback(async () => {
    const { data: p0 } = await supabase.from('players').select('*, ' + TEAM_SEL + ', player_guardians(profile_id)').eq('status', 'pending')
    const p = sortPlayers(p0)
    setPlayers(p)
    const { data: all } = await supabase.from('players').select('id, first_name, last_name, dob, season, status, created_at')
    const dm = {}
    for (const x of p || []) { const m = (all || []).filter((y) => y.id !== x.id && sameChild(x, y)); if (m.length) dm[x.id] = m }
    setDupes(dm)
    const { data: gi } = await supabase.from('guardian_invites').select('*, players(first_name, last_name)').eq('approved', false).order('created_at')
    setGInv(gi || [])
    const { data: a } = await supabase.from('volunteer_roles').select('*, teams(name)').eq('status', 'pending').order('created_at')
    setApps(a || [])
    const ids = [...new Set([...(a || []).map((x) => x.profile_id), ...(p || []).flatMap((x) => (x.player_guardians || []).map((g) => g.profile_id)), ...(gi || []).map((x) => x.invited_by)])]
    if (ids.length) {
      const { data: pr } = await supabase.from('profiles').select('*').in('id', ids)
      setPeople(Object.fromEntries((pr || []).map((x) => [x.id, x])))
      const { data: w } = await supabase.from('wwcc').select('*').in('profile_id', ids)
      setWwcc(Object.fromEntries((w || []).map((x) => [x.profile_id, x])))
      const { data: st } = await supabase.rpc('account_status', { p_ids: (a || []).map((x) => x.profile_id) })
      setAcct(Object.fromEntries((st || []).map((x) => [x.id, x])))
    }
  }, [])
  useLive(['wwcc', 'volunteer_roles', 'profiles', 'players', 'guardian_invites'], load)
  async function resend(p) {
    setMsg('')
    const { data, error } = await supabase.functions.invoke('invite-member', { body: { email: p.email, full_name: p.full_name, resend: true } })
    let text = data?.error
    if (error && !text) { try { text = (await error.context.json()).error } catch { text = error.message } }
    setMsg(text || `Invitation sent again to ${p.email}.`)
  }
  useEffect(() => {
    load()
    // keep the setup checklists current while the page is open
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 60000)
    const vis = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis) }
  }, [load])

  async function decidePlayer(p, ok) {
    const { error } = await supabase.from('players').update({ status: ok ? 'approved' : 'withdrawn' }).eq('id', p.id)
    setMsg(error ? error.message : `${p.first_name} ${p.last_name} ${ok ? 'approved' : 'declined'}.`); load()
  }
  const [deciding, setDeciding] = useState(null)
  function decideVol(a, ok) { setDeciding({ a, ok }) }
  async function mark(pid, field) {
    const { data: me } = await supabase.auth.getSession()
    const patch = field === 'status' ? { status_checked_at: new Date().toISOString(), status_checked_by: me.session.user.id } : { wwc_connected_at: new Date().toISOString(), wwc_connected_by: me.session.user.id }
    const { error } = await supabase.from('wwcc').update(patch).eq('profile_id', pid)
    setMsg(error ? error.message : 'Recorded.'); load()
  }
  async function viewCard(path) {
    const { data, error } = await supabase.storage.from('wwcc').createSignedUrl(path, 120)
    if (error) return setMsg(error.message)
    setOpen(data.signedUrl)
  }
  const kindLabel = { coach: 'Coach', executive: 'Executive', committee: 'Committee', volunteer: 'Volunteer' }
  return (
    <>
      {!isExec && <div className="card callout"><p>You can see what's waiting, but only the <b>executive committee</b> (President, Vice President, Secretary, Treasurer) can sign off.</p></div>}
      {msg && <p className="ok">{msg}</p>}
      <h2>Coaches, committee & volunteers ({apps.length})</h2>
      <p className="muted small">Before approving: 1) check the card with the <a href={WWC_STATUS_URL} target="_blank" rel="noreferrer">WWC status checker</a>, 2) connect the person to the club in <a href={WWC_CONNECT_URL} target="_blank" rel="noreferrer">WWC Connect</a>. Both are required by Victorian law from 19 Oct 2026, and the site won't let you approve until both are ticked.</p>
      {apps.length === 0 && <p className="muted">Nothing waiting.</p>}
      <div className="cards wide">
        {apps.map((a) => {
          const p = people[a.profile_id] || {}
          const w = wwcc[a.profile_id]
          const [cls, label] = wwccState(w)
          return (
            <div key={a.id} className="card">
              <div className="row between"><b>{p.full_name || p.email}</b><span className="tag">{kindLabel[a.kind]}{a.teams?.name ? ' – ' + a.teams.name : ''}</span></div>
              {a.detail && <p className="small">"{a.detail}"</p>}
              <p className="small">{p.email} · {p.phone || 'no phone'}<br />{p.address || 'no address'}</p>
              {(() => {
                const st = acct[a.profile_id]
                const steps = [
                  [!!st?.confirmed_at, st?.confirmed_at ? `Account set up ${fmtDate(st.confirmed_at.slice(0, 10), { day: 'numeric', month: 'short' })}` : st?.invited_at ? `Invited ${fmtDate(st.invited_at.slice(0, 10), { day: 'numeric', month: 'short' })} – hasn't accepted yet` : 'Email not confirmed yet'],
                  [!!st?.has_mfa, st?.has_mfa ? 'Two-factor on' : 'Two-factor not set up'],
                  [!!(p.phone && p.address), p.phone && p.address ? 'Mobile and address added' : 'Mobile / address missing'],
                  [!!w, w ? (w.pending ? 'WWCC applied for' : 'WWCC uploaded') : 'No WWCC yet'],
                ]
                const ready = steps.every(([ok]) => ok)
                return (
                  <div className={'progress-box' + (ready ? ' ready' : '')}>
                    <b className="small">{ready ? 'Ready for you to check and approve' : 'Still setting up – nothing to do yet'}</b>
                    <ul className="ticks">{steps.map(([ok, t]) => <li key={t} className={ok ? 'done' : ''}>{t}</li>)}</ul>
                    {st && !st.confirmed_at && <button className="link small" onClick={() => resend(p)}>Resend invitation</button>}
                  </div>
                )
              })()}
              {w && <div className="wwccbox">
                <p><span className={'pill ' + cls}>{label}</span></p>
                {w ? <>
                  <p className="small">{w.pending ? <>Applied – application no. <b>{w.card_number}</b> ({w.card_type}). Check it in the status checker using the application number.</> : <>Card <b>{w.card_number}</b> ({w.card_type}) · {w.expiry ? `expires ${fmtDate(w.expiry)}` : <span className="warn-text">expiry not recorded – add it with "Correct card details"</span>}</>}</p>
                  {w.file_path && <button className="link" onClick={() => viewCard(w.file_path)}>{w.pending ? 'View application receipt' : 'View card image'}</button>}
                  {isExec && <div className="row small-gap"><a className="btn small ghost" href={WWC_STATUS_URL} target="_blank" rel="noreferrer">Status checker</a><a className="btn small ghost" href={WWC_CONNECT_URL} target="_blank" rel="noreferrer">WWC Connect login</a><button className="link small" onClick={() => setFixing(fixing === a.profile_id ? null : a.profile_id)}>{fixing === a.profile_id ? 'Close' : 'Correct card details'}</button></div>}
                  {fixing === a.profile_id && <FixCard w={w} onDone={(m) => { setFixing(null); setMsg(m); load() }} />}
                  <ul className="ticks">
                    <li className={w.status_checked_at ? 'done' : ''}>Status checked {w.status_checked_at ? fmtDate(w.status_checked_at.slice(0, 10)) : isExec && <button className="btn small ghost" onClick={() => mark(a.profile_id, 'status')}>Mark checked</button>}</li>
                    <li className={w.wwc_connected_at ? 'done' : ''}>Connected in WWC Connect {w.wwc_connected_at ? fmtDate(w.wwc_connected_at.slice(0, 10)) : isExec && <button className="btn small ghost" onClick={() => mark(a.profile_id, 'connect')}>Mark connected</button>}</li>
                  </ul>
                </> : null}
              </div>}
              {isExec && <div className="row"><button className="btn small" onClick={() => decideVol(a, true)}>Approve</button><button className="btn small ghost" onClick={() => decideVol(a, false)}>Decline</button></div>}
            </div>
          )
        })}
      </div>
      <h2>Extra parents / guardians ({gInv.length})</h2>
      {gInv.length === 0 ? <p className="muted">Nothing waiting.</p> : <div className="table-wrap"><table className="stack auto-label"><thead><tr><th>Child</th><th>Requested by</th><th>New guardian</th><th>Relationship</th><th /></tr></thead>
        <tbody>{gInv.map((i) => <tr key={i.id}><td><b>{i.players?.first_name} {i.players?.last_name}</b></td><td>{people[i.invited_by]?.full_name || people[i.invited_by]?.email || '—'}</td><td>{i.name}<br /><span className="small muted">{i.email}</span></td><td>{i.relationship || '—'}</td>
          <td className="nowrap">{isExec && <><button className="btn small" onClick={async () => { const { error } = await supabase.from('guardian_invites').update({ approved: true }).eq('id', i.id); setMsg(error ? error.message : 'Approved – they\'ll be linked when they sign up.'); load() }}>Approve</button> <button className="link danger" onClick={async () => { await supabase.from('guardian_invites').delete().eq('id', i.id); setMsg('Request removed.'); load() }}>Decline</button></>}</td></tr>)}</tbody></table></div>}
      <p className="small muted">Check custody arrangements before approving. Each parent's contact details stay hidden from the other.</p>
      <h2>Player registrations ({players.length})</h2>
      {players.length === 0 && <p className="muted">Nothing waiting.</p>}
      {players.length > 0 && <div className="table-wrap"><table className="stack auto-label"><thead><tr><th>Player</th><th>Born</th><th>Season</th><th>Parent</th><th>Medical</th><th>FV reg</th><th>Paid</th><th /></tr></thead>
        <tbody>{players.map((p) => { const g = people[p.player_guardians?.[0]?.profile_id]; return (
          <tr key={p.id}><td><b>{p.first_name} {p.last_name}</b>{p.committee_notes && <><br /><span className="small muted">{p.committee_notes}</span></>}
            <KitTags p={p} />
            {dupes[p.id] && <div className="release">⚠ Possible duplicate – this child already has a registration:
              {dupes[p.id].map((d) => <div key={d.id} className="row small-gap">{d.season} · {d.status}{d.dob !== p.dob ? ` · birthday on file ${fmtDate(d.dob)}` : ''}
                {isExec && d.season === p.season && <button className="btn small" onClick={async () => { if (!window.confirm(`Merge this registration into the existing ${d.season} one? The parent who registered it is linked to the existing record, and this copy is removed.`)) return; const { error } = await supabase.rpc('merge_players', { p_keep: d.id, p_dup: p.id }); setMsg(error ? error.message : `${p.first_name} merged – both parents are now linked to one registration.`); load() }}>Merge into this one</button>}</div>)}</div>}</td><td>{p.dob ? fmtDate(p.dob) : ''}</td><td>{p.season}</td>
            <td>{g ? <>{g.full_name || g.email}<br /><span className="small muted">{g.phone}</span></> : <span className="muted">not linked</span>}</td>
            <td className={p.medical_notes ? 'alert' : 'muted'}>{p.medical_notes || '—'}</td><td>{p.fv_registered ? '✓' : '—'}</td><td>{p.fees_paid ? '✓' : '—'}</td>
            <td className="nowrap">{isExec && <><button className="btn small" onClick={() => decidePlayer(p, true)}>Approve</button> <button className="link danger" onClick={() => decidePlayer(p, false)}>Decline</button></>}</td></tr>) })}</tbody></table></div>}
      {deciding && <DecideModal a={deciding.a} ok={deciding.ok} person={people[deciding.a.profile_id] || {}} onClose={(m) => { setDeciding(null); if (m) setMsg(m); load() }} />}
      {open && <div className="modal" onClick={() => setOpen(null)}><div className="card" onClick={(e) => e.stopPropagation()}><h3>WWCC card</h3>{/\.pdf/i.test(open.split('?')[0]) ? <a href={open} target="_blank" rel="noreferrer">Open PDF</a> : <img src={open} alt="WWCC card" style={{ maxWidth: '100%' }} />}<p className="small muted">This link expires in 2 minutes.</p><button className="btn small ghost" onClick={() => setOpen(null)}>Close</button></div></div>}
    </>
  )
}

// Exec: correct a volunteer's card details from what the status checker shows (e.g. they ticked "applied" but have a card).
function FixCard({ w, onDone }) {
  const [f, setF] = useState({ card_number: w.card_number || '', expiry: w.expiry || '', card_type: w.card_type || 'Volunteer', pending: !!w.pending })
  const [err, setErr] = useState('')
  async function save(e) {
    e.preventDefault()
    if (!f.pending && !f.expiry) return setErr('Add the expiry date shown in the status checker.')
    const { error } = await supabase.from('wwcc').update({ card_number: f.card_number.trim().toUpperCase(), expiry: f.pending ? null : f.expiry, card_type: f.card_type, pending: f.pending }).eq('profile_id', w.profile_id)
    if (error) return setErr(error.message)
    onDone('Card details updated.')
  }
  return (
    <form className="fixcard" onSubmit={save}>
      <label className="check"><input type="radio" checked={!f.pending} onChange={() => setF({ ...f, pending: false })} /> Has a card</label>
      <label className="check"><input type="radio" checked={f.pending} onChange={() => setF({ ...f, pending: true })} /> Applied, no card yet</label>
      <label>{f.pending ? 'Application no.' : 'Card no.'}<input value={f.card_number} onChange={(e) => setF({ ...f, card_number: e.target.value })} required /></label>
      {!f.pending && <label>Expiry<input type="date" value={f.expiry} onChange={(e) => setF({ ...f, expiry: e.target.value })} required /></label>}
      <label>Type<select value={f.card_type} onChange={(e) => setF({ ...f, card_type: e.target.value })}><option>Volunteer</option><option>Employee</option></select></label>
      {err && <p className="err small">{err}</p>}
      <button className="btn small">Save</button>
    </form>
  )
}

const WWC_STATUS_URL = 'https://www.service.vic.gov.au/services/working-with-children-check-status-checker/home'
const WWC_CONNECT_URL = 'https://service.vic.gov.au/find-services/work-and-volunteering/working-with-children-connect'
const daysSince = (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 864e5) : null

function csvCell(v) { const t = String(v ?? ''); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t }
function downloadCsv(name, head, rows) {
  const blob = new Blob([[head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
}

function WWCCRegister() {
  const { isExec } = useAuth()
  const [rows, setRows] = useState([])
  const [reload, setReload] = useState(0)
  const [note, setNote] = useState('')
  const bump = useCallback(() => setReload((x) => x + 1), [])
  useLive(['wwcc', 'profiles', 'volunteer_roles', 'wwcc_offline'], bump)
  const [offline, setOffline] = useState([])
  useEffect(() => { supabase.from('wwcc_offline').select('id, first_name, last_name').then(({ data }) => setOffline(data || [])) }, [reload])
  async function purge(p, w) {
    if (!window.confirm(`Permanently delete ${p.full_name || p.email}'s WWCC record and card image? This can't be undone.`)) return
    if (w.file_path) await supabase.storage.from('wwcc').remove([w.file_path])
    const { error } = await supabase.from('wwcc').delete().eq('profile_id', p.id)
    setNote(error ? error.message : 'Deleted.'); setReload((x) => x + 1)
  }
  async function patch(pid, fields, msg) {
    const { error } = await supabase.from('wwcc').update(fields).eq('profile_id', pid)
    setNote(error ? error.message : msg); setReload((x) => x + 1)
  }
  async function act(p, what) {
    const { data: me } = await supabase.auth.getSession()
    const uid = me.session.user.id, now = new Date().toISOString()
    if (what === 'check') return patch(p.id, { status_checked_at: now, status_checked_by: uid }, 'Status check recorded.')
    if (what === 'connect') return patch(p.id, { wwc_connected_at: now, wwc_connected_by: uid, disconnected_at: null, disconnected_by: null, confirmed_at: now.slice(0, 10) }, 'Connection recorded.')
    if (what === 'updated') return patch(p.id, { details_changed_at: null }, 'Marked as updated in WWC Connect.')
    if (what === 'confirm') return patch(p.id, { confirmed_at: now.slice(0, 10) }, 'Yearly check recorded.')
    if (what === 'disconnect') {
      if (!window.confirm(`Record that ${p.full_name || p.email} has stopped volunteering and been disconnected in WWC Connect?`)) return
      return patch(p.id, { disconnected_at: now, disconnected_by: uid }, 'Disconnection recorded. Remember to remove their access in People & access.')
    }
  }
  useEffect(() => {
    if (!isExec) return
    (async () => {
      const { data: pr } = await supabase.from('profiles').select('*').in('role', ['volunteer', 'coach', 'committee', 'admin']).order('full_name')
      const ids = (pr || []).map((p) => p.id)
      const { data: w } = await supabase.from('wwcc').select('*')
      const wm = Object.fromEntries((w || []).map((x) => [x.profile_id, x]))
      const { data: vr } = await supabase.from('volunteer_roles').select('profile_id, season, status, kind, created_at').eq('status', 'approved').gte('season', PREV_SEASON)
      const roleOf = {}; for (const v of vr || []) roleOf[v.profile_id] = v
      const extra = (w || []).filter((x) => !ids.includes(x.profile_id)).map((x) => x.profile_id)
      const { data: pr2 } = extra.length ? await supabase.from('profiles').select('*').in('id', extra) : { data: [] }
      setRows([...(pr || []), ...(pr2 || [])].map((p) => ({ p, w: wm[p.id], vr: roleOf[p.id], active: !!roleOf[p.id] || ['committee', 'admin'].includes(p.role) })))
    })()
  }, [reload, isExec])
  if (!isExec) return <div className="card"><p>The WWCC register is visible to the executive committee only.</p></div>
  const sorted = [...rows].sort((a, b) => (a.w?.expiry || '0') > (b.w?.expiry || '0') ? 1 : -1)
  const todo = []
  for (const { p, w, active } of rows) {
    const n = p.full_name || p.email
    if (!w) continue
    if (active && !w.pending && !w.expiry) todo.push(`${n}: card expiry date not recorded – add it from the status checker`)
    if (active && !w.status_checked_at) todo.push(`${n}: check their ${w.pending ? 'application' : 'card'} in the status checker`)
    if (active && w.pending && daysSince(w.updated_at) > 84) todo.push(`${n}: applied over 12 weeks ago – ask whether their card has arrived`)
    if (active && w.status_checked_at && !w.wwc_connected_at) todo.push(`${n}: connect in WWC Connect (within 21 days of starting)`)
    if (w.details_changed_at && w.wwc_connected_at && !w.disconnected_at) todo.push(`${n}: contact details changed – update WWC Connect within 21 days (changed ${fmtDate(w.details_changed_at.slice(0, 10))})`)
    if (!active && w.wwc_connected_at && !w.disconnected_at) todo.push(`${n}: no longer active – disconnect in WWC Connect within 21 days`)
    if (active && w.wwc_connected_at && !w.disconnected_at && daysSince(w.confirmed_at || w.wwc_connected_at) > 365) todo.push(`${n}: yearly check – confirm they're still volunteering`)
  }
  function exportCsv() {
    const live = rows.filter((r) => r.w && r.active && !r.w.disconnected_at)
    downloadCsv('wwc-connect-' + new Date().toISOString().slice(0, 10) + '.csv',
      ['Family name', 'Given names', 'WWC card number', 'Card type', 'Expiry', 'Email', 'Phone', 'Address', 'Engagement type', 'Club role', 'Start date'],
      live.map(({ p, w, vr }) => { const parts = (p.full_name || '').trim().split(/\s+/); const last = parts.length > 1 ? parts.pop() : ''; return [last, parts.join(' '), w.card_number, w.card_type, w.expiry, p.email, p.phone, p.address, 'Volunteer', vr?.kind || p.role, (vr?.created_at || p.created_at || '').slice(0, 10)] }))
  }
  return (
    <>
      <div className="card callout">
        <h3 style={{ marginTop: 0 }}>Victorian law from 19 October 2026</h3>
        <ol className="small">
          <li><b>Check</b> every card in the <a href={WWC_STATUS_URL} target="_blank" rel="noreferrer">WWC status checker</a> (family name + card number) before they start. Seeing the card isn't enough.</li>
          <li><b>Connect</b> them to the club in <a href={WWC_CONNECT_URL} target="_blank" rel="noreferrer">WWC Connect</a> within 21 days of starting. The Regulator then tells us if their clearance changes.</li>
          <li><b>Update</b> WWC Connect within 21 days if their name, address, email or phone changes – this page flags it automatically.</li>
          <li><b>Disconnect</b> within 21 days when they stop (with an end date). Check yearly that ongoing volunteers are continuing. Keep records 7 years.</li>
        </ol>
        <div className="row"><a className="btn small" href={WWC_CONNECT_URL} target="_blank" rel="noreferrer">Open WWC Connect</a><a className="btn small ghost" href={WWC_STATUS_URL} target="_blank" rel="noreferrer">Open status checker</a><button className="btn small ghost" onClick={exportCsv}>Download list for WWC Connect (CSV)</button></div>
      </div>
      {todo.length > 0 && <div className="card"><h3 style={{ marginTop: 0 }}>To do ({todo.length})</h3><ul className="small">{todo.map((t) => <li key={t}>{t}</li>)}</ul></div>}
      {note && <p className="ok">{note}</p>}
      <h2>People with a site account</h2>
      <p className="muted small">Sorted by expiry, so problems are at the top. <b>Retention:</b> delete a WWCC record once someone stops volunteering, no later than 12 months after their last role (WWC Connect keeps the 7-year history).</p>
      <div className="table-wrap"><table className="stack auto-label"><thead><tr><th>Name</th><th>Access</th><th>Card</th><th>Expiry</th><th>Status</th><th>Checked</th><th>WWC Connect</th><th>Active?</th><th /></tr></thead>
        <tbody>{sorted.map(({ p, w, active }) => { const [cls, label] = wwccState(w); return <tr key={p.id}><td>{p.full_name || p.email}<br /><span className="small muted">{p.phone || 'no phone'} · {p.address ? 'address ✓' : 'no address'}</span></td><td>{p.role}{p.is_executive ? ' · exec' : ''}</td><td>{w?.card_number || '—'}<br /><span className="small muted">{w?.card_type}</span></td><td>{w ? (w.pending ? <span className="small">Application no.</span> : w.expiry ? fmtDate(w.expiry) : <span className="small warn-text">not recorded</span>) : '—'}</td><td><span className={'pill ' + cls}>{label}</span></td>
          <td className="small">{w ? (w.status_checked_at ? fmtDate(w.status_checked_at.slice(0, 10)) : <button className="btn small ghost" onClick={() => act(p, 'check')}>Mark checked</button>) : '—'}</td>
          <td className="small">{!w ? '—' : w.disconnected_at ? <>Disconnected {fmtDate(w.disconnected_at.slice(0, 10))}</> : w.wwc_connected_at ? <>Connected {fmtDate(w.wwc_connected_at.slice(0, 10))}
            {w.details_changed_at && <><br /><span className="pill wait">Details changed</span> <button className="link" onClick={() => act(p, 'updated')}>Updated ✓</button></>}
            {daysSince(w.confirmed_at || w.wwc_connected_at) > 330 && <><br /><button className="link" onClick={() => act(p, 'confirm')}>Yearly check done</button></>}
            <br /><button className="link danger" onClick={() => act(p, 'disconnect')}>Disconnected…</button></> : <button className="btn small ghost" onClick={() => act(p, 'connect')}>Mark connected</button>}</td>
          <td>{active ? 'Yes' : <span className="pill wait">Not active</span>}</td><td>{w && <button className="link danger" onClick={() => purge(p, w)}>Delete record</button>}</td></tr> })}</tbody></table></div>
      <h2>People without a site account</h2>
      {(() => {
        const norm = (x) => (x || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim()
        const dup = offline.filter((o) => rows.some(({ p, w }) => w && norm(p.full_name).includes(norm(o.last_name)) && norm(p.full_name).startsWith(norm(o.first_name).split(' ')[0])))
        if (!dup.length) return null
        return <div className="card callout small"><b>Now on the site:</b> {dup.map((o) => `${o.first_name} ${o.last_name}`).join(', ')} {dup.length > 1 ? 'have' : 'has'} a site account with a WWCC on file, so the old row below is out of date. <button className="link danger" onClick={async () => { if (!window.confirm(`Remove the old rows for ${dup.map((o) => o.first_name + ' ' + o.last_name).join(', ')}? Their site WWCC record stays.`)) return; await supabase.from('wwcc_offline').delete().in('id', dup.map((o) => o.id)); bump() }}>Remove old rows</button></div>
      })()}
      <p className="muted small">Brought across from the old Operations Doc. Once a person signs up on the site and uploads their card, delete their row here. Dates are the day you did each step.</p>
      <EditTable live table="wwcc_offline" order={[['season', false], ['last_name']]} search={['last_name', 'first_name', 'club_role', 'notes']} defaults={{ season: REG_SEASON }}
        cols={[{ key: 'season', label: 'Season', type: 'number', width: 70 }, { key: 'last_name', label: 'Family name', width: 110 }, { key: 'first_name', label: 'Given name', width: 100 },
          { key: 'club_role', label: 'Role', width: 90 }, { key: 'card_number', label: 'Card no.', width: 110 }, { key: 'card_type', label: 'Type', type: 'select', options: [['Volunteer', 'Volunteer'], ['Employee', 'Employee'], ['VIT', 'VIT teacher'], ['Applied', 'Applied – awaiting card']], width: 100 },
          { key: 'expiry', label: 'Expiry', type: 'date' }, { key: 'email', label: 'Email', width: 140 }, { key: 'phone', label: 'Phone', width: 100 }, { key: 'address', label: 'Address', width: 160 },
          { key: 'status_checked_at', label: 'Checked', type: 'date' }, { key: 'wwc_connected_at', label: 'Connected', type: 'date' }, { key: 'confirmed_at', label: 'Yearly check', type: 'date' }, { key: 'disconnected_at', label: 'Disconnected', type: 'date' },
          { key: 'notes', label: 'Notes', type: 'textarea', width: 180 }]} />
    </>
  )
}

function Registers() {
  return (
    <>
      <h2>Key register</h2>
      <p className="muted small">Who holds which key. When a key comes back, tick "Returned" rather than deleting the row, so the history stays.</p>
      <EditTable table="keys" order={[['sort'], ['key_no']]} search={['key_no', 'holder', 'location', 'notes']} defaults={{ key_no: 'New' }}
        cols={[{ key: 'key_no', label: 'Key', width: 60 }, { key: 'location', label: 'Opens', width: 220 }, { key: 'holder', label: 'Held by', width: 160 }, { key: 'issued', label: 'Issued', width: 70 }, { key: 'returned', label: 'Returned', type: 'bool' }, { key: 'notes', label: 'Notes', type: 'textarea', width: 240 }, { key: 'sort', label: 'Order', type: 'number', width: 50 }]} />
      <Assets />
    </>
  )
}

function Contacts() {
  return (
    <>
      <h2>Key contacts</h2>
      <p className="muted small">Bookings, the Shire, Football Victoria and suppliers. Account passwords never go here – keep them in a password manager.</p>
      <EditTable table="contacts" order={[['sort'], ['topic']]} search={['topic', 'name', 'organisation', 'notes']} defaults={{ topic: 'New contact' }}
        cols={[{ key: 'topic', label: 'For', width: 140 }, { key: 'name', label: 'Name', width: 120 }, { key: 'organisation', label: 'Organisation', width: 170 }, { key: 'phone', label: 'Phone', width: 110 }, { key: 'email', label: 'Email', width: 190 }, { key: 'notes', label: 'Notes', type: 'textarea', width: 240 }, { key: 'sort', label: 'Order', type: 'number', width: 50 }]} />
      <HandoverNotes />
    </>
  )
}

// Lines starting with "-" or "•" show as a neatly aligned bullet list; other lines as paragraphs.
function NoteBody({ text }) {
  const blocks = []
  for (const raw of (text || '').split('\n')) {
    const line = raw.trim(); if (!line) continue
    const m = line.match(/^[-•*]\s+(.*)$/)
    if (m) { const last = blocks[blocks.length - 1]; last?.list ? last.items.push(m[1]) : blocks.push({ list: true, items: [m[1]] }) }
    else blocks.push({ list: false, text: line })
  }
  return <div className="note-body">{blocks.map((b, i) => b.list ? <ul key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul> : <p key={i}>{b.text}</p>)}</div>
}

const shortDate = (v) => (v ? fmtDate(v.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' }) : '')

// Handover notes as readable cards grouped by area; tap Edit to change one.
function HandoverNotes() {
  const [notes, setNotes] = useState(null)
  const [editing, setEditing] = useState(null)
  const [f, setF] = useState({})
  const [err, setErr] = useState(null)
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('club_notes').select('*').order('sort').order('category')
    if (error) setErr(error.message); setNotes(data || [])
  }, [])
  useEffect(() => { load() }, [load])
  const groups = []
  for (const n of notes || []) { const g = groups.find((x) => x.name === (n.category || 'Other')); g ? g.items.push(n) : groups.push({ name: n.category || 'Other', items: [n] }) }
  function open(n) { setEditing(n.id); setF({ category: n.category || '', title: n.title || '', body: n.body || '', sort: n.sort ?? '' }) }
  async function save(e) {
    e.preventDefault(); setErr(null)
    const row = { category: f.category.trim() || null, title: f.title.trim(), body: f.body, sort: f.sort === '' ? null : Number(f.sort) }
    const { error } = editing === 'new' ? await supabase.from('club_notes').insert(row) : await supabase.from('club_notes').update(row).eq('id', editing)
    if (error) return setErr(error.message)
    setEditing(null); load()
  }
  async function remove() {
    if (!window.confirm(`Delete the note "${f.title}"? This can't be undone.`)) return
    const { error } = await supabase.from('club_notes').delete().eq('id', editing)
    if (error) return setErr(error.message)
    setEditing(null); load()
  }
  const form = (
    <form className="card form note-edit" onSubmit={save}>
      <div className="ae-grid">
        <label>Area<input value={f.category || ''} onChange={(e) => setF({ ...f, category: e.target.value })} list="note-areas" placeholder="e.g. Facilities" /></label>
        <label>Topic<input value={f.title || ''} onChange={(e) => setF({ ...f, title: e.target.value })} required /></label>
        <label>Order<input type="number" value={f.sort ?? ''} onChange={(e) => setF({ ...f, sort: e.target.value })} /></label>
      </div>
      <datalist id="note-areas">{groups.map((g) => <option key={g.name} value={g.name} />)}</datalist>
      <label>Notes <span className="small muted">(start a line with "- " for a bullet point)</span><textarea rows={8} value={f.body || ''} onChange={(e) => setF({ ...f, body: e.target.value })} /></label>
      <div className="row"><button className="btn small">Save</button><button type="button" className="btn small ghost" onClick={() => setEditing(null)}>Cancel</button>
        {editing !== 'new' && <button type="button" className="link danger small" onClick={remove}>Delete note</button>}</div>
    </form>
  )
  return (
    <>
      <div className="row between"><h2>Handover notes</h2>{editing !== 'new' && <button className="btn small" onClick={() => { setEditing('new'); setF({ category: '', title: '', body: '', sort: (notes?.length || 0) + 1 }) }}>+ Add a note</button>}</div>
      <p className="muted small">How the club works – the things a new President, Secretary or committee member needs to know.</p>
      {err && <p className="err small">{err}</p>}
      {editing === 'new' && form}
      {notes === null ? <p className="muted">Loading…</p> : groups.map((g) => (
        <section key={g.name} className="note-group">
          <h3>{g.name}</h3>
          {g.items.map((n) => editing === n.id ? <div key={n.id}>{form}</div> : (
            <article key={n.id} className="card note">
              <div className="row between"><b>{n.title}</b><button className="link small" onClick={() => open(n)}>Edit</button></div>
              <NoteBody text={n.body} />
              {n.created_at && <p className="small muted note-dates">Added {shortDate(n.created_at)}{n.updated_at && shortDate(n.updated_at) !== shortDate(n.created_at) ? ` · Updated ${shortDate(n.updated_at)}` : ''}</p>}
            </article>
          ))}
        </section>
      ))}
    </>
  )
}

// Same child: same name and birthday, or the birthday with day and month swapped (11/10 vs 10/11).
const sameChild = (a, b) => {
  if (!a.dob || !b.dob) return false
  const n = (x) => (x || '').trim().toLowerCase()
  if (n(a.first_name) !== n(b.first_name) || n(a.last_name) !== n(b.last_name)) return false
  if (a.dob === b.dob) return true
  const [ya, ma, da] = a.dob.split('-'), [yb, mb, db] = b.dob.split('-')
  return ya === yb && ma === db && da === mb
}

const ACCESS = {
  coach: 'Coach access: their team page, squad list with medical notes and photo permission, parents\' names and phone numbers, gala availability, coach messages and resources.',
  executive: 'Full executive access: everything – approvals, all registered children and guardians, WWCC register, people and access, finances and settings. For the President, Vice-President, Secretary and Treasurer.',
  committee: 'Committee access: committee portal (action list, galas, uniforms, documents, committee messages). Not children\'s personal details.',
  volunteer: 'Volunteer access: volunteer messages and rosters. No children\'s personal details.',
}
function DecideModal({ a, ok, person, onClose }) {
  const [teams, setTeams] = useState([])
  const [roles, setRoles] = useState([])
  const [team, setTeam] = useState(a.team_id || '')
  const [role, setRole] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => {
    supabase.from('teams').select('id,name').eq('season', REG_SEASON).order('sort_order').then(({ data }) => setTeams(data || []))
    supabase.from('committee_roles').select('*').eq('season', REG_SEASON).order('sort_order').then(({ data }) => setRoles(data || []))
  }, [])
  const roleOpts = roles.filter((r) => a.kind === 'executive' ? r.grp === 'Executive' : r.grp !== 'Executive')
  async function go() {
    const { error } = await supabase.rpc('decide_volunteer', { p_id: a.id, p_approve: ok, p_note: note || null, p_team: team || null, p_committee_role: role || null })
    if (error) return setErr(error.message)
    const { data: n } = await supabase.functions.invoke('notify-decision', { body: { id: a.id } })
    const mailed = n?.ok ? ` They've been emailed at ${n.to}.` : n?.skipped ? ' (Approval emails switch on once the email key is added.)' : ' The email to them didn\'t send – let them know directly.'
    onClose(`${person.full_name || person.email} ${ok ? 'approved – access is now active' : 'declined'}.${mailed}`)
  }
  const label = { coach: 'Coach', executive: 'Executive committee', committee: 'Committee', volunteer: 'Volunteer' }[a.kind]
  return (
    <div className="modal" onClick={() => onClose()}><div className="card form" onClick={(e) => e.stopPropagation()}>
      <h3>{ok ? 'Approve' : 'Decline'}: {person.full_name || person.email} – {label}</h3>
      {ok && a.kind === 'coach' && <label>Coaching which team?<select value={team} onChange={(e) => setTeam(e.target.value)}><option value="">Decide later</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>{teams.length === 0 && <span className="small muted">No {REG_SEASON} teams yet – add them under Teams, then assign under People & access.</span>}</label>}
      {ok && ['committee', 'executive'].includes(a.kind) && <label>Which role?<select value={role} onChange={(e) => setRole(e.target.value)}><option value="">Not yet decided</option>{roleOpts.map((r) => <option key={r.id} value={r.id}>{r.role}{r.person ? ` (currently ${r.person})` : ' – vacant'}</option>)}</select><span className="small muted">Their name is added to the public committee list.</span></label>}
      <label>{ok ? 'Note to the applicant (optional)' : 'Reason (shown to the applicant)'}<input value={note} onChange={(e) => setNote(e.target.value)} /></label>
      {ok && <p className="small callout card">{ACCESS[a.kind]}</p>}
      {err && <p className="err">{err}</p>}
      <div className="row"><button className="btn" onClick={go}>{ok ? 'Approve and activate' : 'Decline'}</button><button className="btn ghost small" onClick={() => onClose()}>Cancel</button></div>
    </div></div>
  )
}

function PlayersList({ season, toolbarExtra }) {
  const { isExec } = useAuth()
  const teams = useTeams()
  const [reload, setReload] = useState(0)
  const [adding, setAdding] = useState(false)
  const [custodyFor, setCustodyFor] = useState(null)
  const [linkFor, setLinkFor] = useState(null)
  const [editing, setEditing] = useState(null)
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [team, setTeam] = useState('')
  const [status, setStatus] = useState('')
  const [copied, setCopied] = useState('')
  useEffect(() => {
    (async () => {
      const { data: ps0 } = await supabase.from('players').select('*, ' + TEAM_SEL).eq('season', season)
      const ps = sortPlayers(ps0)
      const ids = (ps || []).map((p) => p.id)
      const { data: gs } = ids.length ? await supabase.from('player_guardians').select('player_id, profile_id').in('player_id', ids) : { data: [] }
      const pids = [...new Set((gs || []).map((g) => g.profile_id))]
      const { data: pr } = pids.length ? await supabase.from('profiles').select('id, full_name, email, phone, address').in('id', pids) : { data: [] }
      const pm = Object.fromEntries((pr || []).map((x) => [x.id, x]))
      const { data: gi } = ids.length ? await supabase.from('guardian_invites').select('*').in('player_id', ids).is('claimed_at', null) : { data: [] }
      const { data: pp } = ids.length ? await supabase.from('player_private').select('*').in('player_id', ids) : { data: [] }
      const ppm = Object.fromEntries((pp || []).map((x) => [x.player_id, x]))
      setRows((ps || []).map((p) => ({ ...p, custody: ppm[p.id], invites: (gi || []).filter((i) => i.player_id === p.id), guardians: (gs || []).filter((g) => g.player_id === p.id).map((g) => pm[g.profile_id]).filter(Boolean) })))
    })()
  }, [season, reload])
  const bump = useCallback(() => setReload((x) => x + 1), [])
  useLive(['players', 'player_guardians'], bump)
  if (!isExec) return <div className="card"><p>Visible to the executive committee only.</p></div>
  const shown = rows.filter((r) => (!team || r.team_id === team || (team === 'none' && !r.team_id)) && (!status || r.status === status)
    && (!q || `${r.first_name} ${r.last_name} ${r.guardians.map((g) => g.full_name + g.email).join(' ')}`.toLowerCase().includes(q.toLowerCase())))
  const counts = { total: shown.length, fv: shown.filter((r) => r.fv_registered).length, paid: shown.filter((r) => r.fees_paid).length, med: shown.filter((r) => r.medical_notes).length, uni: shown.filter((r) => r.needs_uniform).length, boots: shown.filter((r) => r.needs_boots).length }
  function copy() {
    const head = ['First', 'Last', 'DOB', 'Age group', 'Team', 'Status', 'FV registered', 'Paid', 'Medical', 'Photo OK', 'Uniform / boots', 'Emergency contact', 'Guardian', 'Guardian phone', 'Guardian email']
    const lines = shown.map((r) => [r.first_name, r.last_name, r.dob, ageGroupFor(r.dob, r.season), r.teams?.name || '', r.status, r.fv_registered ? 'Y' : 'N', r.fees_paid ? 'Y' : 'N', r.medical_notes || '', r.photo_consent ? 'Y' : 'N', kitText(r), r.emergency_contact || '',
      r.guardians.map((g) => g.full_name).join(' / '), r.guardians.map((g) => g.phone || '').join(' / '), r.guardians.map((g) => g.email).join(' / ')].join('\t'))
    navigator.clipboard.writeText([head.join('\t'), ...lines].join('\n')).then(() => setCopied('Copied – paste into a spreadsheet.'), () => setCopied('Copy blocked by the browser.'))
  }
  return (
    <>
      <div className="row">
        {toolbarExtra}
        <select className="search" value={team} onChange={(e) => setTeam(e.target.value)}><option value="">All teams</option><option value="none">No team yet</option>{teams.filter((t) => t.season === season).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <select className="search" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Any status</option><option value="pending">Awaiting sign-off</option><option value="approved">Approved</option><option value="withdrawn">Withdrawn</option></select>
        <input className="search" placeholder="Search child or parent…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn small ghost" onClick={copy}>Copy for spreadsheet</button>{copied && <span className="small ok">{copied}</span>}
        <button className="btn small" onClick={() => setAdding(true)}>+ Add a family</button>
      </div>
      {adding && <AddFamily teams={teams.filter((t) => t.season === REG_SEASON)} onClose={(m) => { setAdding(false); if (m) setCopied(m); setReload((x) => x + 1) }} />}
      {custodyFor && <CustodyModal player={custodyFor} onClose={() => { setCustodyFor(null); setReload((x) => x + 1) }} />}
      <p className="small muted">{counts.total} players · {counts.fv} FV registered · {counts.paid} paid · {counts.med} with medical notes · {counts.uni} need a uniform · {counts.boots} interested in loan boots. Click <b>Edit</b> on a child to change their details.</p>
      <div className="table-wrap"><table className="dir stack players-dir">
        <thead><tr><th>Player</th><th>Team</th><th>Status</th><th>FV</th><th>Paid</th><th>Medical</th><th>Photos</th><th>Parent / guardian</th><th>Emergency</th></tr></thead>
        <tbody>{shown.map((r) => <Fragment key={r.id}><tr className={editing === r.id ? 'editing-row' : ''}>
          <td className="lead-cell"><b>{r.first_name} {r.last_name}</b><br /><span className="small muted">{r.dob ? fmtDate(r.dob, { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · {ageGroupFor(r.dob, r.season)}</span>
            {r.release_check && <div className="release">⚠ Release check</div>}
            <KitTags p={r} />
            <div className="row small-gap nowrap-row"><button className="btn small" onClick={() => setEditing(editing === r.id ? null : r.id)}>{editing === r.id ? 'Close' : 'Edit'}</button><button className="link small" onClick={() => setCustodyFor(r)}>{r.custody?.custody_note || r.release_check ? 'Custody note' : '+ custody note'}</button><button className="link small" onClick={() => setLinkFor(r)}>Parents</button></div></td>
          <td data-label="Team">{r.teams?.name || <span className="muted">TBA</span>}</td>
          <td data-label="Status"><span className={'pill ' + ({ approved: 'good', pending: 'wait', withdrawn: 'bad' }[r.status])}>{r.status === 'pending' ? 'awaiting' : r.status}</span></td>
          <td data-label="FV">{r.fv_registered ? '✓' : <span className="err">✗</span>}</td><td data-label="Paid">{r.fees_paid ? '✓' : <span className="err">✗</span>}</td>
          <td data-label="Medical" className={r.medical_notes ? 'alert' : 'muted'}>{r.medical_notes || '—'}</td><td data-label="Photos">{r.photo_consent ? 'Yes' : 'No'}</td>
          <td data-label="Parent">{r.guardians.map((g) => <div key={g.email} className="small"><b>{g.full_name || g.email}</b><br />{g.phone || ''}{g.phone ? ' · ' : ''}{g.email}</div>)}
            {r.invites.map((i) => <div key={i.id} className="small muted">{i.name || i.email} ({i.relationship || 'guardian'}) – {i.approved ? 'invited, not signed up' : 'awaiting approval'}<br />{i.phone || ''} {i.email}</div>)}
            {!r.guardians.length && !r.invites.length && <span className="muted small">not linked</span>}</td>
          <td data-label="Emergency" className="small">{r.emergency_contact || '—'}</td>
        </tr>{editing === r.id && <tr className="editrow"><td colSpan={9} className="full-cell"><PlayerEditor p={r} teams={teams.filter((t) => t.season === r.season)} onDone={() => { setEditing(null); bump() }} /></td></tr>}</Fragment>)}</tbody></table></div>
      {linkFor && <LinkParent player={linkFor} onClose={() => { setLinkFor(null); bump() }} />}
    </>
  )
}

function AddFamily({ teams, onClose }) {
  const [c, setC] = useState({ first: '', last: '', dob: '', gender: '', medical: '', emergency: '', photo: false, team: '' })
  const [gs, setGs] = useState([{ name: '', email: '', phone: '', relationship: '' }])
  const [err, setErr] = useState('')
  const [dupe, setDupe] = useState(null)
  async function checkDupe() {
    if (!c.first || !c.last || !c.dob) return
    const { data } = await supabase.from('players').select('id, season, status').ilike('first_name', c.first.trim()).ilike('last_name', c.last.trim()).eq('dob', c.dob)
    setDupe(data?.length ? data : null)
  }
  async function save(e) {
    e.preventDefault(); setErr('')
    const { error } = await supabase.rpc('exec_add_family', { p_first: c.first.trim(), p_last: c.last.trim(), p_dob: c.dob, p_gender: c.gender, p_medical: c.medical, p_emergency: c.emergency, p_photo: c.photo, p_season: REG_SEASON, p_team: c.team || null, p_guardians: gs.filter((g) => g.email) })
    if (error) return setErr(error.message)
    onClose(`${c.first} added for ${REG_SEASON}. Parents just need to create an account with the email you entered – ${c.first} will already be linked.`)
  }
  const setG = (i, k, v) => setGs(gs.map((g, j) => (j === i ? { ...g, [k]: v } : g)))
  return (
    <div className="modal" onClick={() => onClose()}><form className="card form wide-modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
      <h3>Add a family ({REG_SEASON})</h3>
      <p className="small muted">For a child who missed registration. The child is approved straight away; each parent gets linked automatically when they sign up with the email you enter here.</p>
      <div className="grid2 tight">
        <label>Child first name<input value={c.first} onChange={(e) => setC({ ...c, first: e.target.value })} onBlur={checkDupe} required /></label>
        <label>Last name<input value={c.last} onChange={(e) => setC({ ...c, last: e.target.value })} onBlur={checkDupe} required /></label>
        <label>Date of birth<input type="date" value={c.dob} onChange={(e) => setC({ ...c, dob: e.target.value })} onBlur={checkDupe} required /></label>
        <label>Team<select value={c.team} onChange={(e) => setC({ ...c, team: e.target.value })}><option value="">Decide later</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      </div>
      {dupe && <p className="release">⚠ A child with this name and birthday is already registered ({dupe.map((d) => `${d.season} ${d.status}`).join(', ')}). Use the Players tab to link a parent or carry them over instead.</p>}
      <label>Medical / allergies<input value={c.medical} onChange={(e) => setC({ ...c, medical: e.target.value })} /></label>
      <label>Emergency contact<input value={c.emergency} onChange={(e) => setC({ ...c, emergency: e.target.value })} /></label>
      <label className="check"><input type="checkbox" checked={c.photo} onChange={(e) => setC({ ...c, photo: e.target.checked })} /> Parent has given photo permission</label>
      {gs.map((g, i) => (
        <fieldset key={i} className="roles-pick"><legend>Parent / guardian {i + 1}</legend>
          <div className="grid2 tight">
            <label>Name<input value={g.name} onChange={(e) => setG(i, 'name', e.target.value)} required={i === 0} /></label>
            <label>Email<input type="email" value={g.email} onChange={(e) => setG(i, 'email', e.target.value)} required={i === 0} /></label>
            <label>Mobile<input value={g.phone} onChange={(e) => setG(i, 'phone', e.target.value)} /></label>
            <label>Relationship<input value={g.relationship} onChange={(e) => setG(i, 'relationship', e.target.value)} placeholder="Mum, Dad, carer…" /></label>
          </div>
        </fieldset>
      ))}
      {gs.length < 2 && <button type="button" className="link" onClick={() => setGs([...gs, { name: '', email: '', phone: '', relationship: '' }])}>+ Add a second parent / guardian</button>}
      {err && <p className="err">{err}</p>}
      <div className="row"><button className="btn">Add family</button><button type="button" className="btn ghost small" onClick={() => onClose()}>Cancel</button></div>
    </form></div>
  )
}

function CustodyModal({ player, onClose }) {
  const [note, setNote] = useState(player.custody?.custody_note || '')
  const [flag, setFlag] = useState(!!player.release_check)
  const [err, setErr] = useState('')
  async function save() {
    const { data: s } = await supabase.auth.getSession()
    const r1 = await supabase.from('player_private').upsert({ player_id: player.id, custody_note: note || null, updated_by: s.session.user.id, updated_at: new Date().toISOString() })
    const r2 = await supabase.from('players').update({ release_check: flag }).eq('id', player.id)
    const e = r1.error || r2.error
    if (e) return setErr(e.message)
    onClose()
  }
  return (
    <div className="modal" onClick={() => onClose()}><div className="card form" onClick={(e) => e.stopPropagation()}>
      <h3>Custody / release – {player.first_name} {player.last_name}</h3>
      <label>Private executive note (court orders, who may collect, etc.)<textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <label className="check"><input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} /> Show coaches "Check with the executive before releasing this child"</label>
      <p className="small muted">Only the executive can see the note. Coaches and parents see only the flag (coaches) – never the note.</p>
      {err && <p className="err">{err}</p>}
      <div className="row"><button className="btn" onClick={save}>Save</button><button className="btn ghost small" onClick={() => onClose()}>Cancel</button></div>
    </div></div>
  )
}

function Audit() {
  const { isExec } = useAuth()
  const [rows, setRows] = useState([])
  const [tbl, setTbl] = useState('')
  useEffect(() => {
    let q = supabase.from('audit_log').select('*').order('at', { ascending: false }).limit(300)
    if (tbl) q = q.eq('tbl', tbl)
    q.then(({ data }) => setRows(data || []))
  }, [tbl])
  if (!isExec) return <div className="card"><p>Visible to the executive committee only.</p></div>
  const LABEL = { players: 'Players', volunteer_roles: 'Applications', wwcc: 'WWCC', profiles: 'Access', player_guardians: 'Parent links', guardian_invites: 'Guardian invites', team_coaches: 'Coach teams', player_private: 'Custody notes' }
  const fmt = (c) => Object.entries(c || {}).map(([k, v]) => typeof v === 'object' && v && 'to' in v ? `${k}: ${v.from ?? '–'} → ${v.to ?? '–'}` : `${k} ${typeof v === 'string' ? v : ''}`).join('; ')
  return (
    <>
      <p className="muted small">Every approval, access change, payment/registration change, WWCC check, parent link and custody note edit is recorded here automatically. It can't be edited.</p>
      <div className="tabs">{[['', 'All'], ...Object.entries(LABEL)].map(([k, l]) => <button key={k} className={tbl === k ? 'on' : ''} onClick={() => setTbl(k)}>{l}</button>)}</div>
      <div className="table-wrap"><table className="stack auto-label"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Action</th><th>Changes</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td className="nowrap small">{new Date(r.at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{r.actor_name || 'system'}</td><td>{LABEL[r.tbl] || r.tbl}</td><td>{r.action}</td><td className="small">{fmt(r.changes)}</td></tr>)}</tbody></table></div>
    </>
  )
}

function GalaJobs({ gala, onClose }) {
  const [jobs, setJobs] = useState([])
  const [signups, setSignups] = useState([])
  const [f, setF] = useState({ job: '', time_slot: '', slots: 2 })
  const load = useCallback(async () => {
    const { data } = await supabase.from('gala_jobs').select('*').eq('gala_id', gala.id).order('sort_order')
    setJobs(data || [])
    const ids = (data || []).map((j) => j.id)
    const { data: s } = ids.length ? await supabase.from('gala_job_signups').select('*').in('job_id', ids) : { data: [] }
    setSignups(s || [])
  }, [gala.id])
  useEffect(() => { load() }, [load])
  async function add(e) { e.preventDefault(); await supabase.from('gala_jobs').insert({ gala_id: gala.id, job: f.job, time_slot: f.time_slot, slots: Number(f.slots) || 1, sort_order: jobs.length }); setF({ job: '', time_slot: '', slots: 2 }); load() }
  async function addDefaults() {
    const D = [['Set-up & line marking', 'Sat afternoon', 3], ['BBQ', '8:30–10:30am', 2], ['BBQ', '10:30am–12:30pm', 2], ['Canteen', '8:30–10:30am', 2], ['Canteen', '10:30am–12:30pm', 2], ['Pack-up', 'After last game', 4]]
    await supabase.from('gala_jobs').insert(D.map(([job, time_slot, slots], i) => ({ gala_id: gala.id, job, time_slot, slots, sort_order: i }))); load()
  }
  async function del(j) { await supabase.from('gala_jobs').delete().eq('id', j.id); load() }
  return (
    <div className="modal" onClick={onClose}><div className="card form wide-modal" onClick={(e) => e.stopPropagation()}>
      <h3>Volunteer jobs – {gala.host_club}, {fmtDate(gala.gala_date)}</h3>
      {jobs.length === 0 && <p><button className="btn small ghost" onClick={addDefaults}>Add the usual home-gala jobs</button></p>}
      <ul className="roles">{jobs.map((j) => { const s = signups.filter((x) => x.job_id === j.id); return <li key={j.id}><span><b>{j.job}</b> {j.time_slot && <span className="muted">· {j.time_slot}</span>}<br /><span className="small">{s.map((x) => x.display_name).join(', ') || 'No one yet'}</span></span><b className={s.length >= j.slots ? '' : 'vacant'}>{s.length}/{j.slots} <button className="link danger" onClick={() => del(j)}>×</button></b></li> })}</ul>
      <form className="row" onSubmit={add}><input placeholder="Job" value={f.job} onChange={(e) => setF({ ...f, job: e.target.value })} required /><input placeholder="Time" value={f.time_slot} onChange={(e) => setF({ ...f, time_slot: e.target.value })} /><input type="number" min="1" style={{ maxWidth: 70 }} value={f.slots} onChange={(e) => setF({ ...f, slots: e.target.value })} /><button className="btn small">Add</button></form>
      <p className="small muted">Approved volunteers (with a checked WWCC) sign up on the Gala days page.</p>
      <button className="btn ghost small" onClick={onClose}>Close</button>
    </div></div>
  )
}
