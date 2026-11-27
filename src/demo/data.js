// Sample data for the demo build only. Names of children are made up.
const T = (id, name, age, format, coaches, sort, training = 'Wednesday 4–5pm') => ({ id, season: 2027, name, age_group: age, format, coach_names: 'TBA', training, sort_order: sort })
export const teams = [
  T('t5', 'Under 5', 'U5', '4v4, no goalkeeper', 'Carly', 1),
  T('t6', 'Under 6', 'U6', '4v4, no goalkeeper', 'Sarah / David', 2),
  T('t7', 'Under 7', 'U7', '4v4, no goalkeeper', 'Steff / Daniel', 3),
  T('t9r', 'Under 9 Red', 'U9', '7v7 with goalkeeper', 'Rachelle', 4),
  T('t9g', 'Under 9 Green', 'U9', '7v7 with goalkeeper', 'Erik', 5),
  T('t11r', 'Under 11 Red', 'U11', '9v9 with goalkeeper', 'Rob', 6),
  T('t11g', 'Under 11 Green', 'U11', '9v9 with goalkeeper', 'Dave', 7),
  T('t13', 'Under 13', 'U13', '9v9 with goalkeeper', 'Sian', 8, 'Tuesday & Wednesday 4–5pm'),
]

const first = ['Ava', 'Billy', 'Charlie', 'Daisy', 'Eli', 'Freya', 'George', 'Hazel', 'Isla', 'Jack', 'Kai', 'Lily', 'Max', 'Nell', 'Oscar', 'Poppy', 'Quinn', 'Ruby', 'Sid', 'Tilly', 'Ulla', 'Vince', 'Willow', 'Xavi', 'Yara', 'Zac', 'Archie', 'Bea', 'Cody', 'Dot', 'Ezra', 'Fern', 'Gus', 'Harper', 'Ivy', 'Jude', 'Kit', 'Luna', 'Milo', 'Nina', 'Ollie', 'Pip', 'Remy', 'Sage', 'Theo', 'Uma', 'Vera', 'Wren']
const last = ['Bogong', 'Kiewa', 'Falls', 'Tawonga', 'Howman', 'Bright', 'Feathertop', 'Ovens', 'Buffalo', 'Hotham', 'Dinner', 'Plain', 'Embery', 'Rocky', 'Simmonds', 'Huggins']
const yearFor = { t5: 2022, t6: 2021, t7: 2020, t9r: 2018, t9g: 2018, t11r: 2016, t11g: 2016, t13: 2014 }
const sizes = { t5: 3, t6: 5, t7: 7, t9r: 8, t9g: 8, t11r: 8, t11g: 7, t13: 4 }
export const players = []
let n = 0
for (const t of teams) {
  for (let i = 0; i < sizes[t.id]; i++) {
    const f = first[n % first.length], l = last[(n * 7) % last.length]
    players.push({
      id: 'p' + n, season: 2027, first_name: f, last_name: l, dob: `${yearFor[t.id] + (i % 2)}-0${(i % 9) + 1}-1${i % 9}`,
      gender: n % 2 ? 'M' : 'F', team_id: t.id, status: n % 11 === 3 ? 'pending' : 'approved', fv_registered: n % 6 !== 2, fees_paid: n % 5 !== 1,
      release_check: n === 12,
      medical_notes: n % 9 === 4 ? 'Asthma – puffer in bag' : n % 13 === 6 ? 'Nut allergy (EpiPen)' : '', photo_consent: n % 7 !== 0, committee_notes: '', emergency_contact: '',
      created_at: '2026-12-01T09:00:00Z',
    })
    n++
  }
}
// The demo family: Sam Parker, two kids
players.push(
  { id: 'kid1', release_check: false, season: 2027, first_name: 'Mia', last_name: 'Parker', dob: '2018-08-14', gender: 'F', team_id: 't9r', status: 'approved', fv_registered: true, fees_paid: true, medical_notes: '', photo_consent: true, committee_notes: '', created_at: '2026-12-02T09:00:00Z' },
  { id: 'kid2', season: 2027, first_name: 'Leo', last_name: 'Parker', dob: '2021-03-02', gender: 'M', team_id: null, status: 'pending', fv_registered: false, fees_paid: false, medical_notes: 'Mild hay fever', photo_consent: true, committee_notes: '', created_at: '2026-12-02T09:05:00Z' },
)

export const profiles = [
  { id: 'u-parent', email: 'sam.parker@example.com', full_name: 'Sam Parker', phone: '0400 000 111', role: 'parent', created_at: '2026-12-02T09:00:00Z' },
  { id: 'u-coach', email: 'coach@example.com', full_name: 'Sample coach (U9 Red)', phone: '', role: 'coach', created_at: '2026-12-01T09:00:00Z' },
  { id: 'u-committee', email: 'secretary@example.com', full_name: 'Club Secretary', phone: '', role: 'committee', is_executive: true, created_at: '2026-11-30T09:00:00Z' },
  { id: 'u-treas', email: 'treasurer@example.com', full_name: 'Sample Treasurer', phone: '', role: 'admin', is_executive: true, created_at: '2026-11-25T09:00:00Z' },
  { id: 'u-admin', email: 'danielflorisson@gmail.com', full_name: 'Dan Florisson', phone: '', role: 'admin', is_executive: true, created_at: '2026-11-25T09:00:00Z' },
  { id: 'u-p2', email: 'jo.kiewa@example.com', full_name: 'Jo Kiewa', phone: '0400 444 555', address: '3 Example Rd, Mount Beauty VIC', role: 'parent', created_at: '2026-12-03T09:00:00Z' },
  { id: 'u-p3', email: 'alex.bogong@example.com', full_name: 'Alex Bogong', phone: '0400 222 333', address: '12 Sample St, Tawonga VIC', role: 'parent', created_at: '2026-12-04T09:00:00Z' },
]
export const player_guardians = [{ player_id: 'kid1', profile_id: 'u-parent' }, { player_id: 'kid2', profile_id: 'u-parent' }]
export const team_coaches = [{ team_id: 't9r', profile_id: 'u-coach' }]

