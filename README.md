# Mount Beauty Football Club (MBFC) – club website

React + Vite front end, Supabase back end (project `mbsc-club`, Sydney), hosted on Netlify.

- `npm run build` – production site (talks to Supabase)
- `npx vite build -c vite.demo.config.js` – single-file demo with sample data and a role switcher
- Season settings: `src/supabase.js` (`REG_SEASON`)
- Access rules are enforced in the database (row-level security). The publishable key in the code is safe to be public.

The earlier 2026 prototype is kept on the `archive-2026` branch.
