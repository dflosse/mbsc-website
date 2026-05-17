import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-green-club text-white mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <h3 className="font-bold text-gold mb-3">Mt Beauty SC</h3>
          <p className="text-sm text-green-light">
            Junior Soccer Club – Alpine Valleys, Victoria.
            Playing in green and gold since 1978.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-gold mb-3">Quick Links</h3>
          <ul className="space-y-1 text-sm">
            {[
              ['/fixtures', 'Fixtures & Draw'],
              ['/results',  'Results'],
              ['/teams',    'Teams & Rosters'],
              ['/pitch',    'Ground Map'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="hover:text-gold transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-gold mb-3">Contact</h3>
          <p className="text-sm text-green-light">
            Mt Beauty Recreational Reserve<br />
            Mt Beauty, VIC 3699<br />
            <a href="mailto:info@mtbeautysc.org.au" className="hover:text-gold transition-colors">
              info@mtbeautysc.org.au
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-green-mid text-center py-4 text-xs text-green-light">
        © {new Date().getFullYear()} Mt Beauty Soccer Club. All rights reserved.
      </div>
    </footer>
  )
}
