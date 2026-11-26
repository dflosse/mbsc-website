// Emails people about forum activity, from noreply@mountbeautyfc.org.au.
//  - New reply: the thread starter and everyone who has replied (unless they've turned reply emails off).
//  - New thread: people who chose "email me new threads" for that channel.
//  - Moderators (President / Secretary) can also email everyone who can see the channel.
// Only ever emails people who are allowed to see the thread.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const SITE = 'https://mountbeautyfc.org.au'
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const CHANNEL: Record<string, string> = { public: 'Club news', members: 'General', team: 'Team', coaches: 'Coaches', committee: 'Committee', volunteers: 'Volunteers' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const key = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('Resend_API_Key')
    if (!key) return json({ skipped: 'Email not set up' })
    const url = Deno.env.get('SUPABASE_URL')!
    const authz = req.headers.get('Authorization') ?? ''
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authz } } })
    const { data: { user } } = await asUser.auth.getUser()
    if (!user) return json({ error: 'Please sign in again.' }, 401)
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const b = await req.json()

    // The caller must be able to see the thread (checked with their own permissions).
    const { data: post } = await asUser.from('posts').select('id, title, body, audience, team_id, author_id, author_name, teams(name)').eq('id', b.post_id).maybeSingle()
    if (!post) return json({ error: 'Thread not found.' }, 404)
    const channel = post.audience === 'team' ? `${(post as any).teams?.name || 'Team'}` : CHANNEL[post.audience]
    const link = `${SITE}/board/${post.id}`

    let ids: string[] = []
    let subject = '', intro = '', text = '', by = ''
    if (b.reply_id) {
      const { data: r } = await asUser.from('replies').select('id, body, author_id, author_name, parent_id').eq('id', b.reply_id).maybeSingle()
      if (!r || r.author_id !== user.id) return json({ error: 'Reply not found.' }, 404)
      const { data: rs } = await db.from('replies').select('author_id').eq('post_id', post.id)
      ids = [post.author_id, ...(rs || []).map((x) => x.author_id)].filter((x) => x && x !== user.id)
      const { data: off } = await db.from('forum_prefs').select('profile_id').in('profile_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']).eq('reply_emails', false)
      const offSet = new Set((off || []).map((o) => o.profile_id))
      ids = ids.filter((x) => !offSet.has(x))
      by = r.author_name; text = r.body
      let parentName = ''
      if (r.parent_id) { const { data: pr } = await db.from('replies').select('author_name, author_id').eq('id', r.parent_id).maybeSingle(); parentName = pr?.author_name || ''; if (pr?.author_id && pr.author_id !== user.id && !offSet.has(pr.author_id)) ids.push(pr.author_id) }
      subject = parentName ? `${r.author_name} replied to ${parentName}: ${post.title}` : `${r.author_name} replied: ${post.title}`
      intro = parentName ? `<b>${esc(r.author_name)}</b> replied to <b>${esc(parentName)}</b>'s comment in <b>${esc(post.title)}</b> (${esc(channel)}):` : `<b>${esc(r.author_name)}</b> replied in <b>${esc(post.title)}</b> (${esc(channel)}):`
    } else {
      if (post.author_id !== user.id) return json({ error: 'Only the person who started the thread can send its notice.' }, 403)
      const { data: mod } = await asUser.rpc('is_moderator')
      if (b.everyone && mod) {
        const { data: all } = await db.from('profiles').select('id')
        ids = (all || []).map((p) => p.id)
      } else {
        const chanKey = post.audience === 'team' ? `team:${post.team_id}` : post.audience
        const { data: subs } = await db.from('forum_prefs').select('profile_id').contains('channels', [chanKey])
        ids = (subs || []).map((s) => s.profile_id)
      }
      ids = ids.filter((x) => x !== user.id)
      by = post.author_name; text = post.body
      subject = `${post.audience === 'public' ? 'Club news' : 'New in ' + channel}: ${post.title}`
      intro = `<b>${esc(post.author_name)}</b> started a new thread in <b>${esc(channel)}</b>:`
    }
    // @mentions: only ones the caller actually saved for this post/reply.
    let mentionIds: string[] = []
    if (Array.isArray(b.mentions) && b.mentions.length) {
      let mq = db.from('forum_mentions').select('mentioned_id').eq('post_id', post.id).eq('by_id', user.id).in('mentioned_id', b.mentions)
      mq = b.reply_id ? mq.eq('reply_id', b.reply_id) : mq.is('reply_id', null)
      const { data: ms } = await mq
      mentionIds = [...new Set((ms || []).map((m) => m.mentioned_id))].filter((x) => x !== user.id)
      if (mentionIds.length) {
        const { data: off } = await db.from('forum_prefs').select('profile_id').in('profile_id', mentionIds).eq('mention_emails', false)
        const offSet = new Set((off || []).map((o) => o.profile_id))
        mentionIds = mentionIds.filter((x) => !offSet.has(x))
      }
    }
    ids = [...new Set(ids)].filter((x) => !mentionIds.includes(x))

    const visible = async (list: string[]) => {
      const out: string[] = []
      for (const id of list) { const { data: ok } = await db.rpc('can_see_as_public', { uid: id, a: post.audience, t: post.team_id }); if (ok) out.push(id) }
      if (!out.length) return []
      const { data: people } = await db.from('profiles').select('email, full_name').in('id', out)
      return (people || []).filter((p) => p.email)
    }
    const { data: ce } = await db.from('settings').select('value').eq('key', 'club_email').maybeSingle()
    const replyTo = ce?.value?.trim() || 'mtbeautysoccerclub@gmail.com'
    const excerpt = esc(text.length > 600 ? text.slice(0, 600) + '…' : text).replace(/\n/g, '<br>')
    const html = (first: string, lead: string) => `<div style="font-family:Arial,sans-serif;color:#1e3b2f;max-width:560px;font-size:15px;line-height:1.5">
      <p>Hi ${esc(first || 'there')},</p><p>${lead}</p>
      <blockquote style="margin:0 0 16px;padding:10px 14px;border-left:3px solid #f08a3c;background:#f4f6f3">${excerpt}</blockquote>
      <p><a href="${link}" style="display:inline-block;background:#f08a3c;color:#1e3b2f;padding:11px 18px;border-radius:10px;text-decoration:none;font-weight:bold">Open the thread</a></p>
      <p style="color:#666;font-size:13px;border-top:1px solid #ddd;padding-top:10px">Please reply on the club forum, not to this email. Change which emails you get in the forum under "Email settings".<br>Mount Beauty Football Club · mountbeautyfc.org.au</p></div>`
    const sendAll = async (to: { email: string; full_name: string }[], subj: string, lead: string) => {
      let n = 0
      for (let i = 0; i < to.length; i += 100) {
        const chunk = to.slice(i, i + 100)
        const r = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk.map((p) => ({ from: 'Mount Beauty Football Club <noreply@mountbeautyfc.org.au>', to: [p.email], reply_to: replyTo, subject: subj, html: html((p.full_name || '').split(' ')[0], lead) }))),
        })
        if (r.ok) n += chunk.length
      }
      return n
    }
    let sent = 0
    if (mentionIds.length) sent += await sendAll(await visible(mentionIds), `${by} mentioned you: ${post.title}`, `<b>${esc(by)}</b> mentioned you in <b>${esc(post.title)}</b> (${esc(channel)}):`)
    if (ids.length) sent += await sendAll(await visible(ids), subject, intro)
    return json({ ok: true, sent, by })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})