const G = (id, date, host, venue, address, extra = {}) => ({ id, season: 2027, gala_date: date, host_club: host + ' – sample date', venue, address, start_time: '9:00am', created_at: '', ...extra })
export const galas = [
  G('g1', '2027-05-16', 'Mount Beauty FC (home)', 'Les Peart Oval', 'Pool Road, Mount Beauty', { signup_closes: '2027-05-11', info: 'Home gala – we need parent helpers for the BBQ, canteen and pack-up. Arrive 8:30am for warm-up. Bring water, shin pads and a fruit snack.' }),
  G('g2', '2027-05-22', 'Myrtleford SC', 'Myrtleford Showgrounds', 'Myrtleford', { signup_closes: '2027-05-18' }),
  G('g3', '2027-05-30', 'Mount Beauty FC (home)', 'Les Peart Oval', 'Pool Road, Mount Beauty', { signup_closes: '2027-05-25' }),
  G('g4', '2027-06-13', 'Yackandandah FC', 'Yackandandah Recreation Reserve', 'Yackandandah', { signup_closes: '2027-06-08' }),
  G('g5', '2027-06-26', 'Bright SC', 'Bright Pioneer Park', 'Bright', { signup_closes: '2027-06-22' }),
  { id: 'g0a', season: 2026, gala_date: '2026-05-17', host_club: 'Mount Beauty FC', venue: 'Les Peart Oval' },
  { id: 'g0b', season: 2026, gala_date: '2026-05-23', host_club: 'Myrtleford SC', venue: 'Myrtleford' },
  { id: 'g0c', season: 2026, gala_date: '2026-05-31', host_club: 'Mount Beauty FC', venue: 'Les Peart Oval' },
  { id: 'g0d', season: 2026, gala_date: '2026-06-14', host_club: 'Yackandandah FC', venue: 'Yackandandah' },
  { id: 'g0e', season: 2026, gala_date: '2026-06-27', host_club: 'Bright SC', venue: 'Bright' },
]
export const gala_entries = []
players.forEach((p, i) => {
  if (p.id === 'kid2') return
  ;['g1', 'g2'].forEach((g, j) => { if ((i + j) % 4 !== 3) gala_entries.push({ gala_id: g, player_id: p.id, response: (i + j) % 7 === 0 ? 'no' : (i + j) % 5 === 0 ? 'maybe' : 'yes' }) })
})

const P = (id, audience, title, body, extra = {}) => ({ id, audience, title, body, team_id: null, pinned: false, author_name: 'Dan Florisson', created_at: '2026-12-05T09:00:00Z', ...extra })
export const posts = [
  P('n1', 'public', '2027 registrations are open', 'Registrations for the 2027 season are now open for kids born 2014–2022. Sign in, add your child and the committee will confirm their squad. Come n Try day date TBA – bring a friend!', { pinned: true, author_id: null, author_name: null, created_at: '2026-12-01T09:00:00Z' }),
  P('n2', 'public', '2027 AGM – date TBA', 'All families welcome. We need volunteers for several committee roles – see About us for what is open.', { created_at: '2026-12-03T09:00:00Z' }),
  P('m1', 'members', 'Volunteers for the first home gala', 'We need 6 helpers for 16 May: 2 on the BBQ, 2 on canteen, 2 on pack-up. Reply here if you can help.', { author_name: 'Club Secretary', created_at: '2027-04-20T09:00:00Z' }),
  P('m2', 'team', 'U9 Red – training this week', 'Training is on as normal Wednesday. We will practise throw-ins and goal kicks. Please bring a full water bottle – it will be warm.', { team_id: 't9r', author_name: 'Sample coach (U9 Red)', created_at: '2027-04-27T09:00:00Z' }),
  P('c1', 'coaches', 'Pre-gala reminder – Mini-Roos rules', 'Reminder of the rough-play protocol agreed at the Alpine region meeting: send off for a short time, then back on in the spirit of the game; second time off for the match.', { created_at: '2027-05-01T09:00:00Z' }),
  P('k1', 'committee', 'FV renewal submitted', 'Football Victoria 2027 club renewal is in. Next: book Les Peart Oval for Come n Try.', { created_at: '2026-12-20T09:00:00Z' }),
]
posts.forEach((p) => { p.reply_count = p.reply_count ?? 0; p.last_activity_at = p.last_activity_at || p.created_at; if (p.author_name === undefined) p.author_name = 'Dan Florisson' })
posts.find((p) => p.id === 'm1').reply_count = 2
posts.find((p) => p.id === 'm1').last_activity_at = '2027-04-21T10:00:00Z'
export const replies = [
  { id: 'r1', post_id: 'm1', author_name: 'Jo Kiewa', body: 'I can do the BBQ 9–11.', created_at: '2027-04-21T09:00:00Z' },
  { id: 'r2', post_id: 'm1', author_name: 'Alex Bogong', body: 'Happy to help pack up.', created_at: '2027-04-21T10:00:00Z' },
  { id: 'r3', post_id: 'm1', parent_id: 'r1', author_name: 'Club Secretary', body: 'Thanks Jo – you are on the BBQ roster. Can you bring tongs? @Sam Parker could you do canteen?', created_at: '2027-04-21T11:00:00Z' },
  { id: 'r4', post_id: 'm1', parent_id: 'r3', author_name: 'Jo Kiewa', body: 'Yep, will bring two pairs.', created_at: '2027-04-21T12:00:00Z' },
]

const D = (i, title, url, category, audience, notes = null) => ({ id: 'd' + i, title, url, category, audience, notes })
export const documents = [
  D(1, 'PlayFootball – MiniRoos formats, rules and registration', 'https://www.playfootball.com.au/', 'Football Victoria', 'public'),
  D(2, 'Football Victoria – club members hub', 'https://footballvictoria.com.au/members', 'Football Victoria', 'public'),
  D(3, 'Annual Club Membership Criteria 2026', 'https://footballvictoria.com.au/sites/ffv/files/2026-10/FV_AnnualClubMembership_Criteria_2026.pdf', 'Football Victoria', 'committee', 'What the club must meet to play in 2027'),
  D(4, 'Membership renewal checklist 2026', 'https://footballvictoria.com.au/sites/ffv/files/2026-10/FV_AnnualClubMembershipApplication_Checklist_Renewal_2026.pdf', 'Football Victoria', 'committee', 'Contacts and documents needed for the renewal form'),
  D(5, 'FV annual membership renewal form (due 31 Dec)', 'https://form.jotform.com/262836043186864', 'Football Victoria', 'committee', 'Action needed by 31 December'),
  D(6, 'Community Coach Agreement template (PDF)', 'https://footballvictoria.com.au/sites/ffv/files/2026-10/CommunityCoachAgreement_Template.pdf', 'Football Victoria', 'coaches', 'For volunteer coaches'),
  D(7, 'Parent welcome letter 2027', '#', 'Families', 'members'),
  D(8, 'Club Operations Doc (legacy spreadsheet)', '#', 'Committee', 'committee'),
]

