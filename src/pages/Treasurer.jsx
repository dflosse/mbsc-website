import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, REG_SEASON, fmtDate } from '../supabase'
import { useAuth } from '../auth'

// Treasurer: grants, sponsorships and other funding, plus a list of funding ideas.
const STATUS = [
  ['idea', 'Idea'], ['preparing', 'Preparing'], ['submitted', 'Applied – waiting'], ['successful', 'Approved – not yet paid'],
  ['received', 'Received'], ['acquitted', 'Acquitted / done'], ['declined', 'Declined'], ['withdrawn', 'Withdrawn'],
]
const SPONSOR_STATUS = [
  ['idea', 'Idea'], ['preparing', 'Talking to them'], ['submitted', 'Proposal sent'], ['successful', 'Agreed – not yet paid'],
  ['received', 'Paid / delivered'], ['acquitted', 'Finished'], ['declined', 'Declined'], ['withdrawn', 'Withdrawn'],
]
const KINDS = [['grant', 'Grant'], ['sponsorship', 'Sponsorship'], ['donation', 'Donation'], ['fundraiser', 'Fundraiser'], ['other', 'Other']]
const TONE = { submitted: 'wait', preparing: 'wait', successful: 'good', received: 'good', acquitted: 'good', declined: 'bad', withdrawn: '' , idea: '' }
const money = (n) => (n == null || n === '' ? '' : Number(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }))
const sum = (rows, k) => rows.reduce((t, r) => t + (Number(r[k]) || 0), 0)
const statusLabel = (r) => Object.fromEntries(r.kind === 'sponsorship' ? SPONSOR_STATUS : STATUS)[r.status] || r.status

