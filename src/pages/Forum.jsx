// Club forum: channels → threads → replies. Channel visibility is enforced by the database
// (who can see/post is the same rule everywhere); this page just reflects it.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase, REG_SEASON } from '../supabase'
import { useAuth } from '../auth'
import { useLive } from './EditTable'

export const CHANNELS = {
  public: { name: 'Club news', icon: '📣', blurb: 'Announcements from the President and Secretary. Everyone can read.' },
  members: { name: 'General', icon: '💬', blurb: 'Questions and chat for all club families.' },
  team: { name: 'Team', icon: '⚽', blurb: 'Just this team\'s families and coaches.' },
  coaches: { name: 'Coaches', icon: '📋', blurb: 'Coaches and the committee.' },
  volunteers: { name: 'Volunteers', icon: '🙌', blurb: 'Gala-day helpers, volunteers, coaches and the committee.' },
  committee: { name: 'Committee', icon: '🏛️', blurb: 'Committee members only.' },
}
const REACTS = ['👍', '✅', '❤️', '😂']
export const ago = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}
const initials = (n) => (n || '?').split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase()
const hue = (n) => [...(n || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
export const Avatar = ({ name, size = 36 }) => <span className="av" style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue(name)} 32% 88%)`, color: `hsl(${hue(name)} 40% 26%)` }} aria-hidden>{initials(name)}</span>
const chanKey = (p) => (p.audience === 'team' ? `team:${p.team_id}` : p.audience)

// Which channels this person can see and post in.
function useChannels() {
  const { user, isStaff, isCoach, coachTeams } = useAuth()
  const [state, setState] = useState(null)
  useEffect(() => {
    if (!user) return
    (async () => {
      const [{ data: mod }, { data: kids }, { data: vols }, { data: teams }] = await Promise.all([
        supabase.rpc('is_moderator'),
        supabase.from('player_guardians').select('players(team_id, season, status)').eq('profile_id', user.id),
        supabase.from('volunteer_roles').select('kind').eq('profile_id', user.id).eq('status', 'approved'),
        supabase.from('teams').select('id, name, sort_order').eq('season', REG_SEASON).order('sort_order'),
      ])
      const myTeams = new Set([...(kids || []).map((k) => k.players?.team_id).filter(Boolean), ...(coachTeams || []).map((t) => t.id || t)])
      const teamList = (teams || []).filter((t) => isStaff || myTeams.has(t.id))
      const list = [
        { key: 'public', audience: 'public', canPost: !!mod },
        { key: 'members', audience: 'members', canPost: true },
        ...teamList.map((t) => ({ key: `team:${t.id}`, audience: 'team', team_id: t.id, name: t.name, canPost: true })),
        ...(isCoach || isStaff ? [{ key: 'coaches', audience: 'coaches', canPost: true }] : []),
        ...(isCoach || isStaff || (vols || []).length ? [{ key: 'volunteers', audience: 'volunteers', canPost: true }] : []),
        ...(isStaff ? [{ key: 'committee', audience: 'committee', canPost: true }] : []),
      ].map((c) => ({ ...c, name: c.name || CHANNELS[c.audience].name, icon: CHANNELS[c.audience].icon, blurb: CHANNELS[c.audience].blurb }))
      setState({ list, mod: !!mod })
    })()
  }, [user, isStaff, isCoach, coachTeams])
  return state
}

function useReads(userId) {
  const [reads, setReads] = useState(null)
  const [since, setSince] = useState(null)
  const load = useCallback(async () => {
    const { data } = await supabase.from('thread_reads').select('post_id, read_at')
    setReads(Object.fromEntries((data || []).map((r) => [r.post_id, r.read_at])))
    const { data: p } = await supabase.from('profiles').select('created_at').eq('id', userId).maybeSingle()
    const base = new Date(Date.now() - 30 * 86400000).toISOString()
    setSince(p?.created_at && p.created_at > base ? p.created_at : base)
  }, [userId])
  useEffect(() => { if (userId) load() }, [userId, load])
  const isUnread = (t) => reads && t.author_id !== userId && t.last_activity_at > (reads[t.id] || since)
  return { isUnread, reload: load }
}

export default function Forum() {
  const { id } = useParams()
  return id ? <Thread id={id} /> : <ForumHome />
}

function ForumHome() {
  const { user } = useAuth()
  const ch = useChannels()
  const nav = useNavigate()
  const [threads, setThreads] = useState(null)
  const [sel, setSel] = useState('all')
  const [q, setQ] = useState('')
  const [writing, setWriting] = useState(false)
  const [prefs, setPrefs] = useState(false)
  const { isUnread, reload: reloadReads } = useReads(user?.id)
  const load = useCallback(async () => {
    const { data } = await supabase.from('posts').select('id, title, body, audience, team_id, author_id, author_name, pinned, locked, created_at, last_activity_at, reply_count').order('pinned', { ascending: false }).order('last_activity_at', { ascending: false }).limit(300)
    setThreads(data || [])
  }, [])
  useEffect(() => { load() }, [load])
  useLive(['posts'], load)
  if (!ch || !threads) return <div className="wrap"><p className="muted">Loading the forum…</p></div>
  const channel = ch.list.find((c) => c.key === sel)
  const visible = threads.filter((t) => ch.list.some((c) => c.key === chanKey(t)))
  const shown = visible.filter((t) => (sel === 'all' || chanKey(t) === sel) && (!q.trim() || `${t.title} ${t.body} ${t.author_name}`.toLowerCase().includes(q.trim().toLowerCase())))
  const unreadIn = (key) => visible.filter((t) => (key === 'all' || chanKey(t) === key) && isUnread(t)).length
  const nameOf = (t) => ch.list.find((c) => c.key === chanKey(t))
  async function markAllRead() {
    const rows = visible.filter(isUnread).map((t) => ({ post_id: t.id, read_at: new Date().toISOString() }))
    if (rows.length) await supabase.from('thread_reads').upsert(rows)
    reloadReads()
  }
  return (
    <div className="wrap wide forum">
      <header className="forum-head">
        <div><h1>Club forum</h1><p className="muted">Ask questions, share news and organise your team. Only people in a channel can see it.</p></div>
        <button className="btn big" onClick={() => setWriting(true)}>+ Start a thread</button>
      </header>
      <div className="forum-grid">
        <aside className="channels" aria-label="Channels">
          <button className={'chan' + (sel === 'all' ? ' on' : '')} onClick={() => setSel('all')}><span className="ci">🗂️</span><span className="cn">All discussions</span>{unreadIn('all') > 0 && <span className="cu">{unreadIn('all')}</span>}</button>
          {ch.list.map((c) => <button key={c.key} className={'chan' + (sel === c.key ? ' on' : '')} onClick={() => setSel(c.key)}><span className="ci">{c.icon}</span><span className="cn">{c.name}</span>{unreadIn(c.key) > 0 && <span className="cu">{unreadIn(c.key)}</span>}</button>)}
          <div className="chan-foot">
            <button className="link small" onClick={() => setPrefs(true)}>✉️ Email settings</button>
            {unreadIn('all') > 0 && <button className="link small" onClick={markAllRead}>Mark all as read</button>}
          </div>
        </aside>
        <section className="threads">
          <div className="threads-head">
            <div>
              <h2>{channel ? <>{channel.icon} {channel.name}</> : 'All discussions'}</h2>
              <p className="muted small">{channel ? channel.blurb : 'Everything you can see, newest activity first.'}</p>
            </div>
            <input className="search" placeholder="Search threads" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search threads" />
          </div>
          {shown.length === 0 ? (
            <div className="empty-forum"><p><b>No threads here yet.</b></p><p className="muted">Start the conversation – ask a question or share something with {channel ? channel.name : 'the club'}.</p><button className="btn" onClick={() => setWriting(true)}>Start a thread</button></div>
          ) : (
            <ul className="thread-list">
              {shown.map((t) => { const c = nameOf(t); const un = isUnread(t); return (
                <li key={t.id}>
                  <Link to={`/board/${t.id}`} className={'thread-row' + (un ? ' unread' : '')}>
                    <Avatar name={t.author_name} />
                    <span className="tr-main">
                      <span className="tr-title">{t.pinned && <span className="pin" title="Pinned">📌</span>}{t.locked && <span title="Locked">🔒</span>}{t.title}{un && <span className="new-dot">New</span>}</span>
                      <span className="tr-meta">{t.author_name} · {sel === 'all' && c ? <span className="tr-chan">{c.icon} {c.name}</span> : null}{sel === 'all' && c ? ' · ' : ''}{ago(t.created_at)}</span>
                      <span className="tr-excerpt">{t.body.slice(0, 140)}{t.body.length > 140 ? '…' : ''}</span>
                    </span>
                    <span className="tr-stats"><b>{t.reply_count}</b><span>{t.reply_count === 1 ? 'reply' : 'replies'}</span><em>{ago(t.last_activity_at)}</em></span>
                  </Link>
                </li>) })}
            </ul>
          )}
        </section>
      </div>
      {writing && <NewThread channels={ch.list.filter((c) => c.canPost)} mod={ch.mod} start={sel !== 'all' && ch.list.find((c) => c.key === sel)?.canPost ? sel : 'members'} onClose={() => setWriting(false)} onDone={(id) => { setWriting(false); nav(`/board/${id}`) }} />}
      {prefs && <EmailPrefs channels={ch.list} onClose={() => setPrefs(false)} />}
    </div>
  )
}

function NewThread({ channels, mod, start, onClose, onDone }) {
  const [f, setF] = useState({ chan: start, title: '', body: '', everyone: false })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const c = channels.find((x) => x.key === f.chan) || channels[0]
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr(null)
    const { data, error } = await supabase.from('posts').insert({ audience: c.audience, team_id: c.team_id || null, title: f.title.trim(), body: f.body.trim() }).select('id').single()
    if (error) { setBusy(false); return setErr(/row-level/.test(error.message) ? "You can't post in that channel." : error.message) }
    const newId = Array.isArray(data) ? data[0]?.id : data?.id
    await supabase.from('thread_reads').upsert({ post_id: newId, read_at: new Date().toISOString() })
    supabase.functions.invoke('forum-notify', { body: { post_id: newId, everyone: mod && f.everyone } })
    onDone(newId)
  }
  return (
    <div className="modal" onClick={onClose}>
      <form className="card form new-thread" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="row between"><h3>Start a thread</h3><button type="button" className="link" onClick={onClose} aria-label="Close">✕</button></div>
        <label>Channel<select value={c.key} onChange={(e) => setF({ ...f, chan: e.target.value })}>{channels.map((x) => <option key={x.key} value={x.key}>{x.icon} {x.name}</option>)}</select></label>
        <p className="small muted chan-note">{c.blurb}</p>
        <label>Title<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required maxLength={140} placeholder="e.g. Carpool to Bright on Sunday?" autoFocus /></label>
        <label>Message<textarea rows={7} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} required /></label>
        {mod && <label className="check"><input type="checkbox" checked={f.everyone} onChange={(e) => setF({ ...f, everyone: e.target.checked })} /> Also email everyone who can see this channel <span className="muted small">(moderators only – use for important news)</span></label>}
        {err && <p className="err small">{err}</p>}
        <div className="row"><button className="btn" disabled={busy}>{busy ? 'Posting…' : 'Post thread'}</button><button type="button" className="btn ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </div>
  )
}

function EmailPrefs({ channels, onClose }) {
  const [p, setP] = useState(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => { supabase.from('forum_prefs').select('*').maybeSingle().then(({ data }) => setP(data || { reply_emails: true, channels: [] })) }, [])
  async function save(next) {
    setP(next); setSaved(false)
    const { error } = await supabase.from('forum_prefs').upsert({ reply_emails: next.reply_emails, channels: next.channels, updated_at: new Date().toISOString() })
    if (!error) setSaved(true)
  }
  if (!p) return null
  return (
    <div className="modal" onClick={onClose}>
      <div className="card form prefs" onClick={(e) => e.stopPropagation()}>
        <div className="row between"><h3>Email settings</h3><button className="link" onClick={onClose} aria-label="Close">✕</button></div>
        <label className="check"><input type="checkbox" checked={p.reply_emails} onChange={(e) => save({ ...p, reply_emails: e.target.checked })} /> Email me when someone replies to a thread I started or replied to</label>
        <p className="small"><b>Email me every new thread in:</b></p>
        {channels.map((c) => <label key={c.key} className="check"><input type="checkbox" checked={p.channels.includes(c.key)} onChange={(e) => save({ ...p, channels: e.target.checked ? [...p.channels, c.key] : p.channels.filter((x) => x !== c.key) })} /> {c.icon} {c.name}</label>)}
        <p className="small muted">{saved ? '✓ Saved' : 'Changes save straight away.'} Important club news may still be emailed to everyone.</p>
        <button className="btn ghost small" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}

function Thread({ id }) {
  const { user } = useAuth()
  const ch = useChannels()
  const nav = useNavigate()
  const [t, setT] = useState(undefined)
  const [replies, setReplies] = useState([])
  const [reacts, setReacts] = useState([])
  const [replyTo, setReplyTo] = useState(null) // reply id being answered inline
  const [editing, setEditing] = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [sort, setSort] = useState('old')
  const [flash, setFlash] = useState(null)
  const [err, setErr] = useState(null)
  const load = useCallback(async () => {
    const { data } = await supabase.from('posts').select('*, teams(name)').eq('id', id).maybeSingle()
    setT(data)
    if (!data) return
    const [{ data: r }, { data: x }] = await Promise.all([
      supabase.from('replies').select('*').eq('post_id', id).order('created_at'),
      supabase.from('forum_reactions').select('id, reply_id, profile_id, emoji').eq('post_id', id),
    ])
    setReplies(r || []); setReacts(x || [])
    supabase.from('thread_reads').upsert({ post_id: id, read_at: new Date().toISOString() }).then(() => window.dispatchEvent(new Event('forum-read')))
  }, [id])
  useEffect(() => { load() }, [load])
  useLive(['posts', 'replies', 'forum_reactions'], load)
  const byId = useMemo(() => Object.fromEntries(replies.map((r) => [r.id, r])), [replies])
  const kids = useMemo(() => {
    const m = {}
    for (const r of replies) { const p = r.parent_id && byId[r.parent_id] ? r.parent_id : 'root'; (m[p] = m[p] || []).push(r) }
    if (sort === 'new' && m.root) m.root = [...m.root].reverse()
    return m
  }, [replies, byId, sort])
  const count = (rid) => (kids[rid] || []).reduce((n, c) => n + 1 + count(c.id), 0)
  if (t === undefined || !ch) return <div className="wrap"><p className="muted">Loading…</p></div>
  if (!t) return <div className="wrap"><h1>Thread not found</h1><p>It may have been removed, or it's in a channel you can't see. <Link to="/board">Back to the forum</Link></p></div>
  const c = ch.list.find((x) => x.key === chanKey(t)) || { icon: CHANNELS[t.audience].icon, name: t.audience === 'team' ? t.teams?.name : CHANNELS[t.audience].name }
  const mod = ch.mod
  const mine = (a) => a === user?.id
  const canReply = !t.locked || mod

  async function send(body, parent) {
    setErr(null)
    const { data, error } = await supabase.from('replies').insert({ post_id: id, body, parent_id: parent || null }).select('id').single()
    if (error) { setErr(/row-level/.test(error.message) ? (t.locked ? 'This thread is locked.' : "You can't reply here.") : error.message); return false }
    const newId = Array.isArray(data) ? data[0]?.id : data?.id
    setReplyTo(null); if (parent) setCollapsed((x) => ({ ...x, [parent]: false }))
    await load(); setFlash(newId); setTimeout(() => document.getElementById(`r-${newId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80); setTimeout(() => setFlash(null), 2200)
    supabase.functions.invoke('forum-notify', { body: { post_id: id, reply_id: newId } })
    return true
  }
  async function react(emoji, replyId) {
    const have = reacts.find((r) => r.emoji === emoji && r.profile_id === user.id && (r.reply_id || null) === (replyId || null))
    if (have) await supabase.from('forum_reactions').delete().eq('id', have.id)
    else await supabase.from('forum_reactions').insert({ post_id: id, reply_id: replyId || null, emoji })
    load()
  }
  async function modSet(patch) { const { error } = await supabase.from('posts').update(patch).eq('id', id); if (error) setErr(error.message); load() }
  async function delThread() { if (!window.confirm('Delete this whole thread and its replies?')) return; await supabase.from('posts').delete().eq('id', id); nav('/board') }
  async function delReply(r) { if (!window.confirm(count(r.id) ? 'Delete this reply? Replies to it will stay, marked as answering a deleted comment.' : 'Delete this reply?')) return; await supabase.from('replies').delete().eq('id', r.id); load() }
  async function saveEdit(kind, rid, patch) {
    const { error } = kind === 'post' ? await supabase.from('posts').update(patch).eq('id', rid) : await supabase.from('replies').update(patch).eq('id', rid)
    if (error) setErr(error.message); setEditing(null); load()
  }
  const Reacts = ({ replyId }) => { // eslint-disable-line react/no-unstable-nested-components
    const here = reacts.filter((r) => (r.reply_id || null) === (replyId || null))
    return (
      <span className="reacts">
        {REACTS.map((e) => { const n = here.filter((r) => r.emoji === e).length; const me = here.some((r) => r.emoji === e && r.profile_id === user.id); return <button key={e} className={'react' + (me ? ' me' : '') + (n ? '' : ' zero')} onClick={() => react(e, replyId)} aria-label={`React ${e}`}>{e}{n > 0 && <span>{n}</span>}</button> })}
      </span>
    )
  }

  // One comment and everything under it. Indent stops at 4 levels so it stays readable on a phone.
  const renderComment = (r, depth) => {
    const children = kids[r.id] || []
    const isCollapsed = collapsed[r.id]
    const parent = r.parent_id ? byId[r.parent_id] : null
    const orphan = r.parent_id && !parent
    return (
      <div key={r.id} className={'cmt' + (depth > 0 ? ' nested' : '') + (flash === r.id ? ' flash' : '')} id={`r-${r.id}`}>
        <div className="cmt-card">
          <div className="cmt-head">
            <Avatar name={r.author_name} size={30} />
            <b>{r.author_name}</b>
            {r.author_id && r.author_id === t.author_id && <span className="op-tag">Started thread</span>}
            <span className="cmt-time" title={new Date(r.created_at).toLocaleString('en-AU')}>{ago(r.created_at)}{r.edited_at ? ' · edited' : ''}</span>
          </div>
          {(depth >= 4 && parent) || orphan ? <p className="replying-to">↳ replying to {orphan ? 'a deleted comment' : <a href={`#r-${parent.id}`}>{parent.author_name}</a>}</p> : null}
          {editing === r.id ? <EditBox body={r.body} onCancel={() => setEditing(null)} onSave={(v) => saveEdit('reply', r.id, v)} /> : <div className="msg-text">{r.body}</div>}
          <div className="msg-actions">
            <Reacts replyId={r.id} />
            {canReply && <button className="link small act" onClick={() => setReplyTo(replyTo === r.id ? null : r.id)}>↩ Reply</button>}
            {mine(r.author_id) && editing !== r.id && <button className="link small act" onClick={() => setEditing(r.id)}>Edit</button>}
            {(mine(r.author_id) || mod) && <button className="link small act danger" onClick={() => delReply(r)}>Delete</button>}
            {children.length > 0 && <button className="link small act" onClick={() => setCollapsed((x) => ({ ...x, [r.id]: !isCollapsed }))}>{isCollapsed ? `Show ${count(r.id)} ${count(r.id) === 1 ? 'reply' : 'replies'}` : 'Hide replies'}</button>}
          </div>
          {replyTo === r.id && <Composer key={r.id} inline to={r.author_name} onCancel={() => setReplyTo(null)} onSend={(b) => send(b, r.id)} />}
        </div>
        {children.length > 0 && !isCollapsed && (
          <div className={'cmt-children' + (depth >= 3 ? ' flat' : '')}>
            <button className="thread-line" aria-label={`Hide replies to ${r.author_name}`} onClick={() => setCollapsed((x) => ({ ...x, [r.id]: true }))} />
            <div className="cmt-kids">{children.map((k) => renderComment(k, depth + 1))}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="wrap forum thread-page">
      <p className="crumb"><Link to="/board">Club forum</Link> <span aria-hidden>›</span> {c.icon} {c.name}</p>
      <header className="thread-head">
        <h1>{t.pinned && '📌 '}{t.locked && '🔒 '}{t.title}</h1>
        {mod && <div className="mod-tools"><span className="pill">Moderator</span><button className="btn small ghost" onClick={() => modSet({ pinned: !t.pinned })}>{t.pinned ? 'Unpin' : 'Pin'}</button><button className="btn small ghost" onClick={() => modSet({ locked: !t.locked })}>{t.locked ? 'Unlock' : 'Lock'}</button><button className="btn small ghost danger" onClick={delThread}>Delete</button></div>}
      </header>
      {err && <p className="err">{err}</p>}
      <article className="msg op">
        <Avatar name={t.author_name} size={44} />
        <div className="msg-body">
          <div className="msg-meta"><b>{t.author_name}</b><span>{ago(t.created_at)}{t.edited_at ? ' · edited' : ''}</span></div>
          {editing === 'post' ? <EditBox title={t.title} body={t.body} onCancel={() => setEditing(null)} onSave={(v) => saveEdit('post', t.id, v)} /> : <div className="msg-text">{t.body}</div>}
          <div className="msg-actions"><Reacts />{canReply && <button className="link small act" onClick={() => document.getElementById('reply-box')?.focus()}>↩ Reply</button>}{mine(t.author_id) && editing !== 'post' && <button className="link small act" onClick={() => setEditing('post')}>Edit</button>}{!mod && mine(t.author_id) && <button className="link small act danger" onClick={delThread}>Delete</button>}</div>
        </div>
      </article>
      <div className="row between replies-bar">
        <h2 className="replies-head">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</h2>
        {replies.length > 1 && <div className="seg small-seg"><button className={sort === 'old' ? 'on' : ''} onClick={() => setSort('old')}>Oldest first</button><button className={sort === 'new' ? 'on' : ''} onClick={() => setSort('new')}>Newest first</button></div>}
      </div>
      <div className="cmts">{(kids.root || []).map((r) => renderComment(r, 0))}</div>
      {canReply ? <Composer bottom to={t.author_name} onSend={(b) => send(b, null)} channel={c.name} /> : <p className="locked-note">🔒 This thread is locked – no new replies.</p>}
    </div>
  )
}

function Composer({ inline, bottom, to, channel, onSend, onCancel }) {
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  async function go(e) {
    e.preventDefault(); if (!body.trim()) return
    setBusy(true); const ok = await onSend(body.trim()); setBusy(false)
    if (ok) setBody('')
  }
  return (
    <form className={'composer' + (inline ? ' inline' : '') + (bottom ? ' bottom' : '')} onSubmit={go}>
      <p className="composer-to">{inline ? <>↩ Replying to <b>{to}</b></> : <>Reply to the thread{to ? <> started by <b>{to}</b></> : null}</>}</p>
      <textarea id={bottom ? 'reply-box' : undefined} rows={inline ? 2 : 3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={inline ? `Reply to ${to}…` : 'Write a reply…'} autoFocus={inline} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) go(e); if (e.key === 'Escape' && onCancel) onCancel() }} />
      <div className="row between"><span className="small muted">{channel ? `Everyone in ${channel} can see your reply.` : ''}</span><span className="row">{onCancel && <button type="button" className="btn small ghost" onClick={onCancel}>Cancel</button>}<button className="btn small" disabled={busy || !body.trim()}>{busy ? 'Posting…' : 'Reply'}</button></span></div>
    </form>
  )
}

