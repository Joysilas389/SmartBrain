# 🧠 SmartMedicine — Dr. Agbesi's Deep Medical Learning System

> Every concept from first principles. Every mechanism visualised spatially. Zero unresolved doubts.

---

## WHAT THIS IS

SmartMedicine is a personal AI medical tutor built exclusively for Dr. Agbesi. It combines:

- **Claude AI** as an elite specialist in every medical specialty
- **Real SQLite database** — all topics, messages, flashcards and concepts persist permanently
- **Auto-classification** — AI automatically files every session under the right specialty
- **Mermaid flowcharts** — coloured causal chain diagrams for every mechanism
- **ECG grid drawing** — ECG rhythms drawn as ASCII grids with wave labels
- **Text highlight → Flashcard/Concept** — select any AI text to save it
- **Auto-generated flashcards** — extracted from every AI response and saved to DB
- **Study mode** — flip-card review of all saved cards
- **Specialty filtering** — view all Cardiology topics, all Nephrology flashcards, etc.
- **The full Agbesi Method** baked into the AI system prompt

---

## FILE STRUCTURE

```
SmartBrain/  ← your GitHub repo name
├── .github/
│   └── workflows/
│       └── deploy.yml        ← auto-deploy on every git push
├── backend/
│   ├── db/
│   │   └── database.js       ← SQLite schema + all DB operations
│   ├── routes/
│   │   ├── topics.js         ← CRUD for learning sessions
│   │   ├── flashcards.js     ← CRUD for flashcards
│   │   └── concepts.js       ← CRUD for saved highlights
│   ├── server.js             ← Express + Anthropic streaming + system prompt
│   ├── utils.js              ← nanoid + specialty classifier (15 specialties)
│   └── package.json
├── frontend/
│   ├── index.html            ← Complete single-file app (no build step)
│   └── netlify.toml          ← Routes /api/* to Render backend
├── render.yaml               ← Render deployment config
├── .gitignore
└── README.md
```

---

## DEPLOY — STEP BY STEP (from your phone with Termux)

### STEP 1 — Create GitHub repo

1. Open GitHub on your phone browser → github.com
2. Tap **+** → **New repository**
3. Name it: `SmartBrain`
4. Set to **Public** (or Private)
5. **Do NOT** add README, .gitignore, or license
6. Tap **Create repository**
7. Copy the repo URL: `https://github.com/YOUR_USERNAME/SmartBrain.git`

---

### STEP 2 — Termux setup (one-time)

```bash
# Install Termux from F-Droid (NOT Play Store)
# Then in Termux:
pkg update && pkg upgrade -y
pkg install git -y
pkg install wget -y

# Set up git identity
git config --global user.email "your@email.com"
git config --global user.name "Dr Agbesi"
```

---

### STEP 3 — Download & push from Termux

```bash
# Download the zip to your phone
cd ~
wget -O smartmedicine.zip "YOUR_DOWNLOAD_LINK_FROM_CLAUDE"

# Unzip
pkg install unzip -y
unzip smartmedicine.zip
cd smartmedicine

# Initialize git
git init
git add .
git commit -m "SmartMedicine: initial commit"

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/SmartBrain.git
git branch -M main
git push -u origin main

# GitHub will ask for username + password
# Use your GitHub username
# For password: use a Personal Access Token (NOT your GitHub password)
# Get token: github.com → Settings → Developer Settings → Personal Access Tokens → Classic → Generate
# Tick: repo (full control)
```

---

### STEP 4 — Deploy Backend on Render

1. Go to **render.com** → Sign up / Log in with GitHub
2. Click **New +** → **Web Service**
3. Click **Connect a repository** → select `SmartBrain`
4. Fill in:
   - **Name**: `smartmedicine-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
5. Scroll to **Environment Variables** → Add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-YOUR-KEY-HERE`
6. Click **Create Web Service**
7. Wait ~3 min. Copy your backend URL:
   `https://smartmedicine-backend.onrender.com`

---

### STEP 5 — Update Netlify redirect URL

In `frontend/netlify.toml`, replace:
```
https://smartmedicine-backend.onrender.com
```
with your actual Render URL (they match if you used the name above).

---

### STEP 6 — Deploy Frontend on Netlify

1. Go to **netlify.com** → Sign up / Log in with GitHub
2. Click **Add new site** → **Import an existing project**
3. Connect GitHub → select `SmartBrain`
4. Build settings:
   - **Base directory**: `frontend`
   - **Build command**: *(leave empty — no build needed)*
   - **Publish directory**: `frontend`
5. Click **Deploy site**
6. Your app is live at: `https://smartmedicine.netlify.app` (or similar)

---

### STEP 7 — Auto-deploy on every push (GitHub Actions)

After both Render and Netlify are set up:

**Get Render Deploy Hook:**
- Render dashboard → your service → Settings → Deploy Hook → Copy URL

**Get Netlify Build Hook:**
- Netlify → Site settings → Build & deploy → Build hooks → Add build hook → Copy URL

**Add to GitHub Secrets:**
- GitHub → SmartBrain repo → Settings → Secrets and variables → Actions
- Add secret: `RENDER_DEPLOY_HOOK` = your Render hook URL
- Add secret: `NETLIFY_BUILD_HOOK` = your Netlify hook URL

Now every `git push` automatically redeploys both services. 🎉

---

### STEP 8 — Future updates from Termux

```bash
cd ~/smartmedicine
# Make your changes...
git add .
git commit -m "Update: [description]"
git push origin main
# Auto-deploy triggers within seconds
```

---

## HOW TO USE SMARTMEDICINE

### Text Highlight Feature
1. In any AI response, **click and drag** to select text
2. A tooltip appears: **🃏 Flashcard** | **📌 Save**
3. Tap **🃏 Flashcard** → saved to DB under current specialty
4. Tap **📌 Save** → saved as a key concept under Concepts tab

### Flashcards Tab
- All auto-generated AND manually saved flashcards appear here
- Click any card to flip it
- **Study Mode** → one card at a time, flip with click, navigate with arrows
- Delete individual cards with 🗑

### Concepts Tab
- All highlighted/saved text passages appear here
- Auto-tagged by specialty
- Delete with 🗑

### Topic Management
- **Rename** any topic: click ✏️ when topic is active
- **Delete** any topic: click 🗑️ → confirm (deletes all messages + flashcards)
- **Filter by specialty** using pills in sidebar
- **Search** topics by keyword

### Auto-Classification
Every session is automatically filed under the correct specialty:
- Ask about DKA → Endocrinology
- Ask about MI → Cardiology
- Ask about COPD → Respiratory
No manual tagging needed.

---

## DATABASE

SQLite database lives at `backend/data/smartmedicine.db`

Tables:
- `topics` — all learning sessions with specialty + timestamps
- `messages` — all messages per topic (user + AI)
- `flashcards` — all cards (auto + manual) with specialty
- `concepts` — all highlighted/saved passages

The database persists on Render's disk. For free tier, if the service restarts the disk resets — **upgrade to Render Starter ($7/mo)** for persistent disk, or use Render's managed PostgreSQL for production.

---

*SmartMedicine — Built for Dr. Agbesi. Physician, Ghana.*
*"Every patient who sits before you deserves a doctor who truly understands."*