const R = (grp, role, person, notes, i) => ({ id: 'cr' + i, season: 2027, grp, role, person, notes, sort_order: i })
export const committee_roles = [
  R('Executive', 'President', 'Dan Florisson', null, 0), R('Executive', 'Vice President', null, null, 1),
  R('Executive', 'Secretary', 'Amy Robertson', 'Taking over from Amanda Harvey (2025–26)', 2),
  R('Executive', 'Treasurer', 'Nathan Roberts', 'Staying on until a new treasurer is found – could this be you?', 3),
  R('General committee', 'General committee member', 'Amanda Harvey', 'Outgoing secretary – supporting the handover', 10),
  R('General committee', 'General committee member', 'Rachelle Potts', null, 11), R('General committee', 'General committee member', null, null, 12),
  R('Football Victoria contacts', 'Primary FV Contact', null, 'Receives all FV communications', 20), R('Football Victoria contacts', 'Secondary FV Contact', null, null, 21),
  R('Football Victoria contacts', 'Game Day Contact', null, 'Published on the FV website for other clubs', 22),
  R('Football Victoria contacts', 'Member Protection Information Officer (MPIO)', null, 'First point of contact for member protection concerns', 23),
  R('Football Victoria contacts', 'Authorised Club Delegate', null, 'Represents the club at the FV AGM', 24),
  R('Football Victoria contacts', 'PlayFootball registration administrators', 'Dan, Amy, Nathan, Amanda', 'Submitted to FV for 2027; WWCC required', 25),
  ...['Child Safety Officer', 'Coaches Coordinator', 'Gala Coordinator (Alpine Valleys)', 'Uniforms & Equipment', 'Grants & Sponsorship', 'Communications (email / Facebook / website)', 'Field marking', 'Come n Try day'].map((r, i) => R('Club volunteer roles', r, null, null, 30 + i)),
]
export const settings = [
  { key: 'require_2fa', label: 'Two-factor sign-in (type on or off)', value: 'off' },
  { id: 's1', key: 'fees', label: 'Season fee', value: 'TBA – 2027 fees will be confirmed by the committee. (2026: $55 per player.)' },
  { id: 's2', key: 'payment', label: 'How to pay', value: "Registration and payment are completed online through Football Victoria's PlayFootball system. The club will email the 2027 registration link once it opens." },
  { id: 's3', key: 'agm', label: 'AGM date', value: 'TBA' },
  { id: 's4', key: 'come_n_try', label: 'Come n Try day', value: 'TBA' },
  { id: 's5', key: 'boots_bond', label: 'Boots bond (refundable)', value: 'TBA' },
  { id: 's6', key: 'uniform_bond_charge', label: 'Uniform bond – amount charged online ($, numbers only)', value: '45' },
  { id: 's6b', key: 'uniform_bond_refund', label: 'Uniform bond – amount refunded when returned ($, blank = full amount)', value: '43' },
]

const K = (t, o, n, c, s = 'todo', due = null) => ({ id: 'tk' + t.length + o.length, season: 2027, title: t, owner: o, notes: n, category: c, status: s, due })
export const tasks = [
  K('Football Victoria 2027 club renewal form', 'Dan', 'Due 31 Dec 2026.', 'Compliance', 'done', '2026-12-31'),
  K('Plan 2027 AGM – date and advertising', 'Dan', 'AGM 24 Feb.', 'Committee', 'doing', '2027-02-24'),
  K('Come n Try day 2027', 'Secretary', 'Book Les Peart Oval, flyers to community and schools.', 'Season', 'todo', '2027-03-10'),
  K('New ball order', 'Equipment', 'Size 3 for U5–U9, more size 4.', 'Equipment', 'todo', '2027-03-01'),
  K('2027 gala fixture with Alpine Valleys clubs', 'Dan', 'Confirm whether Myrtleford and Yackandandah stay in after the FNSW change.', 'Galas', 'doing', '2027-02-15'),
  K('New "Wildfires" uniforms', 'Committee', 'VS Wear quote: 100 jerseys at $33 ex GST. Need club and sponsor logos.', 'Uniforms', 'todo', '2027-03-15'),
  K('Confirm coaches for every squad', 'President / Secretary', 'Head + assistant per squad.', 'Coaching', 'todo', '2027-03-20'),
]

// Preseason sections for the sample actions (in order above)
;['plan', 'plan', 'register', 'teams', 'plan', 'teams', 'teams'].forEach((st, i) => { tasks[i].stage = st; tasks[i].sort = i })
tasks.push(
  { id: 'ps1', season: 2027, stage: 'register', sort: 1, title: 'Set 2027 fees in PlayFootball and open registrations', owner: 'Secretary', status: 'todo', category: 'Registrations' },
  { id: 'ps2', season: 2027, stage: 'register', sort: 5, title: 'Approve player registrations weekly', owner: 'Executive', status: 'doing', category: 'Registrations', link: '/committee/approvals' },
  { id: 'ps3', season: 2027, stage: 'people', sort: 1, title: 'Call-out for coaches, assistant coaches and gala helpers', owner: 'President', status: 'todo', category: 'Volunteers', notes: 'Aim for a head coach and an assistant per team.' },
  { id: 'ps4', season: 2027, stage: 'people', sort: 2, title: 'Every coach and volunteer: website account, WWCC checked and connected, approved', owner: 'Executive', status: 'todo', category: 'Child safety', link: '/committee/wwcc' },
  { id: 'ps5', season: 2027, stage: 'ready', sort: 1, title: 'Uniform handout day and bonds collected', owner: 'Uniforms', status: 'todo', category: 'Uniforms', link: '/committee/kit' },
  { id: 'ps6', season: 2027, stage: 'gala', sort: 1, title: 'Submit team entries to each host club', owner: 'Secretary', status: 'todo', category: 'Galas', link: '/committee/galas' },
)
tasks.forEach((t) => { t.owner = /^coach/i.test(t.owner || '') ? 'Coaches' : ['Committee', 'Equipment', 'Uniforms'].includes(t.owner) ? 'Committee' : 'Exec' })
export const key_dates = [
  { id: 'kd1', season: 2027, label: 'AGM', on_date: '2027-02-24', sort: 1, public: false },
  { id: 'kd2', season: 2027, label: 'Registrations open', on_date: '2027-02-01', sort: 2, notes: 'Website + PlayFootball' },
  { id: 'kd3', season: 2027, label: 'Come n Try day', on_date: '2027-03-10', sort: 3 },
  { id: 'kd4', season: 2027, label: 'Registrations close', on_date: null, sort: 4 },
  { id: 'kd5', season: 2027, label: 'First training', on_date: '2027-04-21', sort: 5, notes: 'Les Peart Oval' },
  { id: 'kd6', season: 2027, label: 'First gala', on_date: null, sort: 6 },
]

export const kit = Array.from({ length: 40 }, (_, i) => {
  if (i === 39) return { id: 'k39', jersey_label: 'R12', jersey_number: 12, size: '10', kit_bag: '43', holder_name: 'Mia Parker', player_id: 'kid1', status: 'Loaned Out', shin_guard: 'S', boots_on_loan: false, registration_paid: true, notes: '', sort_order: 39, season: 2027, bond_paid: true, bond_refunded: false }
  const p = players[(i * 2) % players.length]
  const out = i % 3 !== 0
  return { id: 'k' + i, jersey_label: String(i + 1), jersey_number: i + 1, size: ['6', '8', '10', '12', '14'][Math.floor(i / 8)], kit_bag: out ? String(10 + i) : '', holder_name: out ? `${p.first_name} ${p.last_name}` : '', status: out ? 'Loaned Out' : 'Shed Tub', shin_guard: out ? 'S' : '', boots_on_loan: i % 5 === 0, registration_paid: out && i % 4 !== 1, notes: '', sort_order: i, season: 2026, bond_paid: out && i % 4 !== 1, bond_refunded: false }
})

