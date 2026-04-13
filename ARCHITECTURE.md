# RecallAI Architecture & Features

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        RECALLAI APPLICATION                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 14)                       │
│                    React Components + TypeScript                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Landing Page          Auth Pages              Dashboard         │
│  ├─ Hero Section       ├─ Sign Up              ├─ Deck Grid     │
│  ├─ Features           ├─ Login                ├─ Quick Stats   │
│  └─ CTA Buttons        └─ OAuth               └─ Create Deck   │
│                                                                  │
│  Upload Page           Deck Detail            Study Session     │
│  ├─ Drag & Drop        ├─ Card List           ├─ 3D Flip UI   │
│  ├─ PDF Preview        ├─ Stats               ├─ Ratings      │
│  ├─ Generation Progress├─ Action Buttons      ├─ Hints        │
│  ├─ Card Editor        └─ Study Options       ├─ Voice        │
│  └─ Save to DB                                ├─ Confetti     │
│                                               └─ Session Stats │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                   API ROUTES (Server-Side)                       │
│                    Node.js + TypeScript                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /api/generate-cards          /api/get-hint      /api/update    │
│  ├─ Receive PDF text          ├─ Receive Q        -progress     │
│  ├─ Chunk intelligently        ├─ Call Gemini      ├─ Get       │
│  ├─ Call Gemini API            ├─ Socratic hint    │  progress  │
│  ├─ Parse JSON                 └─ Return hint      ├─ SM-2      │
│  └─ Return cards                                   │  algorithm │
│                                                    ├─ Update DB │
│                                                    └─ Return    │
│                                                       metrics    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
        ┌────────────────────────────────────────┐
        │    Database Layer (PostgreSQL)         │
        ├────────────────────────────────────────┤
        │                                        │
        │  Supabase (Free Tier)                 │
        │  ├─ Row-Level Security               │
        │  ├─ Auth integration                 │
        │  ├─ Real-time subscriptions (future) │
        │  └─ Backup & restore                 │
        │                                        │
        └────────────────────────────────────────┘
                  ↓           ↓          ↓
        ┌─────────────┐ ┌──────────┐ ┌──────────────┐
        │   Decks     │ │  Cards   │ │ CardProgress │
        ├─────────────┤ ├──────────┤ ├──────────────┤
        │ id          │ │ id       │ │ id           │
        │ user_id     │ │ deck_id  │ │ card_id      │
        │ title       │ │ front    │ │ user_id      │
        │ card_count  │ │ back     │ │ ease_factor  │
        │ color_tag   │ │ hint     │ │ interval     │
        │ created_at  │ │ tags     │ │ repetitions  │
        └─────────────┘ │ type     │ │ next_review  │
                        │ difficulty
                        │ created_at
                        └──────────┘ └──────────────┘
         
            (RLS Policies ensure users can only
             access their own data)
