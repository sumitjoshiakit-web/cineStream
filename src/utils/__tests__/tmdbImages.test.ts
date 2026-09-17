import { describe, it, expect } from 'vitest';
import { getPosterUrl, getBackdropUrl } from '../tmdbImages';

describe('TMDB Image Utilities', () => {
  it('constructs valid TMDB CDN poster URLs for valid paths', () => {
    const path = '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg';
    const url = getPosterUrl(path, 'w500');
    expect(url).toBe('https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg');
  });

  it('constructs valid TMDB CDN backdrop URLs for valid paths', () => {
    const path = '/xOMo8BRK7PfcJv9JCnx7s5200SV.jpg';
    const url = getBackdropUrl(path, 'original');
    expect(url).toBe('https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5200SV.jpg');
  });

  it('returns a fallback placeholder image when poster path is null or empty', () => {
    const urlNull = getPosterUrl(null);
    const urlEmpty = getPosterUrl('');

    expect(urlNull).toContain('unsplash.com');
    expect(urlEmpty).toContain('unsplash.com');
  });

  it('returns a fallback placeholder image when backdrop path is null or empty', () => {
    const urlNull = getBackdropUrl(null);
    const urlEmpty = getBackdropUrl('');

    expect(urlNull).toContain('unsplash.com');
    expect(urlEmpty).toContain('unsplash.com');
  });
});
