import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MovieGrid } from './components/MovieGrid';
import { MoodMatcherBar } from './components/MoodMatcherBar';
import { MovieModal } from './components/MovieModal';
import { ApiStatusModal } from './components/ApiStatusModal';
import { TmdbAttributionBadge } from './components/TmdbAttributionBadge';
import { useDebounce } from './utils/debounce';
import { useFavorites } from './hooks/useFavorites';
import { Movie, TMDBResponse, ApiStatus } from './types';
import { GENRES } from './data/mockMovies';
import { Sparkles, Heart, Filter, RefreshCw } from 'lucide-react';
import { fetchPopularMovies, searchMovies, getApiStatus } from './services/movieService';

export default function App() {
  // Navigation and view state
  const [activeView, setActiveView] = useState<'discover' | 'favorites'>('discover');
  const [isMoodMatcherOpen, setIsMoodMatcherOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Search and Debounce state (Sprint Phase 2: 500ms delay)
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 500);
  const isDebouncing = searchQuery !== debouncedQuery;

  // AI Mood Matcher state
  const [activeMoodMatch, setActiveMoodMatch] = useState<{
    mood: string;
    title: string;
    reason: string;
  } | null>(null);

  // Genre filter state
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);

  // Movie catalog & Infinite Scroll state (Sprint Phase 2: Infinite Scroll)
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Environment Status
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);

  // Favorites Hook (Sprint Phase 2: localStorage persistence)
  const { favorites, toggleFavorite, isFavorite, clearFavorites } = useFavorites();

  // Check API keys status on mount
  useEffect(() => {
    getApiStatus()
      .then((data: ApiStatus) => setApiStatus(data))
      .catch((err) => console.warn('Could not fetch config status', err));
  }, []);

  // Fetch movies helper (page 1 or pagination append)
  const fetchMovies = useCallback(
    async (targetPage: number, query: string, isNewQuery: boolean) => {
      if (isNewQuery) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const trimmed = query.trim();
        const data: TMDBResponse = trimmed
          ? await searchMovies(trimmed, targetPage)
          : await fetchPopularMovies(targetPage);

        setMovies((prev) => {
          if (isNewQuery) {
            return data.results || [];
          }
          // Deduplicate items on infinite scroll append
          const existingIds = new Set(prev.map((m) => m.id));
          const newItems = (data.results || []).filter((m) => !existingIds.has(m.id));
          return [...prev, ...newItems];
        });

        setPage(data.page || targetPage);
        setTotalPages(data.total_pages || 1);
      } catch (err: any) {
        console.error('Failed to fetch movies:', err);
        setError('Failed to load movies. Please check your connection or try again.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Trigger fetch when debounced query changes
  useEffect(() => {
    setPage(1);
    fetchMovies(1, debouncedQuery, true);
  }, [debouncedQuery, fetchMovies]);

  // Infinite Scroll "Load More" handler triggered by IntersectionObserver
  const handleLoadMore = useCallback(() => {
    if (activeView !== 'discover') return;
    if (isLoading || isLoadingMore) return;
    if (page >= totalPages) return;

    const nextPage = page + 1;
    fetchMovies(nextPage, debouncedQuery, false);
  }, [activeView, isLoading, isLoadingMore, page, totalPages, debouncedQuery, fetchMovies]);

  // AI Mood Match selected
  const handleMoodMatch = useCallback((movieTitle: string, moodText: string, reason: string) => {
    setActiveMoodMatch({
      mood: moodText,
      title: movieTitle,
      reason,
    });
    // Silently inject movieTitle into the TMDB search bar
    setSearchQuery(movieTitle);
    setActiveView('discover');
  }, []);

  const handleClearActiveMoodMatch = useCallback(() => {
    setActiveMoodMatch(null);
    setSearchQuery('');
  }, []);

  // Filter movies by genre if selected (client-side polish)
  const displayedMovies = useMemo(() => {
    if (activeView === 'favorites') {
      if (selectedGenreId === null) return favorites;
      return favorites.filter((m) => m.genre_ids?.includes(selectedGenreId));
    }

    if (selectedGenreId === null) return movies;
    return movies.filter((m) => m.genre_ids?.includes(selectedGenreId));
  }, [activeView, favorites, movies, selectedGenreId]);

  // Top movie for Hero Spotlight
  const heroMovie = useMemo(() => {
    if (activeView === 'favorites') {
      return favorites.length > 0 ? favorites[0] : null;
    }
    // In search mode, don't display massive hero to keep grid focused
    if (debouncedQuery.trim()) return null;
    return movies.length > 0 ? movies[0] : null;
  }, [activeView, favorites, movies, debouncedQuery]);

  const hasMore = page < totalPages;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-red-600 selection:text-white">
      {/* Sticky Header with Search & Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          if (activeView === 'favorites') setActiveView('discover');
        }}
        onClearSearch={() => {
          setSearchQuery('');
          setActiveMoodMatch(null);
        }}
        isDebouncing={isDebouncing}
        favoritesCount={favorites.length}
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          setSelectedGenreId(null);
        }}
        isMoodMatcherOpen={isMoodMatcherOpen}
        onToggleMoodMatcher={() => setIsMoodMatcherOpen((prev) => !prev)}
        apiStatus={apiStatus}
        onOpenStatusModal={() => setIsStatusModalOpen(true)}
      />

      {/* Secondary AI Mood Matcher Panel */}
      {isMoodMatcherOpen && (
        <MoodMatcherBar
          onMoodMatch={handleMoodMatch}
          activeMatch={activeMoodMatch}
          onClearActiveMatch={handleClearActiveMoodMatch}
        />
      )}

      {/* Hero Featured Movie (shown in Discover view without search query) */}
      {heroMovie && !debouncedQuery.trim() && (
        <HeroBanner
          movie={heroMovie}
          isFavorite={isFavorite(heroMovie.id)}
          onToggleFavorite={toggleFavorite}
          onSelectMovie={setSelectedMovie}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Section Header & Genre Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {activeView === 'favorites'
                  ? 'My Saved Favorites'
                  : debouncedQuery.trim()
                  ? `Search Results for "${debouncedQuery}"`
                  : 'Popular Titles'}
              </h2>
              {activeView === 'favorites' && favorites.length > 0 && (
                <button
                  id="clear-all-favorites-btn"
                  type="button"
                  onClick={clearFavorites}
                  className="text-xs text-zinc-500 hover:text-red-400 underline ml-2 cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeView === 'favorites'
                ? `${favorites.length} movies stored locally in browser state`
                : apiStatus?.hasTmdbKey
                ? 'Live TMDB catalogue with on-demand infinite scroll'
                : 'Curated high-fidelity TMDB discovery catalogue'}
            </p>
          </div>

          {/* Genre Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 no-scrollbar">
            <button
              id="genre-filter-all"
              type="button"
              onClick={() => setSelectedGenreId(null)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedGenreId === null
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Genres
            </button>
            {GENRES.slice(0, 8).map((genre) => (
              <button
                key={genre.id}
                id={`genre-filter-${genre.id}`}
                type="button"
                onClick={() =>
                  setSelectedGenreId(selectedGenreId === genre.id ? null : genre.id)
                }
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedGenreId === genre.id
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              id="retry-fetch-btn"
              type="button"
              onClick={() => fetchMovies(1, debouncedQuery, true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-900/60 hover:bg-red-900 rounded-md text-xs font-medium text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Movie Grid with Infinite Scroll & Skeletons */}
        <MovieGrid
          movies={displayedMovies}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={activeView === 'discover' ? hasMore : false}
          onLoadMore={handleLoadMore}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          onSelectMovie={setSelectedMovie}
          emptyMessage={
            activeView === 'favorites'
              ? 'You have not added any movies to your favorites list yet. Click the heart icon on any movie card to pin it here.'
              : `No titles found matching "${searchQuery}". Try a different keyword or mood!`
          }
          onResetSearch={() => {
            setSearchQuery('');
            setSelectedGenreId(null);
            setActiveMoodMatch(null);
            setActiveView('discover');
          }}
        />
      </main>

      {/* Footer with TMDB Attribution & Architecture notes */}
      <footer className="w-full bg-zinc-950 border-t border-zinc-900 py-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="font-black tracking-wider text-white">CINEPULSE</span>
              <span>•</span>
              <span>High-Performance Media Discovery</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-zinc-500">
              <span>Infinite Scroll Hydration</span>
              <span>•</span>
              <span>500ms Search Debounce</span>
              <span>•</span>
              <span>Gemini AI Mood Matcher</span>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <TmdbAttributionBadge />
            <span className="text-[11px] text-zinc-400">
              All external API secrets strictly isolated to serverless proxy layer.
            </span>
          </div>
        </div>
      </footer>

      {/* Movie Details Modal */}
      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        isFavorite={selectedMovie ? isFavorite(selectedMovie.id) : false}
        onToggleFavorite={toggleFavorite}
      />

      {/* API Key Security & Configuration Modal */}
      <ApiStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        status={apiStatus}
      />
    </div>
  );
}
