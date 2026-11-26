import { useEffect, useState, useCallback, Fragment } from 'react'
import { supabase } from '../supabase'
import { useLive } from './EditTable'

export const GROUPS = ['Uniforms & kit', 'Goals & field', 'Balls & training', 'First aid & safety', 'Trophies & awards', 'Other']
const CONDITIONS = ['New', 'Good', 'Worn', 'Needs replacing']
const COND_PILL = { New: 'good', Good: 'good', Worn: 'wait', 'Needs replacing': 'bad' }
const BLANK = { category: '', group_name: 'Other', brand: '', quantity: '', sizes: '', value: '', total_value: '', year: '', condition: '', location: '', action: '', notes: '' }

export default function Assets() {
  const [items, setItems] = useState([])
  const [group, setGroup] = useState('All')
  const [open, setOpen] = useState(null)      // row showing details
  const [editing, setEditing] = useState(null) // id, or 'new'
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState('')
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
  function copy() {
    const head = ['Group', 'Item', 'How many', 'Sizes / breakdown', 'Condition', 'Kept', 'Brand / supplier', 'Year bought', 'Cost', 'Total paid', 'Needs doing', 'Notes']
    const rows = items.map((a) => [a.group_name, a.category, a.quantity, a.sizes, a.condition, a.location, a.brand, a.year, a.value, a.total_value, a.action, a.notes].map((v) => String(v ?? '').replace(/\t|\n/g, ' ')).join('\t'))
    navigator.clipboard.writeText([head.join('\t'), ...rows].join('\n')).then(() => setCopied('Copied – paste into a spreadsheet.'), () => setCopied('Copy blocked by the browser.'))
  }

  return (
    <section>
      <div className="row between"><h2 style={{ margin: 0 }}>Asset register</h2>
        <span className="row small-gap"><button className="btn small ghost" onClick={copy}>Copy for spreadsheet</button><button className="btn small" onClick={() => { setEditing('new'); setOpen(null) }}>+ Add item</button></span></div>
      <p className="muted small">What the club owns. Click an item for sizes, cost and supplier. {copied && <span className="ok">{copied}</span>}</p>
      <div className="row small-gap asset-summary">
        <span><b>{items.length}</b> items</span><span>·</span><span><b>${Math.round(total).toLocaleString('en-AU')}</b> spent (recorded)</span><span>·</span>
        <button className={'link' + (group === 'Needs attention' ? ' strong' : '')} onClick={() => setGroup(group === 'Needs attention' ? 'All' : 'Needs attention')}><b>{attention.length}</b> need attention</button>
      </div>
      <div className="tabs">{['All', ...GROUPS.filter((g) => items.some((a) => (a.group_name || 'Other') === g))].map((g) => <button key={g} className={group === g ? 'on' : ''} onClick={() => setGroup(g)}>{g}</button>)}</div>
      {err && <p className="err">{err}</p>}
      {editing === 'new' && <AssetEditor a={{ ...BLANK, group_name: GROUPS.includes(group) ? group : 'Other' }} onDone={() => { setEditing(null); load() }} />}
      {groups.map((g) => (
        <div key={g} className="table-wrap asset-table">
          <table>
            <thead><tr><th>{g}</th><th>How many</th><th>Condition</th><th>Kept</th><th>Needs doing</th></tr></thead>
            <tbody>{shown.filter((a) => (a.group_name || 'Other') === g).map((a) => (
              <Fragment key={a.id}>
                <tr className={'clickable' + (open === a.id || editing === a.id ? ' opened' : '')} onClick={() => { setOpen(open === a.id ? null : a.id); setEditing(null) }}>
                  <td><b>{a.category}</b> <span className="muted small">{open === a.id ? '▴' : '▾'}</span></td>
                  <td className="nowrap">{a.quantity || <span className="muted">—</span>}</td>
                  <td>{a.condition ? <span className={'pill ' + (COND_PILL[a.condition] || '')}>{a.condition}</span> : <span className="muted">—</span>}</td>
                  <td className="small">{a.location || <span className="muted">—</span>}</td>
                  <td className="small">{a.action ? <span className="warn-text">{a.action}</span> : <span className="muted">—</span>}</td>
                </tr>
                {(open === a.id || editing === a.id) && <tr className="editrow"><td colSpan={5}>
                  {editing === a.id ? <AssetEditor a={a} onDone={() => { setEditing(null); load() }} /> : (
                    <div className="asset-detail">
                      <dl className="mini">
                        {a.sizes && <><dt>Sizes</dt><dd>{a.sizes}</dd></>}
                        {(a.brand || a.year) && <><dt>Bought</dt><dd>{[a.brand, a.year].filter(Boolean).join(', ')}</dd></>}
                        {(a.value || a.total_value) && <><dt>Cost</dt><dd>{a.value || ''}{a.total_value ? `${a.value ? ' · ' : ''}total $${Number(a.total_value).toLocaleString("en-AU", { minimumFractionDigits: Number(a.total_value) % 1 ? 2 : 0, maximumFractionDigits: 2 })}` : ''}</dd></>}
                        {a.notes && <><dt>Notes</dt><dd>{a.notes}</dd></>}
                      </dl>
                      <button className="btn small" onClick={(e) => { e.stopPropagation(); setEditing(a.id) }}>Edit</button>
                    </div>
                  )}
                </td></tr>}
              </Fragment>
            ))}</tbody>
          </table>
        </div>
      ))}
      {shown.length === 0 && <p className="muted">Nothing here.</p>}
    </section>
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
