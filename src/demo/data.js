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
      medical_notes: n % 9 === 4 ? 'Asthma – puffer in bag' : n % 13 === 6 ? 'Nut allergy (EpiPen)' : '', photo_consent: n % 7 !== 0, committee_notes: '', emergency_contact: '',
      created_at: '2026-12-01T09:00:00Z',
    })
    n++
  }
}
// The demo family: Sam Parker, two kids
players.push(
  { id: 'kid1', season: 2027, first_name: 'Mia', last_name: 'Parker', dob: '2018-08-14', gender: 'F', team_id: 't9r', status: 'approved', fv_registered: true, fees_paid: true, medical_notes: '', photo_consent: true, committee_notes: '', created_at: '2026-12-02T09:00:00Z' },
  { id: 'kid2', season: 2027, first_name: 'Leo', last_name: 'Parker', dob: '2021-03-02', gender: 'M', team_id: null, status: 'pending', fv_registered: false, fees_paid: false, medical_notes: 'Mild hay fever', photo_consent: true, committee_notes: '', created_at: '2026-12-02T09:05:00Z' },
)

export const profiles = [
  { id: 'u-parent', email: 'sam.parker@example.com', full_name: 'Sam Parker', phone: '0400 000 111', role: 'parent', created_at: '2026-12-02T09:00:00Z' },
  { id: 'u-coach', email: 'coach@example.com', full_name: 'Sample coach (U9 Red)', phone: '', role: 'coach', created_at: '2026-12-01T09:00:00Z' },
  { id: 'u-committee', email: 'secretary@example.com', full_name: 'Club Secretary', phone: '', role: 'committee', created_at: '2026-11-30T09:00:00Z' },
  { id: 'u-admin', email: 'danielflorisson@gmail.com', full_name: 'Dan Florisson', phone: '', role: 'admin', created_at: '2026-11-25T09:00:00Z' },
  { id: 'u-p2', email: 'jo.kiewa@example.com', full_name: 'Jo Kiewa', phone: '', role: 'parent', created_at: '2026-12-03T09:00:00Z' },
  { id: 'u-p3', email: 'alex.bogong@example.com', full_name: 'Alex Bogong', phone: '', role: 'parent', created_at: '2026-12-04T09:00:00Z' },
]
export const player_guardians = [{ player_id: 'kid1', profile_id: 'u-parent' }, { player_id: 'kid2', profile_id: 'u-parent' }]
export const team_coaches = [{ team_id: 't9r', profile_id: 'u-coach' }]

const G = (id, date, host, venue, address, extra = {}) => ({ id, season: 2027, gala_date: date, host_club: host + ' – sample date', venue, address, start_time: '9:00am', created_at: '', ...extra })
export const galas = [
  G('g1', '2027-05-16', 'Mt Beauty SC (home)', 'Les Peart Oval', 'Pool Road, Mt Beauty', { signup_closes: '2027-05-11', info: 'Home gala – we need parent helpers for the BBQ, canteen and pack-up. Arrive 8:30am for warm-up. Bring water, shin pads and a fruit snack.' }),
  G('g2', '2027-05-22', 'Myrtleford SC', 'Myrtleford Showgrounds', 'Myrtleford', { signup_closes: '2027-05-18' }),
  G('g3', '2027-05-30', 'Mt Beauty SC (home)', 'Les Peart Oval', 'Pool Road, Mt Beauty', { signup_closes: '2027-05-25' }),
  G('g4', '2027-06-13', 'Yackandandah FC', 'Yackandandah Recreation Reserve', 'Yackandandah', { signup_closes: '2027-06-08' }),
  G('g5', '2027-06-26', 'Bright SC', 'Bright Pioneer Park', 'Bright', { signup_closes: '2027-06-22' }),
  { id: 'g0a', season: 2026, gala_date: '2026-05-17', host_club: 'Mt Beauty SC', venue: 'Les Peart Oval' },
  { id: 'g0b', season: 2026, gala_date: '2026-05-23', host_club: 'Myrtleford SC', venue: 'Myrtleford' },
  { id: 'g0c', season: 2026, gala_date: '2026-05-31', host_club: 'Mt Beauty SC', venue: 'Les Peart Oval' },
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
  P('n1', 'public', '2027 registrations are open', 'Registrations for the 2027 season are now open for kids born 2014–2022. Sign in, add your child and the committee will confirm their squad. Come n Try day date TBA – bring a friend!', { pinned: true, created_at: '2026-12-01T09:00:00Z' }),
  P('n2', 'public', '2027 AGM – date TBA', 'All families welcome. We need volunteers for several committee roles – see About us for what is open.', { created_at: '2026-12-03T09:00:00Z' }),
  P('m1', 'members', 'Volunteers for the first home gala', 'We need 6 helpers for 16 May: 2 on the BBQ, 2 on canteen, 2 on pack-up. Reply here if you can help.', { author_name: 'Club Secretary', created_at: '2027-04-20T09:00:00Z' }),
  P('m2', 'team', 'U9 Red – training this week', 'Training is on as normal Wednesday. We will practise throw-ins and goal kicks. Please bring a full water bottle – it will be warm.', { team_id: 't9r', author_name: 'Sample coach (U9 Red)', created_at: '2027-04-27T09:00:00Z' }),
  P('c1', 'coaches', 'Pre-gala reminder – Mini-Roos rules', 'Reminder of the rough-play protocol agreed at the Alpine region meeting: send off for a short time, then back on in the spirit of the game; second time off for the match.', { created_at: '2027-05-01T09:00:00Z' }),
  P('k1', 'committee', 'FV renewal submitted', 'Football Victoria 2027 club renewal is in. Next: book Les Peart Oval for Come n Try.', { created_at: '2026-12-20T09:00:00Z' }),
]
export const replies = [
  { id: 'r1', post_id: 'm1', author_name: 'Jo Kiewa', body: 'I can do the BBQ 9–11.', created_at: '2027-04-21T09:00:00Z' },
  { id: 'r2', post_id: 'm1', author_name: 'Alex Bogong', body: 'Happy to help pack up.', created_at: '2027-04-21T10:00:00Z' },
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
  { id: 's1', key: 'fees', label: 'Season fee', value: 'TBA – 2027 fees will be confirmed by the committee. (2026: $55 per player.)' },
  { id: 's2', key: 'payment', label: 'How to pay', value: "Registration and payment are completed online through Football Victoria's PlayFootball system. The club will email the 2027 registration link once it opens." },
  { id: 's3', key: 'agm', label: 'AGM date', value: 'TBA' },
  { id: 's4', key: 'come_n_try', label: 'Come n Try day', value: 'TBA' },
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

export const kit = Array.from({ length: 40 }, (_, i) => {
  const p = players[(i * 2) % players.length]
  const out = i % 3 !== 0
  return { id: 'k' + i, jersey_label: String(i + 1), jersey_number: i + 1, size: ['6', '8', '10', '12', '14'][Math.floor(i / 8)], kit_bag: out ? String(10 + i) : '', holder_name: out ? `${p.first_name} ${p.last_name}` : '', status: out ? 'Loaned Out' : 'Shed Tub', shin_guard: out ? 'S' : '', boots_on_loan: i % 5 === 0, registration_paid: out && i % 4 !== 1, notes: '', sort_order: i }
})
