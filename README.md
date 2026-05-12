# BAXA Outreach Portal

A web app for BAXA Corporate Directors to manage company outreach, generate Gmail drafts in bulk, and track sponsorship pipeline status.

---

## What it does

- **Company list** — all ~70 companies from your spreadsheet, pre-loaded
- **Batch draft creator** — select companies, click one button, and Gmail drafts are created automatically with personalized emails (company name swapped in)
- **Status tracking** — Not Contacted → Draft Created → Sent → Replied
- **Notes per company** — log context like "spoke at GM, interested 2026-27"
- **Email template editor** — update the template from the Settings page without touching code

---

## Setup (one-time, ~20 minutes)

### 1. Clone and install

```bash
cd baxa-outreach
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. In the SQL editor, run **`supabase/schema.sql`** first, then **`supabase/seed.sql`**
3. Copy your **Project URL** and **anon key** from Settings → API

### 2b. Enable Google Auth in Supabase

1. In Supabase dashboard → **Authentication → Providers → Google**
2. Toggle it **on**
3. Paste in the same **Client ID** and **Client Secret** from your Google Cloud project
4. Copy the **Callback URL** shown (looks like `https://xxxx.supabase.co/auth/v1/callback`)
5. Go back to Google Cloud Console → Credentials → your OAuth client → add that callback URL to **Authorized redirect URIs**
6. Save

To add authorized officers: Authentication → Users in Supabase. Anyone who signs in with Google gets an account. You can delete users there if you want to revoke access.

### 3. Set up Google Cloud (Gmail API)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. "BAXA Outreach")
3. Enable the **Gmail API** (APIs & Services → Library → search "Gmail API")
4. Create OAuth credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth Client ID
   - Application type: **Web application**
   - Name: BAXA Outreach
   - Authorized JavaScript origins:
     - `http://localhost:5173` (dev)
     - `https://your-vercel-url.vercel.app` (production)
   - Authorized redirect URIs: same as above
5. Copy the **Client ID** (ends in `.apps.googleusercontent.com`)
6. Go to OAuth consent screen → add your Gmail address as a test user

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## How to send a batch of emails

1. Open **Batch Sender** from the sidebar
2. Filter by "Not Contacted" (default)
3. Click **Select All** or check individual companies
4. Click **Generate Drafts**
5. Sign in with the BAXA Gmail account when prompted (one-time per session)
6. Watch the progress bar — each company gets a personalized draft created in Gmail
7. Open [Gmail Drafts](https://mail.google.com/mail/#drafts) and send at your own pace

> 💡 Drafts are created 300ms apart to stay within Gmail's rate limits. 100 drafts takes ~30 seconds.

---

## Deploying to Vercel (free)

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard (Settings → Environment Variables) — same three as your `.env`.

Then update your Google OAuth authorized origins to include the Vercel URL.

---

## Handing off to future directors

1. Share the Vercel URL
2. They sign into Google (BAXA Gmail) when prompted
3. Update sender name/title in **Settings**
4. That's it — all contact data and history is in Supabase

---

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | React Router v6 |
| Database | Supabase (PostgreSQL) |
| Email | Gmail API via Google Identity Services |
| Hosting | Vercel (free tier) |
