import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(req: IncomingMessage, res: ServerResponse & { json?: (data: any) => void }) {
  const tmdbKey = process.env.TMDB_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  const hasTmdbKey = Boolean(tmdbKey && tmdbKey !== 'MY_TMDB_API_KEY');
  const hasGeminiKey = Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY');

  const data = {
    hasTmdbKey,
    hasGeminiKey,
    isDemoMode: !hasTmdbKey,
  };

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify(data));
}