```

---

## 🔄 User Flow Diagram

```
START
  │
  ├→ Landing Page (/)
  │   └→ [Not logged in?] → Sign Up (/auth/signup)
  │                         ├→ Verify email (in real version)
  │                         └→ [Successfully created] → Dashboard
  │   └→ [Logged in?] → Dashboard (/dashboard)
  │
  ├→ Dashboard
  │   ├─ View all decks (grid)
  │   ├─ View stats (cards due, streak, etc.)
  │   └─ Click "Create Deck" → Upload Page (/upload)
  │
  ├→ Upload Page (PDF Generation)
  │   ├─ Drag & drop PDF
  │   ├─ Enter title & description
  │   ├─ Click "Generate"
  │   │   └→ [Behind scenes]
  │   │       ├─ Extract text from PDF
  │   │       ├─ Chunk text intelligently
  │   │       ├─ Call Gemini API (with system prompt)
  │   │       ├─ Parse JSON responses
  │   │       └─ Display with progress bar
  │   ├─ Review generated cards
  │   ├─ Edit/delete cards as needed
  │   ├─ Click "Save Deck"
  │   │   └→ Create deck record in Supabase
  │   │   └→ Batch insert cards
  │   │   └→ Update deck card_count
  │   └─ Redirect to Deck Detail
  │
  ├→ Deck Detail Page (/deck/:id)
  │   ├─ View deck info (title, description, source file)
  │   ├─ View stats
  │   │   ├─ Total cards
  │   │   ├─ Due today
  │   │   ├─ Mastery % (cards with interval > 21 days)
  │   │   └─ Accuracy % (correct_reviews / total_reviews)
  │   ├─ See all cards with progress badges
  │   │   ├─ "New" (never studied)
  │   │   ├─ "Learning (6d)" (next review in 6 days)
  │   │   └─ "✓ Mastered (45d)" (interval > 21)
  │   ├─ Click "Full Review" → Study Page
  │   │   └→ Study all cards
  │   └─ Click "Quick Study" → Study Page
  │       └→ Study only cards due today
  │
  ├→ Study Page (/study/:id?mode=...)
  │   ├─ [Full-screen focus mode]
  │   ├─ Show card front (question)
  │   ├─ User thinks about answer
  │   ├─ Click/Space → Flip card (3D animation)
  │   ├─ [Card shows answer]
  │   ├─ Options while answer is showing:
  │   │   ├─ "💡 Hint" → Call /api/get-hint
  │   │   │              └→ Get Socratic hint from Gemini
  │   │   ├─ "🔊" → Use Web Speech API to read
  │   │   ├─ "Hide" → Flip back
  │   │   └─ Rate yourself:
  │   │       ├─ "Again" (0) → Reset everything
  │   │       ├─ "Hard" (3) → Slow progression
  │   │       ├─ "Good" (4) → Normal progression
  │   │       └─ "Easy" (5) → Faster progression
  │   │                (All call /api/update-progress)
  │   │
  │   │ [Behind scenes after rating]
  │   │ ├─ Call /api/update-progress with quality
  │   │ ├─ Server runs SM-2 algorithm:
  │   │ │   ├─ Get current card_progress
  │   │ │   ├─ Calculate: ease_factor, interval, repetitions
  │   │ │   ├─ Determine next_review_date
  │   │ │   └─ Update Supabase
  │   │ ├─ If interval > 21 days: CONFETTI! 🎉
  │   │ └─ Load next card
  │   │
  │   ├─ [After last card]
  │   └─ Show session summary page
  │       ├─ Cards reviewed
  │       ├─ Accuracy %
  │       ├─ Breakdown (Again/Hard/Good/Easy)
  │       └─ Options: Study Again, View Deck, Dashboard
  │
  └→ [User can repeat] Study → Deck Detail → Dashboard
      (SM-2 algorithm optimizes review intervals)
```

---

## 🧠 SM-2 Algorithm Flow

```
User rates a card (quality 0-5)
         │
         ↓
┌─────────────────────────────────────┐
│  Call /api/update-progress          │
│  Input: cardId, quality (0-5)       │
└─────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Fetch card_progress from DB        │
│  Get: ease_factor, interval, rep.   │
└─────────────────────────────────────┘
         │
         ↓
         ├─ quality >= 3? (correct/acceptable)
         │   │
         │   YES → Increase interval
         │         ├─ If rep == 0: interval = 1
         │         ├─ If rep == 1: interval = 6
         │         └─ Else: interval = interval × ease_factor
         │
         │   NO  → Reset
         │         └─ interval = 1, rep = 0
         │
         ↓
┌─────────────────────────────────────┐
│  Update ease_factor                 │
│  EF = EF + (0.1 - (5-q) × (0.08...))
│  EF = max(1.3, EF)                  │
└─────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Calculate next_review_date         │
│  Date = today + interval days       │
└─────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Update card_progress in DB         │
│  Store all new values               │
└─────────────────────────────────────┘
         │
         ↓
        ├─ interval > 21 days?
        │   YES → Return mastered: true → CONFETTI 🎉
        │   NO  → Return mastered: false
        │
        ↓
    Return to frontend
    Load next card
