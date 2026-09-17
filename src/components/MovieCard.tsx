import React, { useState } from 'react';
import { Heart, Star, Calendar } from 'lucide-react';
import { Movie } from '../types';
import { getPosterUrl } from '../utils/tmdbImages';
import { GENRE_MAP } from '../data/mockMovies';

interface MovieCardProps {
  movie: Movie;
  isFavorite: boolean;
  onToggleFavorite: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isFavorite,
  onToggleFavorite,
  onSelectMovie,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const posterUrl = getPosterUrl(movie.poster_path, 'w500');
  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
  const rating = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : '—';
  
  // Rating color coding
  const getRatingColor = (score: number) => {
    if (score >= 8.0) return 'text-emerald-400 bg-emerald-950/70 border-emerald-800/60';
    if (score >= 7.0) return 'text-amber-300 bg-amber-950/70 border-amber-800/60';
    return 'text-zinc-300 bg-zinc-900/80 border-zinc-700/60';
  };

  const primaryGenre = movie.genre_ids && movie.genre_ids.length > 0 ? GENRE_MAP[movie.genre_ids[0]] : null;

  return (
    <div
      id={`movie-card-${movie.id}`}
      onClick={() => onSelectMovie(movie)}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-600 transition-all duration-300 hover:shadow-xl hover:shadow-black/60 hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectMovie(movie);
        }
      }}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 animate-pulse text-zinc-600">
            <span className="text-xs uppercase tracking-wider font-mono">Loading...</span>
          </div>
        )}
        <img
          src={posterUrl}
          alt={`${movie.title} Poster`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30 opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Top bar over poster: Rating Badge & Favorite Action */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border backdrop-blur-md shadow-sm ${getRatingColor(
              movie.vote_average
            )}`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>{rating}</span>
          </div>

          <button
            id={`fav-btn-${movie.id}`}
            type="button"
            aria-label={isFavorite ? `Remove ${movie.title} from favorites` : `Add ${movie.title} to favorites`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(movie);
            }}
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 border ${
              isFavorite
                ? 'bg-red-950/80 border-red-500/60 text-red-500 shadow-md shadow-red-950/50 scale-105'
                : 'bg-zinc-900/80 border-zinc-700/60 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-200 ${
                isFavorite ? 'fill-current scale-110' : 'hover:scale-110'
              }`}
            />
          </button>
        </div>

        {/* Primary Genre Tag over bottom of poster */}
        {primaryGenre && (
          <div className="absolute bottom-2 left-2.5 z-10">
            <span className="text-[11px] font-medium tracking-wide px-2 py-0.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-zinc-300 backdrop-blur-md">
              {primaryGenre}
            </span>
          </div>
        )}
      </div>

      {/* Movie Details Footer */}
      <div className="flex flex-col flex-1 p-3.5 justify-between">
        <div>
          <h3
            className="font-medium text-sm text-zinc-100 line-clamp-1 group-hover:text-red-400 transition-colors"
            title={movie.title}
          >
            {movie.title}
          </h3>
          {movie.original_title && movie.original_title !== movie.title && (
            <p className="text-[11px] text-zinc-500 line-clamp-1 italic mt-0.5">
              {movie.original_title}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60 text-xs text-zinc-400">
          <span className="flex items-center gap-1 text-zinc-400">
            <Calendar className="w-3 h-3 text-zinc-500" />
            {releaseYear}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">
            {movie.vote_count ? `${movie.vote_count.toLocaleString()} votes` : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
