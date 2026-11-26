// Preseason: one place for the committee to get the season ready.
// Key dates, a live "where we're at" summary, and the checklist (tasks with a stage).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, REG_SEASON, PREV_SEASON, fmtDate } from '../supabase'
import { useAuth } from '../auth'
import { useLive } from './EditTable'

export const STAGES = [
  { key: 'plan', title: 'Plan the season', when: 'Nov – Dec', blurb: 'Committee, compliance, money, dates and grounds.' },
  { key: 'register', title: 'Registrations', when: 'Jan – Feb', blurb: 'Open registrations, promote, approve and check payments.' },
  { key: 'people', title: 'Coaches & volunteers', when: 'Jan – Mar', blurb: 'Recruit, check WWCCs, register and train.' },
  { key: 'teams', title: 'Teams, uniforms & gear', when: 'March', blurb: 'Build teams, order uniforms, check equipment.' },
  { key: 'ready', title: 'Ready for first training', when: 'Before term 2', blurb: 'Hand out uniforms, brief coaches, final checks.' },
  { key: 'gala', title: 'Gala days', when: 'Term 2', blurb: 'Entries, availability and hosting our home gala.' },
]
const STATUS = { todo: 'To do', doing: 'Under way', done: 'Done' }
const today = () => new Date().toISOString().slice(0, 10)
const daysTo = (d) => Math.round((new Date(d + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000)
const until = (d) => { const n = daysTo(d); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n > 0 ? (n < 21 ? `in ${n} days` : `in ${Math.round(n / 7)} weeks`) : n === -1 ? 'yesterday' : `${-n} days ago` }

export default function Preseason() {
  const { isExec } = useAuth()
  const [tasks, setTasks] = useState(null)
  const [err, setErr] = useState(null)
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('tasks').select('*').eq('season', REG_SEASON).not('stage', 'is', null).order('sort', { nullsFirst: false }).order('created_at')
    if (error) setErr(error.message); else setTasks(data || [])
  }, [])
  useEffect(() => { load() }, [load])
  useLive(['tasks'], load)

  const [owner, setOwner] = useState('')
  const [hideDone, setHideDone] = useState(false)
  const owners = useMemo(() => [...new Set((tasks || []).map((t) => t.owner).filter(Boolean))].sort(), [tasks])
  const done = (tasks || []).filter((t) => t.status === 'done').length
  const total = (tasks || []).length
  const overdue = (tasks || []).filter((t) => t.status !== 'done' && t.due && t.due < today()).length

  async function setStatus(t, status) {
    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, status } : x)))
    const { error } = await supabase.from('tasks').update({ status }).eq('id', t.id)
    if (error) { setErr(error.message); load() }
  }

  return (
    <div className="pre">
      <header className="pre-head">
        <div>
          <h2>{REG_SEASON} preseason</h2>
          <p className="muted">Everything the committee needs to get the season ready, in one place. Tick things off as you go – it updates for everyone straight away.</p>
        </div>
        {tasks && <div className="pre-progress" aria-label={`${done} of ${total} done`}>
          <div className="pre-progress-num"><b>{done}</b> of {total} done{overdue > 0 && <span className="pill bad">{overdue} overdue</span>}</div>
          <div className="bar"><span style={{ width: total ? `${(done / total) * 100}%` : 0 }} /></div>
        </div>}
      </header>

      <KeyDates />
      <Readiness isExec={isExec} />

      <section className="pre-checklist">
        <div className="row between pre-tools">
          <h2>Checklist</h2>
          <div className="row">
            <label className="inline">Who <select value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">Everyone</option>{owners.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label className="check inline"><input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> Hide done</label>
          </div>
        </div>
        {err && <p className="err small">{err}</p>}
        {!tasks ? <p className="muted">Loading…</p> : STAGES.map((s, i) => (
          <Stage key={s.key} n={i + 1} stage={s} items={tasks.filter((t) => t.stage === s.key)} owner={owner} hideDone={hideDone} setStatus={setStatus} reload={load} owners={owners} />
        ))}
        <p className="small muted">These items are also on the <Link to="/committee/tasks">Action list</Link>, with the club's other jobs.</p>
      </section>
    </div>
  )
}

