import React from 'react';
import { Film, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface MovieGridProps {
  movies: Movie[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isFavorite: (id: number) => boolean;
  onToggleFavorite: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
  emptyMessage?: string;
  onResetSearch?: () => void;
}

export const MovieGrid: React.FC<MovieGridProps> = ({
  movies,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  isFavorite,
  onToggleFavorite,
  onSelectMovie,
  emptyMessage,
  onResetSearch,
}) => {
  // Sentinel for Infinite Scroll
  const sentinelRef = useIntersectionObserver({
    onIntersect: onLoadMore,
    enabled: hasMore && !isLoading && !isLoadingMore,
    rootMargin: '300px',
  });

  // Initial Loading Skeleton Grid
  if (isLoading && movies.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 py-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-800 animate-pulse aspect-[2/3]"
          >
            <div className="w-full h-3/4 bg-zinc-800/60" />
            <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-end">
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && movies.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
          <Film className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-zinc-100">No movies found</h3>
        <p className="text-sm text-zinc-400 max-w-md mt-1 mb-5">
          {emptyMessage || "We couldn't find any movies matching your current filters or query."}
        </p>
        {onResetSearch && (
          <button
            id="empty-reset-btn"
            type="button"
            onClick={onResetSearch}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-colors"
          >
            Reset to Popular Movies
          </button>
        )}
      </div>
    );
  }

  return (
    <div id="movie-grid-container" className="space-y-8">
      {/* High Fidelity Movie Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            isFavorite={isFavorite(movie.id)}
            onToggleFavorite={onToggleFavorite}
            onSelectMovie={onSelectMovie}
          />
        ))}
      </div>

      {/* Infinite Scroll Hydration Skeletons (when fetching Page N+1) */}
      {isLoadingMore && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 pt-4 animate-in fade-in">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`loading-more-${i}`}
              className="flex flex-col rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-800 animate-pulse aspect-[2/3]"
            >
              <div className="w-full h-3/4 bg-zinc-800/60" />
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-end">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* IntersectionObserver Sentinel Target Element */}
      <div
        ref={sentinelRef}
        id="infinite-scroll-sentinel"
        className="w-full h-12 flex items-center justify-center text-xs text-zinc-500 font-medium"
      >
        {isLoadingMore ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
            <span>Hydrating Page N+1 from TMDB...</span>
          </div>
        ) : hasMore ? (
          <span className="opacity-0">Scroll for more</span>
        ) : movies.length > 0 ? (
          <div className="py-6 flex flex-col items-center gap-1 text-zinc-500 border-t border-zinc-800/80 w-full">
            <span className="text-xs uppercase tracking-widest font-mono">Catalog Complete</span>
            <span className="text-xs text-zinc-500">You have explored all available titles.</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
