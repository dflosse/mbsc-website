import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MessageBoard() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ author: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const loadMessages = () => {
    supabase
      .from('messages')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMessages(data ?? [])
        setLoading(false)
      })
  }

  useEffect(() => { loadMessages() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.author.trim() || !form.content.trim()) {
      setError('Please fill in both your name and message.')
      return
    }
    if (form.content.trim().length < 5) {
      setError('Message is too short.')
      return
    }
    setSubmitting(true)
    const { error: dbErr } = await supabase
      .from('messages')
      .insert({ author: form.author.trim(), content: form.content.trim(), approved: false })
    setSubmitting(false)
    if (dbErr) {
      setError('Could not send message. Please try again.')
    } else {
      setSubmitted(true)
      setForm({ author: '', content: '' })
    }
  }

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-800 mb-1">Message Board</h1>
      <p className="text-gray-500 mb-8">
        Community noticeboard for Mt Beauty SC families and supporters.
        Posts are reviewed by coaches before appearing.
      </p>

      {/* Post form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="font-bold text-gray-800 mb-4">Post a Message</h2>
        {submitted ? (
          <div className="bg-green-club/10 border border-green-club/20 rounded-xl p-4 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-green-club">Message submitted!</p>
            <p className="text-sm text-gray-500 mt-1">A coach will review and approve it shortly.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-3 text-sm text-green-club font-semibold hover:underline"
            >
              Post another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Your Name</label>
              <input
                type="text"
                value={form.author}
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                placeholder="e.g. Sarah K."
                maxLength={60}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-club focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Message</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Share a result, organise a carpool, say thanks to the coaches..."
                rows={4}
                maxLength={500}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-club focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{form.content.length}/500</p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-club text-white font-bold px-6 py-2.5 rounded-full hover:bg-green-mid disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending…' : 'Submit for Review'}
            </button>
          </form>
        )}
      </div>

      {/* Messages list */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(n => <div key={n} className="animate-pulse bg-gray-100 h-24 rounded-xl" />)}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">💬</p>
          <p className="font-semibold">No messages yet</p>
          <p className="text-sm">Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <article key={msg.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-club/10 border border-green-club/20 flex items-center justify-center font-bold text-green-club text-sm flex-shrink-0">
                  {msg.author?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 text-sm">{msg.author}</span>
                    <span className="text-gray-400 text-xs">·</span>
                    <span className="text-gray-400 text-xs">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