export default function Treasurer() {
  const { isExec } = useAuth()
  const [season, setSeason] = useState(REG_SEASON)
  const [rows, setRows] = useState([])
  const [sources, setSources] = useState([])
  const [view, setView] = useState('grants')
  const [edit, setEdit] = useState(null)
  const [editSrc, setEditSrc] = useState(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('funding').select('*').eq('season', season).order('created_at', { ascending: false })
    if (error) setErr(error.message); else setRows(data || [])
    const { data: s } = await supabase.from('funding_sources').select('*').order('sort').order('name')
    setSources(s || [])
  }, [season])
  useEffect(() => { load() }, [load])

  const grants = rows.filter((r) => r.kind === 'grant')
  const sponsors = rows.filter((r) => r.kind === 'sponsorship')
  const other = rows.filter((r) => !['grant', 'sponsorship'].includes(r.kind))
  const live = rows.filter((r) => !['declined', 'withdrawn', 'idea'].includes(r.status))
  const waiting = live.filter((r) => r.status === 'submitted')
  const approved = live.filter((r) => r.status === 'successful')
  const today = new Date().toISOString().slice(0, 10)
  const soon = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10)
  const upcoming = useMemo(() => rows.flatMap((r) => [
    r.status === 'submitted' && r.outcome_due && { r, d: r.outcome_due, what: 'Outcome expected' },
    r.kind !== 'sponsorship' && ['successful', 'received'].includes(r.status) && r.acquittal_due && { r, d: r.acquittal_due, what: 'Acquittal / report due' },
    r.kind === 'sponsorship' && r.acquittal_due && !['declined', 'withdrawn'].includes(r.status) && { r, d: r.acquittal_due, what: 'Sponsorship renewal' },
    ['idea', 'preparing'].includes(r.status) && r.outcome_due && { r, d: r.outcome_due, what: 'Application closes' },
  ].filter(Boolean)).filter((x) => x.d <= soon).sort((a, b) => a.d.localeCompare(b.d)), [rows, soon])

  const list = view === 'grants' ? grants : view === 'sponsors' ? sponsors : other
  const newKind = view === 'grants' ? 'grant' : view === 'sponsors' ? 'sponsorship' : 'fundraiser'

  return (
    <>
      <div className="row between">
        <p className="muted small" style={{ margin: 0 }}>Grants, sponsorships and other income. {isExec ? 'The executive can add and edit; the rest of the committee can view.' : 'View only – the executive keeps this up to date.'}</p>
        <div className="tabs" style={{ margin: 0 }}>{[REG_SEASON - 1, REG_SEASON, REG_SEASON + 1].map((y) => <button key={y} className={y === season ? 'on' : ''} onClick={() => setSeason(y)}>{y}</button>)}</div>
      </div>
      {err && <p className="err">{err}</p>}

      <div className="stats">
        <Stat n={money(sum(live.filter((r) => ['received', 'acquitted'].includes(r.status)), 'amount_received'))} l={`Received in ${season}`} />
        <Stat n={money(sum(approved, 'amount_awarded'))} l={`Approved, not yet paid (${approved.length})`} />
        <Stat n={money(sum(waiting, 'amount_requested'))} l={`Applied, waiting to hear (${waiting.length})`} />
        <Stat n={money(sum(sponsors.filter((r) => ['successful', 'received', 'acquitted'].includes(r.status)), 'amount_awarded'))} l={`Sponsorship value (${sponsors.filter((r) => ['successful', 'received', 'acquitted'].includes(r.status)).length} sponsors)`} />
      </div>

      {upcoming.length > 0 && (
        <section className="card">
          <h3>Coming up in the next 60 days</h3>
          <ul className="checks">{upcoming.map((x, i) => <li key={i}><b className={x.d < today ? 'err' : ''}>{fmtDate(x.d)}</b> – {x.what}: {x.r.title}{x.r.funder ? ` (${x.r.funder})` : ''}</li>)}</ul>
        </section>
      )}

      <div className="tabs" style={{ marginTop: 14 }}>
        {[['grants', `Grants (${grants.length})`], ['sponsors', `Sponsorships (${sponsors.length})`], ['other', `Donations & fundraising (${other.length})`], ['ideas', `Funding ideas (${sources.filter((s) => s.active).length})`]].map(([k, l]) => <button key={k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>)}
      </div>

      {view !== 'ideas' ? (
        <>
          {isExec && <button className="btn small" onClick={() => setEdit({ kind: newKind, season, status: newKind === 'grant' ? 'preparing' : 'idea' })}>+ Add {newKind === 'grant' ? 'a grant' : newKind === 'sponsorship' ? 'a sponsor' : 'income'}</button>}
          {list.length === 0 && <p className="muted">Nothing recorded for {season} yet.{view === 'grants' ? ' See Funding ideas for grants worth applying for.' : ''}</p>}
          <div className="cards" style={{ marginTop: 12 }}>
            {list.map((r) => (
              <article key={r.id} className="card">
                <div className="row between"><span className={'pill ' + (TONE[r.status] || '')}>{statusLabel(r)}</span>{isExec && <button className="link" onClick={() => setEdit(r)}>Edit</button>}</div>
                <h3 style={{ marginTop: 6 }}>{r.title}</h3>
                {r.funder && <p className="muted small" style={{ marginTop: -4 }}>{r.funder}</p>}
                <dl className="mini">
                  {r.amount_requested != null && <><dt>{r.kind === 'sponsorship' ? 'Asked for' : 'Requested'}</dt><dd>{money(r.amount_requested)}</dd></>}
                  {r.amount_awarded != null && <><dt>{r.kind === 'sponsorship' ? 'Agreed value' : 'Approved'}</dt><dd>{money(r.amount_awarded)}</dd></>}
                  {r.amount_received != null && <><dt>Received</dt><dd>{money(r.amount_received)}{r.received_on ? ` on ${fmtDate(r.received_on)}` : ''}</dd></>}
                  {r.in_kind && <><dt>In kind</dt><dd>{r.in_kind}</dd></>}
                  {r.applied_on && <><dt>Applied</dt><dd>{fmtDate(r.applied_on)}</dd></>}
                  {r.outcome_due && <><dt>{['idea', 'preparing'].includes(r.status) ? 'Closes' : 'Outcome due'}</dt><dd>{fmtDate(r.outcome_due)}</dd></>}
                  {r.acquittal_due && <><dt>{r.kind === 'sponsorship' ? 'Renewal' : 'Acquittal due'}</dt><dd>{fmtDate(r.acquittal_due)}</dd></>}
                  {r.purpose && <><dt>For</dt><dd>{r.purpose}</dd></>}
                  {r.obligations && <><dt>{r.kind === 'sponsorship' ? 'They get' : 'Conditions'}</dt><dd>{r.obligations}</dd></>}
                  {r.contact && <><dt>Contact</dt><dd>{r.contact}</dd></>}
                </dl>
                {r.notes && <p className="small pre">{r.notes}</p>}
                {r.link && <a className="small" href={r.link} target="_blank" rel="noreferrer">Application / guidelines</a>}
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="muted small">Grants and funding the club could apply for. Dates change every year, so always check the link before applying. {isExec && 'Tap "Start an application" to move one into Grants or Sponsorships.'}</p>
          {isExec && <button className="btn small ghost" onClick={() => setEditSrc({ kind: 'grant', active: true, sort: 200 })}>+ Add a funding idea</button>}
          <div className="cards" style={{ marginTop: 12 }}>
            {sources.filter((s) => s.active || isExec).map((s) => (
              <article key={s.id} className="card" style={s.active ? null : { opacity: 0.6 }}>
                <div className="row between"><span className="pill">{Object.fromEntries(KINDS)[s.kind]}</span>{isExec && <button className="link" onClick={() => setEditSrc(s)}>Edit</button>}</div>
                <h3 style={{ marginTop: 6 }}>{s.name}</h3>
                {s.provider && <p className="muted small" style={{ marginTop: -4 }}>{s.provider}</p>}
                <dl className="mini">
                  {s.typical_amount && <><dt>Amount</dt><dd>{s.typical_amount}</dd></>}
                  {s.timing && <><dt>When</dt><dd>{s.timing}</dd></>}
                  {s.fit && <><dt>Fit for us</dt><dd>{s.fit}</dd></>}
                </dl>
                {s.notes && <p className="small">{s.notes}</p>}
                <div className="row">
                  {s.link && <a className="small" href={s.link} target="_blank" rel="noreferrer">Website</a>}
                  {isExec && <button className="btn small" onClick={() => setEdit({ kind: s.kind === 'sponsorship' ? 'sponsorship' : s.kind, season, status: 'preparing', title: s.name, funder: s.provider, source_id: s.id, link: s.link })}>Start an application</button>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <p className="muted small" style={{ marginTop: 18 }}>A copy of this list will also be kept in a private Google Sheet for the executive (being set up).</p>

      {edit && <FundingForm row={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load() }} />}
      {editSrc && <SourceForm row={editSrc} onClose={() => setEditSrc(null)} onSaved={() => { setEditSrc(null); load() }} />}
    </>
  )
}

function Stat({ n, l }) {
  return <div className="stat"><b>{n || '$0'}</b><span>{l}</span></div>
}

function FundingForm({ row, onClose, onSaved }) {
  const [f, setF] = useState(row)
  const [err, setErr] = useState('')
  const sp = f.kind === 'sponsorship'
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value })
  async function save(e) {
    e.preventDefault()
    const clean = Object.fromEntries(Object.entries(f).filter(([k]) => !['id', 'created_at', 'updated_at', 'created_by'].includes(k)).map(([k, v]) => [k, v === '' ? null : v]))
    const { error } = f.id ? await supabase.from('funding').update(clean).eq('id', f.id) : await supabase.from('funding').insert(clean)
    if (error) setErr(error.message); else onSaved()
  }
  async function remove() {
    if (!confirm('Delete this record? This cannot be undone.')) return
    const { error } = await supabase.from('funding').delete().eq('id', f.id)
    if (error) setErr(error.message); else onSaved()
  }
  return (
    <div className="modal" onClick={onClose}>
      <form className="card" onClick={(e) => e.stopPropagation()} onSubmit={save} style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3>{f.id ? 'Edit' : 'Add'} {sp ? 'sponsor' : f.kind}</h3>
        <div className="grid2 tight">
          <label>Type<select value={f.kind} onChange={set('kind')}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label>Status<select value={f.status} onChange={set('status')}>{(sp ? SPONSOR_STATUS : STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        </div>
        <label>{sp ? 'Sponsor / business' : 'Name of grant or item'}<input value={f.title || ''} onChange={set('title')} required /></label>
        {!sp && <label>Funder<input value={f.funder || ''} onChange={set('funder')} placeholder="e.g. Sport and Recreation Victoria" /></label>}
        <label>{sp ? 'What the money is for (optional)' : 'What it’s for'}<input value={f.purpose || ''} onChange={set('purpose')} placeholder={sp ? 'e.g. new jerseys' : 'e.g. goals and balls for U7s'} /></label>
        <div className="grid2 tight">
          <label>{sp ? 'Asked for ($)' : 'Requested ($)'}<input type="number" step="1" min="0" value={f.amount_requested ?? ''} onChange={set('amount_requested')} /></label>
          <label>{sp ? 'Agreed value ($)' : 'Approved ($)'}<input type="number" step="1" min="0" value={f.amount_awarded ?? ''} onChange={set('amount_awarded')} /></label>
          <label>Received ($)<input type="number" step="1" min="0" value={f.amount_received ?? ''} onChange={set('amount_received')} /></label>
          <label>Received on<input type="date" value={f.received_on || ''} onChange={set('received_on')} /></label>
        </div>
        <label>In-kind support (optional)<input value={f.in_kind || ''} onChange={set('in_kind')} placeholder="e.g. printing, BBQ supplies, prizes" /></label>
        <div className="grid2 tight">
          {!sp && <label>Applied on<input type="date" value={f.applied_on || ''} onChange={set('applied_on')} /></label>}
          <label>{['idea', 'preparing'].includes(f.status) ? 'Closes' : 'Outcome expected'}<input type="date" value={f.outcome_due || ''} onChange={set('outcome_due')} /></label>
          <label>{sp ? 'Renewal date' : 'Acquittal / report due'}<input type="date" value={f.acquittal_due || ''} onChange={set('acquittal_due')} /></label>
        </div>
        <label>{sp ? 'What they get in return' : 'Conditions'}<textarea rows={2} value={f.obligations || ''} onChange={set('obligations')} placeholder={sp ? 'e.g. logo on jersey sleeve, banner at home gala, website' : 'e.g. spend by 30 June, receipts and photos for acquittal'} /></label>
        <label>Contact<input value={f.contact || ''} onChange={set('contact')} placeholder="Name, phone or email" /></label>
        <label>Link<input value={f.link || ''} onChange={set('link')} placeholder="https://" /></label>
        <label>Notes<textarea rows={3} value={f.notes || ''} onChange={set('notes')} /></label>
        <label>Season<input type="number" value={f.season ?? REG_SEASON} onChange={set('season')} /></label>
        {err && <p className="err">{err}</p>}
        <div className="row between">
          <div className="row"><button className="btn">Save</button><button type="button" className="btn ghost" onClick={onClose}>Cancel</button></div>
          {f.id && <button type="button" className="link danger" onClick={remove}>Delete</button>}
        </div>
      </form>
    </div>
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
