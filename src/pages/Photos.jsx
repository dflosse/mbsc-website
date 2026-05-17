import { useState } from 'react'

const CATEGORIES = ['All', 'Teams', 'Match Day', 'Training', 'Events']

// Placeholder cards until real photos are uploaded via Supabase Storage
const PLACEHOLDERS = [
  { id: 1, category: 'Teams', caption: 'U12 Team Photo – Round 1', emoji: '👥' },
  { id: 2, category: 'Match Day', caption: 'Opening Day 2025', emoji: '⚽' },
  { id: 3, category: 'Training', caption: 'Tuesday Night Training', emoji: '🏃' },
  { id: 4, category: 'Teams', caption: 'U8 First Kick-off', emoji: '🌟' },
  { id: 5, category: 'Match Day', caption: 'Round 3 – Bright FC Away', emoji: '🏆' },
  { id: 6, category: 'Events', caption: 'Season Launch BBQ', emoji: '🎉' },
  { id: 7, category: 'Training', caption: 'Pre-season Fitness', emoji: '💪' },
  { id: 8, category: 'Match Day', caption: 'Home Opener vs Myrtleford', emoji: '📸' },
  { id: 9, category: 'Teams', caption: 'U16 Squad 2025', emoji: '👕' },
]

export default function Photos() {
  const [category, setCategory] = useState('All')

  const visible = category === 'All'
    ? PLACEHOLDERS
    : PLACEHOLDERS.filter(p => p.category === category)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800 mb-1">Photos</h1>
        <p className="text-gray-500">Season highlights, team photos and match day memories</p>
      </div>

      {/* Upload notice */}
      <div className="bg-gold/10 border border-gold/40 rounded-xl p-5 mb-8 flex items-start gap-4">
        <span className="text-3xl">📸</span>
        <div>
          <p className="font-bold text-gray-800">Photo uploads coming soon</p>
          <p className="text-sm text-gray-600 mt-1">
            Coaches can upload match day and training photos through the{' '}
            <a href="/coach" className="text-green-club font-semibold underline">Coach Portal</a>.
            In the meantime, enjoy the placeholders below!
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all
              ${category === cat
                ? 'bg-green-club text-white shadow'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-green-club hover:text-green-club'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {visible.map(photo => (
          <div
            key={photo.id}
            className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Placeholder thumbnail */}
            <div className="aspect-square bg-gradient-to-br from-green-club/10 to-gold/10 flex items-center justify-center">
              <span className="text-5xl group-hover:scale-110 transition-transform">
                {photo.emoji}
              </span>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-gray-700 leading-tight">{photo.caption}</p>
              <span className="text-xs text-gray-400 mt-1 inline-block">{photo.category}</span>
            </div>
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🖼️</p>
          <p className="font-semibold">No photos in this category yet</p>
        </div>
      )}
    </div>
  )
}
