import React, { useState } from 'react';
import { Sparkles, Loader2, Compass, X } from 'lucide-react';
import { matchMood } from '../services/movieService';

interface MoodMatcherBarProps {
  onMoodMatch: (title: string, moodText: string, reason: string) => void;
  activeMatch: { mood: string; title: string; reason: string } | null;
  onClearActiveMatch: () => void;
}

const QUICK_MOODS = [
  'Rainy cyberpunk noir with atmospheric synth',
  'Mind-bending sci-fi with philosophical questions',
  'Heartwarming cozy nostalgic animation',
  'Tense psychological crime cat-and-mouse game',
  'Epic cosmic journey across space and time',
];

export const MoodMatcherBar: React.FC<MoodMatcherBarProps> = ({
  onMoodMatch,
  activeMatch,
  onClearActiveMatch,
}) => {
  const [moodInput, setMoodInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (moodToSubmit: string) => {
    const text = moodToSubmit.trim();
    if (!text) return;

    setLoading(true);
    setError(null);

    try {
      const data = await matchMood(text);
      if (data.movieTitle) {
        onMoodMatch(data.movieTitle, text, data.reason);
      } else {
        throw new Error('No movie recommendation returned');
      }
    } catch (err: any) {
      console.error('Mood matcher failed', err);
      setError('Could not reach AI Mood Matcher. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="mood-matcher-section" className="w-full bg-zinc-900/60 border-y border-zinc-800/80 backdrop-blur-sm py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Active AI Recommendation Banner */}
        {activeMatch && (
          <div
            id="active-mood-match-banner"
            className="mb-3 p-3.5 rounded-xl bg-gradient-to-r from-red-950/70 via-zinc-900 to-zinc-900 border border-red-800/50 flex items-start justify-between gap-3 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-600/20 text-red-400 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                    AI Mood Match
                  </span>
                  <span className="text-xs text-zinc-400">for &ldquo;{activeMatch.mood}&rdquo;</span>
                </div>
                <p className="text-sm font-semibold text-white mt-0.5">
                  Recommendation: <span className="text-red-400 underline decoration-red-500/50">{activeMatch.title}</span>
                </p>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {activeMatch.reason}
                </p>
              </div>
            </div>
            <button
              id="clear-mood-match-btn"
              type="button"
              onClick={onClearActiveMatch}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Reset to popular catalog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input & Action */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(moodInput);
          }}
          className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-red-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <input
              id="mood-matcher-input"
              type="text"
              value={moodInput}
              onChange={(e) => setMoodInput(e.target.value)}
              placeholder="Describe your mood, vibe, or aesthetic (e.g. 'rainy noir loneliness', 'mind-bending sci-fi')..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/80 transition-all"
            />
          </div>

          <button
            id="match-mood-submit-btn"
            type="submit"
            disabled={loading || !moodInput.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium text-sm transition-all duration-200 shrink-0 shadow-md shadow-red-950/50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Consulting Gemini...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>Match Mood</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2.5 pb-1 no-scrollbar text-xs">
          <span className="text-zinc-500 font-medium shrink-0 flex items-center gap-1">
            Quick Vibes:
          </span>
          {QUICK_MOODS.map((vibe, idx) => (
            <button
              key={idx}
              id={`vibe-chip-${idx}`}
              type="button"
              onClick={() => {
                setMoodInput(vibe);
                handleSubmit(vibe);
              }}
              className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              {vibe}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
