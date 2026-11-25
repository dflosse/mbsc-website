import { useEffect, useState, useCallback, useMemo } from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, REG_SEASON, PREV_SEASON, fmtDate } from '../supabase'
import { useAuth } from '../auth'
import EditTable from './EditTable'
import { wwccState } from './Volunteer'

export default function Committee() {
  return (
    <div className="wrap wide">
      <h1>Committee</h1>
      <div className="tabs">
        {[['overview', 'Overview'], ['approvals', 'Approvals'], ['wwcc', 'WWCC register'], ['players', 'Players'], ['galas', 'Galas'], ['tasks', 'Action list'], ['kit', 'Uniforms'], ['teams', 'Teams'], ['people', 'People & access'], ['docs', 'Documents'], ['roles', 'Committee roles'], ['settings', 'Fees & settings']].map(([p, l]) => <NavLink key={p} to={'/committee/' + p}>{l}</NavLink>)}
      </div>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="wwcc" element={<WWCCRegister />} />
        <Route path="players" element={<Players />} />
        <Route path="galas" element={<Galas />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="kit" element={<Kit />} />
        <Route path="teams" element={<Teams />} />
        <Route path="people" element={<People />} />
        <Route path="docs" element={<Docs />} />
        <Route path="roles" element={<Roles />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </div>
  )
}

function Overview() {
  const [s, setS] = useState(null)
  useEffect(() => {
    (async () => {
      const c = async (t, f) => { let q = supabase.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q); return (await q).count }
      setS({
        pending: await c('players', (q) => q.eq('status', 'pending')),
        reg: await c('players', (q) => q.eq('season', REG_SEASON)),
        roster: await c('players', (q) => q.eq('season', PREV_SEASON).neq('status', 'withdrawn')),
        unpaid: await c('players', (q) => q.eq('season', REG_SEASON).eq('fees_paid', false)),
        tasks: await c('tasks', (q) => q.neq('status', 'done')),
        vols: await c('volunteer_roles', (q) => q.eq('status', 'pending')),
        kitOut: await c('kit', (q) => q.in('status', ['Loaned Out', 'Outstanding'])),
        users: await c('profiles'),
      })
    })()
  }, [])
  const [due, setDue] = useState([])
  useEffect(() => { supabase.from('tasks').select('*').neq('status', 'done').order('due', { nullsFirst: false }).limit(6).then(({ data }) => setDue(data || [])) }, [])
  if (!s) return <p className="muted">Loading…</p>
  return (
    <>
      <div className="stats">
        <Stat n={s.pending} l="player registrations awaiting sign-off" to="approvals" warn={s.pending > 0} />
        <Stat n={s.vols} l="volunteer / coach applications awaiting sign-off" to="approvals" warn={s.vols > 0} />
        <Stat n={s.reg} l={`${REG_SEASON} registrations`} to="players" />
        <Stat n={s.unpaid} l={`${REG_SEASON} payments outstanding`} to="players" warn={s.unpaid > 0} />
        <Stat n={s.roster} l={`${PREV_SEASON} players (last season)`} to="players" />
        <Stat n={s.tasks} l="open actions" to="tasks" />
        <Stat n={s.kitOut} l="jerseys out / outstanding" to="kit" />
        <Stat n={s.users} l="site accounts" to="people" />
      </div>
      <h2>Next actions</h2>
      <div className="table-wrap"><table><tbody>{due.map((t) => <tr key={t.id}><td><b>{t.title}</b><br /><span className="muted small">{t.notes}</span></td><td>{t.owner}</td><td className="nowrap">{t.due ? fmtDate(t.due) : ''}</td></tr>)}</tbody></table></div>
    </>
  )
}
const Stat = ({ n, l, to, warn }) => <NavLink to={'/committee/' + to} className={'stat' + (warn ? ' warn' : '')}><b>{n ?? '–'}</b><span>{l}</span></NavLink>

function useTeams() {
  const [teams, setTeams] = useState([])
  useEffect(() => { supabase.from('teams').select('id,name,season').order('season', { ascending: false }).order('sort_order').then(({ data }) => setTeams(data || [])) }, [])
  return teams
}

function Players() {
  const teams = useTeams()
  const [season, setSeason] = useState(REG_SEASON)
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
      <div className="row"><span>Season:</span>{[PREV_SEASON, REG_SEASON].map((s) => <button key={s} className={'btn small ' + (s === season ? '' : 'ghost')} onClick={() => setSeason(s)}>{s}</button>)}
        {season === REG_SEASON && teamOpts.length === 0 && <span className="muted small">No {REG_SEASON} teams yet – add them under Teams to assign players.</span>}</div>
      {note && <p className="ok">{note}</p>}
      <p className="muted small">Registrations are signed off by the executive on the <NavLink to="/committee/approvals">Approvals</NavLink> tab. {season === PREV_SEASON ? `Last season's players are kept here. Use ➜${REG_SEASON} to carry a returning player over. ` : ''}Edits save as you go. "Approved" + FV registered + paid = fully registered. Use 🔗 to link a parent's account to a player.</p>
      <EditTable key={season} table="players" filter={filter} order={order} search={['first_name', 'last_name']}
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

function LinkParent({ player, onClose }) {
  const [links, setLinks] = useState([])
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const load = useCallback(async () => {
    const { data } = await supabase.from('player_guardians').select('profile_id, profiles(email, full_name)').eq('player_id', player.id)
    setLinks(data || [])
  }, [player.id])
  useEffect(() => { load() }, [load])
  async function add(e) {
    e.preventDefault()
    const { data: p } = await supabase.from('profiles').select('id').eq('email', email.trim().toLowerCase()).maybeSingle()
    if (!p) return setMsg('No account with that email yet. Ask the parent to sign up first.')
    const { error } = await supabase.from('player_guardians').insert({ player_id: player.id, profile_id: p.id })
    setMsg(error ? error.message : 'Linked.'); setEmail(''); load()
  }
  async function unlink(pid) { await supabase.from('player_guardians').delete().eq('player_id', player.id).eq('profile_id', pid); load() }
  return (
    <div className="modal" onClick={onClose}><div className="card" onClick={(e) => e.stopPropagation()}>
      <h3>Parents of {player.first_name} {player.last_name}</h3>
      {links.length === 0 && <p className="muted">No accounts linked.</p>}
      <ul>{links.map((l) => <li key={l.profile_id}>{l.profiles?.full_name || l.profiles?.email} <span className="muted small">{l.profiles?.email}</span> <button className="link danger" onClick={() => unlink(l.profile_id)}>remove</button></li>)}</ul>
      <form className="row" onSubmit={add}><input type="email" placeholder="Parent's email" value={email} onChange={(e) => setEmail(e.target.value)} required /><button className="btn small">Link</button></form>
      {msg && <p className="small">{msg}</p>}
      <button className="btn ghost small" onClick={onClose}>Close</button>
    </div></div>
  )
}

function Galas() {
  const order = useMemo(() => [['gala_date', false]], [])
  const [sel, setSel] = useState(null)
  return (
    <>
      <EditTable table="galas" order={order} defaults={{ season: REG_SEASON, gala_date: `${REG_SEASON}-05-01`, host_club: 'TBC' }}
        cols={[
          { key: 'season', label: 'Season', type: 'number', width: 70 }, { key: 'gala_date', label: 'Date', type: 'date' },
          { key: 'host_club', label: 'Host', width: 120 }, { key: 'venue', label: 'Venue', width: 120 }, { key: 'address', label: 'Address', width: 140 },
          { key: 'start_time', label: 'Start', width: 70 }, { key: 'signup_closes', label: 'RSVP by', type: 'date' },
          { key: 'draw_url', label: 'Draw link', width: 120 }, { key: 'info', label: 'Info for families', type: 'textarea', width: 180 },
        ]}
        rowActions={(r) => <button className="link" title="Who's coming" onClick={() => setSel(r)}>👥</button>} />
      {sel && <GalaEntries gala={sel} onClose={() => setSel(null)} />}
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
      <EditTable key={season} table="tasks" filter={filter} order={order} search={['title', 'owner', 'notes']} defaults={{ season, title: 'New action' }}
        cols={[
          { key: 'title', label: 'Action', type: 'textarea', width: 220 }, { key: 'owner', label: 'Who', width: 100 },
          { key: 'due', label: 'Due', type: 'date' },
          { key: 'status', label: 'Status', type: 'select', options: [['todo', 'To do'], ['doing', 'Doing'], ['done', 'Done']] },
          { key: 'category', label: 'Area', width: 90 }, { key: 'notes', label: 'Notes', type: 'textarea', width: 260 },
        ]} />
    </>
  )
}

function Kit() {
  const order = useMemo(() => [['sort_order']], [])
  return (
    <>
      <p className="muted small">Jersey numbers repeat across print runs: plain numbers are the first run (1–55), R = repeated run, N = newer size-14 run.</p>
      <EditTable table="kit" order={order} search={['holder_name', 'jersey_label', 'notes', 'status']} defaults={{ jersey_label: 'New', status: 'Shed Tub', sort_order: 999 }}
        cols={[
          { key: 'jersey_label', label: '#', width: 50 }, { key: 'size', label: 'Size', width: 60 }, { key: 'kit_bag', label: 'Bag', width: 50 },
          { key: 'holder_name', label: 'Player', width: 150 },
          { key: 'status', label: 'Status', type: 'select', options: [['Shed Tub', 'Shed Tub'], ['Loaned Out', 'Loaned Out'], ['Outstanding', 'Outstanding'], ['Returned', 'Returned'], ['Written off', 'Written off']] },
          { key: 'shin_guard', label: 'Shin', width: 50 }, { key: 'boots_on_loan', label: 'Boots', type: 'bool' }, { key: 'registration_paid', label: 'Paid', type: 'bool' },
          { key: 'notes', label: 'Notes', width: 180 },
        ]} />
    </>
  )
}

function Teams() {
  const order = useMemo(() => [['season', false], ['sort_order']], [])
  return <EditTable table="teams" order={order} defaults={{ season: REG_SEASON, name: 'New team', age_group: 'U?' }}
    cols={[
      { key: 'season', label: 'Season', type: 'number', width: 70 }, { key: 'name', label: 'Name', width: 110 }, { key: 'age_group', label: 'Age', width: 60 },
      { key: 'format', label: 'Format', width: 140 }, { key: 'coach_names', label: 'Coaches (shown publicly)', width: 140 },
      { key: 'training', label: 'Training', width: 150 }, { key: 'sort_order', label: 'Order', type: 'number', width: 50 },
    ]} />
}

function People() {
  const { isAdmin, user } = useAuth()
  const teams = useTeams()
  const [people, setPeople] = useState([])
  const [tc, setTc] = useState([])
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setPeople(data || [])
    const { data: t } = await supabase.from('team_coaches').select('*')
    setTc(t || [])
  }, [])
  useEffect(() => { load() }, [load])
  async function setExec(id, v) { const { error } = await supabase.from('profiles').update({ is_executive: v }).eq('id', id); setErr(error?.message || ''); load() }
  async function setRole(id, role) { const { error } = await supabase.from('profiles').update({ role }).eq('id', id); setErr(error?.message || ''); load() }
  async function addCoach(profile_id, team_id) { if (!team_id) return; const { error } = await supabase.from('team_coaches').insert({ profile_id, team_id }); setErr(error?.message || ''); load() }
  async function rmCoach(profile_id, team_id) { await supabase.from('team_coaches').delete().eq('profile_id', profile_id).eq('team_id', team_id); load() }
  const tname = (id) => teams.find((t) => t.id === id)?.name + ' ' + (teams.find((t) => t.id === id)?.season || '')
  return (
    <>
      <p className="muted small">Tick <b>Executive</b> for the President, Vice President, Secretary and Treasurer – only they can sign off registrations and volunteers. Coaches and volunteers get their access automatically when an executive approves their application. Everyone who signs up starts as a parent. {isAdmin ? 'As an admin you can make people coaches, committee members or admins.' : 'Only admins can change access levels.'} Committee members see all player details.</p>
      {err && <p className="err">{err}</p>}
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Access</th><th>Executive</th><th>Coaches</th></tr></thead>
        <tbody>{people.map((p) => <tr key={p.id}>
          <td>{p.full_name}</td><td>{p.email}</td><td>{p.phone}</td>
          <td>{isAdmin && p.id !== user.id ? <select value={p.role} onChange={(e) => setRole(p.id, e.target.value)}>{['parent', 'volunteer', 'coach', 'committee', 'admin'].map((r) => <option key={r}>{r}</option>)}</select> : p.role}</td>
          <td>{isAdmin ? <input type="checkbox" checked={!!p.is_executive} onChange={(e) => setExec(p.id, e.target.checked)} title="President, VP, Secretary, Treasurer – can sign off registrations and volunteers" /> : (p.is_executive ? 'Yes' : '')}</td>
          <td>{tc.filter((t) => t.profile_id === p.id).map((t) => <span key={t.team_id} className="pill">{tname(t.team_id)} <button className="link danger" onClick={() => rmCoach(p.id, t.team_id)}>×</button></span>)}
            <select value="" onChange={(e) => addCoach(p.id, e.target.value)}><option value="">+ team</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name} {t.season}</option>)}</select></td>
        </tr>)}</tbody>
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
  return (
    <>
      <p className="muted small">These show on the public site (About us, home page and the registration form). Football Victoria requires the club to publish all fees and charges.</p>
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
  const load = useCallback(async () => {
    const { data: p } = await supabase.from('players').select('*, teams(name), player_guardians(profile_id)').eq('status', 'pending').order('created_at')
    setPlayers(p || [])
    const { data: a } = await supabase.from('volunteer_roles').select('*, teams(name)').eq('status', 'pending').order('created_at')
    setApps(a || [])
    const ids = [...new Set([...(a || []).map((x) => x.profile_id), ...(p || []).flatMap((x) => (x.player_guardians || []).map((g) => g.profile_id))])]
    if (ids.length) {
      const { data: pr } = await supabase.from('profiles').select('*').in('id', ids)
      setPeople(Object.fromEntries((pr || []).map((x) => [x.id, x])))
      const { data: w } = await supabase.from('wwcc').select('*').in('profile_id', ids)
      setWwcc(Object.fromEntries((w || []).map((x) => [x.profile_id, x])))
    }
  }, [])
  useEffect(() => { load() }, [load])

  async function decidePlayer(p, ok) {
    const { error } = await supabase.from('players').update({ status: ok ? 'approved' : 'withdrawn' }).eq('id', p.id)
    setMsg(error ? error.message : `${p.first_name} ${p.last_name} ${ok ? 'approved' : 'declined'}.`); load()
  }
  async function decideVol(a, ok) {
    const note = ok ? null : prompt('Reason (shown to the applicant)?') || null
    const { error } = await supabase.rpc('decide_volunteer', { p_id: a.id, p_approve: ok, p_note: note })
    setMsg(error ? error.message : `${people[a.profile_id]?.full_name || 'Applicant'} ${ok ? 'approved' : 'declined'}.`); load()
  }
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
      <h2>Volunteers, coaches & committee ({apps.length})</h2>
      <p className="muted small">Before approving: 1) check the card with the <a href="https://service.vic.gov.au/workchecks" target="_blank" rel="noreferrer">WWC status checker (Service Victoria)</a>, 2) connect the person to the club in WWC Connect. Both are required by Victorian law from 19 Oct 2026, and the site won't let you approve until both are ticked.</p>
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
              <div className="wwccbox">
                <p><span className={'pill ' + cls}>{label}</span></p>
                {w ? <>
                  <p className="small">Card <b>{w.card_number}</b> ({w.card_type}) · expires {fmtDate(w.expiry)}</p>
                  {w.file_path && <button className="link" onClick={() => viewCard(w.file_path)}>View card image</button>}
                  <ul className="ticks">
                    <li className={w.status_checked_at ? 'done' : ''}>Status checked {w.status_checked_at ? fmtDate(w.status_checked_at.slice(0, 10)) : isExec && <button className="btn small ghost" onClick={() => mark(a.profile_id, 'status')}>Mark checked</button>}</li>
                    <li className={w.wwc_connected_at ? 'done' : ''}>Connected in WWC Connect {w.wwc_connected_at ? fmtDate(w.wwc_connected_at.slice(0, 10)) : isExec && <button className="btn small ghost" onClick={() => mark(a.profile_id, 'connect')}>Mark connected</button>}</li>
                  </ul>
                </> : <p className="small err">They haven't uploaded a WWCC yet.</p>}
              </div>
              {isExec && <div className="row"><button className="btn small" onClick={() => decideVol(a, true)}>Approve</button><button className="btn small ghost" onClick={() => decideVol(a, false)}>Decline</button></div>}
            </div>
          )
        })}
      </div>
      <h2>Player registrations ({players.length})</h2>
      {players.length === 0 && <p className="muted">Nothing waiting.</p>}
      {players.length > 0 && <div className="table-wrap"><table><thead><tr><th>Player</th><th>Born</th><th>Season</th><th>Parent</th><th>Medical</th><th>FV reg</th><th>Paid</th><th /></tr></thead>
        <tbody>{players.map((p) => { const g = people[p.player_guardians?.[0]?.profile_id]; return (
          <tr key={p.id}><td><b>{p.first_name} {p.last_name}</b>{p.committee_notes && <><br /><span className="small muted">{p.committee_notes}</span></>}</td><td>{p.dob ? fmtDate(p.dob) : ''}</td><td>{p.season}</td>
            <td>{g ? <>{g.full_name || g.email}<br /><span className="small muted">{g.phone}</span></> : <span className="muted">not linked</span>}</td>
            <td className={p.medical_notes ? 'alert' : 'muted'}>{p.medical_notes || '—'}</td><td>{p.fv_registered ? '✓' : '—'}</td><td>{p.fees_paid ? '✓' : '—'}</td>
            <td className="nowrap">{isExec && <><button className="btn small" onClick={() => decidePlayer(p, true)}>Approve</button> <button className="link danger" onClick={() => decidePlayer(p, false)}>Decline</button></>}</td></tr>) })}</tbody></table></div>}
      {open && <div className="modal" onClick={() => setOpen(null)}><div className="card" onClick={(e) => e.stopPropagation()}><h3>WWCC card</h3>{/\.pdf/i.test(open.split('?')[0]) ? <a href={open} target="_blank" rel="noreferrer">Open PDF</a> : <img src={open} alt="WWCC card" style={{ maxWidth: '100%' }} />}<p className="small muted">This link expires in 2 minutes.</p><button className="btn small ghost" onClick={() => setOpen(null)}>Close</button></div></div>}
    </>
  )
}

