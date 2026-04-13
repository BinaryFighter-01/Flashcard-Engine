# RecallAI Setup Guide

## Overview
RecallAI is a production-ready AI-powered flashcard engine built with Next.js 14, TypeScript, Tailwind CSS, Supabase, and Google Gemini API.

## Prerequisites
- Node.js 18+ and npm/pnpm
- Git
- A Supabase account (free tier)
- A Google Cloud account (for Gemini API - free tier)

## Step 1: Clone & Install

```bash
cd RecallAI
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Choose free tier
4. Copy your project URL and ANON key from Settings → API

### 2.2 Run Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy the entire contents of `schema.sql`
3. Paste and run it in the SQL editor
4. This creates all tables, indexes, RLS policies, and functions

### 2.3 Set Up Email Authentication Required ✅
- Go to **Authentication → Providers → Email**
- Email is enabled by default
- Users must verify email before first login
- Confirmation email is sent automatically

### 2.4 Set Up Google OAuth (Recommended)
Follow these steps to enable "Sign in with Google":

#### Step A: Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (name it "RecallAI")
3. Wait for project creation to complete
4. Go to **APIs & Services → OAuth Consent Screen**
5. Select **External** user type, click Create
6. Fill in app name: "RecallAI"
7. Click **Add or remove scopes** → Search for "email" → Select `/auth/userinfo.profile` and `/auth/userinfo.email`
8. Click **Save and continue** → **Save and continue** again
9. Go to **APIs & Services → Credentials**
10. Click **Create Credentials → OAuth 2.0 Client IDs**
11. Choose **Web application**
12. Add **Authorized redirect URIs:**
    - `https://YOUR_SUPABASE_PROJECT_URL/auth/v1/callback?provider=google`
    - Example: `https://wmedkdrsroesyyuzfdtn.supabase.co/auth/v1/callback?provider=google`
13. Click Create → Copy **Client ID** and **Client Secret**

#### Step B: Configure Supabase with Google OAuth
1. Go to your Supabase dashboard
2. Click **Authentication → Providers → Google**
3. Enabled: Toggle ON
4. Paste your Client ID (from Google Cloud Console)
5. Paste your Client Secret (from Google Cloud Console)
6. Click Save

#### Step C: Test Google OAuth
- Go to http://localhost:3001/auth/signup
- Click "Sign up with Google"
- Follow Google login flow
- You should be redirected to dashboard on success

## Step 3: Set Up Google Gemini API

### 3.1 Get API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key (free tier included)
3. Copy the key

## Step 4: Configure Environment

Create `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

**CRITICAL:** Never commit `.env.local` (it's in .gitignore)

## Step 5: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Deploy to Vercel

### 6.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial RecallAI commit"
git remote add origin your-repo-url
git push origin main
```

### 6.2 Deploy
1. Go to [vercel.com](https://vercel.com)
2. Import project from GitHub
3. Add environment variables in Settings → Environment Variables
4. Deploy!

## File Structure

```
RecallAI/
├── app/
│   ├── api/                    # API routes (server-side)
│   │   ├── generate-cards/     # AI card generation
│   │   ├── get-hint/           # Socratic hints from AI
│   │   └── update-progress/    # SM-2 algorithm
│   ├── auth/                   # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/           # OAuth callback
│   ├── dashboard/              # Main dashboard
│   ├── deck/                   # Deck detail pages
│   ├── study/                  # Study/practice modes
│   ├── upload/                 # PDF upload page
│   ├── lib/                    # Utilities
│   │   ├── supabase-client.ts  # Client-side Supabase
│   │   ├── supabase-server.ts  # Server-side Supabase
│   │   └── spaced-repetition.ts # SM-2 algorithm
│   ├── types/                  # TypeScript types
│   ├── globals.css             # Global styles
│   └── layout.tsx              # Root layout
├── public/                     # Static assets
├── schema.sql                  # Database schema
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Tech Stack Details

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.3 + Custom CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: Google Gemini 1.5 Flash API
- **Animations**: Framer Motion
- **PDF Parsing**: pdf-parse
- **Confetti**: canvas-confetti

## Key Features (Step 1 Complete)

✅ Next.js 14 setup with App Router
✅ Supabase authentication (email + OAuth)
✅ TypeScript configuration
✅ Tailwind CSS with custom dark theme
✅ Database schema with RLS policies
✅ SM-2 spaced repetition algorithm
✅ Gemini API integration (server-side)
✅ Landing page with auth flow
✅ Protected API routes

## Next Steps

After Step 1, proceed with:
- **Step 2**: Build PDF upload + Gemini card generation UI
- **Step 3**: Deck/card storage and retrieval
- **Step 4**: Flashcard flip UI + SM-2 practice session
- **Step 5**: Progress dashboard
- **Step 6**: Unique features (hints, voice, concept map)
- **Step 7**: UI polish and animations
- **Step 8**: Vercel deployment

## Environment Variables Reference

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Public - safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public - safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Secret - server-side only |
| `GEMINI_API_KEY` | ✅ | Secret - NEVER expose client-side |

## Troubleshooting

### "Gemini API key not configured"
- Check `.env.local` has `GEMINI_API_KEY`
- Restart dev server after adding env vars
- Verify key is active in Google Cloud Console

### "Unauthorized" on protected routes
- Ensure user is logged in
- Check RLS policies in Supabase
- Verify auth middleware is working

### Database errors
- Check schema.sql ran without errors
- Verify user is authenticated
- Check RLS policies allow the operation

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Check Next.js documentation: https://nextjs.org/docs
3. Check Gemini API docs: https://ai.google.dev/docs

---

Ready to build? Run `npm run dev` and start creating decks!