function Stage({ n, stage, items, owner, hideDone, setStatus, reload, owners }) {
  const done = items.filter((t) => t.status === 'done').length
  const shown = items.filter((t) => (!owner || t.owner === owner) && (!hideDone || t.status !== 'done'))
  const complete = items.length > 0 && done === items.length
  const [open, setOpen] = useState(!complete)
  const [editing, setEditing] = useState(null)
  return (
    <section className={'pre-stage' + (complete ? ' complete' : '')}>
      <button className="pre-stage-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="pre-num">{complete ? '✓' : n}</span>
        <span className="pre-stage-title"><b>{stage.title}</b><span className="muted small">{stage.when} · {stage.blurb}</span></span>
        <span className="pre-count">{done}/{items.length}<span className="bar small"><span style={{ width: items.length ? `${(done / items.length) * 100}%` : 0 }} /></span></span>
        <span className="chev" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="pre-items">
          {shown.length === 0 && <p className="muted small pad">{items.length ? 'Nothing to show with these filters.' : 'No items yet.'}</p>}
          {shown.map((t) => editing === t.id
            ? <ItemForm key={t.id} item={t} owners={owners} onDone={() => { setEditing(null); reload() }} />
            : <Item key={t.id} t={t} setStatus={setStatus} onEdit={() => setEditing(t.id)} />)}
          {editing === 'new'
            ? <ItemForm item={{ stage: stage.key, season: REG_SEASON, status: 'todo', sort: (items.at(-1)?.sort ?? 0) + 1 }} owners={owners} onDone={() => { setEditing(null); reload() }} />
            : <button className="link small add-item" onClick={() => setEditing('new')}>+ Add an item</button>}
        </div>
      )}
    </section>
  )
}

