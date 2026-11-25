import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, REG_SEASON, fmtDate } from '../supabase'
import { useAuth } from '../auth'

// Treasurer: grants, sponsorships and other income, grouped by where each one is up to.
const KINDS = [['grant', 'Grant'], ['sponsorship', 'Sponsorship'], ['donation', 'Donation'], ['fundraiser', 'Fundraiser'], ['other', 'Other']]
const STAGES = [
  { key: 'todo', title: 'To do', hint: 'Ideas and applications being written', statuses: ['idea', 'preparing'] },
  { key: 'waiting', title: 'Waiting to hear', hint: 'Sent in – waiting for an answer', statuses: ['submitted'] },
  { key: 'approved', title: 'Approved – money not in yet', hint: 'Chase payment / invoice the sponsor', statuses: ['successful'] },
  { key: 'received', title: 'Money received', hint: 'Banked. Grants may still need an acquittal (spending report).', statuses: ['received', 'acquitted'] },
  { key: 'closed', title: 'Unsuccessful or withdrawn', hint: '', statuses: ['declined', 'withdrawn'] },
]
const STATUS = (sp) => [
  ['idea', 'Idea'], ['preparing', sp ? 'Talking to them' : 'Writing application'], ['submitted', sp ? 'Proposal sent' : 'Applied – waiting'],
  ['successful', sp ? 'Agreed – not paid yet' : 'Approved – not paid yet'], ['received', sp ? 'Paid' : 'Money received'],
  ['acquitted', sp ? 'Finished' : 'Acquitted (all done)'], ['declined', 'Unsuccessful'], ['withdrawn', 'Withdrawn'],
]
const rank = (s) => STATUS(false).findIndex(([k]) => k === s)
const money = (n) => (n == null || n === '' ? '' : Number(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }))
const sum = (rows, k) => rows.reduce((t, r) => t + (Number(r[k]) || 0), 0)
const mainAmount = (r) => r.amount_received ?? r.amount_awarded ?? r.amount_requested
const nextDate = (r) => {
  if (['idea', 'preparing'].includes(r.status) && r.outcome_due) return ['Closes', r.outcome_due]
  if (r.status === 'submitted' && r.outcome_due) return ['Answer by', r.outcome_due]
  if (r.kind === 'sponsorship' && r.acquittal_due) return ['Renew', r.acquittal_due]
  if (['successful', 'received'].includes(r.status) && r.acquittal_due) return ['Acquittal due', r.acquittal_due]
  return null
}