```

Example progression for one card:

```
Session 1 (Quality = 5 "Easy")
╔═════════════════════════════════╗
║ Start:                          ║
║   ease_factor = 2.5             ║
║   interval = 1                  ║
║   repetitions = 0               ║
╠═════════════════════════════════╣
║ After (Quality 5):              ║
║   easeFactor = 2.68 ↑           ║
║   interval = 1 (first review)   ║
║   repetitions = 1 ↑             ║
║   next_review = today + 1 day   ║
╚═════════════════════════════════╝
      ↓ (Study again 1 day later)

Session 2 (Quality = 4 "Good")
╔═════════════════════════════════╗
║ Start:                          ║
║   ease_factor = 2.68            ║
║   interval = 1                  ║
║   repetitions = 1               ║
╠═════════════════════════════════╣
║ After (Quality 4):              ║
║   easeFactor = 2.63             ║
║   interval = 6 (second review)  ║
║   repetitions = 2 ↑             ║
║   next_review = today + 6 days  ║
╚═════════════════════════════════╝
      ↓ (Study again 6 days later)

Session 3 (Quality = 5 "Easy")
╔═════════════════════════════════╗
║ Start:                          ║
║   ease_factor = 2.63            ║
║   interval = 6                  ║
║   repetitions = 2               ║
╠═════════════════════════════════╣
║ After (Quality 5):              ║
║   easeFactor = 2.80 ↑           ║
║   interval = 17 (6 × 2.8)       ║
║   repetitions = 3 ↑             ║
║   next_review = today + 17 days ║
╚═════════════════════════════════╝
      ↓ (Study again 17 days later)

