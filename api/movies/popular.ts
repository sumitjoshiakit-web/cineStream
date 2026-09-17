import { MOCK_MOVIES } from '../../src/data/mockMovies.ts';
import { fetchWithRetry } from '../../src/utils/fetchWithRetry.ts';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export default async function handler(req: any, res: any) {
  const urlObj = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const page = Math.max(1, parseInt(urlObj.searchParams.get('page') || req.query?.page || '1'));
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

      const tmdbRes = await fetchWithRetry(tmdbUrl.toString(), { headers }, {
        maxRetries: 3,
        initialDelayMs: 350,
      });

      if (tmdbRes.ok) {
        const data = await tmdbRes.json();
        res.setHeader('Content-Type', 'application/json');
        return res.status ? res.status(200).json({ ...data, source: 'tmdb' }) : res.end(JSON.stringify({ ...data, source: 'tmdb' }));
      }
    } catch (err) {
      console.warn('TMDB popular proxy error:', err);
    }
  }

  // Fallback pagination
  const PAGE_SIZE = 10;
  const total_pages = Math.ceil(MOCK_MOVIES.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const results = startIndex < MOCK_MOVIES.length
    ? MOCK_MOVIES.slice(startIndex, startIndex + PAGE_SIZE)
    : [];

  const payload = {
    page,
    results,
    total_pages,
    total_results: MOCK_MOVIES.length,
    source: 'demo',
  };

  res.setHeader('Content-Type', 'application/json');
  return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
}
