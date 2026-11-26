import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { useLive } from './EditTable'

export const GROUPS = ['Uniforms & kit', 'Goals & field', 'Balls & training', 'First aid & safety', 'Trophies & awards', 'Other']
const CONDITIONS = ['New', 'Good', 'Worn', 'Needs replacing']
const COND_PILL = { New: 'good', Good: 'good', Worn: 'wait', 'Needs replacing': 'bad' }
const BLANK = { category: '', group_name: 'Other', brand: '', quantity: '', sizes: '', value: '', total_value: '', year: '', condition: '', location: '', action: '', notes: '' }
const money = (n) => '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default function Assets() {
  const [items, setItems] = useState([])
  const [group, setGroup] = useState('All')
  const [editing, setEditing] = useState(null) // id, or 'new'
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('assets').select('*').order('sort').order('category')
    if (error) setErr(error.message); else setItems(data || [])
  }, [])
  useEffect(() => { load() }, [load])
  useLive(['assets'], load)

  const total = items.reduce((t, a) => t + (Number(a.total_value) || 0), 0)
  const attention = items.filter((a) => a.action || a.condition === 'Needs replacing' || a.condition === 'Worn')
  const shown = group === 'All' ? items : group === 'Needs attention' ? attention : items.filter((a) => (a.group_name || 'Other') === group)
  const groups = GROUPS.filter((g) => shown.some((a) => (a.group_name || 'Other') === g))

  return (
    <section>
      <div className="row between"><h2 style={{ margin: 0 }}>Asset register</h2><button className="btn small" onClick={() => setEditing('new')}>+ Add item</button></div>
      <p className="muted small">Club equipment: what we have, what it cost, its condition and where it's kept. Jerseys by number are on the Uniforms tab.</p>
      <div className="money-strip">
        <div><span>Items</span><b>{items.length}</b></div>
        <div><span>Spent (recorded)</span><b>{money(total)}</b></div>
        <button className={'strip-btn' + (group === 'Needs attention' ? ' on' : '')} onClick={() => setGroup(group === 'Needs attention' ? 'All' : 'Needs attention')}><span>Needs attention</span><b>{attention.length}</b></button>
      </div>
      <div className="tabs">{['All', ...GROUPS.filter((g) => items.some((a) => (a.group_name || 'Other') === g))].map((g) => <button key={g} className={group === g ? 'on' : ''} onClick={() => setGroup(g)}>{g}</button>)}</div>
      {err && <p className="err">{err}</p>}
      {editing === 'new' && <AssetEditor a={{ ...BLANK, group_name: GROUPS.includes(group) ? group : 'Other' }} onDone={() => { setEditing(null); load() }} />}
      {groups.map((g) => (
        <div key={g} className="asset-group">
          {group === 'All' || group === 'Needs attention' ? <h3>{g}</h3> : null}
          <div className="asset-list">
            {shown.filter((a) => (a.group_name || 'Other') === g).map((a) => editing === a.id
              ? <AssetEditor key={a.id} a={a} onDone={() => { setEditing(null); load() }} />
              : <AssetCard key={a.id} a={a} onEdit={() => setEditing(a.id)} />)}
          </div>
        </div>
      ))}
      {shown.length === 0 && <p className="muted">Nothing here.</p>}
    </section>
  )
}

function AssetCard({ a, onEdit }) {
  return (
    <div className="item asset">
      <div className="item-top">
        <div className="asset-main">
          <b>{a.category}</b>
          <span className="small muted">{[a.brand, a.year && `bought ${a.year}`].filter(Boolean).join(' · ')}</span>
        </div>
        <div className="asset-side">
          {a.quantity && <span className="qty">{a.quantity}</span>}
          {a.condition && <span className={'pill ' + (COND_PILL[a.condition] || '')}>{a.condition}</span>}
        </div>
      </div>
      {a.sizes && <p className="small asset-sizes">{a.sizes}</p>}
      <dl className="mini">
        {a.value && <><dt>Cost</dt><dd>{a.value}{a.total_value ? <span className="muted"> · total {money(a.total_value)}</span> : null}</dd></>}
        {!a.value && a.total_value ? <><dt>Cost</dt><dd>{money(a.total_value)}</dd></> : null}
        <dt>Kept</dt><dd>{a.location || <span className="muted">not recorded</span>}</dd>
        {a.notes && <><dt>Notes</dt><dd>{a.notes}</dd></>}
      </dl>
      {a.action && <p className="small asset-action">⚠ {a.action}</p>}
      <button className="link small" onClick={onEdit}>Edit</button>
    </div>
  )
}

function AssetEditor({ a, onDone }) {
  const [f, setF] = useState({ ...BLANK, ...Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v ?? ''])) })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function save(e) {
    e.preventDefault()
    if (!f.category.trim()) return setErr('Give the item a name.')
    const row = Object.fromEntries(Object.keys(BLANK).map((k) => [k, f[k] === '' ? null : f[k]]))
    row.total_value = f.total_value === '' ? null : Number(String(f.total_value).replace(/[$,\s]/g, '')) || null
    const { error } = a.id ? await supabase.from('assets').update(row).eq('id', a.id) : await supabase.from('assets').insert({ ...row, sort: 999 })
    if (error) return setErr(error.message)
    onDone()
  }
  async function remove() {
    if (!window.confirm(`Delete "${a.category}" from the asset register? This can't be undone.`)) return
    const { error } = await supabase.from('assets').delete().eq('id', a.id)
    if (error) return setErr(error.message)
    onDone()
  }
  return (
    <form className="item editing asset-edit" onSubmit={save}>
      <div className="ae-grid">
        <label className="wide">Item<input value={f.category} onChange={set('category')} placeholder="e.g. Size 3 balls" autoFocus /></label>
        <label>Group<select value={f.group_name || 'Other'} onChange={set('group_name')}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>How many<input value={f.quantity} onChange={set('quantity')} placeholder="e.g. 20, or 3 sets" /></label>
        <label>Condition<select value={f.condition} onChange={set('condition')}><option value="">—</option>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Brand / supplier<input value={f.brand} onChange={set('brand')} /></label>
        <label>Year bought<input value={f.year} onChange={set('year')} placeholder="2026" /></label>
        <label>Kept where<input value={f.location} onChange={set('location')} placeholder="Container – Les Peart" /></label>
        <label className="wide">Sizes / breakdown<input value={f.sizes} onChange={set('sizes')} placeholder="e.g. Size 3 ×20, size 4 ×10" /></label>
        <label className="half">Cost details<input value={f.value} onChange={set('value')} placeholder="e.g. $12 each" /></label>
        <label>Total paid ($)<input value={f.total_value} onChange={set('total_value')} inputMode="decimal" placeholder="240" /></label>
        <label className="wide">Needs doing (optional)<input value={f.action} onChange={set('action')} placeholder="e.g. Reorder before Come n Try" /></label>
        <label className="wide">Notes<input value={f.notes} onChange={set('notes')} /></label>
      </div>
      {err && <p className="err small">{err}</p>}
      <div className="row"><button className="btn small">Save</button><button type="button" className="btn small ghost" onClick={onDone}>Cancel</button>{a.id && <button type="button" className="link danger small" onClick={remove} style={{ marginLeft: 'auto' }}>Delete item</button>}</div>
    </form>
  )
}
