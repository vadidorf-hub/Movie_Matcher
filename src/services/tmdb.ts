import { Movie } from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZGY1ZDQ1ZGZiZTM4ZWE5OTVhODU5ODkyNjdkYjA5YiIsIm5iZiI6MTc3NzIyNzA5OC42MjMwMDAxLCJzdWIiOiI2OWVlNTU1YTkxNDY0NWYwNGExNTExNjkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.VkVizDAaNJ9-mUxare0AgEiiRuX0YlZEbjRGoiOjViA';

const headers = {
  accept: 'application/json',
  Authorization: `Bearer ${TMDB_TOKEN}`,
};

// Helper to construct image URLs with fallback placeholders
const getPosterUrl = (path: string | null): string => {
  return path 
    ? `https://image.tmdb.org/t/p/w500${path}`
    : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600&auto=format&fit=crop'; // fallback
};

const getBackdropUrl = (path: string | null): string => {
  return path
    ? `https://image.tmdb.org/t/p/w1280${path}`
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop'; // fallback
};

/**
 * Fetches the details, credits (cast/crew), and videos (trailers) for a specific TMDB movie ID,
 * then maps it to the application's native Movie type.
 */
export async function getMovieDetails(movieId: number): Promise<Movie> {
  const [detailsRes, creditsRes, videosRes] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/movie/${movieId}?language=en-US`, { headers }),
    fetch(`${TMDB_BASE_URL}/movie/${movieId}/credits?language=en-US`, { headers }),
    fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?language=en-US`, { headers })
  ]);

  if (!detailsRes.ok) {
    throw new Error(`Failed to fetch details for movie ID ${movieId}`);
  }

  const details = await detailsRes.json();
  const credits = creditsRes.ok ? await creditsRes.json() : { cast: [], crew: [] };
  const videos = videosRes.ok ? await videosRes.json() : { results: [] };

  // Find director
  const directorInfo = credits.crew.find((member: any) => member.job === 'Director');
  const director = directorInfo ? directorInfo.name : 'Unknown Director';

  // Get top 4 cast members
  const cast = credits.cast.slice(0, 4).map((member: any) => member.name);

  // Find official YouTube trailer
  const trailerVideo = videos.results.find(
    (video: any) => video.site === 'YouTube' && video.type === 'Trailer' && video.official
  ) || videos.results.find(
    (video: any) => video.site === 'YouTube' && video.type === 'Trailer'
  );

  const trailerUrl = trailerVideo 
    ? `https://www.youtube.com/embed/${trailerVideo.key}`
    : undefined;

  // Extract release year
  const releaseYear = details.release_date 
    ? new Date(details.release_date).getFullYear() 
    : 2026;

  return {
    id: details.id.toString(),
    title: details.title,
    overview: details.overview,
    rating: details.vote_average || 0.0,
    genres: details.genres.map((g: any) => g.name),
    releaseYear,
    posterUrl: getPosterUrl(details.poster_path),
    backdropUrl: getBackdropUrl(details.backdrop_path),
    director,
    runtime: details.runtime || 120,
    cast,
    trailerUrl,
  };
}

interface DiscoverFilters {
  genres?: string[];
  minRating?: number;
  decade?: string;
}

/**
 * Fetches popular movies from TMDB or discover endpoint if filters are set,
 * and resolves their details (cast, trailers, etc.) in parallel.
 */