// Sample WWCC records and volunteer applications (made up)
const CARD = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="420" height="260"><rect width="420" height="260" rx="16" fill="#e8f0fc"/><text x="24" y="50" font-family="Arial" font-size="20" font-weight="700" fill="#1a4a8a">Working with Children Check</text><text x="24" y="90" font-family="Arial" font-size="16">SAMPLE CARD – DEMO ONLY</text><text x="24" y="130" font-family="Arial" font-size="16">Card no. 01234567A-01</text><text x="24" y="160" font-family="Arial" font-size="16">Volunteer · expires 2029</text></svg>')
export const wwcc = [
  { profile_id: 'u-coach', card_number: '07654321A-01', expiry: '2029-03-01', card_type: 'Volunteer', file_path: CARD, status_checked_at: '2026-12-01T00:00:00Z', wwc_connected_at: '2026-12-01T00:00:00Z' },
  { profile_id: 'u-p2', card_number: '01234567A-01', expiry: '2029-06-30', card_type: 'Volunteer', file_path: CARD, status_checked_at: null, wwc_connected_at: null },
  { profile_id: 'u-treas', card_number: '05555556A-01', expiry: '2028-03-01', card_type: 'Volunteer', file_path: CARD, status_checked_at: '2026-11-25T00:00:00Z', wwc_connected_at: '2026-11-25T00:00:00Z' },
  { profile_id: 'u-admin', card_number: '05555555A-02', expiry: '2027-01-10', card_type: 'Employee', file_path: CARD, status_checked_at: '2026-11-25T00:00:00Z', wwc_connected_at: '2026-11-25T00:00:00Z' },
]
export const volunteer_roles = [
  { id: 'vr1', profile_id: 'u-p2', season: 2027, kind: 'coach', team_id: 't7', detail: 'Happy to assist with Under 7s on Wednesdays', status: 'pending', created_at: '2026-12-05T00:00:00Z' },
  { id: 'vr2', profile_id: 'u-p3', season: 2027, kind: 'volunteer', team_id: null, detail: 'Gala day BBQ', status: 'pending', created_at: '2026-12-06T00:00:00Z' },
  { id: 'vr3', profile_id: 'u-coach', season: 2027, kind: 'coach', team_id: 't9r', detail: '', status: 'approved', created_at: '2026-11-30T00:00:00Z' },
]

export const guardian_invites = [
  { id: 'gi1', player_id: 'kid1', email: 'chris.parker@example.com', name: 'Chris Parker', relationship: 'Dad', invited_by: 'u-parent', approved: false, created_at: '2026-12-07T00:00:00Z' },
]
export const player_private = []
export const audit_log = [
  { id: 1, at: '2026-12-01T09:12:00Z', actor_name: 'Dan Florisson', tbl: 'volunteer_roles', action: 'update', changes: { status: { from: 'pending', to: 'approved' } } },
  { id: 2, at: '2026-12-01T09:10:00Z', actor_name: 'Dan Florisson', tbl: 'wwcc', action: 'update', changes: { status_checked_at: { from: null, to: '2026-12-01' }, wwc_connected_at: { from: null, to: '2026-12-01' } } },
  { id: 3, at: '2026-11-30T20:05:00Z', actor_name: 'Club Secretary', tbl: 'players', action: 'update', changes: { status: { from: 'pending', to: 'approved' } } },
]
export const gala_jobs = [
  { id: 'j1', gala_id: 'g1', job: 'Set-up & line marking', time_slot: 'Sat afternoon', slots: 3, sort_order: 0 },
  { id: 'j2', gala_id: 'g1', job: 'BBQ', time_slot: '8:30–10:30am', slots: 2, sort_order: 1 },
  { id: 'j3', gala_id: 'g1', job: 'Canteen', time_slot: '8:30–10:30am', slots: 2, sort_order: 2 },
  { id: 'j4', gala_id: 'g1', job: 'Pack-up', time_slot: 'After last game', slots: 4, sort_order: 3 },
]
export const gala_job_signups = [
  { job_id: 'j1', profile_id: 'u-coach', display_name: 'Sample coach (U9 Red)' },
  { job_id: 'j2', profile_id: 'u-admin', display_name: 'Dan Florisson' },
]

const FS = (id, sort, name, provider, kind, typical_amount, timing, fit, link, notes = null) => ({ id, sort, name, provider, kind, typical_amount, timing, fit, link, notes, active: true })
export const funding_sources = [
  FS('fs1', 10, 'Sporting Club Grants Program', 'Sport and Recreation Victoria', 'grant', 'Up to $1,000 uniforms & equipment; up to $5,000 volunteers, coaches & officials; $750 travel', 'Two rounds a year. 2026-27 Round 2 opens 18 Feb 2027.', 'Strong – new kit, loan boots, balls, first aid, coach courses, volunteer training.', 'https://sport.vic.gov.au/funding/sporting-club-grants-program', 'Clubs that received a grant in categories 1, 2, 3 or 5 in the previous year may be ineligible for the next round – check the guidelines.'),
  FS('fs2', 20, 'Community Grants Program', 'Alpine Shire Council', 'grant', 'Projects typically $1,500–$10,000', 'Opens May each year. Apply via SmartyGrants.', 'Good – equipment storage, goals, participation projects.', 'https://www.alpineshire.vic.gov.au/community/grants-and-awards/community-grants', 'Council also runs a separate Event Funding Program – worth a look for the home gala day.'),
  FS('fs3', 30, 'AGL Hydro Community Fund', 'AGL (Kiewa Hydro Scheme)', 'grant', 'Guide up to $5,000', 'Twice a year – April and October.', 'Strong – specifically for groups around Mount Beauty, Tawonga, Bogong and Falls Creek.', 'https://www.agl.com.au/about-agl/operations/hydroelectric-power-stations/community'),
  FS('fs4', 40, 'Mount Beauty & District Community Bank', 'Bendigo Bank', 'sponsorship', 'Varies', 'Ask the branch about their current round.', 'Good – local sponsorship of kit, gala day or equipment.', 'https://www.bendigobank.com.au/community/foundation/community-grants'),
  FS('fs5', 50, 'Growing Football Community Grants', 'Football Australia (with CommBank)', 'grant', 'Up to $5,000 (ex GST)', 'Annual – last round Sep–Oct 2026.', 'Good if framed around girls in football.', 'https://www.footballaustralia.com.au/community-grants'),
  FS('fs9', 90, 'Local business sponsors', 'Mount Beauty / Kiewa Valley businesses', 'sponsorship', 'Typically $250–$2,000 or in kind', 'Any time – best before kit orders.', 'Strong – logo on shirts/banners in exchange for cash or in-kind.', null),
]
export const funding = [
  { id: 'fu3', season: 2027, kind: 'grant', title: 'Coach courses and first aid kits (sample)', funder: 'AGL Hydro Community Fund', status: 'successful', amount_requested: 2500, amount_awarded: 2000, applied_on: '2027-04-10', acquittal_due: '2027-12-01', purpose: 'MiniRoos coaching courses for 4 parents, 2 first aid kits', obligations: 'Acknowledge AGL on website; photos and receipts for acquittal', source_id: 'fs3', created_at: '2027-04-10' },
  { id: 'fu4', season: 2027, kind: 'grant', title: 'Portable goals (sample)', funder: 'Alpine Shire Council', status: 'preparing', amount_requested: 3500, outcome_due: '2027-06-21', purpose: 'Two sets of pop-up goals for U7/U9', source_id: 'fs2', created_at: '2027-05-12' },
  { id: 'fu5', season: 2027, kind: 'sponsorship', title: 'Sample Hardware (sample)', status: 'successful', amount_requested: 1000, amount_awarded: 1000, obligations: 'Logo on shorts, banner at home galas', acquittal_due: '2028-02-01', created_at: '2027-02-15' },
  { id: 'fu6', season: 2027, kind: 'fundraiser', title: 'Home gala BBQ (sample)', status: 'received', amount_received: 640, received_on: '2027-05-16', in_kind: 'Sausages donated by local butcher', created_at: '2027-05-16' },
  { id: 'fu1', season: 2027, kind: 'grant', title: 'New goals and balls for U7s (sample)', funder: 'Sport and Recreation Victoria', status: 'submitted', amount_requested: 1000, applied_on: '2027-03-01', outcome_due: '2027-06-30', purpose: 'Pop-up goals and size 3 balls', source_id: 'fs1', created_at: '2027-03-01' },
  { id: 'fu2', season: 2027, kind: 'sponsorship', title: 'Sample Bakery (sample)', status: 'received', amount_awarded: 750, amount_received: 750, received_on: '2027-02-10', obligations: 'Logo on jersey sleeve, banner at home gala', acquittal_due: '2028-02-01', created_at: '2027-02-01' },
]

