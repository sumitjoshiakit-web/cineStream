import { GoogleGenAI, Type } from '@google/genai';
import { Movie, TMDBResponse, MoodMatchResponse, ApiStatus } from '../types';
import { MOCK_MOVIES } from '../data/mockMovies';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Environment variable resolution for TMDB and Gemini API keys.
 * Supports server-side process.env, Vite define replacement, and import.meta.env.
 * 
 * SECURITY NOTICE:
 * When deployed on Vercel or running in Vite dev, API requests are routed through
 * server-side API routes (/api/*) to keep API keys secure.
 * For pure static hosting (e.g. static S3/GitHub Pages without serverless functions),
 * client-side failover safely falls back to curated catalog data or direct client keys if provided.
 */
function getTmdbKey(): string {
  const envKey = (typeof process !== 'undefined' && process.env?.TMDB_API_KEY) ||
    (import.meta as any).env?.VITE_TMDB_API_KEY ||
    '';
  return envKey.trim();
}

function getGeminiKey(): string {
  const envKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    '';
  return envKey.trim();
}

/**
 * Check API configuration status
 */
export async function getApiStatus(): Promise<ApiStatus> {
  // First try backend / serverless endpoint if available
  try {
    const res = await fetch('/api/config/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Pure static hosting fallback
  }

  const tmdbKey = getTmdbKey();
  const geminiKey = getGeminiKey();
  const hasTmdb = Boolean(tmdbKey && tmdbKey !== 'MY_TMDB_API_KEY');
  const hasGemini = Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY');

  return {
    hasTmdbKey: hasTmdb,
    hasGeminiKey: hasGemini,
    isDemoMode: !hasTmdb,
  };
}

/**
 * Fetch Popular Movies with Infinite Scroll pagination
 */
export async function fetchPopularMovies(page: number = 1): Promise<TMDBResponse> {
  // Try server-side/serverless endpoint first
  try {
    const res = await fetch(`/api/movies/popular?page=${page}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fall through to client fallback
  }

  // Client-side execution (e.g. on static Vercel/Vite preview without backend)
  const tmdbKey = getTmdbKey();
  if (tmdbKey && tmdbKey !== 'MY_TMDB_API_KEY') {
    try {
      const url = new URL(`${TMDB_BASE_URL}/movie/popular`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('language', 'en-US');

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (tmdbKey.startsWith('ey') || tmdbKey.length > 50) {
        headers['Authorization'] = `Bearer ${tmdbKey}`;
      } else {
        url.searchParams.set('api_key', tmdbKey);
      }

      const tmdbRes = await fetch(url.toString(), { headers });
      if (tmdbRes.ok) {
        const data = await tmdbRes.json();
        return { ...data, source: 'tmdb' };
      }
    } catch (err) {
      console.warn('Direct TMDB fetch failed, falling back to curated dataset', err);
    }
  }

  // Curated dataset pagination fallback
  const PAGE_SIZE = 10;
  const total_pages = Math.ceil(MOCK_MOVIES.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const results = startIndex < MOCK_MOVIES.length
    ? MOCK_MOVIES.slice(startIndex, startIndex + PAGE_SIZE)
    : [];

  return {
    page,
    results,
    total_pages,
    total_results: MOCK_MOVIES.length,
    source: 'demo',
  };
}

/**
 * Search Movies with Debouncing support and Infinite Scroll pagination
 */
export async function searchMovies(query: string, page: number = 1): Promise<TMDBResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return fetchPopularMovies(1);
  }

  // Try server-side/serverless endpoint first
  try {
    const res = await fetch(`/api/movies/search?query=${encodeURIComponent(trimmed)}&page=${page}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fall through to client fallback
  }

  // Client-side execution
  const tmdbKey = getTmdbKey();
  if (tmdbKey && tmdbKey !== 'MY_TMDB_API_KEY') {
    try {
      const url = new URL(`${TMDB_BASE_URL}/search/movie`);
      url.searchParams.set('query', trimmed);
      url.searchParams.set('page', String(page));
      url.searchParams.set('include_adult', 'false');
      url.searchParams.set('language', 'en-US');

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (tmdbKey.startsWith('ey') || tmdbKey.length > 50) {
        headers['Authorization'] = `Bearer ${tmdbKey}`;
      } else {
        url.searchParams.set('api_key', tmdbKey);
      }

      const tmdbRes = await fetch(url.toString(), { headers });
      if (tmdbRes.ok) {
        const data = await tmdbRes.json();
        return { ...data, source: 'tmdb' };
      }
    } catch (err) {
      console.warn('Direct TMDB search failed, falling back to local search', err);
    }
  }

  // Curated search fallback
  const lower = trimmed.toLowerCase();
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

  return {
    page,
    results,
    total_pages,
    total_results: matched.length,
    source: 'demo',
  };
}

/**
 * AI Mood Matcher: takes a mood prompt and returns a single recommended movie title and reason
 */
export async function matchMood(mood: string): Promise<MoodMatchResponse> {
  const text = mood.trim();
  if (!text) {
    throw new Error('Mood prompt is required');
  }

  // Try server-side/serverless endpoint first
  try {
    const res = await fetch('/api/ai/mood-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood: text }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fall through to client fallback
  }

  // Client-side Gemini invocation if GEMINI_API_KEY is present
  const geminiKey = getGeminiKey();
  if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `The user is describing their current mood, vibe, or aesthetic: "${text}".
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
        return {
          movieTitle: parsed.movieTitle,
          reason: parsed.reason,
          source: 'gemini',
        };
      }
    } catch (err) {
      console.warn('Client-side Gemini call failed, using heuristic fallback', err);
    }
  }

  // Intelligent heuristic mood matcher fallback
  const lower = text.toLowerCase();
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

  return {
    movieTitle,
    reason,
    source: 'curated',
  };
}
