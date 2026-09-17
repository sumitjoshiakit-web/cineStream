import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  let mood = '';
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        mood = parsed.mood || '';
      } catch {
        mood = req.body;
      }
    } else {
      mood = req.body.mood || '';
    }
  }

  mood = (mood || '').trim();
  if (!mood) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Mood description is required' }));
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
        return res.status
          ? res.status(200).json({ movieTitle: parsed.movieTitle, reason: parsed.reason, source: 'gemini' })
          : res.end(JSON.stringify({ movieTitle: parsed.movieTitle, reason: parsed.reason, source: 'gemini' }));
      }
    } catch (err) {
      console.warn('Gemini mood match serverless error:', err);
    }
  }

  // Heuristic mood fallback
  const lower = mood.toLowerCase();
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

  const payload = { movieTitle, reason, source: 'curated' };
  res.setHeader('Content-Type', 'application/json');
  return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
}