export const payments = []

export const gala_results = [{"id": "gr0", "gala_id": "g0a", "age_group": "Under 6", "team": null, "opponent": "Bright SC", "score": "8–1", "outcome": "win", "sort": 1}, {"id": "gr1", "gala_id": "g0a", "age_group": "Under 6", "team": null, "opponent": "Bright SC", "score": "11–1", "outcome": "win", "sort": 2}, {"id": "gr2", "gala_id": "g0a", "age_group": "Under 7", "team": null, "opponent": "Bright SC Black", "score": "6–1", "outcome": "win", "sort": 3}, {"id": "gr3", "gala_id": "g0a", "age_group": "Under 7", "team": null, "opponent": "Myrtleford SC", "score": "2–3", "outcome": "loss", "sort": 4}, {"id": "gr4", "gala_id": "g0a", "age_group": "Under 7", "team": null, "opponent": "Bright SC White", "score": "6–0/1", "outcome": "win", "sort": 5}, {"id": "gr5", "gala_id": "g0a", "age_group": "Under 9", "team": "Red", "opponent": null, "score": "2–0", "outcome": "win", "sort": 6}, {"id": "gr6", "gala_id": "g0a", "age_group": "Under 9", "team": "Red", "opponent": "Bright SC", "score": "4–0", "outcome": "win", "sort": 7}, {"id": "gr7", "gala_id": "g0a", "age_group": "Under 9", "team": "Red", "opponent": "Mt Beauty Green", "score": "1–4", "outcome": "loss", "sort": 8}, {"id": "gr8", "gala_id": "g0a", "age_group": "Under 9", "team": "Green", "opponent": "Myrtleford SC", "score": "0–4", "outcome": "loss", "sort": 9}, {"id": "gr9", "gala_id": "g0a", "age_group": "Under 9", "team": "Green", "opponent": "Bright SC", "score": "1–1", "outcome": "draw", "sort": 10}, {"id": "gr10", "gala_id": "g0a", "age_group": "Under 9", "team": "Green", "opponent": "Mt Beauty Red", "score": "4–1", "outcome": "win", "sort": 11}, {"id": "gr11", "gala_id": "g0a", "age_group": "Under 11", "team": "Red", "opponent": "Mt Beauty Green", "score": "2–1", "outcome": "win", "sort": 12}, {"id": "gr12", "gala_id": "g0a", "age_group": "Under 11", "team": "Red", "opponent": "Yackandandah FC", "score": "2–2", "outcome": "draw", "sort": 13}, {"id": "gr13", "gala_id": "g0a", "age_group": "Under 11", "team": "Red", "opponent": "Bright SC", "score": "4–1", "outcome": "win", "sort": 14}, {"id": "gr14", "gala_id": "g0a", "age_group": "Under 11", "team": "Green", "opponent": "Bright SC", "score": "2–3", "outcome": "loss", "sort": 15}, {"id": "gr15", "gala_id": "g0a", "age_group": "Under 11", "team": "Green", "opponent": "Yackandandah FC", "score": "2–2", "outcome": "draw", "sort": 16}, {"id": "gr16", "gala_id": "g0a", "age_group": "Under 11", "team": "Green", "opponent": "Mt Beauty Red", "score": "1–2", "outcome": "loss", "sort": 17}, {"id": "gr17", "gala_id": "g0a", "age_group": "Under 13", "team": null, "opponent": "Bright SC Red U12", "score": "1–1", "outcome": "draw", "sort": 18}, {"id": "gr18", "gala_id": "g0a", "age_group": "Under 13", "team": null, "opponent": "Bright SC Black U13", "score": "1–5", "outcome": "loss", "sort": 19}, {"id": "gr19", "gala_id": "g0b", "age_group": "Under 7", "team": "Red", "opponent": "Myrtleford Blue", "score": "2–2", "outcome": "draw", "sort": 1}, {"id": "gr20", "gala_id": "g0b", "age_group": "Under 7", "team": "Red", "opponent": "Bright Black", "score": "1–6", "outcome": "loss", "sort": 2}, {"id": "gr21", "gala_id": "g0b", "age_group": "Under 7", "team": "Red", "opponent": "Bright Red", "score": "4–3", "outcome": "win", "sort": 3}, {"id": "gr22", "gala_id": "g0b", "age_group": "Under 7", "team": "Green", "opponent": "Myrtleford U6", "score": "3–5", "outcome": "loss", "sort": 4}, {"id": "gr23", "gala_id": "g0b", "age_group": "Under 7", "team": "Green", "opponent": "Myrtleford White", "score": "2–7", "outcome": "loss", "sort": 5}, {"id": "gr24", "gala_id": "g0b", "age_group": "Under 9", "team": "Red", "opponent": "Yackandandah", "score": "7–1", "outcome": "win", "sort": 6}, {"id": "gr25", "gala_id": "g0b", "age_group": "Under 9", "team": "Red", "opponent": "Myrtleford", "score": "1–1", "outcome": "draw", "sort": 7}, {"id": "gr26", "gala_id": "g0b", "age_group": "Under 9", "team": "Red", "opponent": "Bright Red", "score": "1–2", "outcome": "loss", "sort": 8}, {"id": "gr27", "gala_id": "g0b", "age_group": "Under 9", "team": "Green", "opponent": null, "score": "3–0", "outcome": "win", "sort": 9}, {"id": "gr28", "gala_id": "g0b", "age_group": "Under 9", "team": "Green", "opponent": "Bright", "score": "4–0", "outcome": "win", "sort": 10}, {"id": "gr29", "gala_id": "g0b", "age_group": "Under 11", "team": "Red", "opponent": "Myrtleford", "score": "2–3", "outcome": "loss", "sort": 11}, {"id": "gr30", "gala_id": "g0b", "age_group": "Under 11", "team": "Red", "opponent": "Myrtleford Blue", "score": "2–3", "outcome": "loss", "sort": 12}, {"id": "gr31", "gala_id": "g0b", "age_group": "Under 11", "team": "Red", "opponent": "Myrtleford Red", "score": "1–8", "outcome": "loss", "sort": 13}, {"id": "gr32", "gala_id": "g0b", "age_group": "Under 11", "team": "Green", "opponent": "Myrtleford Red", "score": "1–3", "outcome": "loss", "sort": 14}, {"id": "gr33", "gala_id": "g0b", "age_group": "Under 11", "team": "Green", "opponent": "Bright", "score": "0–3", "outcome": "loss", "sort": 15}, {"id": "gr34", "gala_id": "g0b", "age_group": "Under 11", "team": "Green", "opponent": "Myrtleford", "score": "0–4", "outcome": "loss", "sort": 16}, {"id": "gr35", "gala_id": "g0b", "age_group": "Under 13", "team": null, "opponent": null, "score": "0–6", "outcome": "loss", "sort": 17}, {"id": "gr36", "gala_id": "g0b", "age_group": "Under 13", "team": null, "opponent": "Bright", "score": "1–1", "outcome": "draw", "sort": 18}, {"id": "gr37", "gala_id": "g0c", "age_group": "Under 7", "team": "Red", "opponent": "Myrtleford White", "score": "4–1", "outcome": "win", "sort": 1}, {"id": "gr38", "gala_id": "g0c", "age_group": "Under 7", "team": "Red", "opponent": "Bright Black", "score": "5–2", "outcome": "win", "sort": 2}, {"id": "gr39", "gala_id": "g0c", "age_group": "Under 7", "team": "Green", "opponent": "Myrtleford Blue", "score": "0–3", "outcome": "loss", "sort": 3}, {"id": "gr40", "gala_id": "g0c", "age_group": "Under 7", "team": "Green", "opponent": "Bright Black", "score": "4–4", "outcome": "draw", "sort": 4}, {"id": "gr41", "gala_id": "g0c", "age_group": "Under 7", "team": "Green", "opponent": "Bright", "score": "5–0", "outcome": "win", "sort": 5}, {"id": "gr42", "gala_id": "g0c", "age_group": "Under 7", "team": "Blue", "opponent": null, "score": "1–8", "outcome": "loss", "sort": 6}, {"id": "gr43", "gala_id": "g0c", "age_group": "Under 7", "team": "Blue", "opponent": null, "score": "2–1", "outcome": "win", "sort": 7}, {"id": "gr44", "gala_id": "g0c", "age_group": "Under 9", "team": "Red", "opponent": null, "score": null, "outcome": "win", "sort": 8}, {"id": "gr45", "gala_id": "g0c", "age_group": "Under 9", "team": "Green", "opponent": "Yackandandah", "score": "2–0", "outcome": "win", "sort": 9}, {"id": "gr46", "gala_id": "g0c", "age_group": "Under 9", "team": "Green", "opponent": "Bright", "score": "6–0", "outcome": "win", "sort": 10}, {"id": "gr47", "gala_id": "g0c", "age_group": "Under 11", "team": "Red", "opponent": "Mt Beauty Green", "score": "3–3", "outcome": "draw", "sort": 11}, {"id": "gr48", "gala_id": "g0c", "age_group": "Under 11", "team": "Red", "opponent": "Yackandandah", "score": "2–2", "outcome": "draw", "sort": 12}, {"id": "gr49", "gala_id": "g0c", "age_group": "Under 11", "team": "Red", "opponent": "Bright", "score": "2–1", "outcome": "win", "sort": 13}, {"id": "gr50", "gala_id": "g0c", "age_group": "Under 11", "team": "Green", "opponent": "Yackandandah", "score": "1–1", "outcome": "draw", "sort": 14}, {"id": "gr51", "gala_id": "g0c", "age_group": "Under 11", "team": "Green", "opponent": "Bright", "score": "2–2", "outcome": "draw", "sort": 15}, {"id": "gr52", "gala_id": "g0c", "age_group": "Under 11", "team": "Green", "opponent": "Mt Beauty Red", "score": "3–3", "outcome": "draw", "sort": 16}, {"id": "gr53", "gala_id": "g0c", "age_group": "Under 13", "team": null, "opponent": "Bright Red", "score": "0–1", "outcome": "loss", "sort": 17}, {"id": "gr54", "gala_id": "g0c", "age_group": "Under 13", "team": null, "opponent": "Bright Black", "score": "0–0", "outcome": "draw", "sort": 18}, {"id": "gr55", "gala_id": "g0d", "age_group": "Under 7", "team": "Red", "opponent": "Bright Black", "score": "3–2", "outcome": "win", "sort": 1}, {"id": "gr56", "gala_id": "g0d", "age_group": "Under 7", "team": "Red", "opponent": "Myrtleford White", "score": "0–2", "outcome": "loss", "sort": 2}, {"id": "gr57", "gala_id": "g0d", "age_group": "Under 7", "team": "Red", "opponent": "Bright White", "score": "3–3", "outcome": "draw", "sort": 3}, {"id": "gr58", "gala_id": "g0d", "age_group": "Under 7", "team": "Green", "opponent": "Myrtleford White", "score": "0–7", "outcome": "loss", "sort": 4}, {"id": "gr59", "gala_id": "g0d", "age_group": "Under 7", "team": "Green", "opponent": "Myrtleford White", "score": "7–6", "outcome": "win", "sort": 5}, {"id": "gr60", "gala_id": "g0d", "age_group": "Under 7", "team": "Green", "opponent": "Bright", "score": "3–1", "outcome": "win", "sort": 6}, {"id": "gr61", "gala_id": "g0d", "age_group": "Under 7", "team": "Blue", "opponent": "Yackandandah", "score": "2–0", "outcome": "win", "sort": 7}, {"id": "gr62", "gala_id": "g0d", "age_group": "Under 7", "team": "Blue", "opponent": "Bright Red", "score": "0–1", "outcome": "loss", "sort": 8}, {"id": "gr63", "gala_id": "g0d", "age_group": "Under 7", "team": "Blue", "opponent": "Myrtleford Blue", "score": "1–1", "outcome": "draw", "sort": 9}, {"id": "gr64", "gala_id": "g0d", "age_group": "Under 9", "team": "Red", "opponent": "Bright White", "score": "3–0", "outcome": "win", "sort": 10}, {"id": "gr65", "gala_id": "g0d", "age_group": "Under 9", "team": "Red", "opponent": "Myrtleford Blue", "score": "0–4", "outcome": "loss", "sort": 11}, {"id": "gr66", "gala_id": "g0d", "age_group": "Under 9", "team": "Green", "opponent": "Bright Black", "score": "2–1", "outcome": "win", "sort": 12}, {"id": "gr67", "gala_id": "g0d", "age_group": "Under 9", "team": "Green", "opponent": "Bright Red", "score": "2–0", "outcome": "win", "sort": 13}, {"id": "gr68", "gala_id": "g0d", "age_group": "Under 9", "team": "Green", "opponent": "Bright Black", "score": "2–1", "outcome": "win", "sort": 14}, {"id": "gr69", "gala_id": "g0d", "age_group": "Under 11", "team": "Green", "opponent": "Myrtleford", "score": "1–0", "outcome": "win", "sort": 15}, {"id": "gr70", "gala_id": "g0d", "age_group": "Under 11", "team": "Green", "opponent": "Myrtleford White", "score": "6–3", "outcome": "win", "sort": 16}, {"id": "gr71", "gala_id": "g0d", "age_group": "Under 11", "team": "Green", "opponent": "Bright", "score": "0–2", "outcome": "loss", "sort": 17}, {"id": "gr72", "gala_id": "g0d", "age_group": "Under 11", "team": "Red", "opponent": "Yackandandah", "score": "0–4", "outcome": "loss", "sort": 18}, {"id": "gr73", "gala_id": "g0d", "age_group": "Under 11", "team": "Red", "opponent": "Myrtleford White", "score": "3–2", "outcome": "win", "sort": 19}, {"id": "gr74", "gala_id": "g0d", "age_group": "Under 11", "team": "Red", "opponent": "Myrtleford Blue", "score": "0–2", "outcome": "loss", "sort": 20}, {"id": "gr75", "gala_id": "g0d", "age_group": "Under 13", "team": null, "opponent": "Bright Red", "score": "2–2", "outcome": "draw", "sort": 21}, {"id": "gr76", "gala_id": "g0d", "age_group": "Under 13", "team": null, "opponent": "Bright Black", "score": "2–4", "outcome": "loss", "sort": 22}, {"id": "gr77", "gala_id": "g0d", "age_group": "Under 13", "team": null, "opponent": "Bright Red", "score": "1–0", "outcome": "win", "sort": 23}, {"id": "gr78", "gala_id": "g0e", "age_group": "Under 7", "team": "Red", "opponent": "Bright Black", "score": "4–2", "outcome": "win", "sort": 1}, {"id": "gr79", "gala_id": "g0e", "age_group": "Under 7", "team": "Red", "opponent": "Myrtleford White", "score": "4–2", "outcome": "win", "sort": 2}, {"id": "gr80", "gala_id": "g0e", "age_group": "Under 7", "team": "Red", "opponent": "Yackandandah", "score": "3–0", "outcome": "win", "sort": 3}, {"id": "gr81", "gala_id": "g0e", "age_group": "Under 7", "team": "Blue", "opponent": "Bright Red", "score": "1–1", "outcome": "draw", "sort": 4}, {"id": "gr82", "gala_id": "g0e", "age_group": "Under 7", "team": "Blue", "opponent": "Bright White", "score": "1–1", "outcome": "draw", "sort": 5}, {"id": "gr83", "gala_id": "g0e", "age_group": "Under 7", "team": "Blue", "opponent": "Mt Beauty Green", "score": null, "outcome": "loss", "sort": 6}, {"id": "gr84", "gala_id": "g0e", "age_group": "Under 7", "team": "Green", "opponent": "Myrtleford White", "score": null, "outcome": "pending", "sort": 7}, {"id": "gr85", "gala_id": "g0e", "age_group": "Under 7", "team": "Green", "opponent": "Myrtleford Green", "score": null, "outcome": "pending", "sort": 8}, {"id": "gr86", "gala_id": "g0e", "age_group": "Under 7", "team": "Green", "opponent": "Bright Red", "score": null, "outcome": "pending", "sort": 9}, {"id": "gr87", "gala_id": "g0e", "age_group": "Under 9", "team": "Red", "opponent": "Bright Black", "score": null, "outcome": "loss", "sort": 10}, {"id": "gr88", "gala_id": "g0e", "age_group": "Under 9", "team": "Red", "opponent": "Myrtleford White", "score": null, "outcome": "loss", "sort": 11}, {"id": "gr89", "gala_id": "g0e", "age_group": "Under 9", "team": "Red", "opponent": "Bright Red", "score": null, "outcome": "loss", "sort": 12}, {"id": "gr90", "gala_id": "g0e", "age_group": "Under 9", "team": "Green", "opponent": "Myrtleford White", "score": null, "outcome": "loss", "sort": 13}, {"id": "gr91", "gala_id": "g0e", "age_group": "Under 9", "team": "Green", "opponent": "Myrtleford", "score": null, "outcome": "loss", "sort": 14}, {"id": "gr92", "gala_id": "g0e", "age_group": "Under 9", "team": "Green", "opponent": "Myrtleford", "score": null, "outcome": "loss", "sort": 15}, {"id": "gr93", "gala_id": "g0e", "age_group": "Under 11", "team": "Red", "opponent": "Mt Beauty Green", "score": "2–0", "outcome": "win", "sort": 16}, {"id": "gr94", "gala_id": "g0e", "age_group": "Under 11", "team": "Red", "opponent": "Myrtleford", "score": "1–1", "outcome": "draw", "sort": 17}, {"id": "gr95", "gala_id": "g0e", "age_group": "Under 11", "team": "Red", "opponent": "Myrtleford", "score": "0–0", "outcome": "draw", "sort": 18}, {"id": "gr96", "gala_id": "g0e", "age_group": "Under 11", "team": "Red", "opponent": "Bright", "score": "0–0", "outcome": "draw", "sort": 19}, {"id": "gr97", "gala_id": "g0e", "age_group": "Under 11", "team": "Green", "opponent": "Myrtleford", "score": "0–0", "outcome": "draw", "sort": 20}, {"id": "gr98", "gala_id": "g0e", "age_group": "Under 11", "team": "Green", "opponent": "Mt Beauty Red", "score": "0–2", "outcome": "loss", "sort": 21}, {"id": "gr99", "gala_id": "g0e", "age_group": "Under 11", "team": "Green", "opponent": "Bright", "score": "1–4", "outcome": "loss", "sort": 22}, {"id": "gr100", "gala_id": "g0e", "age_group": "Under 11", "team": "Green", "opponent": "Myrtleford", "score": "1–3", "outcome": "loss", "sort": 23}, {"id": "gr101", "gala_id": "g0e", "age_group": "Under 13", "team": null, "opponent": "Bright Red", "score": "0–0", "outcome": "draw", "sort": 24}, {"id": "gr102", "gala_id": "g0e", "age_group": "Under 13", "team": null, "opponent": "Bright Black", "score": "1–0", "outcome": "win", "sort": 25}]
export const gala_result_details = [{ result_id: 'gr0', scorers: 'Sample player', highlight: null }, { result_id: 'gr13', scorers: 'Sample player x3', highlight: 'Hat-trick! (sample)' }]
export const season_awards = [{ id: 'aw1', season: 2026, award: 'Charles Oakley Award', recipients: 'Sample player', note: 'Sample data', sort: 1 }, { id: 'aw2', season: 2026, award: "Coach's Awards – U9", recipients: 'Sample player, Sample player', sort: 2 }]