function EditBox({ title, body, onSave, onCancel }) {
  const [v, setV] = useState({ title, body })
  return (
    <div className="edit-box">
      {title !== undefined && <input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />}
      <textarea rows={4} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
      <div className="row"><button className="btn small" onClick={() => onSave(title !== undefined ? { title: v.title.trim(), body: v.body.trim() } : { body: v.body.trim() })}>Save</button><button className="btn small ghost" onClick={onCancel}>Cancel</button></div>
    </div>
  )
}

// Small "latest in the forum" panel used on My family, Coaches and the committee home.
export function ForumLatest({ limit = 4, title = 'Latest in the club forum' }) {
  const { user } = useAuth()
  const [rows, setRows] = useState(null)
  const { isUnread } = useReads(user?.id)
  const load = useCallback(async () => {
    const { data } = await supabase.from('posts').select('id, title, audience, team_id, author_id, author_name, last_activity_at, reply_count, pinned, teams(name)').order('last_activity_at', { ascending: false }).limit(limit)
    setRows(data || [])
  }, [limit])
  useEffect(() => { if (user) load() }, [user, load])
  useLive(['posts'], load)
  if (!user || !rows) return null
  return (
    <section className="card forum-latest">
      <div className="row between"><h3>💬 {title}</h3><Link to="/board" className="btn small">Open forum</Link></div>
      {rows.length === 0 ? <p className="muted small">No threads yet. <Link to="/board">Start one</Link></p> : (
        <ul className="plain">
          {rows.map((t) => <li key={t.id}><Link to={`/board/${t.id}`} className={isUnread(t) ? 'unread' : ''}><span className="fl-title">{t.title}{isUnread(t) && <span className="new-dot">New</span>}</span><span className="fl-meta">{t.audience === 'team' ? t.teams?.name : CHANNELS[t.audience]?.name} · {t.reply_count} {t.reply_count === 1 ? 'reply' : 'replies'} · {ago(t.last_activity_at)}</span></Link></li>)}
        </ul>
      )}
    </section>
  )
}

// Menu link with a count of threads that have new activity.
export function ForumNavLink({ NavLink }) {
  const { user } = useAuth()
  const [n, setN] = useState(0)
  const load = useCallback(async () => { const { data } = await supabase.rpc('forum_unread'); setN(data || 0) }, [])
  useEffect(() => {
    if (!user) return
    load(); const t = setInterval(load, 60000)
    window.addEventListener('forum-read', load)
    return () => { clearInterval(t); window.removeEventListener('forum-read', load) }
  }, [user, load])
  useLive(user ? ['posts', 'replies'] : [], load)
  return <NavLink to="/board" className="nav-forum">Club forum{n > 0 && <span className="badge">{n > 99 ? '99+' : n}</span>}</NavLink>
}
