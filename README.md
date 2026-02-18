# 🔖 Smart Bookmark Manager

A private, real-time bookmark manager built with **Next.js 15**, **Supabase**, and **Tailwind CSS**.

## Features

- **Google OAuth** — Quick sign-in with Google.
- **Private Bookmarks** — Secure data access via Row Level Security (RLS).
- **Real-time Sync** — Instant updates across multiple tabs/devices.
- **Automatic Favicons** — Clear visual identification of saved sites.
- **Sleek Interface** — Modern dark-mode dashboard with emerald accents.

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Backend/Auth**: Supabase
- **Deployment**: Vercel

## Setup Guide

### 1. Database & Auth
- Create a Supabase project.
- Execute the SQL in `supabase/schema.sql` in the SQL Editor.
- Enable Google OAuth in **Authentication > Providers**. You will need a Client ID and Secret from the Google Cloud Console.
- Add your Supabase callback URL to the authorized redirect URIs in Google.

### 2. Environment Variables
Rename `.env.example` to `.env.local` and add your credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Running Locally
```bash
npm install
npm run dev
```

## Deployment

1. Deploy to Vercel and add your environment variables.
2. **Crucial**: Update your Google OAuth and Supabase settings with the production URL:
   - Google Cloud Console: Add to Authorized JavaScript origins.
   - Supabase Auth: Update Site URL and Redirect URLs.

---

## Development Notes & Challenges

### Auth Sync (Next.js & Supabase)
Integrating Supabase Auth with the Next.js App Router required careful cookie handling. I used `@supabase/ssr` to ensure that session state is correctly shared between the browser and Server Components, preventing logout flickers and unauthorized access in middleware.

### Row Level Security (RLS)
Security was priority one. I implemented RLS policies that verify the `auth.uid()` for every request. This ensures that bookmarks are strictly private; even if a user knows another user's bookmark ID, they cannot view or delete it.

### Real-time Multi-Tab Sync
Implementing real-time updates while keeping the UI responsive was a challenge. I moved to a singleton client pattern for the Supabase connection to ensure stability across the session. Instead of complex client-side filtering (which often failed on delete events), I relied on RLS to broadcast only the relevant data to each connected user, resulting in a much cleaner and faster sync.

### UI State Management
I initially tried optimistic updates, but they often collided with the real-time broadcasts. I opted for a pure "Live" state where the UI reacts directly to database events. This removed state inconsistencies and made the app feel much more robust.