export const keys = [
  { id: 'k1', key_no: 'C1', location: 'Container – Les Peart Oval', holder: 'Sample treasurer', issued: '2025', returned: false, notes: null, sort: 1 },
  { id: 'k2', key_no: 'C6', location: 'Container – Les Peart Oval', holder: 'President', issued: null, returned: false, notes: 'MASTER KEY', sort: 2 },
  { id: 'k3', key_no: 'M1', location: 'Main door – Mount Beauty Oval Pavilion', holder: 'Sample past president', issued: null, returned: false, notes: 'Don\'t give this one up', sort: 3 },
]
export const assets = [
  { id: 'a1', category: 'Goals', group_name: 'Goals & field', brand: 'Hart / Tor Sport', quantity: '20', sizes: 'U11/12 ×6 · U9 ×4 · U7 ×6 · U5/6 ×4', value: 'U11/12 goals $306.81 each', total_value: null, year: '2024–2025', condition: 'New', location: 'Container – Les Peart', action: null, notes: null, sort: 10 },
  { id: 'a2', category: 'Line marker kit', group_name: 'Goals & field', brand: 'Hart', quantity: '1', sizes: null, value: '$2,190.00', total_value: 2190, year: '2025', condition: 'New', location: 'Container – Les Peart', action: null, notes: null, sort: 11 },
  { id: 'a3', category: 'Balls', group_name: 'Balls & training', brand: null, quantity: null, sizes: 'Size 3 and size 4', value: null, total_value: null, year: '2024', condition: 'Needs replacing', location: null, action: 'Order new size 3 for U5–U9 before 2027', notes: null, sort: 20 },
  { id: 'a4', category: 'Bibs', group_name: 'Balls & training', brand: 'Hart', quantity: '2 sets', sizes: 'Junior · green', value: '$71.55 a set', total_value: 143.10, year: '2025', condition: 'New', location: null, action: null, notes: null, sort: 21 },
  { id: 'a5', category: 'Playing jerseys', group_name: 'Uniforms & kit', brand: null, quantity: '102', sizes: 'Youth 4 ×9, 6 ×16, 8 ×20, 10 ×24, 12 ×18, 14 ×9', value: '$1,390.40 incl. embroidery', total_value: 1390.40, year: '2023', condition: 'Good', location: null, action: 'Older sizes ran out in 2026 – new design being looked at', notes: null, sort: 1 },
  { id: 'a6', category: 'First aid kit', group_name: 'First aid & safety', brand: 'The First Aid Shop', quantity: '1', sizes: null, value: '$110 restock', total_value: 110, year: '2025', condition: null, location: null, action: 'Check and restock before the season', notes: null, sort: 30 },
]
export const contacts = [
  { id: 'c1', topic: 'Les Peart Oval booking', name: 'Sample contact', organisation: null, phone: '0400 000 000', email: 'sample@example.com', notes: 'Book training and galas early', sort: 1 },
  { id: 'c2', topic: 'Football Victoria', name: 'Sample RDC', organisation: 'Football Victoria – Regional Development Coordinator', phone: null, email: 'sample@example.com', notes: 'Coach the Coach sessions, Mini-Roos rules', sort: 2 },
]
export const club_notes = [
  { id: 'n1', category: 'Child safety', title: 'The President owns child safety', body: 'Every committee member and coach must be on PlayFootball with a current WWCC, checked in the status checker and connected in WWC Connect.', sort: 1 },
  { id: 'n2', category: 'League', title: 'Alpine Valleys league', body: 'Non-competitive Mini-Roos cooperative: no scores or ladders, maximum participation. Sharing players to balance teams is part of the culture.', sort: 2 },
]
export const wwcc_offline = [
  { id: 'wo1', season: 2026, last_name: 'Sample', first_name: 'Coach', card_number: '1234567A-01', card_type: 'Volunteer', expiry: '2029-01-01', club_role: 'Coach', email: null, phone: null, address: null, status_checked_at: null, wwc_connected_at: null, disconnected_at: null, confirmed_at: null, notes: 'Sample row' },
]

