import { useEffect, useState, useCallback, useMemo } from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, REG_SEASON, PREV_SEASON, fmtDate } from '../supabase'
import { useAuth } from '../auth'
import EditTable from './EditTable'

export default function Committee() {
  return (
    <div className="wrap wide">
      <h1>Committee</h1>
      <div className="tabs">
        {[['overview', 'Overview'], ['players', 'Players'], ['galas', 'Galas'], ['tasks', 'Action list'], ['kit', 'Uniforms'], ['teams', 'Teams'], ['people', 'People & access'], ['docs', 'Documents'], ['roles', 'Committee roles'], ['settings', 'Fees & settings']].map(([p, l]) => <NavLink key={p} to={'/committee/' + p}>{l}</NavLink>)}
      </div>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />
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
        <Stat n={s.pending} l="registrations awaiting approval" to="players" warn={s.pending > 0} />
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
      <p className="muted small">{season === PREV_SEASON ? `Last season's players are kept here. Use ➜${REG_SEASON} to carry a returning player over. ` : ''}Edits save as you go. "Approved" + FV registered + paid = fully registered. Use 🔗 to link a parent's account to a player.</p>
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
  async function setRole(id, role) { const { error } = await supabase.from('profiles').update({ role }).eq('id', id); setErr(error?.message || ''); load() }
  async function addCoach(profile_id, team_id) { if (!team_id) return; const { error } = await supabase.from('team_coaches').insert({ profile_id, team_id }); setErr(error?.message || ''); load() }
  async function rmCoach(profile_id, team_id) { await supabase.from('team_coaches').delete().eq('profile_id', profile_id).eq('team_id', team_id); load() }
  const tname = (id) => teams.find((t) => t.id === id)?.name + ' ' + (teams.find((t) => t.id === id)?.season || '')
  return (
    <>
      <p className="muted small">Everyone who signs up starts as a parent. {isAdmin ? 'As an admin you can make people coaches, committee members or admins.' : 'Only admins can change access levels.'} Committee members see all player details.</p>
      {err && <p className="err">{err}</p>}
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Access</th><th>Coaches</th></tr></thead>
        <tbody>{people.map((p) => <tr key={p.id}>
          <td>{p.full_name}</td><td>{p.email}</td><td>{p.phone}</td>
          <td>{isAdmin && p.id !== user.id ? <select value={p.role} onChange={(e) => setRole(p.id, e.target.value)}>{['parent', 'coach', 'committee', 'admin'].map((r) => <option key={r}>{r}</option>)}</select> : p.role}</td>
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
