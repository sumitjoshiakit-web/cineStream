import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { MOCK_MOVIES } from './src/data/mockMovies';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Vite Dev Server Middleware Plugin: Provides seamless /api/* routing in Vite Dev
function viteApiPlugin(): Plugin {
  return {
    name: 'vite-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost:3000');
        const pathname = urlObj.pathname;

        // /api/config/status
        if (pathname === '/api/config/status') {
          const tmdbKey = process.env.TMDB_API_KEY?.trim();
          const geminiKey = process.env.GEMINI_API_KEY?.trim();
          const hasTmdbKey = Boolean(tmdbKey && tmdbKey !== 'MY_TMDB_API_KEY');
          const hasGeminiKey = Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY');

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ hasTmdbKey, hasGeminiKey, isDemoMode: !hasTmdbKey }));
          return;
        }

        // /api/movies/popular
        if (pathname === '/api/movies/popular') {
          const page = Math.max(1, parseInt(urlObj.searchParams.get('page') || '1'));
          const apiKey = process.env.TMDB_API_KEY?.trim();

          if (apiKey && apiKey !== 'MY_TMDB_API_KEY') {
            try {
              const tmdbUrl = new URL(`${TMDB_BASE_URL}/movie/popular`);
              tmdbUrl.searchParams.set('page', String(page));
              tmdbUrl.searchParams.set('language', 'en-US');

              const headers: Record<string, string> = { Accept: 'application/json' };
              if (apiKey.startsWith('ey') || apiKey.length > 50) {
                headers['Authorization'] = `Bearer ${apiKey}`;
              } else {
                tmdbUrl.searchParams.set('api_key', apiKey);
              }

              const tmdbRes = await fetch(tmdbUrl.toString(), { headers });
              if (tmdbRes.ok) {
                const data = await tmdbRes.json();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ...data, source: 'tmdb' }));
                return;
              }
            } catch (err) {
              console.warn('Vite proxy TMDB error:', err);
            }
          }

          const PAGE_SIZE = 10;
          const total_pages = Math.ceil(MOCK_MOVIES.length / PAGE_SIZE);
          const startIndex = (page - 1) * PAGE_SIZE;
          const results = startIndex < MOCK_MOVIES.length
            ? MOCK_MOVIES.slice(startIndex, startIndex + PAGE_SIZE)
            : [];

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            page,
            results,
            total_pages,
            total_results: MOCK_MOVIES.length,
            source: 'demo',
          }));
          return;
        }

        // /api/movies/search
        if (pathname === '/api/movies/search') {
          const query = (urlObj.searchParams.get('query') || '').trim();
          const page = Math.max(1, parseInt(urlObj.searchParams.get('page') || '1'));
          const apiKey = process.env.TMDB_API_KEY?.trim();

          if (!query) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Search query is required' }));
            return;
          }

          if (apiKey && apiKey !== 'MY_TMDB_API_KEY') {
            try {
              const tmdbUrl = new URL(`${TMDB_BASE_URL}/search/movie`);
              tmdbUrl.searchParams.set('query', query);
              tmdbUrl.searchParams.set('page', String(page));
              tmdbUrl.searchParams.set('include_adult', 'false');
              tmdbUrl.searchParams.set('language', 'en-US');

              const headers: Record<string, string> = { Accept: 'application/json' };
              if (apiKey.startsWith('ey') || apiKey.length > 50) {
                headers['Authorization'] = `Bearer ${apiKey}`;
              } else {
                tmdbUrl.searchParams.set('api_key', apiKey);
              }

              const tmdbRes = await fetch(tmdbUrl.toString(), { headers });
              if (tmdbRes.ok) {
                const data = await tmdbRes.json();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ...data, source: 'tmdb' }));
                return;
              }
            } catch (err) {
              console.warn('Vite proxy TMDB search error:', err);
            }
          }

          const lower = query.toLowerCase();
          const matched = MOCK_MOVIES.filter((m) =>
            m.title.toLowerCase().includes(lower) ||
            m.overview.toLowerCase().includes(lower) ||
            (m.original_title && m.original_title.toLowerCase().includes(lower))
          );

          const PAGE_SIZE = 10;
          const total_pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
          const startIndex = (page - 1) * PAGE_SIZE;
          const results = startIndex < matched.length
            ? matched.slice(startIndex, startIndex + PAGE_SIZE)
            : [];

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            page,
            results,
            total_pages,
            total_results: matched.length,
            source: 'demo',
          }));
          return;
        }

        // /api/ai/mood-match
        if (pathname === '/api/ai/mood-match' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            let mood = '';
            try {
              const parsed = JSON.parse(body);
              mood = parsed.mood || '';
            } catch {
              mood = body;
            }

            const geminiKey = process.env.GEMINI_API_KEY?.trim();
            if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
              try {
                const ai = new GoogleGenAI({ apiKey: geminiKey });
                const prompt = `The user is describing their current mood, vibe, or aesthetic: "${mood}".
Recommend exactly ONE celebrated, widely recognized movie title that best captures this exact mood or emotion.
Return JSON with two fields:
- movieTitle: The standard English recognized title of the movie (e.g., "Blade Runner 2049", "Interstellar", "Amélie", "The Grand Budapest Hotel").
- reason: A concise 1-2 sentence compelling rationale explaining why this film fits their mood.`;

                const response = await ai.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents: prompt,
                  config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                        movieTitle: { type: Type.STRING },
                        reason: { type: Type.STRING },
                      },
                      required: ['movieTitle', 'reason'],
                    },
                  },
                });

                const parsed = JSON.parse(response.text || '{}');
                if (parsed.movieTitle) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ movieTitle: parsed.movieTitle, reason: parsed.reason, source: 'gemini' }));
                  return;
                }
              } catch (err) {
                console.warn('Vite Gemini Mood Matcher error:', err);
              }
            }

            // Fallback
            const lower = (mood || '').toLowerCase();
            let movieTitle = 'Inception';
            let reason = 'A mind-bending cinematic journey exploring dreams, subconscious depths, and architectural wonders.';

            if (lower.includes('cyber') || lower.includes('rain') || lower.includes('neon') || lower.includes('noir') || lower.includes('melanchol')) {
              movieTitle = 'Blade Runner 2049';
              reason = 'Drenched in atmospheric neon, haunting synth scores, and contemplative existential beauty.';
            } else if (lower.includes('space') || lower.includes('cosmic') || lower.includes('epic') || lower.includes('wonder') || lower.includes('time')) {
              movieTitle = 'Interstellar';
              reason = 'An emotional, grand odyssey that reaches across the cosmos fueled by love and scientific devotion.';
            } else if (lower.includes('warm') || lower.includes('cozy') || lower.includes('comfort') || lower.includes('heart') || lower.includes('sweet') || lower.includes('love')) {
              movieTitle = 'Spirited Away';
              reason = 'A mesmerizing, heartwarming masterpiece overflowing with nostalgic warmth and pure visual magic.';
            } else if (lower.includes('dark') || lower.includes('gritty') || lower.includes('justice') || lower.includes('revenge') || lower.includes('night')) {
              movieTitle = 'The Dark Knight';
              reason = 'An electrifying battle between chaos and moral discipline in a shadowy, rain-soaked metropolis.';
            } else if (lower.includes('fun') || lower.includes('colorful') || lower.includes('laugh') || lower.includes('party') || lower.includes('bright')) {
              movieTitle = 'Barbie';
              reason = 'A wildly vibrant, witty visual spectacle that balances hilarious comedy with genuine emotional resonance.';
            } else if (lower.includes('intense') || lower.includes('twist') || lower.includes('smart') || lower.includes('mystery')) {
              movieTitle = 'Parasite';
              reason = 'A razor-sharp, suspenseful masterpiece that will keep you on the edge of your seat with every scene.';
            } else if (lower.includes('action') || lower.includes('speed') || lower.includes('hero') || lower.includes('energy')) {
              movieTitle = 'Spider-Man: Across the Spider-Verse';
              reason = 'A kinetic explosion of jaw-dropping animation styles, rhythmic beats, and multidimensional stakes.';
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ movieTitle, reason, source: 'curated' }));
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), viteApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
      'process.env.TMDB_API_KEY': JSON.stringify(process.env.TMDB_API_KEY || ''),
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