// Sample gala games for the Under 9 Red coach (gala 1). Scores and scorers are sample data.
export const gala_games = [
  { id: 'gg1', gala_id: 'g1', team_id: 't9r', kickoff: '9:00am', pitch: 'Pitch 2', opponent: 'Bright Red', our_score: 3, their_score: 1, sort: 0 },
  { id: 'gg2', gala_id: 'g1', team_id: 't9r', kickoff: '9:50am', pitch: 'Pitch 4', opponent: 'Myrtleford White', our_score: 2, their_score: 2, sort: 1 },
  { id: 'gg3', gala_id: 'g1', team_id: 't9r', kickoff: '10:40am', pitch: 'Pitch 2', opponent: 'Yackandandah', our_score: null, their_score: null, sort: 2 },
  { id: 'gg4', gala_id: 'g1', team_id: 't9g', kickoff: '9:25am', pitch: 'Pitch 3', opponent: 'Bright White', our_score: 1, their_score: 4, sort: 0 },
]
export const gala_goals = [
  { id: 'gl1', game_id: 'gg1', player_id: 'kid1', goals: 2 },
  { id: 'gl2', game_id: 'gg1', player_id: 'p16', goals: 1 },
  { id: 'gl3', game_id: 'gg2', player_id: 'p18', goals: 1 },
  { id: 'gl4', game_id: 'gg2', player_id: 'kid1', goals: 1 },
]

