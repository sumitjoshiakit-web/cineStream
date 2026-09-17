import React from 'react';

interface TmdbAttributionBadgeProps {
  variant?: 'compact' | 'full' | 'card';
  className?: string;
}

export const TmdbAttributionBadge: React.FC<TmdbAttributionBadgeProps> = ({
  variant = 'compact',
  className = '',
}) => {
  return (
    <div
      id="tmdb-compliance-attribution"
      className={`flex flex-col sm:flex-row items-center gap-3 ${className}`}
    >
      {/* Official TMDB Logo Mark */}
      <a
        href="https://www.themoviedb.org"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 shrink-0 opacity-90 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-sky-500 rounded"
        title="The Movie Database (TMDB)"
        aria-label="The Movie Database (TMDB) official website"
      >
        <svg
          className="h-4 w-auto text-[#01b4e4]"
          viewBox="0 0 185 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8.2 3.1H0V0.5H19.5V3.1H11.3V14.5H8.2V3.1Z"
            fill="currentColor"
          />
          <path
            d="M33.4 14.5H30.4L24.8 5.6H24.7L24.8 14.5H21.9V0.5H24.9L30.5 9.4H30.6L30.5 0.5H33.4V14.5Z"
            fill="#90cea1"
          />
          <path
            d="M48.7 0.5C53.3 0.5 56.6 3.6 56.6 7.5C56.6 11.4 53.3 14.5 48.7 14.5H41.6V0.5H48.7ZM48.6 12C51.6 12 53.5 9.9 53.5 7.5C53.5 5.1 51.6 3 48.6 3H44.6V12H48.6Z"
            fill="currentColor"
          />
          <path
            d="M62.6 14.5V0.5H69.4C72.5 0.5 74.8 1.8 74.8 4.2C74.8 5.8 73.7 7 72 7.4V7.5C74.1 7.8 75.4 9.3 75.4 11C75.4 13.5 73 14.5 69.8 14.5H62.6ZM65.6 6.3H68.8C70.6 6.3 71.7 5.5 71.7 4.2C71.7 2.9 70.6 2.3 68.8 2.3H65.6V6.3ZM65.6 12.7H69.1C71.1 12.7 72.3 11.9 72.3 10.5C72.3 9.1 71.1 8.2 69.1 8.2H65.6V12.7Z"
            fill="#90cea1"
          />
        </svg>
      </a>

      {/* Mandatory TMDB Legal Attribution Text */}
      <p className="text-[11px] text-zinc-400 text-center sm:text-left leading-relaxed">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </div>
  );
};
