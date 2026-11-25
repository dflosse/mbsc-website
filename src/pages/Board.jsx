import { useEffect, useState, useCallback } from 'react'
import { supabase, fmtDate, ROSTER_SEASON } from '../supabase'
import { useAuth } from '../auth'

const AUD = { public: 'Everyone (public)', members: 'All club families', team: 'One team', coaches: 'Coaches', committee: 'Committee only' }

export default function Board() {
  const { isStaff, isCoach, coachTeams } = useAuth()
  const [posts, setPosts] = useState([])
  const [teams, setTeams] = useState([])
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)
  const [replies, setReplies] = useState({})
  const [draft, setDraft] = useState({ audience: 'members', team_id: '', title: '', body: '' })
  const [writing, setWriting] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('posts').select('*, teams(name)').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(200)
    setPosts(data || [])
  }, [])
  useEffect(() => {
    load()
    supabase.from('teams').select('id,name').eq('season', ROSTER_SEASON).order('sort_order').then(({ data }) => setTeams(data || []))
  }, [load])

  const allowed = ['members', 'team', ...(isCoach || isStaff ? ['coaches'] : []), ...(isStaff ? ['public', 'committee'] : [])]

  async function openPost(id) {
    setOpen(open === id ? null : id)
    const { data } = await supabase.from('replies').select('*').eq('post_id', id).order('created_at')
    setReplies((r) => ({ ...r, [id]: data || [] }))
  }
  async function post(e) {
    e.preventDefault(); setErr('')
    const row = { audience: draft.audience, title: draft.title, body: draft.body, team_id: draft.audience === 'team' ? draft.team_id || null : null }
    const { error } = await supabase.from('posts').insert(row)
    if (error) return setErr(error.message.includes('row-level') ? "You can't post to that group." : error.message)
    setDraft({ audience: 'members', team_id: '', title: '', body: '' }); setWriting(false); load()
  }
  async function reply(e, id) {
    e.preventDefault()
    const body = e.target.body.value.trim(); if (!body) return
    const { error } = await supabase.from('replies').insert({ post_id: id, body })
    if (!error) { e.target.reset(); openPost(id); setOpen(id) }
  }
  async function del(id) { if (confirm('Delete this post?')) { await supabase.from('posts').delete().eq('id', id); load() } }
  async function pin(p) { await supabase.from('posts').update({ pinned: !p.pinned }).eq('id', p.id); load() }

  const shown = posts.filter((p) => filter === 'all' || p.audience === filter)
  return (
    <div className="wrap">
      <div className="row between"><h1>Message board</h1><button className="btn" onClick={() => setWriting(!writing)}>{writing ? 'Cancel' : 'New post'}</button></div>
      {writing && (
        <form className="card form" onSubmit={post}>
          <div className="grid2 tight">
            <label>Who can see it<select value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })}>{allowed.map((a) => <option key={a} value={a}>{AUD[a]}</option>)}</select></label>
            {draft.audience === 'team' && <label>Team<select value={draft.team_id} onChange={(e) => setDraft({ ...draft, team_id: e.target.value })} required><option value="">Choose…</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
          </div>
          <label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required /></label>
          <label>Message<textarea rows={4} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} required /></label>
          <button className="btn">Post</button> {err && <span className="err">{err}</span>}
        </form>
      )}
      <div className="tabs">
        {['all', 'members', 'team', ...(isCoach || isStaff ? ['coaches'] : []), ...(isStaff ? ['committee', 'public'] : [])].map((a) => <button key={a} className={filter === a ? 'on' : ''} onClick={() => setFilter(a)}>{a === 'all' ? 'All' : AUD[a].replace('One team', 'Teams')}</button>)}
      </div>
      {shown.length === 0 && <p className="muted">Nothing here yet.</p>}
      {shown.map((p) => (
        <article key={p.id} className="card post">
          <div className="row between">
            <span className="tag">{p.audience === 'team' ? p.teams?.name : AUD[p.audience]}</span>
            <span className="muted small">{p.author_name || 'Club'} · {fmtDate(p.created_at.slice(0, 10))}</span>
          </div>
          <h3>{p.pinned && '📌 '}{p.title}</h3>
          <p className="pre">{p.body}</p>
          <div className="row">
            <button className="link" onClick={() => openPost(p.id)}>{open === p.id ? 'Hide replies' : 'Replies'}</button>
            {isStaff && <button className="link" onClick={() => pin(p)}>{p.pinned ? 'Unpin' : 'Pin'}</button>}
            {isStaff && <button className="link danger" onClick={() => del(p.id)}>Delete</button>}
          </div>
          {open === p.id && (
            <div className="replies">
              {(replies[p.id] || []).map((r) => <div key={r.id} className="reply"><b>{r.author_name}</b> <span className="muted small">{fmtDate(r.created_at.slice(0, 10))}</span><p className="pre">{r.body}</p></div>)}
              <form onSubmit={(e) => reply(e, p.id)} className="row"><input name="body" placeholder="Write a reply…" /><button className="btn small">Reply</button></form>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
