-- ─────────────────────────────────────────────────────────────────────────────
-- Mt Beauty SC – Seed Data (run AFTER schema.sql)
-- ─────────────────────────────────────────────────────────────────────────────

-- Coaches
insert into coaches (name, age_group, role, phone, email, bio) values
  ('Mark Thompson',  'U8',  'Head Coach',      '0412 345 678', 'mark.t@email.com',  'Mark has coached junior football for 8 years. Loves developing confident young players.'),
  ('Lisa Chen',      'U10', 'Head Coach',      '0423 456 789', 'lisa.c@email.com',  'Former state-level midfielder. Passionate about skill development and fair play.'),
  ('Dave Hartley',   'U10', 'Assistant Coach', '0434 567 890', '',                   'Dave brings enthusiasm and energy to every Tuesday night training session.'),
  ('Sarah Williams', 'U12', 'Head Coach',      '0445 678 901', 'sarah.w@email.com', 'Sarah is a UEFA B licensed coach in her 4th season with the U12s.'),
  ('Tom Nguyen',     'U14', 'Head Coach',      '0456 789 012', 'tom.n@email.com',   'Tom played NPL2 for 10 years before turning to coaching. Tactical specialist.'),
  ('Emma O''Brien',  'U16', 'Head Coach',      '0467 890 123', 'emma.o@email.com',  'Emma focuses on developing players ready for senior football.');

-- Rosters – U12 (sample team)
insert into rosters (player_name, jersey_number, position, age_group, parent_name, parent_phone) values
  ('Liam Mitchell',    1,  'GK',  'U12', 'James Mitchell',   '0411 111 001'),
  ('Noah Davis',       2,  'DEF', 'U12', 'Karen Davis',      '0411 111 002'),
  ('Oliver Smith',     3,  'DEF', 'U12', 'Paul Smith',       '0411 111 003'),
  ('Ethan Brown',      4,  'DEF', 'U12', 'Sue Brown',        '0411 111 004'),
  ('Ava Wilson',       5,  'DEF', 'U12', 'Chris Wilson',     '0411 111 005'),
  ('Charlotte Jones',  6,  'MID', 'U12', 'Rachel Jones',     '0411 111 006'),
  ('Mia Taylor',       7,  'MID', 'U12', 'Mark Taylor',      '0411 111 007'),
  ('Amelia Anderson',  8,  'MID', 'U12', 'Tracy Anderson',   '0411 111 008'),
  ('Sophia Thomas',    9,  'FWD', 'U12', 'Ben Thomas',       '0411 111 009'),
  ('Isabella Jackson',10,  'FWD', 'U12', 'Helen Jackson',    '0411 111 010'),
  ('James White',      11, 'FWD', 'U12', 'Gary White',       '0411 111 011'),
  ('William Harris',   12, 'MID', 'U12', 'Louise Harris',    '0411 111 012');

-- Rosters – U8 (sample)
insert into rosters (player_name, jersey_number, position, age_group, parent_name, parent_phone) values
  ('Zara Green',   1, 'GK',  'U8', 'Phil Green',    '0411 222 001'),
  ('Jake Martin',  2, 'DEF', 'U8', 'Jen Martin',    '0411 222 002'),
  ('Lily Thompson',3, 'MID', 'U8', 'Mark Thompson', '0411 222 003'),
  ('Oscar Lee',    4, 'FWD', 'U8', 'Amy Lee',       '0411 222 004'),
  ('Ruby King',    5, 'MID', 'U8', 'Paul King',     '0411 222 005');

-- Rosters – U16 (sample)
insert into rosters (player_name, jersey_number, position, age_group, parent_name, parent_phone) values
  ('Connor Walsh',   1,  'GK',  'U16', 'Damien Walsh',   '0411 333 001'),
  ('Tyler Scott',    5,  'DEF', 'U16', 'Maria Scott',    '0411 333 002'),
  ('Jordan Adams',   7,  'MID', 'U16', 'Craig Adams',    '0411 333 003'),
  ('Riley Cooper',   9,  'FWD', 'U16', 'Fiona Cooper',   '0411 333 004'),
  ('Hayden Murray',  11, 'FWD', 'U16', 'Donna Murray',   '0411 333 005');