function Item({ t, setStatus, onEdit }) {
  const [more, setMore] = useState(false)
  const late = t.status !== 'done' && t.due && t.due < today()
  const internal = t.link && t.link.startsWith('/')
  return (
    <div className={'pre-item ' + t.status}>
      <input type="checkbox" checked={t.status === 'done'} onChange={(e) => setStatus(t, e.target.checked ? 'done' : 'todo')} aria-label={`Mark "${t.title}" done`} />
      <div className="pre-item-main">
        <button className="pre-item-title" onClick={() => setMore(!more)}>{t.title}</button>
        <div className="pre-meta">
          {t.owner && <span className="tag">{t.owner}</span>}
          {t.status === 'doing' && <span className="pill wait">Under way</span>}
          {t.due && <span className={late ? 'due late' : 'due'}>{late ? 'Overdue · ' : 'Due '}{fmtDate(t.due)}</span>}
          {t.link && (internal ? <Link to={t.link} className="go">Open →</Link> : <a href={t.link} target="_blank" rel="noreferrer" className="go">Open ↗</a>)}
        </div>
        {more && (
          <div className="pre-more">
            {t.notes ? <p>{t.notes}</p> : <p className="muted small">No notes.</p>}
            <div className="row">
              {t.status !== 'doing' && t.status !== 'done' && <button className="btn small ghost" onClick={() => setStatus(t, 'doing')}>Mark under way</button>}
              <button className="btn small ghost" onClick={onEdit}>Edit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ItemForm({ item, owners, onDone }) {
  const [f, setF] = useState({ title: '', owner: '', due: '', status: 'todo', notes: '', link: '', category: '', ...item })
  const [err, setErr] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function save(e) {
    e.preventDefault()
    const row = { season: f.season, stage: f.stage, title: f.title.trim(), owner: f.owner.trim() || null, due: f.due || null, status: f.status, notes: f.notes.trim() || null, link: f.link.trim() || null, category: f.category?.trim() || null, sort: f.sort ?? null }
    const { error } = item.id ? await supabase.from('tasks').update(row).eq('id', item.id) : await supabase.from('tasks').insert(row)
    if (error) setErr(error.message); else onDone()
  }
  async function remove() {
    if (!window.confirm(`Delete "${f.title}" from the checklist?`)) return
    const { error } = await supabase.from('tasks').delete().eq('id', item.id)
    if (error) setErr(error.message); else onDone()
  }
  return (
    <form className="pre-form" onSubmit={save}>
      <label>What needs doing<input value={f.title} onChange={set('title')} required autoFocus /></label>
      <div className="ae-grid">
        <label>Who<input value={f.owner || ''} onChange={set('owner')} list="pre-owners" placeholder="e.g. Secretary" /></label>
        <label>Due<input type="date" value={f.due || ''} onChange={set('due')} /></label>
        <label>Status<select value={f.status} onChange={set('status')}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Section<select value={f.stage} onChange={set('stage')}>{STAGES.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}</select></label>
      </div>
      <datalist id="pre-owners">{owners.map((o) => <option key={o} value={o} />)}</datalist>
      <label>Notes<textarea rows={3} value={f.notes || ''} onChange={set('notes')} /></label>
      <label>Link <span className="muted small">(a page on this site like /committee/kit, or a web address)</span><input value={f.link || ''} onChange={set('link')} /></label>
      {err && <p className="err small">{err}</p>}
      <div className="row"><button className="btn small">Save</button><button type="button" className="btn small ghost" onClick={onDone}>Cancel</button>
        {item.id && <button type="button" className="link danger small" onClick={remove}>Delete</button>}</div>
    </form>
  )
}

function KeyDates() {
  const [dates, setDates] = useState(null)
  const [edit, setEdit] = useState(false)
  const load = useCallback(async () => {
    const { data } = await supabase.from('key_dates').select('*').eq('season', REG_SEASON).order('sort')
    setDates(data || [])
  }, [])
  useEffect(() => { load() }, [load])
  useLive(['key_dates'], load)
  async function save(d, patch) {
    setDates((ds) => ds.map((x) => (x.id === d.id ? { ...x, ...patch } : x)))
    await supabase.from('key_dates').update(patch).eq('id', d.id)
  }
  async function add() { await supabase.from('key_dates').insert({ season: REG_SEASON, label: 'New date', sort: (dates.at(-1)?.sort ?? 0) + 1 }); load() }
  async function remove(d) { if (window.confirm(`Remove "${d.label}"?`)) { await supabase.from('key_dates').delete().eq('id', d.id); load() } }
  if (!dates) return null
  const next = dates.filter((d) => d.on_date && d.on_date >= today()).sort((a, b) => a.on_date.localeCompare(b.on_date))[0]
  return (
    <section className="pre-dates">
      <div className="row between"><h3>Key dates</h3><button className="link small" onClick={() => setEdit(!edit)}>{edit ? 'Done' : 'Edit dates'}</button></div>
      {edit ? (
        <div className="pre-dates-edit">
          {dates.map((d) => (
            <div key={d.id} className="row">
              <input defaultValue={d.label} onBlur={(e) => e.target.value !== d.label && save(d, { label: e.target.value })} aria-label="Name" />
              <input type="date" value={d.on_date || ''} onChange={(e) => save(d, { on_date: e.target.value || null })} aria-label={`${d.label} date`} />
              <input defaultValue={d.notes || ''} placeholder="Note (optional)" onBlur={(e) => e.target.value !== (d.notes || '') && save(d, { notes: e.target.value || null })} aria-label="Note" />
              <button className="link danger small" onClick={() => remove(d)}>Remove</button>
            </div>
          ))}
          <button className="link small" onClick={add}>+ Add a date</button>
        </div>
      ) : (
        <ol className="pre-timeline">
          {dates.map((d) => (
            <li key={d.id} className={(d.on_date && d.on_date < today() ? 'past ' : '') + (next?.id === d.id ? 'next' : '')}>
              <span className="when">{d.on_date ? fmtDate(d.on_date, { day: 'numeric', month: 'short' }) : 'TBA'}</span>
              <span className="what">{d.label}</span>
              {d.on_date && d.on_date >= today() && <span className="small muted">{until(d.on_date)}</span>}
              {d.notes && <span className="small muted">{d.notes}</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function Readiness({ isExec }) {
  const [r, setR] = useState(null)
  const load = useCallback(async () => {
    const c = async (t, f) => { let q = supabase.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q); return (await q).count ?? 0 }
    const [{ data: teams }, { data: roles }] = await Promise.all([
      supabase.from('teams').select('id, name, coach_names').eq('season', REG_SEASON).or('active.is.null,active.eq.true'),
      supabase.from('committee_roles').select('grp, role, person').eq('season', REG_SEASON),
    ])
    const out = {
      teams: teams?.length ?? 0,
      noCoach: (teams || []).filter((t) => !t.coach_names?.trim()).length,
      exec: (roles || []).filter((x) => x.grp === 'Executive'),
      fv: (roles || []).filter((x) => x.grp === 'Football Victoria contacts'),
      kitOut: await c('kit', (q) => q.eq('season', PREV_SEASON).in('status', ['Loaned Out', 'Outstanding'])),
    }
    if (isExec) {
      const live = (q) => q.eq('season', REG_SEASON).neq('status', 'withdrawn')
      Object.assign(out, {
        players: await c('players', live),
        pending: await c('players', (q) => q.eq('season', REG_SEASON).eq('status', 'pending')),
        fv_ok: await c('players', (q) => live(q).eq('fv_registered', true)),
        paid: await c('players', (q) => live(q).eq('fees_paid', true)),
        unassigned: await c('players', (q) => live(q).neq('status', 'pending').is('team_id', null)),
        uniforms: await c('players', (q) => live(q).eq('needs_uniform', true)),
        volPending: await c('volunteer_roles', (q) => q.eq('status', 'pending')),
        coaches: await c('volunteer_roles', (q) => q.eq('status', 'approved').eq('kind', 'coach')),
      })
      const { data: w } = await supabase.from('wwcc').select('*')
      const { data: active } = await supabase.from('volunteer_roles').select('profile_id').in('status', ['approved', 'pending'])
      const ids = new Set((active || []).map((a) => a.profile_id))
      const mine = (w || []).filter((x) => ids.has(x.profile_id))
      out.wwccWaiting = mine.filter((x) => x.pending).length
      out.wwccTodo = mine.filter((x) => !x.pending && (!x.status_checked_at || !x.wwc_connected_at)).length
      out.wwccExpiring = mine.filter((x) => x.expiry && x.expiry <= `${REG_SEASON}-09-30`).length
    }
    setR(out)
  }, [isExec])
  useEffect(() => { load() }, [load])
  useLive(isExec ? ['players', 'teams', 'volunteer_roles', 'wwcc', 'committee_roles', 'kit'] : ['teams', 'committee_roles', 'kit'], load)
  if (!r) return null
  const vacant = (list) => list.filter((x) => !x.person?.trim()).map((x) => x.role)
  const execVacant = vacant(r.exec), fvVacant = vacant(r.fv)
  return (
    <section className="pre-ready">
      <h3>Where we're at</h3>
      <div className="pre-tiles">
        {isExec && <Tile to="/committee/players" title="Players" big={r.players} unit="registered"
          lines={[[r.pending, 'waiting for approval', r.pending > 0], [r.players - r.fv_ok, 'not yet on PlayFootball', r.players - r.fv_ok > 0], [r.players - r.paid, 'fees not paid', r.players - r.paid > 0]]} />}
        <Tile to="/committee/teams" title="Teams" big={r.teams} unit={`${REG_SEASON} teams`}
          lines={[[r.noCoach, 'without a coach', r.noCoach > 0], ...(isExec ? [[r.unassigned, 'approved players not in a team', r.unassigned > 0]] : [])]} />
        {isExec && <Tile to="/committee/approvals" title="Coaches & volunteers" big={r.coaches} unit="coaches approved"
          lines={[[r.volPending, 'applications waiting', r.volPending > 0]]} />}
        {isExec && <Tile to="/committee/wwcc" title="Working With Children" big={r.wwccTodo + r.wwccWaiting} unit="need follow-up" good={r.wwccTodo + r.wwccWaiting === 0}
          lines={[[r.wwccTodo, 'to check / connect', r.wwccTodo > 0], [r.wwccWaiting, 'waiting for a card', r.wwccWaiting > 0], [r.wwccExpiring, 'expire before season ends', r.wwccExpiring > 0]]} />}
        <Tile to="/committee/roles" title="Committee" big={r.exec.length - execVacant.length} unit={`of ${r.exec.length} exec roles filled`}
          lines={[[null, execVacant.length ? `Vacant: ${execVacant.join(', ')}` : 'All exec roles filled', execVacant.length > 0], [fvVacant.length, 'Football Victoria contacts to fill', fvVacant.length > 0]]} />
        <Tile to="/committee/kit" title="Uniforms" big={isExec ? r.uniforms : r.kitOut} unit={isExec ? 'children need a uniform' : `${PREV_SEASON} jerseys still out`}
          lines={isExec ? [[r.kitOut, `${PREV_SEASON} jerseys still out`, r.kitOut > 0]] : []} />
      </div>
    </section>
  )
}

function Tile({ to, title, big, unit, lines = [], good }) {
  const warn = lines.some(([, , w]) => w)
  return (
    <Link to={to} className={'pre-tile' + (warn ? ' warn' : good ? ' ok' : '')}>
      <span className="pre-tile-title">{title}</span>
      <span className="pre-tile-big"><b>{big ?? '–'}</b> {unit}</span>
      {lines.map(([n, label, w], i) => <span key={i} className={'pre-tile-line' + (w ? ' w' : '')}>{n !== null && n !== undefined ? <b>{n}</b> : null} {label}</span>)}
    </Link>
  )
}
