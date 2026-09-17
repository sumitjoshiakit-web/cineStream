import { MOCK_MOVIES } from '../../src/data/mockMovies.ts';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export default async function handler(req: any, res: any) {
  const urlObj = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const query = (urlObj.searchParams.get('query') || req.query?.query || '').trim();
  const page = Math.max(1, parseInt(urlObj.searchParams.get('page') || req.query?.page || '1'));
  const apiKey = process.env.TMDB_API_KEY?.trim();

  if (!query) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Search query is required' }));
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
        return res.status ? res.status(200).json({ ...data, source: 'tmdb' }) : res.end(JSON.stringify({ ...data, source: 'tmdb' }));
      }
    } catch (err) {
      console.warn('TMDB search proxy error:', err);
    }
  }

  // Fallback local search
  const lowerQuery = query.toLowerCase();
  const matched = MOCK_MOVIES.filter((m) =>
    m.title.toLowerCase().includes(lowerQuery) ||
    m.overview.toLowerCase().includes(lowerQuery) ||
    (m.original_title && m.original_title.toLowerCase().includes(lowerQuery))
  );

  const PAGE_SIZE = 10;
  const total_pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const results = startIndex < matched.length
    ? matched.slice(startIndex, startIndex + PAGE_SIZE)
    : [];

  const payload = {
    page,
    results,
    total_pages,
    total_results: matched.length,
    source: 'demo',
  };

  res.setHeader('Content-Type', 'application/json');
  return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
}
