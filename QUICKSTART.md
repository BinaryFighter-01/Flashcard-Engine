# RecallAI - Quick Start Checklist ✓

## 🎯 Get Running in 15 Minutes

### **Phase 1: Clone & Install (2 minutes)**

```bash
cd "c:\Users\Anil Abhange\OneDrive\Documents\GitHub\Flashcard-Engine"
npm install
```

Wait for dependencies to install...

---

### **Phase 2: Set Up Supabase (5 minutes)**

**2.1 Create Supabase Project**
1. Go to https://supabase.com
2. Sign up/login
3. Click "New Project"
4. Choose free tier
5. Wait for provisioning (1-2 minutes)

**2.2 Get Your Credentials**
1. Go to Settings → API
2. Copy: `Project URL` → save somewhere
3. Copy: `anon public` key → save somewhere

**2.3 Run Database Schema**
1. In Supabase, go to SQL Editor
2. Click "New Query"
3. Copy entire contents of `schema.sql` from your project
4. Paste into SQL editor
5. Click "Run"
6. ✓ Should show "Success" messages

---

### **Phase 3: Get Gemini API Key (2 minutes)**

1. Go to https://makersuite.google.com/app/apikey
2. Click "+ Create API Key"
3. Copy the key
4. Save somewhere safe

⚠️ **NEVER commit this key to GitHub!**

---

### **Phase 4: Create `.env.local` (1 minute)**

Create a new file in your project root:
**File:** `c:\Users\Anil Abhange\OneDrive\Documents\GitHub\Flashcard-Engine\.env.local`

**Content:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...rest_of_key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...service_role_key...
GEMINI_API_KEY=AIzaSyD...your_gemini_key...
```

**Where to find each:**
- `NEXT_PUBLIC_SUPABASE_URL` → Supabase Settings → API → "Project URL"
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase Settings → API → "anon public"
- `SUPABASE_SERVICE_ROLE_KEY` → Supabase Settings → API → "service_role" (need to click "Reveal")
- `GEMINI_API_KEY` → From step above

---

### **Phase 5: Start Development Server (1 minute)**

```bash
npm run dev
```

You should see:
```
> next dev
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local
```

✓ Open http://localhost:3000 in your browser!

---

## 🧪 QUICK TEST (3 minutes)

### **Test 1: Sign Up**
1. Go to http://localhost:3000
2. Click "Create Account"
3. Enter email & password
4. Submit
5. ✓ Redirected to dashboard (empty)

### **Test 2: Create a Deck**
1. Click "Create Deck"
2. Drag & drop a PDF (or click to select)
   - Don't have a PDF? Download one:
     - Science: https://samplepdf.com/sample.pdf
     - Or: search "sample pdf" online
3. Enter title: "Test Deck"
4. Click "Generate Flashcards"
5. ⏳ Watch progress bar (takes 10-30 seconds)
6. See generated cards appear
7. Click "Save Deck with X Cards"
8. ✓ Deck created!

### **Test 3: Study Cards**
1. Click "Full Review"
2. See question on card
3. Press Space or click → see answer
4. Click "💡 Hint" → AI gives you a hint
5. Rate yourself:
   - "Again" (forgot)
   - "Hard" (difficult)
   - "Good" (normal)
   - "Easy" (too easy)
6. Next card loads
7. After all cards → session summary
8. ✓ Spaced repetition working!

---

## 🎨 FILE STRUCTURE

```
RecallAI/
├── .env.local              ← YOU CREATE THIS (has your secrets)
├── .env.local.example      ← Template file
├── .gitignore              ← Prevents uploading .env.local
├── package.json            ← Dependencies
├── next.config.js          ← Next.js config
├── tsconfig.json           ← TypeScript config
├── schema.sql              ← Database schema (run in Supabase)
├── SETUP.md                ← Detailed setup guide
├── DEMO.md                 ← Full features showcase
├── README_FULL.md          ← Complete documentation
│
├── app/
│   ├── page.tsx            ← Landing page
│   ├── layout.tsx          ← Root layout
│   ├── globals.css         ← Global styling
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
│   └── types/
│       └── database.ts
│
├── public/
│   └── (static assets)
│
└── node_modules/
    └── (dependencies)
```

---

## 🚨 COMMON MISTAKES

❌ **DON'T:**
- Commit `.env.local` to GitHub (it's in .gitignore for a reason!)
- Share the Gemini API key publicly
- Forget to run schema.sql in Supabase
- Use the wrong keys in .env.local

✅ **DO:**
- Keep `.env.local` in `.gitignore`
- Regenerate Gemini key if exposed
- Verify schema.sql ran with "Success" messages
- Restart dev server after changing .env.local

---

## 🆘 NEED HELP?

### Build Failed?
```bash
# Clear cache and reinstall
rm -r node_modules .next
npm install
npm run dev
```

### Can't login?
- Check Supabase Auth is enabled
- Verify database connection
- Check browser console for errors

### PDF upload not working?
- Try a different PDF file
- Ensure PDF has text (not just images)
- Check browser console for errors

### Cards not saving?
- Verify schema.sql ran successfully
- Check Supabase RLS policies
- Verify user is authenticated

### Gemini API errors?
- Check GEMINI_API_KEY in .env.local
- Verify key is active at https://makersuite.google.com/app/apikey
- Restart dev server

---

## 📖 DOCUMENTATION

- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[DEMO.md](./DEMO.md)** - Full feature walkthrough
- **[README_FULL.md](./README_FULL.md)** - Complete documentation
- **[schema.sql](./schema.sql)** - Database schema

---

## ✨ FEATURES INCLUDED

✅ AI-powered flashcard generation  
✅ PDF upload & text extraction  
✅ Real-time card generation UI  
✅ Beautiful 3D card flip animations  
✅ Spaced repetition (SM-2) algorithm  
✅ Socratic AI hints  
✅ Voice read-aloud (Web Speech API)  
✅ Confetti on card mastery  
✅ Session statistics  
✅ Deck management  
✅ Keyboard shortcuts  
✅ Dark academic theme  
✅ Mobile responsive  
✅ Row-level security  
✅ Production-ready  

---

## 🚀 WHAT TO DO NEXT

1. **✓ Get running** (this checklist)
2. **Create a test deck** (PDF upload)
3. **Study some cards** (try the flip UI)
4. **Rate some cards** (see SM-2 algorithm)
5. **Study again tomorrow** (see spaced repetition)
6. **Deploy to Vercel** (free tier)
7. **Build Step 3+** (dashboard, concept map, etc.)

---

## 📊 PROJECT STATUS

```
Step 1: Foundation ✅ DONE
  ├─ Next.js 14 setup
  ├─ Supabase auth
  ├─ Database schema
  ├─ SM-2 algorithm
  └─ API routes

Step 2: Core Features ✅ DONE
  ├─ PDF upload
  ├─ AI generation
  ├─ Card editor
  ├─ Flip UI
  ├─ Study session
  ├─ Hints
  ├─ Voice
  └─ Confetti

Step 3: Dashboard (Next)
  ├─ Weekly heatmap
  ├─ Study streak
  ├─ Mastery rings
  └─ Stats

Step 4-8: Coming Soon →
```

---

## 🎉 YOU'RE READY!

Your RecallAI platform is built and ready to use. 

**Next:** Follow the Quick Test section above to see it in action!

Questions? Check [DEMO.md](./DEMO.md) for full feature walkthrough.

---

**Happy learning! 🧠✨**
