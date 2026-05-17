import { useState } from 'react'

const ZONES = [
  {
    id: 'main-pitch',
    label: 'Main Pitch',
    desc: 'Full-size 11v11 pitch used for U14 and U16 matches. 100m × 68m with natural grass.',
    color: '#2e8540',
    icon: '⚽',
  },
  {
    id: 'small-pitch',
    label: 'Small Sided Pitch',
    desc: 'Smaller pitch used for U8, U10 and U12 games. Adjustable goals and reduced dimensions.',
    color: '#4caf60',
    icon: '🥅',
  },
  {
    id: 'training',
    label: 'Training Area',
    desc: 'Multi-use training zone with cone setups, rebound walls and agility equipment. Tuesday and Thursday evenings.',
    color: '#3a7c3a',
    icon: '🏃',
  },
  {
    id: 'canteen',
    label: 'Canteen & BBQ',
    desc: 'Club canteen open every home match day. Hot dogs, pies, drinks and snacks. Volunteers welcome!',
    color: '#d4891a',
    icon: '🌭',
  },
  {
    id: 'change-rooms',
    label: 'Change Rooms',
    desc: 'Two change rooms – one per team. Showers available. Please leave clean for the next team.',
    color: '#6b7280',
    icon: '🚿',
  },
  {
    id: 'parking',
    label: 'Car Park',
    desc: 'Free parking for up to 80 vehicles. Please park considerately and leave space for buses.',
    color: '#9ca3af',
    icon: '🅿️',
  },
  {
    id: 'spectator',
    label: 'Spectator Area',
    desc: 'Covered seating for 120 spectators along the eastern sideline. BYO chairs for extra comfort.',
    color: '#f5a623',
    icon: '👀',
  },
]