export const email_events = [
  { resend_id: 'e1', sent_at: '2026-11-27T09:12:00Z', to_addr: 'sample.parent@example.com', subject: '2027 registrations are open', kind: 'Club email', last_event: 'delivered' },
  { resend_id: 'e2', sent_at: '2026-11-27T09:12:00Z', to_addr: 'another.parent@example.com', subject: '2027 registrations are open', kind: 'Club email', last_event: 'sent' },
  { resend_id: 'e3', sent_at: '2026-11-26T22:40:00Z', to_addr: 'new.coach@example.com', subject: "You're invited to join Mount Beauty Football Club", kind: 'Invitation', last_event: 'opened' },
  { resend_id: 'e4', sent_at: '2026-11-26T21:05:00Z', to_addr: 'old.address@example.com', subject: 'Confirm your email', kind: 'Sign-up confirmation', last_event: 'bounced' },
  { resend_id: 'e5', sent_at: '2026-11-26T20:30:00Z', to_addr: 'volunteer@example.com', subject: "You're approved – Mount Beauty Football Club", kind: 'Approval email', last_event: 'delivered' },
]
export const thread_reads = []
export const forum_reactions = [{ id: 'fr1', post_id: 'm1', reply_id: null, profile_id: 'u-parent', emoji: '👍' }]
export const forum_prefs = []
export const forum_mentions = [{ id: 'fm1', post_id: 'm1', reply_id: 'r3', mentioned_id: 'u-parent', by_name: 'Club Secretary', created_at: '2027-04-21T11:00:00Z', seen_at: null }]
