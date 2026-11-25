import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'

// Generic editable table for committee data.
// cols: [{ key, label, type: 'text'|'date'|'bool'|'select'|'textarea'|'number', options: [[value,label]], width }]
export default function EditTable({ table, cols, order = [], filter, defaults = {}, select = '*', search = [], rowActions }) {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState({})

  const load = useCallback(async () => {
    let query = supabase.from(table).select(select)
    if (filter) query = filter(query)
    for (const [k, asc] of order) query = query.order(k, { ascending: asc !== false })
    const { data, error } = await query
    if (error) setErr(error.message); else setRows(data || [])
  }, [table, select, filter, order])
  useEffect(() => { load() }, [load])

  async function update(id, key, value) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
    setSaving((s) => ({ ...s, [id]: true }))
    const { error } = await supabase.from(table).update({ [key]: value === '' ? null : value }).eq('id', id)
    setSaving((s) => ({ ...s, [id]: false }))
    if (error) { setErr(error.message); load() }
  }
  async function add() {
    const { error } = await supabase.from(table).insert(defaults)
    if (error) setErr(error.message); else load()
  }
  async function remove(id) {
    if (!confirm('Delete this row? This cannot be undone.')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) setErr(error.message); else load()
  }

  const shown = q ? rows.filter((r) => search.some((k) => String(r[k] || '').toLowerCase().includes(q.toLowerCase()))) : rows
  return (
    <div>
      <div className="row between">
        {search.length > 0 ? <input className="search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /> : <span />}
        <span className="muted small">{shown.length} rows</span>
        <button className="btn small" onClick={add}>+ Add row</button>
      </div>
      {err && <p className="err">{err} <button className="link" onClick={() => setErr('')}>dismiss</button></p>}
      <div className="table-wrap"><table className="edit">
        <thead><tr>{cols.map((c) => <th key={c.key} style={{ minWidth: c.width }}>{c.label}</th>)}<th /></tr></thead>
        <tbody>{shown.map((r) => (
          <tr key={r.id} className={saving[r.id] ? 'saving' : ''}>
            {cols.map((c) => <td key={c.key}><Cell c={c} v={r[c.key]} onChange={(v) => update(r.id, c.key, v)} /></td>)}
            <td className="nowrap">{rowActions && rowActions(r, load)}<button className="link danger" title="Delete" onClick={() => remove(r.id)}>✕</button></td>
          </tr>))}</tbody>
      </table></div>
    </div>
  )
}

function Cell({ c, v, onChange }) {
  const [local, setLocal] = useState(v ?? '')
  useEffect(() => setLocal(v ?? ''), [v])
  const commit = () => { if ((local ?? '') !== (v ?? '')) onChange(c.type === 'number' && local !== '' ? Number(local) : local) }
  if (c.readOnly) return <span>{c.render ? c.render(v) : v}</span>
  if (c.type === 'bool') return <input type="checkbox" checked={!!v} onChange={(e) => onChange(e.target.checked)} />
  if (c.type === 'select') return <select value={v ?? ''} onChange={(e) => onChange(e.target.value)}><option value="">—</option>{c.options.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}</select>
  if (c.type === 'textarea') return <textarea rows={2} value={local} onChange={(e) => setLocal(e.target.value)} onBlur={commit} />
  return <input type={c.type === 'date' ? 'date' : c.type === 'number' ? 'number' : 'text'} value={local} onChange={(e) => setLocal(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} />
}