Session 4 (Quality = 4 "Good")
╔═════════════════════════════════╗
║ After (Quality 4):              ║
║   interval = 45 (17 × 2.8)      ║
║   ✓ MASTERED! (> 21 days)       ║
║   → CONFETTI ANIMATION 🎉       ║
╚═════════════════════════════════╝
```

---

## 📊 Database Schema

```
┌──────────────────┐     ┌──────────────────┐     ┌────────────────────────┐
│ auth.users       │     │ decks            │     │ cards                  │
│ (Supabase)       │     │                  │     │                        │
├──────────────────┤     ├──────────────────┤     ├────────────────────────┤
│ id (uuid)  ← FK  │     │ id (uuid) ← PK   │     │ id (uuid) ← PK         │
│ email            │──→  │ user_id (FK) ────┼────→│ deck_id (FK)           │
│ created_at       │     │ title            │     │ front ★                │
│                  │     │ description      │     │ back ★                 │
│                  │     │ card_count ▲     │     │ hint                   │
│                  │     │ color_tag        │     │ card_type *            │
│                  │     │ created_at       │     │ difficulty_level (1-5) │
│                  │     │ last_studied_at  │     │ tags (array)           │
│                  │     │                  │     │ created_at             │
└──────────────────┘     └──────────────────┘     └────────────────────────┘
                              ↑                              ↓
                              │                              │
                              └──────────────────┬───────────┘
                                                 │
                                                 ↓
                         ┌────────────────────────────────────────┐
                         │ card_progress                          │
                         │ (User's learning state per card)       │
                         ├────────────────────────────────────────┤
                         │ id (uuid)                              │
                         │ card_id (FK) ──────────────────── card │
                         │ user_id (FK) ──────────────────── user │
                         │ ease_factor (2.5-4.0 typical)          │
                         │ interval (1-365+ days)                 │
                         │ repetitions (0+)                       │
                         │ next_review_date ★ (INDEX)            │
                         │ total_reviews                          │
                         │ correct_reviews                        │
                         │ last_response_quality (0-5)            │
                         │ last_reviewed_at                       │
                         │ created_at                             │
                         └────────────────────────────────────────┘

★ = Critical fields optimized with indexes
* = Enum constraint
```

---

## 🔐 Security Model (RLS - Row Level Security)

```
┌─────────────────────────────────────────┐
│ Supabase RLS Policies                   │
├─────────────────────────────────────────┤
│                                         │
│ Users can ONLY:                         │
│ • View their own decks                  │
│ • Create decks (user_id = auth.uid())   │
│ • Update their own decks                │
│ • Delete their own decks                │
│                                         │
│ Users can ONLY:                         │
│ • View cards in THEIR decks             │
│ • Create cards in THEIR decks           │
│ • Update cards in THEIR decks           │
│ • Delete cards in THEIR decks           │
│                                         │
│ Users can ONLY:                         │
│ • View their own card_progress          │
│ • Create/update their own progress      │
│                                         │
└─────────────────────────────────────────┘

Gemini API Key Protection:
├─ STORED ONLY on server (.env file)
├─ NEVER sent to client-side JS
├─ ONLY used in /api/ routes
└─ Prevents API key theft from browser
```

---

## 📱 Responsive Design

```
Mobile (< 640px)
├─ Single column layout
├─ Full-width cards
├─ Touch-friendly buttons
├─ Vertical scrolling
└─ Optimized for thumbs

Tablet (640px - 1024px)
├─ Two-column grid
├─ Medium-sized cards
├─ Better spacing
└─ Balanced touch/click targets

Desktop (> 1024px)
├─ Three+ column grid
├─ Large cards with hover effects
├─ Optimized for mouse interaction
└─ Full-feature UI
```

---

## 🎨 Color & Animation System

```
Colors
├─ Background: #0F0F0F (dark, readable)
├─ Surface: #1A1A1A (contrast without glare)
├─ Border: #2A2A2A (subtle dividers)
├─ Primary: #F59E0B (warm amber, CTAs)
└─ Accent: #6366F1 (electric indigo, AI elements)

Animations
├─ Card flip: 0.4s ease-in-out (3D transform)
├─ Progress bar: 0.3s smooth width transition
├─ Button hover: scale 105%, color shift
├─ Confetti: burst on card mastery
└─ Page transitions: Framer Motion (ready for Step 7)
```

---

## 🔗 API Integration Points

```
External APIs Used:

1. Google Gemini 1.5 Flash
   ├─ Card generation from text
   ├─ Socratic hint generation
   ├─ Hosted on: https://generativelanguage.googleapis.com
   └─ Server-side only via /api/ routes

2. Supabase
   ├─ PostgreSQL database
   ├─ Authentication (email + OAuth)
   ├─ Real-time subscriptions (future)
   └─ Hosted on: supabase.com CDN

3. Web Speech API (Browser Built-in)
   ├─ No API key needed
   ├─ Client-side only
   └─ Used for card read-aloud

4. Canvas Confetti (npm Package)
   ├─ Celebration animations
   ├─ Client-side rendering
   └─ No external calls
```

---

## 📦 Deployment Architecture

```
GitHub (Source Code)
        ↓
        ↓ (git push)
        ↓
Vercel (Build & Deploy)
        ├─ Automatic build on push
        ├─ Environment variables injected
        ├─ Serverless functions (/api routes)
        ├─ Edge network distribution
        └─ URL: recallai.vercel.app
              ↓
Network of Vercel Edge Nodes
        ├─ USA East
        ├─ USA West
        ├─ Europe
        ├─ Asia Pacific
        └─ Global CDN for static assets
              ↓
Supabase PostgreSQL (Production Database)
        ├─ Hosted in AWS
        ├─ Automatic backups
        ├─ SSL encrypted
        └─ Free tier: generous limits
```

---

## ⚡ Performance Optimizations

```
Frontend
├─ Next.js Image optimization
├─ Code splitting per route
├─ Bundle size reduction
├─ CSS-in-JS minification
└─ Lazy loading components

Backend
├─ Database indexes on hot queries
│   └─ next_review_date (crucial for due cards)
├─ Connection pooling (Supabase)
├─ API request batching
└─ SM-2 calculations in memory

Database
├─ Indexes on:
│   ├─ user_id (all tables)
│   ├─ next_review_date (card_progress)
│   └─ tags (cards, for searching)
├─ RLS policies (no unneeded data transfer)
└─ Aggregation functions for stats

Deployment
├─ CDN distribution (Vercel Edge)
├─ Serverless auto-scaling
├─ Caching headers
└─ Gzip compression
```

---

This architecture ensures RecallAI is **scalable, secure, and performant** from day one! 🚀
