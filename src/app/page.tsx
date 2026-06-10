'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Movie, SwipeDirection, FilterState } from '../types';
import SwipeDeck from '../components/SwipeDeck';
import Filters from '../components/Filters';
import Watchlist from '../components/Watchlist';
import MovieDetailsModal from '../components/MovieDetailsModal';
import RecommendationsModal from '../components/RecommendationsModal';
import { Heart, Filter, Film, Sparkles, User, LogOut, Cloud, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import AuthModal from '../components/AuthModal';

const initialFilters: FilterState = {
  genres: [],
  minRating: 7.0,
  decade: 'all',
};

export default function Home() {
  const {
    user,
    isSyncing,
    watchlist,
    history,
    removeFromWatchlist,
    addSwipeToHistory,
    undoLastSwipe,
    resetUserData,
    logOut,
  } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [liveMovies, setLiveMovies] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [fetchingNextPage, setFetchingNextPage] = useState(false);
  const [consecutiveEmptyFetches, setConsecutiveEmptyFetches] = useState(0);

  // Modals, Drawers & Loading State
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileWatchlistOpen, setIsMobileWatchlistOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Recommendations Modal States
  const [isRecommendationsModalOpen, setIsRecommendationsModalOpen] = useState(false);
  const [hasShownRecommendationsModal, setHasShownRecommendationsModal] = useState(false);

  // Set mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch recommendations once watchlist length is 10 or more using our API endpoint
  useEffect(() => {
    const loadRecommendations = async () => {
      if (watchlist.length >= 10) {
        try {
          const movieIds = watchlist.map((m) => m.id).join(',');
          const swipedIds = history.map((h) => h.movie.id).join(',');
          
          const res = await fetch(`/api/movies/recommendations?movieIds=${movieIds}&swipedIds=${swipedIds}`);
          if (!res.ok) throw new Error('Failed to fetch recommendations from server proxy');
          
          const recs = await res.json();
          setRecommendations(recs);
        } catch (error) {
          console.error('Failed to load recommendations from local API:', error);
        }
      } else {
        setRecommendations([]);
      }
    };

    if (isMounted) {
      loadRecommendations();
    }
  }, [watchlist.length, history.length, isMounted]);

  // Automatically open recommendations modal when watchlist hits exactly 10
  useEffect(() => {
    if (isMounted && watchlist.length === 10 && recommendations.length > 0 && !hasShownRecommendationsModal) {
      setIsRecommendationsModalOpen(true);
      setHasShownRecommendationsModal(true);
    }
    
    // Reset the "has shown" state if the watchlist falls below 10 (e.g. user removes film)
    if (isMounted && watchlist.length < 10) {
      setHasShownRecommendationsModal(false);
    }
  }, [watchlist.length, recommendations.length, hasShownRecommendationsModal, isMounted]);

  // Whenever filters change, reset deck, page, and load page 1 for the new filters
  useEffect(() => {
    if (!isMounted) return;
    
    const loadFilteredMovies = async () => {
      setIsLoading(true);
      setPage(1);
      setConsecutiveEmptyFetches(0);
      try {
        const genresStr = filters.genres.join(',');
        const queryParams = new URLSearchParams({
          page: '1',
          minRating: filters.minRating.toString(),
          decade: filters.decade,
        });
        if (genresStr) {
          queryParams.append('genres', genresStr);
        }
        
        const res = await fetch(`/api/movies/popular?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch filtered movies');
        const movies = await res.json();
        setLiveMovies(movies);
      } catch (error) {
        console.error('Failed to load filtered movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFilteredMovies();
  }, [filters, isMounted]);

  // Calculate deck size and movies remaining based on swiped items and active filters
  const filteredDeck = useMemo(() => {
    return liveMovies.filter((movie) => {
      // 1. Filter out swiped movies
      const isSwiped = history.some((h) => h.movie.id === movie.id);
      if (isSwiped) return false;

      // 2. Filter by selected genres (OR match)
      if (
        filters.genres.length > 0 &&
        !filters.genres.some((g) => movie.genres.includes(g))
      ) {
        return false;
      }

      // 3. Filter by minimum rating
      if (movie.rating < filters.minRating) return false;

      // 4. Filter by release decade
      if (filters.decade !== 'all') {
        const year = movie.releaseYear;
        if (filters.decade === '1970s' && (year < 1970 || year > 1979)) return false;
        if (filters.decade === '1990s' && (year < 1990 || year > 1999)) return false;
        if (filters.decade === '2000s' && (year < 2000 || year > 2009)) return false;
        if (filters.decade === '2010s' && (year < 2010 || year > 2019)) return false;
        if (filters.decade === '2020s' && (year < 2020 || year > 2029)) return false;
      }

      return true;
    });
  }, [liveMovies, history, filters]);

  // Infinite Scroll / Endless Deck Loading Effect querying our local API endpoint
  useEffect(() => {
    const loadNextPage = async () => {
      // If the deck matches count is running low (< 5 films) and we're not currently fetching
      // and we haven't hit a consecutive empty fetch safety limit (5 empty pages in a row)
      if (
        isMounted &&
        !isLoading &&
        !fetchingNextPage &&
        filteredDeck.length < 5 &&
        consecutiveEmptyFetches < 5
      ) {
        setFetchingNextPage(true);
        try {
          const nextPage = page + 1;
          const genresStr = filters.genres.join(',');
          const queryParams = new URLSearchParams({
            page: nextPage.toString(),
            minRating: filters.minRating.toString(),
            decade: filters.decade,
          });
          if (genresStr) {
            queryParams.append('genres', genresStr);
          }
          
          const res = await fetch(`/api/movies/popular?${queryParams.toString()}`);
          if (!res.ok) throw new Error('Failed to fetch next page from server proxy');
          const nextPageMovies = await res.json();

          if (nextPageMovies.length === 0) {
            // No more pages left on TMDB API
            setConsecutiveEmptyFetches(5);
            return;
          }

          // Evaluate how many movies on the new page match the active filters
          const existingIds = liveMovies.map((m) => m.id);
          const newMatching = nextPageMovies.filter((movie: Movie) => {
            if (existingIds.includes(movie.id)) return false;
            if (filters.genres.length > 0 && !filters.genres.some((g) => movie.genres.includes(g))) return false;
            if (movie.rating < filters.minRating) return false;
            if (filters.decade !== 'all') {
              const year = movie.releaseYear;
              if (filters.decade === '1970s' && (year < 1970 || year > 1979)) return false;
              if (filters.decade === '1990s' && (year < 1990 || year > 1999)) return false;
              if (filters.decade === '2000s' && (year < 2000 || year > 2009)) return false;
              if (filters.decade === '2010s' && (year < 2010 || year > 2019)) return false;
              if (filters.decade === '2020s' && (year < 2020 || year > 2029)) return false;
            }
            return true;
          });

          // If none of the movies on this page matched our filters, increment consecutiveEmptyFetches
          if (newMatching.length === 0) {
            setConsecutiveEmptyFetches((prev) => prev + 1);
          } else {
            setConsecutiveEmptyFetches(0);
          }

          // Prepend movies to liveMovies state so active card (last elements) stay on top of the stack
          setLiveMovies((prev) => {
            const currentIds = prev.map((m) => m.id);
            const uniques = nextPageMovies.filter((m: Movie) => !currentIds.includes(m.id));
            return [...uniques, ...prev];
          });
          setPage(nextPage);
        } catch (error) {
          console.error('Failed to load next page of popular movies:', error);
        } finally {
          setFetchingNextPage(false);
        }
      }
    };

    loadNextPage();
  }, [
    filteredDeck.length,
    isMounted,
    isLoading,
    fetchingNextPage,
    page,
    liveMovies,
    filters,
    consecutiveEmptyFetches,
  ]);

  // Swipe Action Handler
  const handleSwipe = async (direction: SwipeDirection, movie: Movie) => {
    await addSwipeToHistory(movie, direction);
  };

  // Save a recommended film to the watchlist directly
  const handleSaveRecommendation = async (movie: Movie) => {
    await addSwipeToHistory(movie, 'right');
    setRecommendations((prev) => prev.filter((m) => m.id !== movie.id));
  };

  // Rewind / Undo Swipe Action Handler
  const handleUndo = async () => {
    await undoLastSwipe();
  };

  // Remove a movie from watchlist directly
  const handleRemoveFromWatchlist = async (movieId: string) => {
    await removeFromWatchlist(movieId);
  };

  // Start Over / Reset Watchlist and Swiped Progress using our API endpoint
  const handleStartOver = async () => {
    if (window.confirm('Are you sure you want to start over? This will clear your entire watchlist, recommendations, and reset the swipe deck.')) {
      setIsLoading(true);
      await resetUserData();
      setRecommendations([]);
      setIsRecommendationsModalOpen(false);
      setHasShownRecommendationsModal(false);
      
      try {
        const genresStr = filters.genres.join(',');
        const queryParams = new URLSearchParams({
          page: '1',
          minRating: filters.minRating.toString(),
          decade: filters.decade,
        });
        if (genresStr) {
          queryParams.append('genres', genresStr);
        }
        
        const res = await fetch(`/api/movies/popular?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Failed to reload popular movies from server proxy');
        const firstPageMovies = await res.json();
        setLiveMovies(firstPageMovies);
        setPage(1);
        setConsecutiveEmptyFetches(0);
      } catch (error) {
        console.error('Failed to reload popular movies:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Reset filters to defaults
  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  // Loading spinner to avoid layout shift and hydration error
  if (!isMounted || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-sm font-semibold tracking-wider text-zinc-300 animate-pulse">Syncing Live TMDB API...</p>
        </div>
      </div>
    );
  }

  // Active filter badge count
  const activeFiltersCount = 
    (filters.genres.length > 0 ? 1 : 0) + 
    (filters.minRating > 7.0 ? 1 : 0) + 
    (filters.decade !== 'all' ? 1 : 0);

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans overflow-hidden selection:bg-violet-600/30">
      
      {/* Dynamic Header with Custom Brand Logo Option 4 */}
      <header className="h-[72px] flex-shrink-0 glass-panel border-b border-white/5 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-white/10 shadow-md">
            <Image
              src="/logo.png"
              alt="Movie Matchmaker Logo"
              fill
              sizes="36px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none bg-gradient-to-r from-violet-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              MOVIE MATCHMAKER
            </h1>
            <span className="text-4xs font-semibold tracking-widest text-zinc-500 uppercase">
              Swipe your next cinema night
            </span>
          </div>
        </div>

        {/* Desktop Controls (Auth & Sync) */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="relative flex items-center gap-3">
              {/* Cloud Sync Status */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-white/5 py-1.5 px-3 rounded-xl">
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-violet-400" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-zinc-500 font-semibold uppercase tracking-wider text-4xs">Cloud Active</span>
                  </>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-100 hover:text-white py-1.5 px-3 rounded-xl transition-all cursor-pointer text-sm font-semibold"
                >
                  <div className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-black text-white uppercase shadow-md shadow-violet-500/20">
                    {user.email?.[0] || <User className="h-3 w-3" />}
                  </div>
                  <span className="max-w-32 truncate text-xs text-zinc-300">
                    {user.email}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400 transition-transform duration-200" style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'none' }} />
                </button>

                {isUserMenuOpen && (
                  <>
                    {/* Menu Backdrop to close it when clicking outside */}
                    <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)} />
                    
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-2 shadow-2xl z-45 animate-scale-in">
                      <div className="px-3 py-2 border-b border-white/5 text-4xs text-zinc-500 font-bold uppercase tracking-wider">
                        Account Info
                      </div>
                      <div className="px-3 py-2 text-2xs text-zinc-300 truncate">
                        {user.email}
                      </div>
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          if (window.confirm('Reset local progress and logout?')) {
                            await logOut();
                          }
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 text-xs transition-all cursor-pointer"
            >
              <User className="h-4 w-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Auth Button for Mobile */}
          {user ? (
            <button
              onClick={async () => {
                if (window.confirm('Logout from Movie Matchmaker?')) {
                  await logOut();
                }
              }}
              className="p-2 rounded-xl bg-zinc-900 border border-white/5 text-red-400 hover:bg-red-500/10 cursor-pointer"
              title="Log Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2 rounded-xl bg-violet-600 text-white font-bold cursor-pointer"
              title="Sign In"
            >
              <User className="h-4.5 w-4.5" />
            </button>
          )}

          {/* Filters Toggle Button */}
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
              isMobileFiltersOpen 
                ? 'bg-violet-600/20 border-violet-500 text-violet-400' 
                : 'bg-zinc-900 border-white/5 text-zinc-400'
            }`}
          >
            <Filter className="h-4.5 w-4.5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-3xs font-extrabold text-white animate-scale-in">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Watchlist Toggle Button */}
          <button
            onClick={() => setIsMobileWatchlistOpen(true)}
            className="relative p-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white cursor-pointer"
          >
            <Heart className="h-4.5 w-4.5" />
            {watchlist.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-3xs font-extrabold text-white animate-scale-in">
                {watchlist.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Grid Wrapper - Height Locked to Fill Screen */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto overflow-hidden relative h-[calc(100vh-72px)]">
        
        {/* Left Column: Filters (Desktop) */}
        <aside className="hidden md:block w-76 p-6 flex-shrink-0 border-r border-white/5 overflow-y-auto h-full bg-zinc-950">
          <Filters
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
          />
        </aside>

        {/* Center Column: Swipe deck viewport */}
        <main className="flex-grow flex items-center justify-center p-6 h-full bg-zinc-950/20">
          <SwipeDeck
            movies={filteredDeck}
            onSwipe={handleSwipe}
            onUndo={handleUndo}
            canUndo={history.length > 0}
            onResetDeck={handleStartOver}
          />
        </main>

        {/* Right Column: Watchlist Sidebar (Desktop) */}
        <aside className="hidden lg:block w-80 flex-shrink-0 border-l border-white/5 h-full bg-zinc-950">
          <Watchlist
            watchlist={watchlist}
            onRemove={handleRemoveFromWatchlist}
            onSelectMovie={setSelectedMovie}
            recommendations={recommendations}
            onSaveRecommendation={handleSaveRecommendation}
            onStartOver={handleStartOver}
          />
        </aside>

        {/* Mobile Slide-in Filters Menu */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-45 md:hidden flex flex-col justify-start pt-20 p-4 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-2 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              <Filters
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
              />
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full mt-4 py-3 bg-violet-600 text-white font-bold rounded-xl shadow-lg cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Mobile Drawer Watchlist overlay */}
        {isMobileWatchlistOpen && (
          <div className="fixed inset-0 z-45 lg:hidden flex justify-end">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
              onClick={() => setIsMobileWatchlistOpen(false)}
            />
            <div className="relative w-full max-w-xs h-full bg-zinc-950 shadow-2xl animate-in slide-in-from-right duration-250 z-50">
              <Watchlist
                watchlist={watchlist}
                onRemove={handleRemoveFromWatchlist}
                onSelectMovie={(movie) => {
                  setSelectedMovie(movie);
                  setIsMobileWatchlistOpen(false);
                }}
                onCloseMobileDrawer={() => setIsMobileWatchlistOpen(false)}
                recommendations={recommendations}
                onSaveRecommendation={handleSaveRecommendation}
                onStartOver={handleStartOver}
              />
            </div>
          </div>
        )}
      </div>

      {/* Watchlist Selected Movie Detailed Info Modal */}
      <MovieDetailsModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />

      {/* 10 Likes Curated Recommendations Popup Modal */}
      <RecommendationsModal
        isOpen={isRecommendationsModalOpen}
        onClose={() => setIsRecommendationsModalOpen(false)}
        recommendations={recommendations}
        watchlist={watchlist}
        onSaveRecommendation={handleSaveRecommendation}
      />

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