function WWCCRegister() {
  const { isExec } = useAuth()
  const [rows, setRows] = useState([])
  useEffect(() => {
    (async () => {
      const { data: pr } = await supabase.from('profiles').select('*').in('role', ['volunteer', 'coach', 'committee', 'admin']).order('full_name')
      const ids = (pr || []).map((p) => p.id)
      const { data: w } = ids.length ? await supabase.from('wwcc').select('*').in('profile_id', ids) : { data: [] }
      const wm = Object.fromEntries((w || []).map((x) => [x.profile_id, x]))
      setRows((pr || []).map((p) => ({ p, w: wm[p.id] })))
    })()
  }, [])
  if (!isExec) return <div className="card"><p>The WWCC register is visible to the executive committee only.</p></div>
  const sorted = [...rows].sort((a, b) => (a.w?.expiry || '0') > (b.w?.expiry || '0') ? 1 : -1)
  return (
    <>
      <p className="muted small">Everyone with coach, volunteer or committee access. Sorted by expiry, so problems are at the top. Under 60 days to expiry is flagged.</p>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Access</th><th>Card</th><th>Expiry</th><th>Status</th></tr></thead>
        <tbody>{sorted.map(({ p, w }) => { const [cls, label] = wwccState(w); return <tr key={p.id}><td>{p.full_name || p.email}</td><td>{p.role}{p.is_executive ? ' · exec' : ''}</td><td>{w?.card_number || '—'}</td><td>{w ? fmtDate(w.expiry) : '—'}</td><td><span className={'pill ' + cls}>{label}</span></td></tr> })}</tbody></table></div>
    </>
  )
}
