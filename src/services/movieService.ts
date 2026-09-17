import { Movie, TMDBResponse, MoodMatchResponse, ApiStatus } from '../types';
import { MOCK_MOVIES } from '../data/mockMovies';
import { fetchWithRetry } from '../utils/fetchWithRetry';

/**
 * PRODUCTION SECURITY ARCHITECTURE:
 * To prevent critical API key exposure (especially billing-linked Gemini and TMDB keys),
 * all external API operations are exclusively proxied through server-side /api/* routes
 * (Vercel Serverless Functions in production, Vite Connect Middleware in local development).
 * 
 * The client browser NEVER accesses, stores, or transmits raw secret keys.
 * If server endpoints are unreachable (e.g. offline, initial setup, or network timeout),
 * the service gracefully falls back to the curated high-fidelity dataset and heuristic mood matcher.
 */

/**
 * Check API configuration status from the server endpoint
 */
export async function getApiStatus(): Promise<ApiStatus> {
  try {
    const res = await fetchWithRetry('/api/config/status', undefined, { maxRetries: 1 });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch server API status:', err);
  }

  // Safe fallback status when offline or server unreachable
  return {
    hasTmdbKey: false,
    hasGeminiKey: false,
    isDemoMode: true,
  };
}

/**
 * Fetch Popular Movies with Infinite Scroll pagination and exponential backoff
 */
export async function fetchPopularMovies(page: number = 1): Promise<TMDBResponse> {
  try {
    const res = await fetchWithRetry(`/api/movies/popular?page=${page}`, undefined, {
      maxRetries: 2,
      initialDelayMs: 300,
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Popular movies API request failed, falling back to curated dataset:', err);
  }

  // Graceful fallback to curated dataset pagination
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
 * Search Movies with Debouncing and exponential backoff
 */
export async function searchMovies(query: string, page: number = 1): Promise<TMDBResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return fetchPopularMovies(1);
  }

  try {
    const res = await fetchWithRetry(
      `/api/movies/search?query=${encodeURIComponent(trimmed)}&page=${page}`,
      undefined,
      { maxRetries: 2, initialDelayMs: 300 }
    );

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Search API request failed, falling back to curated local search:', err);
  }

  // Graceful fallback to curated search
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
 * AI Mood Matcher: queries the serverless Gemini endpoint with exponential backoff,
 * falling back to heuristic mood matching if server or AI is unavailable.
 */
export async function matchMood(mood: string): Promise<MoodMatchResponse> {
  const text = mood.trim();
  if (!text) {
    throw new Error('Mood prompt is required');
  }

  try {
    const res = await fetchWithRetry(
      '/api/ai/mood-match',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: text }),
      },
      { maxRetries: 2, initialDelayMs: 500 }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.movieTitle) {
        return data;
      }
    }
  } catch (err) {
    console.warn('AI Mood Matcher endpoint failed, using heuristic fallback:', err);
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
