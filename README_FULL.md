# RecallAI - AI-Powered Flashcard Engine

A production-ready web application for mastering any subject with AI-generated flashcards and scientifically-backed spaced repetition learning.

![RecallAI](https://img.shields.io/badge/Next.js-14-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3-38B2AC?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square)

## Overview

RecallAI combines cutting-edge AI with proven learning science to revolutionize how you study:

- **🤖 AI Card Generation**: Upload PDFs and let Google Gemini create comprehensive flashcards
- **🧠 Spaced Repetition**: SM-2 algorithm optimizes review intervals for maximum retention
- **💡 Smart Hints**: Get Socratic hints when you're stuck—without giving away the answer
- **📊 Progress Tracking**: Beautiful dashboards, study streaks, and mastery metrics
- **🎨 Stunning UI**: Dark academic aesthetic with smooth animations and 3D card flips
- **📱 Fully Responsive**: Works seamlessly on desktop, tablet, and mobile

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.3 + Custom CSS
- **Animations**: Framer Motion 10.16
- **Build**: Optimized for Vercel deployment

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with email & OAuth
- **API**: Next.js API routes (server-side only)
- **Server Functions**: PostgreSQL triggers & functions

### AI & External Services
- **AI Model**: Google Gemini 1.5 Flash API (free tier)
- **PDF Parsing**: pdf-parse npm package
- **Deployment**: Vercel (free tier)

## Core Features

### ✨ Phase 1: Built & Ready
- ✅ Next.js 14 setup with TypeScript
- ✅ Supabase authentication (email + OAuth)
- ✅ Database schema with RLS policies
- ✅ SM-2 spaced repetition algorithm
- ✅ Gemini API integration (server-side)
- ✅ Landing page and auth flow
- ✅ Protected API routes

### 🎯 Phase 2: In Progress
- PDF upload with progress tracking
- AI card generation from text chunks
- Card review & editing UI
- Deck storage in Supabase

### 🚀 Phase 3: Coming Soon
- Flashcard practice (flip UI + SM-2 session)
- Progress dashboard with stats
- Concept map visualization
- Voice read-aloud (Web Speech API)
- Socratic hint system
- Export to Anki (.apkg)
- UI polish and animations
- Production deployment to Vercel

## Database Schema

### Tables

**decks**
- User's flashcard decks
- Tracks deck metadata, card count, study history

**cards**
- Individual flashcards within decks
- Stores front/back content, card type, hints, difficulty, tags

**card_progress**
- User's learning progress per card
- SM-2 algorithm state: ease_factor, interval, repetitions
- Review history and metrics

## Architecture

```
┌─────────────────────────────────────┐
│        Next.js Frontend (App Router)│
│   (React Components + TypeScript)   │
└────────────┬────────────────────────┘
             │
┌────────────▼──────────────────────────────┐
│      Next.js API Routes (Server-Side)     │
│  - /api/generate-cards (Gemini)          │
│  - /api/get-hint (AI Socratic hints)     │
│  - /api/update-progress (SM-2 Algorithm) │
└────────────┬───────────────────────────────┘
             │
     ┌───────┴────────┐
     │                │
┌────▼─────────┐   ┌──▼──────────────────┐
│ Supabase     │   │ Google Gemini API   │
│ PostgreSQL   │   │ (AI Card Generation)│
│ Auth         │   │ (Gemini 1.5 Flash)  │
└──────────────┘   └─────────────────────┘
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account (free)
- Google Gemini API key (free)

### Quick Setup

1. **Clone & Install**
   ```bash
   git clone <your-repo>
   cd RecallAI
   npm install
   ```

2. **Set Up Supabase**
   - Create project at supabase.com
   - Run `schema.sql` in SQL editor
   - Copy URL and ANON key

3. **Get Gemini API Key**
   - Visit https://makersuite.google.com/app/apikey
   - Create new API key (free tier available)

4. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your keys
   ```

5. **Run Locally**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

6. **Deploy to Vercel**
   ```bash
   git push origin main
   # Click import in Vercel Dashboard
   # Add environment variables
   # Deploy!
   ```

## API Reference

### POST `/api/generate-cards`
Generates flashcards from PDF text using Gemini AI

**Request:**
```json
{
  "pdfText": "Full text from PDF",
  "deckTitle": "Biology 101"
}
```

**Response:**
```json
{
  "cards": [
    {
      "front": "What is photosynthesis?",
      "back": "Process where plants...",
      "hint": "Think about energy from sun",
      "card_type": "definition",
      "difficulty_level": 3,
      "tags": ["biology", "plants"]
    }
  ],
  "count": 24
}
```

### POST `/api/get-hint`
Gets a Socratic hint for a card

**Request:**
```json
{
  "cardFront": "What is the capital of France?"
}
```

**Response:**
```json
{
  "hint": "Think of a city famous for the Eiffel Tower..."
}
```

### POST `/api/update-progress`
Updates card progress with SM-2 algorithm

**Request:**
```json
{
  "cardId": "uuid-here",
  "quality": 4
}
```

**Response:**
```json
{
  "nextReviewDate": "2024-04-12",
  "interval": 6,
  "easeFactor": 2.6,
  "mastered": false
}
```

## SM-2 Spaced Repetition Algorithm

RecallAI implements the SuperMemo 2 (SM-2) algorithm for optimal revision scheduling:

```
Quality Scores:
0 = complete blackout
1 = incorrect response; easy to remember
2 = incorrect response; some difficulty  
3 = correct response after hesitation
4 = correct response with difficulty
5 = perfect response in minimal time
```

Cards are scheduled based on:
- **Ease Factor**: How easy/difficult a card is
- **Interval**: Days until next review
- **Repetitions**: Number of successful reviews

The algorithm adapts to individual learning patterns and maximizes long-term retention.

## UI/UX Design

### Color Palette
- **Background**: Dark academic (#0F0F0F)
- **Surface**: Subtle warmth (#1A1A1A)
- **Border**: Subtle divide (#2A2A2A)
- **Primary**: Warm amber (#F59E0B)
- **Accent**: Electric indigo (#6366F1)

### Typography
- **Serif**: Instrument Serif (card content)
- **Sans**: DM Sans (UI elements)

### Components
- Beautiful card flip animations (3D transforms)
- Smooth page transitions
- Framer Motion for entrance effects
- Confetti on card mastery

## Unique Features

### 1. AI Hint System
When stuck on a card, click "Need a hint?" to get a Socratic hint that guides your thinking without revealing the answer. Streamed word-by-word for an engaging experience.

### 2. Difficulty Prediction
Before rating a card, see predicted difficulty: "This card typically takes 3 tries". Reduces anxiety and helps set expectations.

### 3. Concept Map Visualization
After generating a deck, view a force-directed graph showing relationships between concepts. Click nodes to study related cards together.

### 4. Voice Read-Aloud
Speaker icon on each card uses Web Speech API to read content aloud. Perfect for auditory learners and accessibility.

### 5. Export to Anki
Download your AI-generated decks as .apkg files to use in Anki or other spaced repetition apps.

## Project Structure

```
RecallAI/
├── app/
│   ├── api/
│   │   ├── generate-cards/route.ts
│   │   ├── get-hint/route.ts
│   │   └── update-progress/route.ts
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts
│   ├── dashboard/page.tsx
│   ├── deck/[id]/page.tsx
│   ├── study/[id]/page.tsx
│   ├── upload/page.tsx
│   ├── lib/
│   │   ├── supabase-client.ts
│   │   ├── supabase-server.ts
│   │   └── spaced-repetition.ts
│   ├── types/
│   │   └── database.ts
│   ├── globals.css
│   └── layout.tsx
├── public/
├── schema.sql
├── SETUP.md
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Environment Variables

```bash
# Public (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Secret (server-side only)
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

## Performance Optimizations

- ✅ Next.js Image optimization
- ✅ Code splitting per route
- ✅ Server-side rendering where appropriate
- ✅ Database indexes on hot queries
- ✅ Row-level security policies
- ✅ Efficient SM-2 calculations
- ✅ Lazy loading of decks and cards

## Security

- ✅ Supabase RLS policies (row-level security)
- ✅ Server-side API key management
- ✅ No Gemini key exposure to client
- ✅ Auth middleware for protected routes
- ✅ SQL injection prevention (ORM layer)
- ✅ CSRF protection via Next.js

## Deployment

### To Vercel

1. Push to GitHub
2. Connect Vercel to GitHub repo
3. Add environment variables in Vercel dashboard
4. Deploy!

### Configuration

`vercel.json` ensures:
- API routes get 30-second timeout
- Environment variables are injected
- Build optimizations applied

## Roadmap

- [ ] Real-time collaboration on decks
- [ ] Custom study modes (e.g., timed practice)
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] OpenAI GPT-4 card generation option
- [ ] Integration with Notion/OneNote
- [ ] Advanced analytics dashboard

## Troubleshooting

### Issue: "Gemini API key not configured"
**Solution**: Check `.env.local` and restart dev server

### Issue: "Unauthorized" on dashboard
**Solution**: Ensure RLS policies are enabled in Supabase

### Issue: Cards not saving
**Solution**: Verify `schema.sql` ran successfully

See [SETUP.md](./SETUP.md) for more troubleshooting steps.

## Contributing

Contributions are welcome! Please:
1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- 📖 [Setup Guide](./SETUP.md)
- 📚 [Next.js Docs](https://nextjs.org/docs)
- 🗄️ [Supabase Docs](https://supabase.com/docs)
- 🤖 [Gemini API Docs](https://ai.google.dev/docs)

## Acknowledgments

- SuperMemo 2 algorithm by Piotr Wozniak
- Inspiration from Anki, Quizlet, and Remnote
- Design inspired by modern SaaS applications

---

**Ready to revolutionize your learning? [Deploy Now!](#deployment)**