export async function fetchLivePopularMovies(page = 1, filters?: DiscoverFilters): Promise<Movie[]> {
  try {
    let url = `${TMDB_BASE_URL}/movie/popular?language=en-US&page=${page}`;

    // If active filters are applied, utilize TMDB's server-side /discover/movie endpoint
    if (
      filters && 
      (
        (filters.genres && filters.genres.length > 0) || 
        (filters.minRating && filters.minRating > 7.0) || 
        (filters.decade && filters.decade !== 'all')
      )
    ) {
      const queryParams = new URLSearchParams();
      queryParams.append('language', 'en-US');
      queryParams.append('page', page.toString());
      queryParams.append('sort_by', 'popularity.desc');

      // 1. Genres mapping
      if (filters.genres && filters.genres.length > 0) {
        const genreMap: { [key: string]: number } = {
          'Action': 28,
          'Adventure': 12,
          'Animation': 16,
          'Comedy': 35,
          'Crime': 80,
          'Drama': 18,
          'Family': 10751,
          'Fantasy': 14,
          'Horror': 27,
          'Music': 10402,
          'Mystery': 9648,
          'Romance': 10749,
          'Sci-Fi': 878,
          'Science Fiction': 878,
          'Thriller': 53,
        };
        const genreIds = filters.genres
          .map((name) => genreMap[name])
          .filter(Boolean)
          .join(',');
        if (genreIds) {
          queryParams.append('with_genres', genreIds);
        }
      }

      // 2. Rating mapping (require at least 100 votes to filter out low-tier mock submissions)
      if (filters.minRating) {
        queryParams.append('vote_average.gte', filters.minRating.toString());
        queryParams.append('vote_count.gte', '100');
      }

      // 3. Release era/decade mapping
      if (filters.decade && filters.decade !== 'all') {
        let startYear = '';
        let endYear = '';
        if (filters.decade === '1970s') { startYear = '1970'; endYear = '1979'; }
        else if (filters.decade === '1990s') { startYear = '1990'; endYear = '1999'; }
        else if (filters.decade === '2000s') { startYear = '2000'; endYear = '2009'; }
        else if (filters.decade === '2010s') { startYear = '2010'; endYear = '2019'; }
        else if (filters.decade === '2020s') { startYear = '2020'; endYear = '2029'; }

        if (startYear && endYear) {
          queryParams.append('primary_release_date.gte', `${startYear}-01-01`);
          queryParams.append('primary_release_date.lte', `${endYear}-12-31`);
        }
      }

      url = `${TMDB_BASE_URL}/discover/movie?${queryParams.toString()}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch popular movies from TMDB');

    const data = await res.json();
    const movieResults = data.results || [];

    // Fetch full details, credits, and trailers in parallel for the first 20 movies
    const detailedMovies = await Promise.all(
      movieResults.map(async (movie: any) => {
        try {
          return await getMovieDetails(movie.id);
        } catch (err) {
          console.error(`Skipping movie ${movie.id} due to details fetch error:`, err);
          return null;
        }
      })
    );

    // Filter out any failed requests
    return detailedMovies.filter((m): m is Movie => m !== null);
  } catch (error) {
    console.error('Error in fetchLivePopularMovies:', error);
    return [];
  }
}

/**
 * Searches for live movies from TMDB and resolves their details.
 */
export async function searchLiveMovies(query: string, page = 1): Promise<Movie[]> {
  if (!query.trim()) return [];

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${page}`,
      { headers }
    );
    if (!res.ok) throw new Error('Failed to search movies from TMDB');

    const data = await res.json();
    const movieResults = data.results || [];

    // Resolve details in parallel
    const detailedMovies = await Promise.all(
      movieResults.map(async (movie: any) => {
        try {
          return await getMovieDetails(movie.id);
        } catch (err) {
          return null;
        }
      })
    );

    return detailedMovies.filter((m): m is Movie => m !== null);
  } catch (error) {
    console.error('Error in searchLiveMovies:', error);
    return [];
  }
}

/**
 * Fetches collaborative recommendations based on a list of liked movie IDs.
 * Compiles a list of recommendations, filters out already liked or swiped movies,
 * and fetches details for the top 5 recommended movies.
 */
export async function getRecommendationsForMovies(movieIds: string[], swipedIds: string[]): Promise<Movie[]> {
  if (movieIds.length === 0) return [];

  // Take up to 3 recently liked movies to pull recommendations (avoids hitting API request thresholds)
  const recentLikes = movieIds.slice(0, 3);

  try {
    const recommendationPromises = recentLikes.map(async (id) => {
      try {
        const res = await fetch(`${TMDB_BASE_URL}/movie/${id}/recommendations?language=en-US&page=1`, { headers });
        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
      } catch (err) {
        return [];
      }
    });

    const resultsArray = await Promise.all(recommendationPromises);
    const aggregatedResults = resultsArray.flat();

    // Map unique TMDB IDs to avoid duplicates
    const uniqueMap = new Map<number, any>();
    aggregatedResults.forEach((movie) => {
      if (!uniqueMap.has(movie.id)) {
        uniqueMap.set(movie.id, movie);
      }
    });

    const candidates = Array.from(uniqueMap.values()).filter((movie) => {
      const idStr = movie.id.toString();
      return !movieIds.includes(idStr) && !swipedIds.includes(idStr);
    });

    // Take the top 5 candidates and resolve their details (cast, trailers, runtime, etc.)
    const top5 = candidates.slice(0, 5);

    const detailedRecommendations = await Promise.all(
      top5.map(async (movie: any) => {
        try {
          return await getMovieDetails(movie.id);
        } catch (err) {
          return null;
        }
      })
    );

    return detailedRecommendations.filter((m): m is Movie => m !== null);
  } catch (error) {
    console.error('Error in getRecommendationsForMovies:', error);
    return [];
  }
}
