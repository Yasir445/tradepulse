# TradePulse — Setup & Deployment Guide
## Phase 1 Complete: Landing Page + Auth + Dashboard Shell

---

## STEP 1 — Create Supabase Project (5 min)

1. Go to **https://supabase.com** → Sign up free
2. Click **New Project** → Name it `tradepulse`
3. Choose a region close to you (Singapore or Mumbai for PKT)
4. Set a strong database password → **Save it**
5. Wait ~2 minutes for project to be ready

### Run the Database Schema
1. In Supabase dashboard → click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `supabase/schema.sql` from this project
4. Paste the entire contents → click **Run**
5. You should see "Success. No rows returned"

### Get Your API Keys
1. In Supabase → **Project Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## STEP 2 — Deploy to Vercel (5 min)

### Option A — GitHub (Recommended)
1. Create a GitHub account if you don't have one
2. Create a new repo called `tradepulse`
3. Upload all these files to the repo
4. Go to **https://vercel.com** → Sign up with GitHub
5. Click **New Project** → Import your `tradepulse` repo
6. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
7. Click **Deploy** → Done in 2 minutes

### Option B — Vercel CLI
```bash
npm i -g vercel
cd tradepulse
vercel
# Follow prompts, add env vars when asked
```

---

## STEP 3 — Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Edit .env.local with your Supabase keys

# Run dev server
npm run dev
# Open http://localhost:3000
```

---

## What's Built in Phase 1

| Page            | Status | Description                          |
|-----------------|--------|--------------------------------------|
| Landing Page    | ✅     | Full marketing page with all sections |
| Login           | ✅     | Email + password auth                 |
| Signup          | ✅     | 2-step with trader profile           |
| Auth Callback   | ✅     | Email confirmation handler            |
| Dashboard Shell | ✅     | Sidebar nav + header + layout         |
| Dashboard Home  | ✅     | Stats, recent trades, quick actions   |
| Database Schema | ✅     | Full trades + profiles + RLS          |
| Middleware      | ✅     | Route protection                      |

## Coming in Phase 2

- Pre-Trade Checklist (full 5-step interactive)
- Trade Journal (log, edit, screenshot upload)
- Full Stats & Analytics
- AI Chart Analyzer
- Rules page

---

## File Structure

```
tradepulse/
├── app/
│   ├── layout.js          # Root layout
│   ├── globals.css        # Global styles
│   ├── page.js            # Landing page
│   ├── login/page.js      # Login
│   ├── signup/page.js     # Signup (2-step)
│   ├── auth/callback/     # Auth callback
│   └── dashboard/
│       ├── layout.js      # Dashboard sidebar
│       └── page.js        # Dashboard home
├── lib/
│   └── supabase.js        # Supabase client
├── supabase/
│   └── schema.sql         # Full DB schema
├── middleware.js           # Route protection
├── .env.example           # Env template
├── next.config.js
├── tailwind.config.js
└── package.json
```