-- Fixtures – 2025 season
insert into fixtures (round, date, time, home_team, away_team, age_group, venue, is_home) values
  -- U12
  (1,  '2025-03-22', '10:00', 'Mt Beauty SC',  'Bright FC',        'U12', 'Mt Beauty Rec Reserve',  true),
  (2,  '2025-03-29', '10:00', 'Myrtleford FC', 'Mt Beauty SC',     'U12', 'Myrtleford Oval',        false),
  (3,  '2025-04-05', '10:00', 'Mt Beauty SC',  'Kiewa Valley SC',  'U12', 'Mt Beauty Rec Reserve',  true),
  (4,  '2025-04-12', '10:00', 'Harrietville FC','Mt Beauty SC',    'U12', 'Harrietville Reserve',   false),
  (5,  '2025-05-03', '10:00', 'Mt Beauty SC',  'Bright FC',        'U12', 'Mt Beauty Rec Reserve',  true),
  (6,  '2025-05-17', '10:00', 'Mt Beauty SC',  'Myrtleford FC',    'U12', 'Mt Beauty Rec Reserve',  true),
  (7,  '2025-05-31', '10:00', 'Kiewa Valley SC','Mt Beauty SC',    'U12', 'Kiewa Oval',             false),
  (8,  '2025-06-14', '10:00', 'Mt Beauty SC',  'Harrietville FC',  'U12', 'Mt Beauty Rec Reserve',  true),
  (9,  '2025-06-28', '10:00', 'Bright FC',     'Mt Beauty SC',     'U12', 'Bright Oval',            false),
  (10, '2025-07-12', '10:00', 'Mt Beauty SC',  'Kiewa Valley SC',  'U12', 'Mt Beauty Rec Reserve',  true),
  -- U8
  (1,  '2025-03-22', '08:30', 'Mt Beauty SC',  'Bright FC',        'U8',  'Mt Beauty Rec Reserve',  true),
  (2,  '2025-03-29', '08:30', 'Myrtleford FC', 'Mt Beauty SC',     'U8',  'Myrtleford Oval',        false),
  (3,  '2025-04-05', '08:30', 'Mt Beauty SC',  'Kiewa Valley SC',  'U8',  'Mt Beauty Rec Reserve',  true),
  -- U16
  (1,  '2025-03-22', '12:00', 'Mt Beauty SC',  'Bright FC',        'U16', 'Mt Beauty Rec Reserve',  true),
  (2,  '2025-03-29', '12:00', 'Myrtleford FC', 'Mt Beauty SC',     'U16', 'Myrtleford Oval',        false),
  (3,  '2025-04-05', '12:00', 'Mt Beauty SC',  'Kiewa Valley SC',  'U16', 'Mt Beauty Rec Reserve',  true),
  -- U10
  (1,  '2025-03-22', '09:15', 'Mt Beauty SC',  'Bright FC',        'U10', 'Mt Beauty Rec Reserve',  true),
  (2,  '2025-04-05', '09:15', 'Kiewa Valley SC','Mt Beauty SC',    'U10', 'Kiewa Oval',             false),
  -- U14
  (1,  '2025-03-22', '11:00', 'Mt Beauty SC',  'Bright FC',        'U14', 'Mt Beauty Rec Reserve',  true),
  (2,  '2025-04-05', '11:00', 'Mt Beauty SC',  'Kiewa Valley SC',  'U14', 'Mt Beauty Rec Reserve',  true);

-- Results for early rounds (using fixture IDs – run after inserting fixtures)
-- Replace with actual UUIDs from your fixtures table, or insert dynamically.
-- Example using a subquery pattern:

insert into results (fixture_id, home_score, away_score, scorers, special_moment)
select
  f.id,
  3, 1,
  array['Sophia Thomas', 'Isabella Jackson', 'James White'],
  'Sophia scored a beautiful solo goal in the 2nd half – the whole crowd erupted!'
from fixtures f
where f.round = 1 and f.age_group = 'U12' and f.date = '2025-03-22'
limit 1;

insert into results (fixture_id, home_score, away_score, scorers, special_moment)
select
  f.id,
  1, 2,
  array['Amelia Anderson'],
  'Great sportsmanship from the whole team despite the loss. Heads held high!'
from fixtures f
where f.round = 2 and f.age_group = 'U12' and f.date = '2025-03-29'
limit 1;

insert into results (fixture_id, home_score, away_score, scorers, special_moment)
select
  f.id,
  4, 0,
  array['Connor Walsh (pen save)', 'Jordan Adams x2', 'Riley Cooper'],
  'Connor saved a penalty to keep the clean sheet – brilliant performance!'
from fixtures f
where f.round = 1 and f.age_group = 'U16' and f.date = '2025-03-22'
limit 1;

-- Sample approved messages
insert into messages (author, content, approved) values
  ('Jenny T.', 'Great win last Saturday! The U12s played brilliantly. So proud of all the kids 🎉', true),
  ('Coach Mark', 'Reminder: U8 training is CANCELLED this Tuesday due to the field being used for the school fete. Back on Thursday!', true),
  ('Bob H.', 'Thanks to everyone who helped with the canteen on match day. You raised $340 for new training cones!', true),
  ('Sarah P.', 'Can anyone carpool from Mt Beauty to Bright for the Round 5 away game? We have 3 seats available.', true);
