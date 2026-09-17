import React from 'react';
import { Play, Info, Heart, Star, Calendar } from 'lucide-react';
import { Movie } from '../types';
import { getBackdropUrl } from '../utils/tmdbImages';
import { GENRE_MAP } from '../data/mockMovies';

interface HeroBannerProps {
  movie: Movie | null;
  isFavorite: boolean;
  onToggleFavorite: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  isFavorite,
  onToggleFavorite,
  onSelectMovie,
}) => {
  if (!movie) return null;

  const backdropUrl = getBackdropUrl(movie.backdrop_path, 'original');
  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : '2024';

  return (
    <div id="hero-banner" className="relative w-full h-[55vh] min-h-[420px] max-h-[620px] overflow-hidden">
      {/* Cinematic Background Image */}
      <img
        src={backdropUrl}
        alt={`${movie.title} Backdrop`}
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105"
      />

      {/* Multi-layer Gradient Overlays for high contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent" />

      {/* Content Container */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
        <div className="max-w-2xl space-y-4">
          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide">
            <span className="px-2 py-0.5 rounded bg-red-600/90 text-white font-bold tracking-wider uppercase text-[10px]">
              Spotlight
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-700/60 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
            </div>
            <span className="flex items-center gap-1 text-zinc-300 font-medium">
              <Calendar className="w-3 h-3 text-zinc-400" />
              {releaseYear}
            </span>
            {movie.genre_ids?.slice(0, 2).map((id) => (
              <span
                key={id}
                className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-zinc-300"
              >
                {GENRE_MAP[id] || 'Film'}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-md">
            {movie.title}
          </h1>

          {/* Overview text */}
          <p className="text-sm md:text-base text-zinc-300 line-clamp-3 leading-relaxed drop-shadow">
            {movie.overview}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-details-btn"
              type="button"
              onClick={() => onSelectMovie(movie)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm transition-all duration-200 shadow-lg shadow-white/10 hover:scale-[1.02] active:scale-95"
            >
              <Info className="w-4 h-4 text-zinc-900" />
              <span>View Details</span>
            </button>

            <button
              id="hero-favorite-btn"
              type="button"
              onClick={() => onToggleFavorite(movie)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 border ${
                isFavorite
                  ? 'bg-red-950/90 border-red-500/80 text-red-400'
                  : 'bg-zinc-900/80 border-zinc-700 hover:bg-zinc-800 text-zinc-200 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
              <span>{isFavorite ? 'In Favorites' : 'Add to Favorites'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
