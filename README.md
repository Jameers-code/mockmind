<div align="center">

# 🧠 MockMind — AI-Powered Interview Simulator

**Practice smart. Interview sharp. Get hired.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Groq AI](https://img.shields.io/badge/Groq-LLaMA_3.1-F97316?style=for-the-badge)](https://groq.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

MockMind is a full-stack, AI-driven mock interview platform that generates personalized interview questions from your resume, evaluates your answers in real time, and produces a detailed performance report — all powered by Groq's LLaMA 3.1.

[**Live Demo →**](https://mockmind.vercel.app) &nbsp;·&nbsp; [Report Bug](https://github.com/Jameers-code/interview_app/issues) &nbsp;·&nbsp; [Request Feature](https://github.com/Jameers-code/interview_app/issues)

</div>

---

## 📸 Preview

> Landing page → Setup wizard → Live interview → Performance report → Dashboard

![MockMind Preview](public/product_preview.png)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Resume Parsing** | Upload PDF/TXT or paste text — AI extracts skills and projects |
| 🧠 **AI Question Generation** | 10 tailored questions per session via Groq LLaMA 3.1-8B |
| 💻 **Monaco Code Editor** | In-browser VS Code editor for coding & SQL questions |
| 📊 **Spreadsheet Workspace** | Interactive grid for finance/accounting modeling questions |
| ⚡ **Real-time Evaluation** | Per-answer scoring with feedback and ideal answer |
| 📈 **Performance Report** | 4-dimension scoring: Communication, Technical Depth, Clarity, Confidence |
| 🗂️ **Dashboard** | Session history, trend chart, average score, best score |
| 🔐 **Authentication** | Google OAuth + email/password via NextAuth.js |
| 🤖 **Multi-Provider AI** | Supports both Groq and Google Gemini 1.5 Flash |
| 📱 **Responsive UI** | Fully responsive with Framer Motion animations |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│  Landing → /setup → /interview → /results → /dashboard  │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / Next.js App Router
┌───────────────────────▼─────────────────────────────────┐
│                   Next.js 14 Server                      │
│                                                          │
│  /api/parse-resume      → pdf-parse → extracted text     │
│  /api/generate-questions → Groq LLaMA 3.1 → 10 Qs       │
│  /api/evaluate-answer   → Groq LLaMA 3.1 → score+feedback│
│  /api/generate-report   → Groq LLaMA 3.1 → final report  │
│  /api/auth/[...nextauth]→ Google OAuth / Credentials     │
│  /api/user/sessions     → Prisma ORM → PostgreSQL        │
└───────────────────────┬─────────────────────────────────┘
                        │ Prisma Client
┌───────────────────────▼─────────────────────────────────┐
│              PostgreSQL (Supabase / Neon)                │
│   Users table  ←→  Sessions table (cascading delete)     │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3 + Framer Motion |
| **AI / LLM** | Groq SDK (LLaMA 3.1-8B-Instant) + Gemini 1.5 Flash |
| **Database ORM** | Prisma 5 |
| **Database** | PostgreSQL (Supabase / Neon) |
| **Auth** | NextAuth.js v4 (Google OAuth + Credentials) |
| **Code Editor** | Monaco Editor (VS Code engine) |
| **Charts** | Recharts |
| **PDF Parsing** | pdf-parse |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com) (free tier available)
- A PostgreSQL database — [Supabase](https://supabase.com) (free tier) or [Neon](https://neon.tech) (free tier)
- A Google OAuth app (for Google Sign-In) — [setup guide](https://console.cloud.google.com)

### 1. Clone the repository

```bash
git clone https://github.com/Jameers-code/interview_app.git
cd interview_app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# .env.local

# Groq AI (required for live AI responses)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# PostgreSQL connection string (Supabase or Neon)
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres

# NextAuth
NEXTAUTH_SECRET=generate-a-random-32-char-string
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional — app works without it via email login)
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxx

# Set to "true" if GROQ_API_KEY is configured server-side
NEXT_PUBLIC_HAS_DEFAULT_KEY=true
```

> **Generate NEXTAUTH_SECRET:**
> ```bash
> openssl rand -base64 32
> ```

### 4. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Jameers-code/interview_app)

### Manual deploy

1. Push your code to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Set `NEXTAUTH_URL` to your production domain (e.g. `https://mockmind.vercel.app`)
5. Deploy

> **Note:** Vercel serverless functions are stateless — make sure `DATABASE_URL` points to a hosted PostgreSQL instance (Supabase or Neon), **not** a local SQLite file.

---

## 🎯 Supported Roles

MockMind generates role-specific questions tailored to each domain:

| Role | Question Types |
|---|---|
| **Frontend / Backend / Full Stack Engineer** | Coding challenges, DSA, system design |
| **DevOps Engineer** | CI/CD pipelines, Kubernetes, cloud architecture |
| **Data Scientist / ML Engineer** | Python/pandas, model evaluation, pipeline design |
| **Data Analyst** | SQL queries, window functions, ETL architecture |
| **Financial Analyst** | DCF modeling, WACC, 3-statement models |
| **Corporate Accountant** | Ledger reconciliation, GAAP, balance sheet modeling |
| **Product Manager** | Product metrics, roadmap prioritization, user research |

---

## 📁 Project Structure

```
interview_app/
├── prisma/
│   ├── schema.prisma          # Database schema (User + Session models)
│   └── migrations/            # DB migration history
├── public/
│   └── product_preview.png    # Landing page preview image
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth route handler
│   │   │   ├── evaluate-answer/   # AI answer scoring endpoint
│   │   │   ├── generate-questions/ # AI question generation endpoint
│   │   │   ├── generate-report/   # AI final report endpoint
│   │   │   ├── parse-resume/      # PDF/TXT parsing endpoint
│   │   │   └── user/sessions/     # Session history endpoint
│   │   ├── dashboard/         # Candidate analytics dashboard
│   │   ├── interview/         # Live interview simulator
│   │   ├── results/           # Post-interview report page
│   │   ├── setup/             # Interview configuration wizard
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── Header.tsx         # Global navigation + auth modal
│   │   ├── ScoreChart.tsx     # Recharts performance trend chart
│   │   ├── SessionList.tsx    # Past sessions table component
│   │   └── ...
│   └── lib/
│       ├── auth.ts            # NextAuth config (Google + Credentials)
│       ├── groq.ts            # Groq/Gemini AI abstraction layer
│       └── prisma.ts          # Prisma client singleton
├── .env.example               # Environment variable template
├── next.config.mjs            # Next.js configuration
└── vercel.json                # Vercel deployment configuration
```

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | Groq API key for LLaMA 3.1 |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret for JWT signing |
| `NEXTAUTH_URL` | ✅ | Full URL of your deployment |
| `GOOGLE_CLIENT_ID` | ⬜ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ⬜ | Google OAuth client secret |
| `NEXT_PUBLIC_HAS_DEFAULT_KEY` | ⬜ | Set `true` if Groq key is server-configured |

---

## 🧪 Running Without an API Key

MockMind includes a **sandbox mode** — if no API key is configured, the app falls back to intelligent mock responses so you can explore the full UI without any setup.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Jameer**

- GitHub: [@Jameers-code](https://github.com/Jameers-code)

---

<div align="center">
  <strong>⭐ Star this repo if you found it useful!</strong>
  <br/>
  <em>Built with 🧠 and powered by AI.</em>
</div>
