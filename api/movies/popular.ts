const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: any, res: any) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const urlObj = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
  const parsedPage = Number.parseInt(urlObj.searchParams.get('page') || req.query?.page || '1', 10);
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const apiKey = process.env.TMDB_API_KEY?.trim();

  if (!apiKey || apiKey === 'MY_TMDB_API_KEY') {
    return sendJson(res, 503, { error: 'TMDB API key is not configured', page, results: [], total_pages: 0, total_results: 0 });
  }

  try {
    const tmdbUrl = new URL(`${TMDB_BASE_URL}/movie/popular`);
    tmdbUrl.searchParams.set('page', String(page));
    tmdbUrl.searchParams.set('language', 'en-US');

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey.startsWith('ey') || apiKey.length > 50) {
      headers.Authorization = `Bearer ${apiKey}`;
    } else {
      tmdbUrl.searchParams.set('api_key', apiKey);
    }

    const tmdbRes = await fetch(tmdbUrl.toString(), { headers });
    const body = await tmdbRes.json().catch(() => ({}));

    if (!tmdbRes.ok) {
      console.error('TMDB popular request failed:', tmdbRes.status, body?.status_message || '');
      return sendJson(res, 502, { error: 'TMDB popular movies request failed', upstreamStatus: tmdbRes.status });
    }

    return sendJson(res, 200, { ...body, source: 'tmdb' });
  } catch (error) {
    console.error('TMDB popular request error:', error);
    return sendJson(res, 502, { error: 'Unable to reach TMDB right now' });
  }
}