export default function PitchPage() {
  const [active, setActive] = useState(null)
  const zone = ZONES.find(z => z.id === active)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-800 mb-1">Ground Map</h1>
      <p className="text-gray-500 mb-8">
        Mt Beauty Recreational Reserve — click any zone for details
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
            <svg
              viewBox="0 0 800 580"
              className="w-full max-w-2xl mx-auto"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {/* Background - surroundings */}
              <rect width="800" height="580" fill="#b8c9a0" rx="12" />

              {/* Car park (top) */}
              <rect
                x="0" y="0" width="800" height="75" fill="#c8cdd4" rx="12"
                className="cursor-pointer hover:opacity-80"
                onClick={() => setActive(active === 'parking' ? null : 'parking')}
                opacity={active === 'parking' ? 0.6 : 1}
              />
              <text x="400" y="44" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#4b5563">
                🅿️  Car Park
              </text>

              {/* Change rooms (left) */}
              <rect
                x="0" y="75" width="80" height="430" fill="#9ca3af" rx="0"
                className="cursor-pointer hover:opacity-80"
                onClick={() => setActive(active === 'change-rooms' ? null : 'change-rooms')}
                opacity={active === 'change-rooms' ? 0.6 : 1}
              />
              <text
                x="40" y="295" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white"
                transform="rotate(-90, 40, 295)"
              >
                🚿 Change Rooms
              </text>

              {/* Training area (right) */}
              <rect
                x="700" y="75" width="100" height="430" fill="#4caf60" rx="0"
                className="cursor-pointer hover:opacity-80"
                onClick={() => setActive(active === 'training' ? null : 'training')}
                opacity={active === 'training' ? 0.6 : 1}
              />
              <text
                x="750" y="280" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white"
                transform="rotate(90, 750, 280)"
              >
                🏃 Training Area
              </text>

              {/* Canteen (bottom) */}
              <rect
                x="0" y="505" width="800" height="75" fill="#f5a623" rx="0"
                className="cursor-pointer hover:opacity-80"
                onClick={() => setActive(active === 'canteen' ? null : 'canteen')}
                opacity={active === 'canteen' ? 0.6 : 1}
              />
              <text x="400" y="548" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#7c3d0c">
                🌭  Canteen &amp; BBQ
              </text>

              {/* Spectator strip along east side of main pitch */}
              <rect
                x="80" y="75" width="30" height="430" fill="#f5a623" opacity="0.4"
                className="cursor-pointer hover:opacity-80"
                onClick={() => setActive(active === 'spectator' ? null : 'spectator')}
              />

              {/* === Main Pitch === */}
              <rect
                x="110" y="90" width="450" height="415" fill="#2e8540" rx="4"
                className="cursor-pointer hover:opacity-90"
                onClick={() => setActive(active === 'main-pitch' ? null : 'main-pitch')}
                opacity={active === 'main-pitch' ? 0.7 : 1}
              />

              {/* Pitch markings – all white, stroke only */}
              <g stroke="white" strokeWidth="2" fill="none">
                {/* Outline */}
                <rect x="110" y="90" width="450" height="415" />
                {/* Halfway line */}
                <line x1="335" y1="90" x2="335" y2="505" />
                {/* Centre circle */}
                <circle cx="335" cy="298" r="50" />
                {/* Centre spot */}
                <circle cx="335" cy="298" r="3" fill="white" stroke="none" />
                {/* Left penalty area */}
                <rect x="110" y="175" width="100" height="245" />
                {/* Left goal area */}
                <rect x="110" y="215" width="45" height="165" />
                {/* Right penalty area */}
                <rect x="460" y="175" width="100" height="245" />
                {/* Right goal area */}
                <rect x="515" y="215" width="45" height="165" />
                {/* Penalty spots */}
                <circle cx="193" cy="298" r="3" fill="white" stroke="none" />
                <circle cx="477" cy="298" r="3" fill="white" stroke="none" />
              </g>

              {/* Goals */}
              <rect x="93" y="272" width="17" height="52" fill="white" opacity="0.9" rx="1" />
              <rect x="560" y="272" width="17" height="52" fill="white" opacity="0.9" rx="1" />

              {/* Pitch label */}
              <text x="335" y="130" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white" opacity="0.7">
                MAIN PITCH
              </text>

              {/* === Small sided pitch === */}
              <rect
                x="110" y="400" width="200" height="100" fill="#4caf60" rx="3"
                style={{ display: 'none' }}
              />

              {/* Small pitch – positioned bottom right of training area label for now */}
              {/* Actually let's keep it simple and just label the small pitch area */}

              {/* Info label main pitch */}
              {active === 'main-pitch' && (
                <rect x="140" y="100" width="260" height="24" fill="#1a5c2a" rx="4" opacity="0.8" />
              )}
              {active === 'main-pitch' && (
                <text x="270" y="117" textAnchor="middle" fontSize="11" fill="white">
                  Click info panel →
                </text>
              )}
            </svg>
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          {zone ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-20">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-4"
                style={{ backgroundColor: zone.color + '22', border: `2px solid ${zone.color}` }}
              >
                {zone.icon}
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-2">{zone.label}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{zone.desc}</p>
              <button
                onClick={() => setActive(null)}
                className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="bg-green-club/5 border border-green-club/10 rounded-2xl p-6">
              <p className="text-4xl mb-3">🗺️</p>
              <h2 className="font-bold text-gray-700 mb-2">Explore the Ground</h2>
              <p className="text-sm text-gray-500 mb-4">
                Click any coloured zone on the map to see details about that area.
              </p>
              <ul className="space-y-2">
                {ZONES.map(z => (
                  <li key={z.id}>
                    <button
                      onClick={() => setActive(z.id)}
                      className="w-full text-left text-sm flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-green-club/5 transition-colors text-gray-600 hover:text-green-club font-medium"
                    >
                      <span>{z.icon}</span> {z.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-sm text-gray-600">
            <h3 className="font-bold text-gray-800 mb-2">Ground Address</h3>
            <p>Mt Beauty Recreational Reserve</p>
            <p>Hollonds St, Mt Beauty VIC 3699</p>
            <a
              href="https://maps.google.com/?q=Mt+Beauty+Recreational+Reserve+Victoria"
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-3 text-green-club font-semibold hover:underline text-xs"
            >
              Open in Google Maps →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
