import { NextRequest, NextResponse } from 'next/server';
import { fetchLivePopularMovies } from '../../../../services/tmdb';

export async function GET(req: NextRequest) {
  try {
    const [trending, topRated, scifi, action, drama, comedy] = await Promise.all([
      // Trending Now
      fetchLivePopularMovies(1, {}).catch(() => []),
      // Top Rated (IMDb 8.0+)
      fetchLivePopularMovies(1, { minRating: 8.0 }).catch(() => []),
      // Sci-Fi & Fantasy
      fetchLivePopularMovies(1, { genres: ['Sci-Fi', 'Science Fiction', 'Fantasy'] }).catch(() => []),
      // Action & Thriller
      fetchLivePopularMovies(1, { genres: ['Action', 'Thriller'] }).catch(() => []),
      // Dramas
      fetchLivePopularMovies(1, { genres: ['Drama'] }).catch(() => []),
      // Comedies
      fetchLivePopularMovies(1, { genres: ['Comedy'] }).catch(() => []),
    ]);

    return NextResponse.json({
      trending: trending.slice(0, 12),
      topRated: topRated.slice(0, 12),
      scifi: scifi.slice(0, 12),
      action: action.slice(0, 12),
      drama: drama.slice(0, 12),
      comedy: comedy.slice(0, 12),
    });
  } catch (error: any) {
    console.error('API Error in browse route:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
