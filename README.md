# CinePulse — Netflix-Lite TMDB Media Discovery SPA

A high-performance media discovery single-page application built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Vite**. Features infinite scroll data hydration, debounced search (500ms), local favorites persistence, Gemini-powered AI Mood Matching, and resilient exponential backoff rate-limit handling.

---

## 🔒 Security & Architecture

This application strictly adheres to production security best practices:

- **Zero Client Secret Leakage**: Secret keys (`TMDB_API_KEY`, `GEMINI_API_KEY`) are **never** prefixed with `VITE_` and are **never** baked into client browser bundles.
- **Serverless API Proxying**:
  - **In Production (Vercel)**: All requests flow through Node.js Serverless Functions in `/api/*` (`/api/movies/popular`, `/api/movies/search`, `/api/ai/mood-match`, `/api/config/status`).
  - **In Local Development (Vite)**: Intercepted and handled via connect middleware in `vite.config.ts`, avoiding the need for a separate backend process.
- **Exponential Backoff & Rate-Limit Resilience**: Requests to external APIs (and client calls to `/api/*`) automatically retry on HTTP 429 (Rate Limited) or 5xx server errors with exponential backoff, random jitter, and `Retry-After` header parsing.
- **Graceful Offline Fallback**: If external API keys are not provided or the network is unreachable, CinePulse runs seamlessly using a curated high-fidelity offline movie catalog and heuristic mood matcher.

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Environment Variables Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and populate your API credentials:

```env
# TMDB REST API Key (v3 API key or v4 Bearer Token)
TMDB_API_KEY=your_tmdb_api_key_here

# Google Gemini API Key for AI Mood Matcher
GEMINI_API_KEY=your_gemini_api_key_here
```

#### How to get a TMDB API Key:
1. Create a free account at [themoviedb.org](https://www.themoviedb.org/signup).
2. Go to **Settings > API** at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
3. Click **Create** or request an API Key (Developer).
4. Copy either your **API Key (v3 auth)** or **API Read Access Token (v4 auth)** into `TMDB_API_KEY`.

#### How to get a Google Gemini API Key:
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key**.
3. Copy the key into `GEMINI_API_KEY`.

*(Note: CinePulse functions fully in curated demo mode even if you haven't added keys yet.)*

### 3. Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server on http://localhost:3000
npm run dev
```

### 4. Running the Test Suite

CinePulse includes unit tests covering debounce coalescing, exponential backoff, TMDB image formatting, and favorites persistence:

```bash
npm test
```

### 5. Production Build

```bash
npm run build
```

Generates optimized static assets in `dist/` ready for static CDN deployment alongside Vercel serverless functions.

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com/new), click **Add New Project** and import your repository.
3. Configure the build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `TMDB_API_KEY` = your TMDB key
   - `GEMINI_API_KEY` = your Gemini key
5. Click **Deploy**. Vercel will automatically route `/api/*` requests to the serverless function handlers in `/api/`.

---

## ⚖️ TMDB API Attribution & Compliance

This product uses the TMDB API but is not endorsed or certified by TMDB.

All film posters, backdrop artwork, titles, synopses, and ratings are provided courtesy of [The Movie Database (TMDB)](https://www.themoviedb.org).