export default function Treasurer() {
  const { isExec } = useAuth()
  const [season, setSeason] = useState(REG_SEASON)
  const [rows, setRows] = useState([])
  const [sources, setSources] = useState([])
  const [view, setView] = useState('grants')
  const [openId, setOpenId] = useState(null)
  const [adding, setAdding] = useState(null)
  const [editSrc, setEditSrc] = useState(null)
  const [showClosed, setShowClosed] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('funding').select('*').eq('season', season).order('created_at', { ascending: false })
    if (error) setErr(error.message); else setRows(data || [])
    const { data: s } = await supabase.from('funding_sources').select('*').order('sort').order('name')
    setSources(s || [])
  }, [season])
  useEffect(() => { load() }, [load])

  async function quickStatus(r, status) {
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status } : x)))
    const { error } = await supabase.from('funding').update({ status }).eq('id', r.id)
    if (error) { setErr(error.message); load() }
  }

  const inView = rows.filter((r) => (view === 'grants' ? r.kind === 'grant' : view === 'sponsors' ? r.kind === 'sponsorship' : !['grant', 'sponsorship'].includes(r.kind)))
  const banked = rows.filter((r) => ['received', 'acquitted'].includes(r.status))
  const approved = rows.filter((r) => r.status === 'successful')
  const waiting = rows.filter((r) => r.status === 'submitted')
  const today = new Date().toISOString().slice(0, 10)
  const soon = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10)
  const upcoming = useMemo(() => rows.map((r) => ({ r, nd: nextDate(r) })).filter((x) => x.nd && x.nd[1] <= soon && !['declined', 'withdrawn', 'acquitted'].includes(x.r.status)).sort((a, b) => a.nd[1].localeCompare(b.nd[1])), [rows, soon])
  const newKind = view === 'grants' ? 'grant' : view === 'sponsors' ? 'sponsorship' : 'fundraiser'

  return (
    <div className="treas">
      <div className="row between">
        <div className="tabs" style={{ margin: 0 }}>{[REG_SEASON - 1, REG_SEASON, REG_SEASON + 1].map((y) => <button key={y} className={y === season ? 'on' : ''} onClick={() => setSeason(y)}>{y}</button>)}</div>
        {!isExec && <span className="muted small">View only – the executive keeps this up to date.</span>}
      </div>
      {err && <p className="err">{err} <button className="link" onClick={() => setErr('')}>dismiss</button></p>}

      <div className="money-strip">
        <div><span>Banked in {season}</span><b>{money(sum(banked, 'amount_received')) || '$0'}</b></div>
        <div><span>Approved, still to come</span><b>{money(sum(approved, 'amount_awarded')) || '$0'}</b></div>
        <div><span>Waiting to hear</span><b>{money(sum(waiting, 'amount_requested')) || '$0'}</b></div>
      </div>

      {upcoming.length > 0 && (
        <div className="card soonlist">
          <h3>Coming up</h3>
          {upcoming.map(({ r, nd }) => <button key={r.id} className="soon" onClick={() => { setView(r.kind === 'grant' ? 'grants' : r.kind === 'sponsorship' ? 'sponsors' : 'other'); setOpenId(r.id) }}><b className={nd[1] < today ? 'err' : ''}>{fmtDate(nd[1])}</b><span>{nd[0]} – {r.title}</span></button>)}
        </div>
      )}

      <div className="tabs" style={{ marginTop: 16 }}>
        {[['grants', 'Grants'], ['sponsors', 'Sponsors'], ['other', 'Fundraising & donations'], ['ideas', 'Funding ideas']].map(([k, l]) => <button key={k} className={view === k ? 'on' : ''} onClick={() => { setView(k); setOpenId(null) }}>{l}</button>)}
      </div>

      {view !== 'ideas' ? (
        <>
          {isExec && (adding ? <ItemEditor row={adding} onDone={() => { setAdding(null); load() }} onCancel={() => setAdding(null)} isNew />
            : <button className="btn" onClick={() => setAdding({ kind: newKind, season, status: 'preparing' })}>+ Add {newKind === 'grant' ? 'a grant' : newKind === 'sponsorship' ? 'a sponsor' : 'money in'}</button>)}
          {inView.length === 0 && !adding && <p className="muted">Nothing for {season} yet.{view === 'grants' ? ' Try the Funding ideas tab.' : ''}</p>}
          {STAGES.map((st) => {
            const list = inView.filter((r) => st.statuses.includes(r.status))
            if (!list.length) return null
            if (st.key === 'closed' && !showClosed) return <button key={st.key} className="link" onClick={() => setShowClosed(true)}>Show {list.length} unsuccessful / withdrawn</button>
            return (
              <section key={st.key} className="stage">
                <h3>{st.title} <span className="muted small">({list.length}{list.some((r) => mainAmount(r)) ? `, ${money(list.reduce((t, r) => t + (Number(mainAmount(r)) || 0), 0))}` : ''})</span></h3>
                {st.hint && <p className="muted small">{st.hint}</p>}
                <div className="itemlist">
                  {list.map((r) => openId === r.id && isExec
                    ? <ItemEditor key={r.id} row={r} onDone={() => { setOpenId(null); load() }} onCancel={() => setOpenId(null)} />
                    : <Item key={r.id} r={r} isExec={isExec} open={openId === r.id} onOpen={() => setOpenId(openId === r.id ? null : r.id)} onStatus={(s) => quickStatus(r, s)} />)}
                </div>
              </section>
            )
          })}
        </>
      ) : (
        <>
          <p className="muted small">Grants and funding the club could apply for. Dates change every year – always check the link. {isExec && 'Tap "Start" to add one to your Grants or Sponsors list.'}</p>
          {isExec && <button className="btn ghost small" onClick={() => setEditSrc({ kind: 'grant', active: true, sort: 200 })}>+ Add a funding idea</button>}
          <div className="itemlist" style={{ marginTop: 10 }}>
            {sources.filter((s) => s.active || isExec).map((s) => (
              <div key={s.id} className="item" style={s.active ? null : { opacity: 0.6 }}>
                <div className="item-top">
                  <div><b>{s.name}</b><div className="muted small">{s.provider}{s.typical_amount ? ` · ${s.typical_amount}` : ''}</div></div>
                  {isExec && <button className="btn small" onClick={() => { setView(s.kind === 'sponsorship' ? 'sponsors' : s.kind === 'grant' ? 'grants' : 'other'); setAdding({ kind: s.kind, season, status: 'preparing', title: s.name, funder: s.provider, source_id: s.id, link: s.link }) }}>Start</button>}
                </div>
                {s.timing && <p className="small" style={{ margin: '6px 0 0' }}><b>When:</b> {s.timing}</p>}
                {s.fit && <p className="small" style={{ margin: '2px 0 0' }}><b>Fit:</b> {s.fit}</p>}
                {s.notes && <p className="small muted" style={{ margin: '2px 0 0' }}>{s.notes}</p>}
                <div className="row" style={{ marginTop: 6 }}>{s.link && <a className="small" href={s.link} target="_blank" rel="noreferrer">Website</a>}{isExec && <button className="link small" onClick={() => setEditSrc(s)}>Edit idea</button>}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="muted small" style={{ marginTop: 18 }}>A copy will also be kept in a private Google Sheet for the executive (being set up).</p>
      {editSrc && <SourceForm row={editSrc} onClose={() => setEditSrc(null)} onSaved={() => { setEditSrc(null); load() }} />}
    </div>
  )
}

function Item({ r, isExec, open, onOpen, onStatus }) {
  const sp = r.kind === 'sponsorship'
  const nd = nextDate(r)
  const amt = mainAmount(r)
  const amtLabel = r.amount_received != null ? 'received' : r.amount_awarded != null ? (sp ? 'agreed' : 'approved') : r.amount_requested != null ? 'asked for' : ''
  return (
    <div className="item">
      <div className="item-top">
        <button className="item-main" onClick={onOpen} aria-expanded={open}>
          <b>{r.title}</b>
          <span className="muted small">{[r.funder, r.purpose].filter(Boolean).join(' – ')}</span>
        </button>
        <div className="item-amt">{amt != null && <><b>{money(amt)}</b><span className="muted small">{amtLabel}</span></>}</div>
      </div>
      <div className="item-bottom">
        {isExec
          ? <select value={r.status} onChange={(e) => onStatus(e.target.value)} aria-label="Status">{STATUS(sp).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          : <span className="pill">{Object.fromEntries(STATUS(sp))[r.status]}</span>}
        {nd && <span className="small">{nd[0]}: <b>{fmtDate(nd[1])}</b></span>}
        <button className="link small" onClick={onOpen}>{isExec ? 'Edit' : open ? 'Less' : 'Details'}</button>
      </div>
      {open && !isExec && (
        <dl className="mini">
          {r.amount_requested != null && <><dt>Asked for</dt><dd>{money(r.amount_requested)}</dd></>}
          {r.amount_awarded != null && <><dt>{sp ? 'Agreed' : 'Approved'}</dt><dd>{money(r.amount_awarded)}</dd></>}
          {r.amount_received != null && <><dt>Received</dt><dd>{money(r.amount_received)}{r.received_on ? ` on ${fmtDate(r.received_on)}` : ''}</dd></>}
          {r.obligations && <><dt>{sp ? 'They get' : 'Conditions'}</dt><dd>{r.obligations}</dd></>}
          {r.notes && <><dt>Notes</dt><dd>{r.notes}</dd></>}
        </dl>
      )}
    </div>
  )
}

// Inline editor: only shows the fields that matter for where the item is up to.
function ItemEditor({ row, onDone, onCancel, isNew }) {
  const [f, setF] = useState(row)
  const [more, setMore] = useState(false)
  const [err, setErr] = useState('')
  const sp = f.kind === 'sponsorship'
  const r = rank(f.status)
  const set = (k, numeric) => (e) => setF({ ...f, [k]: numeric ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value })
  async function save(e) {
    e.preventDefault()
    const clean = Object.fromEntries(Object.entries(f).filter(([k]) => !['id', 'created_at', 'updated_at', 'created_by'].includes(k)).map(([k, v]) => [k, v === '' ? null : v]))
    const { error } = f.id ? await supabase.from('funding').update(clean).eq('id', f.id) : await supabase.from('funding').insert(clean)
    if (error) setErr(error.message); else onDone()
  }
  async function remove() {
    if (!confirm('Delete this record? This cannot be undone.')) return
    const { error } = await supabase.from('funding').delete().eq('id', f.id)
    if (error) setErr(error.message); else onDone()
  }
  return (
    <form className="item editing" onSubmit={save}>
      {isNew && <div className="row" style={{ marginBottom: 4 }}>{KINDS.map(([v, l]) => <button type="button" key={v} className={'btn small' + (f.kind === v ? '' : ' ghost')} onClick={() => setF({ ...f, kind: v })}>{l}</button>)}</div>}
      <label>{sp ? 'Sponsor / business' : 'Name'}<input value={f.title || ''} onChange={set('title')} required autoFocus={isNew} placeholder={sp ? 'e.g. Mount Beauty Bakery' : 'e.g. Sporting Club Grant – new goals'} /></label>
      {!sp && <label>Who's giving it<input value={f.funder || ''} onChange={set('funder')} placeholder="e.g. Sport and Recreation Victoria" /></label>}
      <label>What it's for<input value={f.purpose || ''} onChange={set('purpose')} placeholder={sp ? 'e.g. new jerseys' : 'e.g. goals and balls for U7s'} /></label>
      <label>Where it's up to<select value={f.status} onChange={set('status')}>{STATUS(sp).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>

      <fieldset className="kitq"><legend>Money</legend>
        <div className="grid2 tight">
          <label>{sp ? 'Asked for' : 'Asked for'} ($)<input type="number" inputMode="decimal" min="0" value={f.amount_requested ?? ''} onChange={set('amount_requested', true)} /></label>
          {r >= rank('successful') && r <= rank('acquitted') && <label>{sp ? 'Agreed' : 'Approved'} ($)<input type="number" inputMode="decimal" min="0" value={f.amount_awarded ?? ''} onChange={set('amount_awarded', true)} /></label>}
          {r >= rank('received') && r <= rank('acquitted') && <label>Received ($)<input type="number" inputMode="decimal" min="0" value={f.amount_received ?? ''} onChange={set('amount_received', true)} /></label>}
          {r >= rank('received') && r <= rank('acquitted') && <label>Received on<input type="date" value={f.received_on || ''} onChange={set('received_on')} /></label>}
        </div>
      </fieldset>

      <fieldset className="kitq"><legend>Dates</legend>
        <div className="grid2 tight">
          {['idea', 'preparing'].includes(f.status) && <label>Applications close<input type="date" value={f.outcome_due || ''} onChange={set('outcome_due')} /></label>}
          {!sp && r >= rank('submitted') && <label>Applied on<input type="date" value={f.applied_on || ''} onChange={set('applied_on')} /></label>}
          {f.status === 'submitted' && <label>Answer expected<input type="date" value={f.outcome_due || ''} onChange={set('outcome_due')} /></label>}
          {(sp || (r >= rank('successful') && r <= rank('acquitted'))) && <label>{sp ? 'Renewal date' : 'Acquittal due'}<input type="date" value={f.acquittal_due || ''} onChange={set('acquittal_due')} /></label>}
        </div>
      </fieldset>

      {!more ? <button type="button" className="link small" onClick={() => setMore(true)}>+ More details (conditions, contact, link, notes)</button> : (
        <>
          <label>{sp ? 'What they get in return' : 'Conditions'}<textarea rows={2} value={f.obligations || ''} onChange={set('obligations')} placeholder={sp ? 'e.g. logo on sleeve, banner at home gala' : 'e.g. spend by 30 June, keep receipts and photos'} /></label>
          <label>In-kind help<input value={f.in_kind || ''} onChange={set('in_kind')} placeholder="e.g. printing, BBQ supplies" /></label>
          <label>Contact<input value={f.contact || ''} onChange={set('contact')} /></label>
          <label>Link<input value={f.link || ''} onChange={set('link')} placeholder="https://" /></label>
          <label>Notes<textarea rows={2} value={f.notes || ''} onChange={set('notes')} /></label>
          <label>Season<input type="number" value={f.season ?? REG_SEASON} onChange={set('season', true)} /></label>
        </>
      )}
      {err && <p className="err">{err}</p>}
      <div className="row between">
        <div className="row"><button className="btn">Save</button><button type="button" className="btn ghost" onClick={onCancel}>Cancel</button></div>
        {f.id && <button type="button" className="link danger small" onClick={remove}>Delete</button>}
      </div>
    </form>
  )
}

function SourceForm({ row, onClose, onSaved }) {
  const [f, setF] = useState(row)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  async function save(e) {
    e.preventDefault()
    const clean = Object.fromEntries(Object.entries(f).filter(([k]) => !['id', 'created_at'].includes(k)).map(([k, v]) => [k, v === '' ? null : v]))
    const { error } = f.id ? await supabase.from('funding_sources').update(clean).eq('id', f.id) : await supabase.from('funding_sources').insert(clean)
    if (error) setErr(error.message); else onSaved()
  }
  return (
    <div className="modal" onClick={onClose}>
      <form className="card" onClick={(e) => e.stopPropagation()} onSubmit={save} style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3>{f.id ? 'Edit' : 'Add'} funding idea</h3>
        <label>Name<input value={f.name || ''} onChange={set('name')} required /></label>
        <label>Who offers it<input value={f.provider || ''} onChange={set('provider')} /></label>
        <label>Type<select value={f.kind} onChange={set('kind')}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label>Amount<input value={f.typical_amount || ''} onChange={set('typical_amount')} placeholder="e.g. up to $5,000" /></label>
        <label>When it opens<input value={f.timing || ''} onChange={set('timing')} /></label>
        <label>Fit for us<textarea rows={2} value={f.fit || ''} onChange={set('fit')} /></label>
        <label>Link<input value={f.link || ''} onChange={set('link')} placeholder="https://" /></label>
        <label>Notes<textarea rows={2} value={f.notes || ''} onChange={set('notes')} /></label>
        <label className="check"><input type="checkbox" checked={!!f.active} onChange={set('active')} /> Show in the list</label>
        {err && <p className="err">{err}</p>}
        <div className="row"><button className="btn">Save</button><button type="button" className="btn ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </div>
  )
}
