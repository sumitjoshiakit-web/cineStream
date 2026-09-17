import { describe, it, expect, beforeEach } from 'vitest';
import { Movie } from '../../types';

// Mock movie fixture
const sampleMovie1: Movie = {
  id: 693134,
  title: 'Dune: Part Two',
  original_title: 'Dune: Part Two',
  overview: 'Follow the mythic journey of Paul Atreides...',
  poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s5200SV.jpg',
  release_date: '2024-02-27',
  vote_average: 8.2,
  vote_count: 5120,
  genre_ids: [878, 12],
};

const sampleMovie2: Movie = {
  id: 157336,
  title: 'Interstellar',
  original_title: 'Interstellar',
  overview: 'The adventures of a group of explorers...',
  poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  backdrop_path: '/rAiYTua5htbt0STnmzzjWjR8mgr.jpg',
  release_date: '2014-11-05',
  vote_average: 8.4,
  vote_count: 34500,
  genre_ids: [12, 18, 878],
};

describe('Favorites State and Persistence Logic', () => {
  let mockStorage: Record<string, string> = {};
  const STORAGE_KEY = 'cinepulse_favorites_v1';

  beforeEach(() => {
    mockStorage = {};
  });

  function saveFavorites(list: Movie[]) {
    mockStorage[STORAGE_KEY] = JSON.stringify(list);
  }

  function loadFavorites(): Movie[] {
    const raw = mockStorage[STORAGE_KEY];
    return raw ? JSON.parse(raw) : [];
  }

  function toggle(list: Movie[], movie: Movie): Movie[] {
    const exists = list.some((m) => m.id === movie.id);
    return exists ? list.filter((m) => m.id !== movie.id) : [movie, ...list];
  }

  it('adds a movie to empty favorites list and serializes to JSON', () => {
    let list: Movie[] = [];
    list = toggle(list, sampleMovie1);

    expect(list.length).toBe(1);
    expect(list[0].id).toBe(693134);

    saveFavorites(list);
    const restored = loadFavorites();
    expect(restored.length).toBe(1);
    expect(restored[0].title).toBe('Dune: Part Two');
  });

  it('removes an existing movie when toggled again (idempotent unfavorite)', () => {
    let list = [sampleMovie1, sampleMovie2];
    list = toggle(list, sampleMovie1);

    expect(list.length).toBe(1);
    expect(list[0].id).toBe(157336);

    saveFavorites(list);
    const restored = loadFavorites();
    expect(restored.some((m) => m.id === 693134)).toBe(false);
    expect(restored.some((m) => m.id === 157336)).toBe(true);
  });

  it('correctly handles clear all favorites', () => {
    saveFavorites([sampleMovie1, sampleMovie2]);
    expect(loadFavorites().length).toBe(2);

    saveFavorites([]);
    expect(loadFavorites().length).toBe(0);
  });
});
