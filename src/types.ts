export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  genre_ids: number[];
  popularity?: number;
  adult?: boolean;
}

export interface TMDBResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
  source?: 'tmdb' | 'demo';
}

export interface MoodMatchResponse {
  movieTitle: string;
  reason: string;
  source?: 'gemini' | 'curated';
}

export interface ApiStatus {
  hasTmdbKey: boolean;
  hasGeminiKey: boolean;
  isDemoMode: boolean;
}

export interface Genre {
  id: number;
  name: string;
}
