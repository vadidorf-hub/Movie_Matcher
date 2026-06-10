import { NextRequest, NextResponse } from 'next/server';
import { getRecommendationsForMovies } from '../../../../services/tmdb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const movieIds = searchParams.get('movieIds')?.split(',') || [];
  const swipedIds = searchParams.get('swipedIds')?.split(',') || [];

  try {
    const recs = await getRecommendationsForMovies(movieIds, swipedIds);
    return NextResponse.json(recs);
  } catch (error: any) {
    console.error('API Error in recommendations proxy:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
