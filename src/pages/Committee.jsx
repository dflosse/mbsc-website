import { useEffect, useState, useCallback, useMemo } from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, REG_SEASON, PREV_SEASON, fmtDate, ageGroupFor } from '../supabase'
import { useAuth } from '../auth'
import EditTable from './EditTable'
import useSettings from '../useSettings'
import { KitTags, kitText } from './kitInfo'
import { wwccState } from './Volunteer'
import Treasurer from './Treasurer'
import { bondInfo } from './bond'
import { sortPlayers, TEAM_SEL } from './sortPlayers'

export default function Committee() {
  const { isExec } = useAuth()
  const EXEC_ONLY = ['approvals', 'directory', 'wwcc', 'players', 'audit']
  return (
    <div className="wrap wide">
      <h1>Committee</h1>
      <div className="tabs">
        {[['overview', 'Overview'], ['approvals', 'Approve applications'], ['directory', 'Registered players'], ['wwcc', 'WWCC register'], ['players', 'Edit players'], ['galas', 'Galas'], ['tasks', 'Action list'], ['kit', 'Uniforms'], ['teams', 'Teams'], ['people', 'People & access'], ['docs', 'Documents'], ['roles', 'Committee roles'], ['treasurer', 'Treasurer'], ['settings', 'Fees & settings'], ['audit', 'Change log']].filter(([p]) => isExec || !EXEC_ONLY.includes(p)).map(([p, l]) => <NavLink key={p} to={'/committee/' + p} className={EXEC_ONLY.includes(p) ? 'exec' : ''}>{l}</NavLink>)}
      </div>
      {!isExec && <p className="muted small">Children's details, approvals and the WWCC register are visible to the executive committee only.</p>}
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="directory" element={<Directory />} />
        <Route path="wwcc" element={<WWCCRegister />} />
        <Route path="players" element={<Players />} />
        <Route path="galas" element={<Galas />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="kit" element={<Kit />} />
        <Route path="teams" element={<Teams />} />
        <Route path="people" element={<People />} />
        <Route path="docs" element={<Docs />} />
        <Route path="roles" element={<Roles />} />
        <Route path="treasurer" element={<Treasurer />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit" element={<Audit />} />
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
        uniReq: await c('players', (q) => q.eq('season', REG_SEASON).neq('status', 'withdrawn').eq('needs_uniform', true)),
        bootReq: await c('players', (q) => q.eq('season', REG_SEASON).neq('status', 'withdrawn').eq('needs_boots', true).in('boots_status', ['requested', 'waitlist'])),
        kitOut: await c('kit', (q) => q.in('status', ['Loaned Out', 'Outstanding'])),
        users: await c('profiles'),
      })
    })()
  }, [])
  const [due, setDue] = useState([])
  useEffect(() => { supabase.from('tasks').select('*').neq('status', 'done').order('due', { nullsFirst: false }).limit(6).then(({ data }) => setDue(data || [])) }, [])
  const st = useSettings()
  if (!s) return <p className="muted">Loading…</p>
  return (
    <>
      <p><b>Next AGM:</b> {st.agm || 'TBA'} <span className="muted small">(committee and executive only – not shown on the public site; set it in Fees & settings)</span></p>
      <div className="stats">
        <Stat n={s.pending} l="player registrations awaiting sign-off" to="approvals" warn={s.pending > 0} />
        <Stat n={s.vols} l="volunteer / coach applications awaiting sign-off" to="approvals" warn={s.vols > 0} />
        <Stat n={s.reg} l={`${REG_SEASON} registrations`} to="players" />
        <Stat n={s.unpaid} l={`${REG_SEASON} payments outstanding`} to="players" warn={s.unpaid > 0} />
        <Stat n={s.roster} l={`${PREV_SEASON} players (last season)`} to="players" />
        <Stat n={s.tasks} l="open actions" to="tasks" />
        <Stat n={s.uniReq} l={`${REG_SEASON} children needing a uniform`} to="kit" />
        <Stat n={s.bootReq} l="families interested in loan boots" to="kit" />
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
      <EditTable key={season} table="players" filter={filter} order={order} select={'*, ' + TEAM_SEL} sortRows={sortPlayers} search={['first_name', 'last_name']}
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
        <div className="table-wrap"><table>
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

function Kit() {
  const order = useMemo(() => [['sort_order']], [])
  const { isExec } = useAuth()
  const [players, setPlayers] = useState([])
  useEffect(() => { supabase.from('players').select('id, first_name, last_name, season, dob, ' + TEAM_SEL).gte('season', PREV_SEASON).neq('status', 'withdrawn').then(({ data }) => setPlayers(sortPlayers(data))) }, [])
  const popts = players.map((p) => [p.id, `${p.first_name} ${p.last_name} (${p.season})`])
  return (
    <>
      <KitRequests />
      <p className="muted small">{isExec ? 'Link a jersey to a child so their family sees it under My family. ' : ''}Jersey numbers repeat across print runs: plain numbers are the first run (1–55), R = repeated run, N = newer size-14 run.</p>
      <EditTable table="kit" order={order} search={['holder_name', 'jersey_label', 'notes', 'status']} defaults={{ jersey_label: 'New', status: 'Shed Tub', sort_order: 999 }}
        cols={[
          { key: 'jersey_label', label: '#', width: 50 }, { key: 'size', label: 'Size', width: 60 }, { key: 'kit_bag', label: 'Bag', width: 50 },
          ...(isExec ? [{ key: 'player_id', label: 'Linked child', type: 'select', options: popts, width: 170 }] : []),
          { key: 'holder_name', label: 'Holder (text)', width: 140 },
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
  const [gInv, setGInv] = useState([])
  const [dupes, setDupes] = useState({})
  const load = useCallback(async () => {
    const { data: p0 } = await supabase.from('players').select('*, ' + TEAM_SEL + ', player_guardians(profile_id)').eq('status', 'pending')
    const p = sortPlayers(p0)
    setPlayers(p)
    const { data: all } = await supabase.from('players').select('id, first_name, last_name, dob, season, status')
    const key = (x) => `${(x.first_name || '').trim().toLowerCase()}|${(x.last_name || '').trim().toLowerCase()}|${x.dob}`
    const dm = {}
    for (const x of p || []) { const m = (all || []).filter((y) => y.id !== x.id && key(y) === key(x)); if (m.length) dm[x.id] = m }
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
    }
  }, [])
  useEffect(() => { load() }, [load])

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
      <h2>Extra parents / guardians ({gInv.length})</h2>
      {gInv.length === 0 ? <p className="muted">Nothing waiting.</p> : <div className="table-wrap"><table><thead><tr><th>Child</th><th>Requested by</th><th>New guardian</th><th>Relationship</th><th /></tr></thead>
        <tbody>{gInv.map((i) => <tr key={i.id}><td><b>{i.players?.first_name} {i.players?.last_name}</b></td><td>{people[i.invited_by]?.full_name || people[i.invited_by]?.email || '—'}</td><td>{i.name}<br /><span className="small muted">{i.email}</span></td><td>{i.relationship || '—'}</td>
          <td className="nowrap">{isExec && <><button className="btn small" onClick={async () => { const { error } = await supabase.from('guardian_invites').update({ approved: true }).eq('id', i.id); setMsg(error ? error.message : 'Approved – they\'ll be linked when they sign up.'); load() }}>Approve</button> <button className="link danger" onClick={async () => { await supabase.from('guardian_invites').delete().eq('id', i.id); setMsg('Request removed.'); load() }}>Decline</button></>}</td></tr>)}</tbody></table></div>}
      <p className="small muted">Check custody arrangements before approving. Each parent's contact details stay hidden from the other.</p>
      <h2>Player registrations ({players.length})</h2>
      {players.length === 0 && <p className="muted">Nothing waiting.</p>}
      {players.length > 0 && <div className="table-wrap"><table><thead><tr><th>Player</th><th>Born</th><th>Season</th><th>Parent</th><th>Medical</th><th>FV reg</th><th>Paid</th><th /></tr></thead>
        <tbody>{players.map((p) => { const g = people[p.player_guardians?.[0]?.profile_id]; return (
          <tr key={p.id}><td><b>{p.first_name} {p.last_name}</b>{p.committee_notes && <><br /><span className="small muted">{p.committee_notes}</span></>}
            <KitTags p={p} />
            {dupes[p.id] && <div className="release">⚠ Possible duplicate: same name and birthday already registered ({dupes[p.id].map((d) => `${d.season} ${d.status}`).join(', ')}). Check before approving.</div>}</td><td>{p.dob ? fmtDate(p.dob) : ''}</td><td>{p.season}</td>
            <td>{g ? <>{g.full_name || g.email}<br /><span className="small muted">{g.phone}</span></> : <span className="muted">not linked</span>}</td>
            <td className={p.medical_notes ? 'alert' : 'muted'}>{p.medical_notes || '—'}</td><td>{p.fv_registered ? '✓' : '—'}</td><td>{p.fees_paid ? '✓' : '—'}</td>
            <td className="nowrap">{isExec && <><button className="btn small" onClick={() => decidePlayer(p, true)}>Approve</button> <button className="link danger" onClick={() => decidePlayer(p, false)}>Decline</button></>}</td></tr>) })}</tbody></table></div>}
      {deciding && <DecideModal a={deciding.a} ok={deciding.ok} person={people[deciding.a.profile_id] || {}} onClose={(m) => { setDeciding(null); if (m) setMsg(m); load() }} />}
      {open && <div className="modal" onClick={() => setOpen(null)}><div className="card" onClick={(e) => e.stopPropagation()}><h3>WWCC card</h3>{/\.pdf/i.test(open.split('?')[0]) ? <a href={open} target="_blank" rel="noreferrer">Open PDF</a> : <img src={open} alt="WWCC card" style={{ maxWidth: '100%' }} />}<p className="small muted">This link expires in 2 minutes.</p><button className="btn small ghost" onClick={() => setOpen(null)}>Close</button></div></div>}
    </>
  )
}

function WWCCRegister() {
  const { isExec } = useAuth()
  const [rows, setRows] = useState([])
  const [reload, setReload] = useState(0)
  const [note, setNote] = useState('')
  async function purge(p, w) {
    if (!window.confirm(`Permanently delete ${p.full_name || p.email}'s WWCC record and card image? This can't be undone.`)) return
    if (w.file_path) await supabase.storage.from('wwcc').remove([w.file_path])
    const { error } = await supabase.from('wwcc').delete().eq('profile_id', p.id)
    setNote(error ? error.message : 'Deleted.'); setReload((x) => x + 1)
  }
  useEffect(() => {
    (async () => {
      const { data: pr } = await supabase.from('profiles').select('*').in('role', ['volunteer', 'coach', 'committee', 'admin']).order('full_name')
      const ids = (pr || []).map((p) => p.id)
      const { data: w } = await supabase.from('wwcc').select('*')
      const wm = Object.fromEntries((w || []).map((x) => [x.profile_id, x]))
      const { data: vr } = await supabase.from('volunteer_roles').select('profile_id, season, status').eq('status', 'approved').gte('season', PREV_SEASON)
      const active = new Set((vr || []).map((x) => x.profile_id))
      const extra = (w || []).filter((x) => !ids.includes(x.profile_id)).map((x) => x.profile_id)
      const { data: pr2 } = extra.length ? await supabase.from('profiles').select('*').in('id', extra) : { data: [] }
      setRows([...(pr || []), ...(pr2 || [])].map((p) => ({ p, w: wm[p.id], active: active.has(p.id) || ['committee', 'admin'].includes(p.role) })))
    })()
  }, [reload])
  if (!isExec) return <div className="card"><p>The WWCC register is visible to the executive committee only.</p></div>
  const sorted = [...rows].sort((a, b) => (a.w?.expiry || '0') > (b.w?.expiry || '0') ? 1 : -1)
  return (
    <>
      <p className="muted small">Everyone with coach, volunteer or committee access, plus anyone else with a card on file. Sorted by expiry, so problems are at the top; under 60 days to expiry is flagged. <b>Retention rule:</b> delete a person's WWCC record once they stop volunteering, and no later than 12 months after their last approved role – people with no approved role this season or last are marked "Not active".</p>
      {note && <p className="ok">{note}</p>}
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Access</th><th>Card</th><th>Expiry</th><th>Status</th><th>Active?</th><th /></tr></thead>
        <tbody>{sorted.map(({ p, w, active }) => { const [cls, label] = wwccState(w); return <tr key={p.id}><td>{p.full_name || p.email}</td><td>{p.role}{p.is_executive ? ' · exec' : ''}</td><td>{w?.card_number || '—'}</td><td>{w ? fmtDate(w.expiry) : '—'}</td><td><span className={'pill ' + cls}>{label}</span></td>
          <td>{active ? 'Yes' : <span className="pill wait">Not active</span>}</td><td>{w && <button className="link danger" onClick={() => purge(p, w)}>Delete record</button>}</td></tr> })}</tbody></table></div>
    </>
  )
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
    onClose(`${person.full_name || person.email} ${ok ? 'approved – access is now active' : 'declined'}.`)
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

function Directory() {
  const { isExec } = useAuth()
  const teams = useTeams()
  const [reload, setReload] = useState(0)
  const [adding, setAdding] = useState(false)
  const [custodyFor, setCustodyFor] = useState(null)
  const [season, setSeason] = useState(REG_SEASON)
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
        <span>Season:</span>{[PREV_SEASON, REG_SEASON].map((s) => <button key={s} className={'btn small ' + (s === season ? '' : 'ghost')} onClick={() => setSeason(s)}>{s}</button>)}
        <select className="search" value={team} onChange={(e) => setTeam(e.target.value)}><option value="">All teams</option><option value="none">No team yet</option>{teams.filter((t) => t.season === season).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <select className="search" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Any status</option><option value="pending">Awaiting sign-off</option><option value="approved">Approved</option><option value="withdrawn">Withdrawn</option></select>
        <input className="search" placeholder="Search child or parent…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn small ghost" onClick={copy}>Copy for spreadsheet</button>{copied && <span className="small ok">{copied}</span>}
        <button className="btn small" onClick={() => setAdding(true)}>+ Add a family</button>
      </div>
      {adding && <AddFamily teams={teams.filter((t) => t.season === REG_SEASON)} onClose={(m) => { setAdding(false); if (m) setCopied(m); setReload((x) => x + 1) }} />}
      {custodyFor && <CustodyModal player={custodyFor} onClose={() => { setCustodyFor(null); setReload((x) => x + 1) }} />}
      <p className="small muted">{counts.total} players · {counts.fv} FV registered · {counts.paid} paid · {counts.med} with medical notes · {counts.uni} need a uniform · {counts.boots} interested in loan boots. Edit details under <NavLink to="/committee/players">Edit players</NavLink>.</p>
      <div className="table-wrap"><table className="dir">
        <thead><tr><th>Player</th><th>Team</th><th>Status</th><th>FV</th><th>Paid</th><th>Medical</th><th>Photos</th><th>Parent / guardian</th><th>Emergency</th></tr></thead>
        <tbody>{shown.map((r) => <tr key={r.id}>
          <td><b>{r.first_name} {r.last_name}</b><br /><span className="small muted">{r.dob ? fmtDate(r.dob, { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · {ageGroupFor(r.dob, r.season)}</span>
            {r.release_check && <div className="release">⚠ Release check</div>}
            <KitTags p={r} />
            <div><button className="link small" onClick={() => setCustodyFor(r)}>{r.custody?.custody_note || r.release_check ? 'Custody note' : '+ custody note'}</button></div></td>
          <td>{r.teams?.name || <span className="muted">TBA</span>}</td>
          <td><span className={'pill ' + ({ approved: 'good', pending: 'wait', withdrawn: 'bad' }[r.status])}>{r.status === 'pending' ? 'awaiting' : r.status}</span></td>
          <td>{r.fv_registered ? '✓' : <span className="err">✗</span>}</td><td>{r.fees_paid ? '✓' : <span className="err">✗</span>}</td>
          <td className={r.medical_notes ? 'alert' : 'muted'}>{r.medical_notes || '—'}</td><td>{r.photo_consent ? 'Yes' : 'No'}</td>
          <td>{r.guardians.map((g) => <div key={g.email} className="small"><b>{g.full_name || g.email}</b><br />{g.phone || ''}{g.phone ? ' · ' : ''}{g.email}</div>)}
            {r.invites.map((i) => <div key={i.id} className="small muted">{i.name || i.email} ({i.relationship || 'guardian'}) – {i.approved ? 'invited, not signed up' : 'awaiting approval'}<br />{i.phone || ''} {i.email}</div>)}
            {!r.guardians.length && !r.invites.length && <span className="muted small">not linked</span>}</td>
          <td className="small">{r.emergency_contact || '—'}</td>
        </tr>)}</tbody></table></div>
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
      {dupe && <p className="release">⚠ A child with this name and birthday is already registered ({dupe.map((d) => `${d.season} ${d.status}`).join(', ')}). Use "Edit players" to link a parent or carry them over instead.</p>}
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
      <div className="table-wrap"><table><thead><tr><th>When</th><th>Who</th><th>What</th><th>Action</th><th>Changes</th></tr></thead>
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
