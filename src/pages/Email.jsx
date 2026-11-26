// Committee → Send email. Exec-only. Sends from noreply@mountbeautyfc.org.au (each person gets their own copy).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, REG_SEASON, fmtDate } from '../supabase'
import { useAuth } from '../auth'

const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export default function Email() {
  const { isExec } = useAuth()
  const [d, setD] = useState(null)
  const [to, setTo] = useState(new Map()) // email -> { email, name, from }
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState('club')
  const [q, setQ] = useState('')
  const [extra, setExtra] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const [log, setLog] = useState([])

  const load = useCallback(async () => {
    const [p, v, pl, g, t, c] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, is_executive'),
      supabase.from('volunteer_roles').select('profile_id, kind, team_id').eq('status', 'approved'),
      supabase.from('players').select('id, team_id').eq('season', REG_SEASON).neq('status', 'withdrawn'),
      supabase.from('player_guardians').select('player_id, profile_id'),
      supabase.from('teams').select('id, name, sort_order').eq('season', REG_SEASON).order('sort_order'),
      supabase.from('contacts').select('id, topic, name, organisation, email').order('sort'),
    ])
    setD({ profiles: p.data || [], vols: v.data || [], players: pl.data || [], guardians: g.data || [], teams: t.data || [], contacts: c.data || [] })
    const { data: l } = await supabase.from('email_log').select('id, sent_at, sent_by_name, subject, audience, sent_count, failed').order('sent_at', { ascending: false }).limit(20)
    setLog(l || [])
  }, [])
  useEffect(() => { if (isExec) load() }, [isExec, load])

  const people = useMemo(() => {
    if (!d) return null
    const byId = Object.fromEntries(d.profiles.filter((x) => x.email).map((x) => [x.id, { email: x.email, name: x.full_name || '' }]))
    const pick = (ids) => [...new Set(ids)].map((id) => byId[id]).filter(Boolean)
    const kind = (k) => pick(d.vols.filter((x) => x.kind === k).map((x) => x.profile_id))
    const parentsOf = (players) => pick(d.guardians.filter((g) => players.some((p) => p.id === g.player_id)).map((g) => g.profile_id))
    return {
      groups: [
        ['Executive', pick(d.profiles.filter((x) => x.is_executive).map((x) => x.id))],
        ['Committee', kind('committee')],
        ['Coaches', kind('coach')],
        ['Volunteers', kind('volunteer')],
        [`All ${REG_SEASON} parents`, parentsOf(d.players)],
        ['Everyone with an account', Object.values(byId)],
      ],
      teams: d.teams.map((t) => [`${t.name} parents`, parentsOf(d.players.filter((p) => p.team_id === t.id)), [t.name + ' coaches', pick(d.vols.filter((x) => x.kind === 'coach' && x.team_id === t.id).map((x) => x.profile_id))]]),
      contacts: d.contacts.filter((c) => c.email && isEmail(c.email.trim())).map((c) => ({ email: c.email.trim(), name: c.name || c.organisation || '', label: [c.name, c.organisation].filter(Boolean).join(' – '), topic: c.topic })),
      all: Object.values(byId),
    }
  }, [d])

  const add = (list, from) => setTo((m) => { const n = new Map(m); for (const r of list) if (!n.has(r.email.toLowerCase())) n.set(r.email.toLowerCase(), { ...r, from }); return n })
  const removeFrom = (list) => setTo((m) => { const n = new Map(m); for (const r of list) n.delete(r.email.toLowerCase()); return n })
  const allIn = (list) => list.length > 0 && list.every((r) => to.has(r.email.toLowerCase()))
  const toggle = (list, from) => (allIn(list) ? removeFrom(list) : add(list, from))

  function addTyped(e) {
    e.preventDefault()
    const found = extra.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean)
    const bad = found.filter((x) => !isEmail(x))
    add(found.filter(isEmail).map((email) => ({ email, name: '' })), 'Typed')
    setExtra(bad.join(' '))
    if (bad.length) setMsg({ ok: false, text: `Not added – doesn't look like an email: ${bad.join(', ')}` })
  }

  async function send() {
    setMsg(null)
    const list = [...to.values()]
    if (!window.confirm(`Send "${subject}" to ${list.length} ${list.length === 1 ? 'person' : 'people'}? Each gets their own copy.`)) return
    setBusy(true)
    const audience = [...new Set(list.map((r) => r.from))].join(', ')
    const { data, error } = await supabase.functions.invoke('send-email', { body: { subject, body, recipients: list.map(({ email, name }) => ({ email, name })), reply_to: replyTo, audience } })
    let err = data?.error
    if (error && !err) { try { err = (await error.context.json()).error } catch { err = error.message } }
    setBusy(false)
    if (err) return setMsg({ ok: false, text: err })
    setMsg({ ok: true, text: `Sent to ${data.sent} ${data.sent === 1 ? 'person' : 'people'}.${data.failed?.length ? ` Not sent: ${data.failed.join(', ')}` : ''}` })
    setTo(new Map()); setSubject(''); setBody(''); setPreview(false); load()
  }

  if (!isExec) return <p className="muted">Sending club emails is for the executive committee.</p>
  if (!people) return <p className="muted">Loading…</p>
  const matches = q.trim().length < 2 ? [] : [...people.all, ...people.contacts].filter((r) => `${r.name} ${r.email} ${r.label || ''}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
  const list = [...to.values()]
  const first = list[0]?.name?.split(' ')[0] || 'there'

  return (
    <div className="mail">
      <div className="mail-head">
        <h2>Send an email</h2>
        <p className="muted">Sent from <b>noreply@mountbeautyfc.org.au</b>. Everyone gets their own copy, so no one sees anyone else's address. Replies go to the club Gmail unless you choose your own.</p>
      </div>

      <div className="mail-grid">
        <section className="card mail-pick">
          <h3>Who to send to</h3>
          <p className="small muted">Tap a group to add or remove everyone in it.</p>
          <div className="chips">
            {people.groups.map(([label, l]) => <button key={label} className={'chip' + (allIn(l) ? ' on' : '')} disabled={!l.length} onClick={() => toggle(l, label)}>{label}<span>{l.length}</span></button>)}
          </div>
          {people.teams.length > 0 && <>
            <h4>By team</h4>
            <div className="chips">
              {people.teams.map(([label, l, [cl, c]]) => <span key={label} className="chip-pair">
                <button className={'chip' + (allIn(l) ? ' on' : '')} disabled={!l.length} onClick={() => toggle(l, label)}>{label}<span>{l.length}</span></button>
                <button className={'chip' + (allIn(c) ? ' on' : '')} disabled={!c.length} onClick={() => toggle(c, cl)}>coaches<span>{c.length}</span></button>
              </span>)}
            </div>
          </>}
          <h4>Key contacts</h4>
          {people.contacts.length === 0 ? <p className="small muted">No key contacts with an email yet – add them under Contacts & handover.</p> : (
            <ul className="plain contact-pick">
              {people.contacts.map((c) => <li key={c.email}><label className="check"><input type="checkbox" checked={to.has(c.email.toLowerCase())} onChange={(e) => (e.target.checked ? add([c], 'Key contacts') : removeFrom([c]))} /> <span><b>{c.topic || c.label}</b>{c.label && c.topic ? <span className="muted small"> · {c.label}</span> : null}<br /><span className="small muted">{c.email}</span></span></label></li>)}
            </ul>
          )}
          <h4>Anyone else</h4>
          <input placeholder="Search people by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          {matches.length > 0 && <ul className="plain picks">{matches.map((r) => <li key={r.email}><span>{r.name || r.label || r.email}<br /><span className="small muted">{r.email}</span></span>{to.has(r.email.toLowerCase()) ? <span className="small muted">Added</span> : <button className="btn small" onClick={() => add([r], 'Chosen')}>Add</button>}</li>)}</ul>}
          <form onSubmit={addTyped} className="row add-typed"><input placeholder="Or type email addresses" value={extra} onChange={(e) => setExtra(e.target.value)} /><button className="btn small ghost">Add</button></form>
        </section>

        <section className="card form mail-compose">
          <div className="row between"><h3>To: {list.length} {list.length === 1 ? 'person' : 'people'}</h3>{list.length > 0 && <button className="link small" onClick={() => setTo(new Map())}>Clear all</button>}</div>
          {list.length > 0 && <div className="to-list">{list.slice(0, 60).map((r) => <span key={r.email} className="to-chip" title={r.email}>{r.name || r.email}<button aria-label={`Remove ${r.email}`} onClick={() => removeFrom([r])}>×</button></span>)}{list.length > 60 && <span className="small muted">+ {list.length - 60} more</span>}</div>}
          <label>Subject<input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="e.g. 2027 registrations are open" /></label>
          <label>Message<textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} placeholder={'Hi {first_name},\n\n…'} /></label>
          <p className="small muted">Type <code>{'{first_name}'}</code> to greet each person by name. Leave a blank line between paragraphs. Web links become clickable.</p>
          <label>Replies go to<select value={replyTo} onChange={(e) => setReplyTo(e.target.value)}><option value="club">Club Gmail (mtbeautysoccerclub@gmail.com)</option><option value="me">My own email</option></select></label>
          {preview && body && (
            <div className="mail-preview">
              <p className="small muted">Preview for {list[0]?.name || 'the first person'}:</p>
              <b>{subject}</b>
              {body.replace(/\{first_name\}/g, first).split(/\n{2,}/).map((p, i) => <p key={i} style={{ whiteSpace: 'pre-line' }}>{p}</p>)}
              <p className="small muted">Mount Beauty Football Club · mountbeautyfc.org.au</p>
            </div>
          )}
          {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
          <div className="row">
            <button className="btn" disabled={busy || !list.length || !subject.trim() || !body.trim()} onClick={send}>{busy ? 'Sending…' : `Send to ${list.length || ''} ${list.length === 1 ? 'person' : 'people'}`}</button>
            <button className="btn ghost" disabled={!body.trim()} onClick={() => setPreview(!preview)}>{preview ? 'Hide preview' : 'Preview'}</button>
          </div>
        </section>
      </div>

      <section className="mail-log">
        <h3>Sent emails</h3>
        {log.length === 0 ? <p className="muted small">Nothing sent yet.</p> : (
          <div className="table-wrap"><table><thead><tr><th>Sent</th><th>Subject</th><th>To</th><th>By</th></tr></thead><tbody>
            {log.map((l) => <tr key={l.id}><td className="nowrap">{fmtDate(l.sent_at.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' })}</td><td>{l.subject}</td><td>{l.sent_count} {l.audience ? <span className="small muted">({l.audience})</span> : null}{l.failed?.length ? <span className="pill bad">{l.failed.length} failed</span> : null}</td><td>{l.sent_by_name}</td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </div>
  )
}
