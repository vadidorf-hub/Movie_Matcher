import { NextRequest, NextResponse } from 'next/server';
import { fetchLivePopularMovies } from '../../../../services/tmdb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const genresParam = searchParams.get('genres');
  const genres = genresParam ? genresParam.split(',') : undefined;
  
  const minRatingParam = searchParams.get('minRating');
  const minRating = minRatingParam ? parseFloat(minRatingParam) : undefined;
  
  const decade = searchParams.get('decade') || undefined;
  
  try {
    const movies = await fetchLivePopularMovies(page, { genres, minRating, decade });
    return NextResponse.json(movies);
  } catch (error: any) {
    console.error('API Error in popular movies proxy:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
