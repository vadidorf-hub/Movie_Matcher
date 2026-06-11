import { NextRequest, NextResponse } from 'next/server';
import { searchLiveMovies } from '../../../../services/tmdb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const movies = await searchLiveMovies(query, page);
    return NextResponse.json(movies);
  } catch (error: any) {
    console.error('API Error in search movies proxy:', error);
    return NextResponse.json({ error: error.message || 'Failed to search' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
