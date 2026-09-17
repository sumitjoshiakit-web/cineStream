import React from 'react';
import { X, CheckCircle2, AlertCircle, ShieldCheck, Key, Film, Sparkles } from 'lucide-react';
import { ApiStatus } from '../types';

interface ApiStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ApiStatus | null;
}

export const ApiStatusModal: React.FC<ApiStatusModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="api-status-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="api-status-modal-content"
        className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700/80 p-6 shadow-2xl text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">
              Environment & Security Status
            </h3>
          </div>
          <button
            id="close-status-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            In accordance with production security standards, all API keys are strictly managed via server-side environment variables and never exposed to the client browser.
          </p>

          {/* TMDB API Key status */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-red-500" />
                <span className="font-mono text-xs font-semibold text-zinc-200">
                  TMDB_API_KEY
                </span>
              </div>
              {status?.hasTmdbKey ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Live TMDB Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Curated Demo Mode
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {status?.hasTmdbKey
                ? 'Server is actively proxying live TMDB REST endpoints for 800k+ media titles.'
                : 'Using built-in curated TMDB movie dataset with authentic poster paths. Add TMDB_API_KEY to your environment secrets to query live TMDB.'}
            </p>
          </div>

          {/* GEMINI_API_KEY status */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-xs font-semibold text-zinc-200">
                  GEMINI_API_KEY
                </span>
              </div>
              {status?.hasGeminiKey ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Gemini Flash Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Smart Mood Fallback Ready
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Powers the AI &ldquo;Mood Matcher&rdquo; feature, mapping subjective moods and aesthetics to critically acclaimed film titles.
            </p>
          </div>

          {/* TMDB Legal Attribution Card */}
          <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-400">
                TMDB API Compliance & Attribution
              </span>
              <a
                href="https://www.themoviedb.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-sky-400 underline hover:text-sky-300"
              >
                themoviedb.org
              </a>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              This product uses the TMDB API but is not endorsed or certified by TMDB. All movie metadata, poster art, and ratings are provided by The Movie Database community.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            id="dismiss-status-modal-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
