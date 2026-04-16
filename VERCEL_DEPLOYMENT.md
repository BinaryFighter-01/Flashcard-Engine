# Vercel Deployment Guide

## Problem: "Site can't be reached" after Google OAuth sign-in

This happens because:
1. Supabase OAuth redirect URL is not configured for your Vercel domain
2. Environment variables are missing on Vercel
3. The callback route can't reach Supabase

## Solution Steps:

### 1. Deploy to Vercel

```bash
# If not already installed
npm install -g vercel

# Deploy
vercel

# Or link existing project
vercel link
```

This will show you your Vercel deployment URL (e.g., `https://flashcard-engine.vercel.app`)

### 2. Set Environment Variables on Vercel

In Vercel dashboard (Settings → Environment Variables), add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

Get these values from:
- **Supabase**: Project Settings → API → URL and Keys
- **Gemini**: Google AI Studio (https://aistudio.google.com/apikey)

### 3. Update Supabase OAuth Callback URL

In Supabase dashboard:

1. Go to **Authentication → Providers → Google**
2. Add this to "Authorized redirect URIs":
   ```
   https://your-project.vercel.app/auth/callback
   ```
3. Make sure you also have the local development one:
   ```
   http://localhost:3000/auth/callback
   ```

### 4. Deploy & Test

After setting environment variables:

```bash
vercel env pull  # Pull latest env vars
npm run build    # Test build locally
vercel deploy    # Deploy to production
```

Then:
1. Visit your Vercel URL
2. Click "Sign in with Google"
3. After Google redirects, you should see dashboard (not "site can't be reached")

## Troubleshooting

If still showing "site can't be reached":

1. **Check Vercel logs**: Click deployment in Vercel → Logs
2. **Verify env vars**: Settings → Environment Variables (check all 5 are set)
3. **Check Supabase redirect**: Make sure exact URL matches your Vercel domain
4. **Test locally first**: `npm run dev` and test Google OAuth locally
