import React, { useEffect } from 'react';
import { X, Star, Calendar, Heart, Film, ExternalLink } from 'lucide-react';
import { Movie } from '../types';
import { getBackdropUrl, getPosterUrl } from '../utils/tmdbImages';
import { GENRE_MAP } from '../data/mockMovies';

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (movie: Movie) => void;
}

export const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (movie) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movie, onClose]);

  if (!movie) return null;

  const backdrop = getBackdropUrl(movie.backdrop_path, 'original');
  const poster = getPosterUrl(movie.poster_path, 'w500');
  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
  const tmdbLink = `https://www.themoviedb.org/movie/${movie.id}`;

  return (
    <div
      id="movie-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="movie-modal-content"
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-700/80 shadow-2xl text-zinc-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Banner Header */}
        <div className="relative aspect-video sm:aspect-[21/9] w-full overflow-hidden bg-zinc-950">
          <img
            src={backdrop}
            alt={`${movie.title} backdrop`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

          {/* Close button */}
          <button
            id="close-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="Close details modal"
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-950/70 border border-zinc-700/60 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 -mt-12 sm:-mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Poster Thumbnail */}
            <div className="shrink-0 w-32 sm:w-44 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-zinc-800 bg-zinc-950 hidden xs:block">
              <img
                src={poster}
                alt={movie.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info and Actions */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {movie.title}
                </h2>
                {movie.original_title && movie.original_title !== movie.title && (
                  <p className="text-xs sm:text-sm text-zinc-400 italic mt-0.5">
                    Original title: {movie.original_title}
                  </p>
                )}
              </div>

              {/* Badges & Scores */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-amber-300 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'} / 10</span>
                </div>

                <div className="flex items-center gap-1 text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{movie.release_date || releaseYear}</span>
                </div>

                {movie.vote_count ? (
                  <span className="text-zinc-500 font-mono">
                    {movie.vote_count.toLocaleString()} TMDB votes
                  </span>
                ) : null}
              </div>

              {/* Genre Chips */}
              {movie.genre_ids && movie.genre_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {movie.genre_ids.map((id) => (
                    <span
                      key={id}
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800/90 text-zinc-300 border border-zinc-700/80"
                    >
                      {GENRE_MAP[id] || 'Film'}
                    </span>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Synopsis
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {movie.overview || 'No synopsis provided for this title.'}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-800">
                <button
                  id="modal-favorite-toggle-btn"
                  type="button"
                  onClick={() => onToggleFavorite(movie)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                    isFavorite
                      ? 'bg-red-950/80 border-red-500/60 text-red-400'
                      : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                  <span>{isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}</span>
                </button>

                <a
                  href={tmdbLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>TMDB Entry</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              </div>

              <p className="text-[10px] text-zinc-500">
                Metadata provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
