'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Movie, SwipeDirection, FilterState } from '../types';
import SwipeDeck from '../components/SwipeDeck';
import Filters from '../components/Filters';
import Watchlist from '../components/Watchlist';
import MovieDetailsModal from '../components/MovieDetailsModal';
import RecommendationsModal from '../components/RecommendationsModal';
import NetflixBrowse from '../components/NetflixBrowse';
import { 
  Heart, 
  Filter, 
  Film, 
  Sparkles, 
  User, 
  LogOut, 
  Cloud, 
  RefreshCw, 
  ChevronDown, 
  Search, 
  X, 
  Compass,
  Star,
  Play,
  Plus,
  Check,
  Palette
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import AuthModal from '../components/AuthModal';
import { motion, AnimatePresence } from 'framer-motion';

const initialFilters: FilterState = {
  genres: [],
  minRating: 7.0,
  decade: 'all',
};

type ActiveTab = 'swipe' | 'browse' | 'watchlist';

const themes = [
  { id: 'amethyst', name: 'Classic Amethyst', primary: '#9d4edd', secondary: '#ff007f', bg: '#07050f' },
  { id: 'cyberpunk', name: 'Cyberpunk Tokyo', primary: '#ff0055', secondary: '#00f0ff', bg: '#000000' },
  { id: 'hollywood', name: 'Hollywood Gold', primary: '#d4af37', secondary: '#e63946', bg: '#120202' },
  { id: 'aurora', name: 'Nordic Aurora', primary: '#06b6d4', secondary: '#10b981', bg: '#080f1a' },
];

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

  const [activeTab, setActiveTab] = useState<ActiveTab>('swipe');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [liveMovies, setLiveMovies] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [fetchingNextPage, setFetchingNextPage] = useState(false);
  const [consecutiveEmptyFetches, setConsecutiveEmptyFetches] = useState(0);

  // Modals & UI States
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playTrailerMovie, setPlayTrailerMovie] = useState<Movie | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Recommendations Modal States
  const [isRecommendationsModalOpen, setIsRecommendationsModalOpen] = useState(false);
  const [hasShownRecommendationsModal, setHasShownRecommendationsModal] = useState(false);

  const [currentTheme, setCurrentTheme] = useState<string>('amethyst');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // Set mounted on client
  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const cycleTheme = () => {
    const currentIndex = themes.findIndex((t) => t.id === currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextThemeId = themes[nextIndex].id;
    setCurrentTheme(nextThemeId);
    localStorage.setItem('theme', nextThemeId);
  };

  // Fetch recommendations once watchlist length is 10 or more using our API endpoint
  useEffect(() => {
    const loadRecommendations = async () => {
      if (watchlist.length >= 10) {
        try {
          const movieIds = watchlist.map((m) => m.id).join(',');
          const swipedIds = history.map((h) => h.movie.id).join(',');
          
          const res = await fetch(`/api/movies/recommendations?movieIds=${movieIds}&swipedIds=${swipedIds}`);
          if (!res.ok) throw new Error('Failed to fetch recommendations');
          
          const recs = await res.json();
          setRecommendations(recs);
        } catch (error) {
          console.error('Failed to load recommendations:', error);
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

  // Handle Search Input Debouncing & Fetching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/movies/search?query=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error('Search failed');
        const results = await res.json();
        setSearchResults(results);
      } catch (error) {
        console.error('Error in movie search:', error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Calculate deck size and movies remaining based on swiped items and active filters
  const filteredDeck = useMemo(() => {
    return liveMovies.filter((movie) => {
      const isSwiped = history.some((h) => h.movie.id === movie.id);
      if (isSwiped) return false;

      if (
        filters.genres.length > 0 &&
        !filters.genres.some((g) => movie.genres.includes(g))
      ) {
        return false;
      }

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
  }, [liveMovies, history, filters]);

  // Infinite Scroll Deck Loading
  useEffect(() => {
    const loadNextPage = async () => {
      if (
        isMounted &&
        !isLoading &&
        !fetchingNextPage &&
        filteredDeck.length < 5 &&
        consecutiveEmptyFetches < 5 &&
        !searchQuery
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
          if (!res.ok) throw new Error('Failed to fetch next page');
          const nextPageMovies = await res.json();

          if (nextPageMovies.length === 0) {
            setConsecutiveEmptyFetches(5);
            return;
          }

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

          if (newMatching.length === 0) {
            setConsecutiveEmptyFetches((prev) => prev + 1);
          } else {
            setConsecutiveEmptyFetches(0);
          }

          setLiveMovies((prev) => {
            const currentIds = prev.map((m) => m.id);
            const uniques = nextPageMovies.filter((m: Movie) => !currentIds.includes(m.id));
            return [...uniques, ...prev];
          });
          setPage(nextPage);
        } catch (error) {
          console.error('Failed to load next page:', error);
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
    searchQuery,
  ]);

  const handleSwipe = async (direction: SwipeDirection, movie: Movie) => {
    await addSwipeToHistory(movie, direction);
  };

  const handleUndo = async () => {
    await undoLastSwipe();
  };

  const handleSaveRecommendation = async (movie: Movie) => {
    await addSwipeToHistory(movie, 'right');
    setRecommendations((prev) => prev.filter((m) => m.id !== movie.id));
  };

  const handleRemoveFromWatchlist = async (movieId: string) => {
    await removeFromWatchlist(movieId);
  };

  const handleStartOver = async () => {
    if (window.confirm('Reset local progress and start over? This clears your watchlist and swiped history.')) {
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
        if (!res.ok) throw new Error('Failed to reload popular movies');
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

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const toggleSearchExpand = () => {
    if (isSearchExpanded) {
      setSearchQuery('');
      setIsSearchExpanded(false);
    } else {
      setIsSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className={`theme-${currentTheme} flex h-screen w-screen items-center justify-center bg-theme-bg text-theme-accent font-theme-body`}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-theme-accent border-t-transparent shadow-lg" />
          <p className="text-xs font-bold tracking-widest text-theme-fg/70 animate-pulse uppercase">Syncing Live TMDB API...</p>
        </div>
      </div>
    );
  }

  const activeFiltersCount = 
    (filters.genres.length > 0 ? 1 : 0) + 
    (filters.minRating > 7.0 ? 1 : 0) + 
    (filters.decade !== 'all' ? 1 : 0);

  const watchlistSet = new Set(watchlist.map(m => m.id));

  return (
    <div className={`theme-${currentTheme} h-screen bg-theme-bg text-theme-fg flex flex-col font-theme-body overflow-hidden selection:bg-theme-accent/30`}>
      
      {/* Sleek Navigation Header */}
      <header className="h-[68px] flex-shrink-0 bg-theme-panel/95 border-b border-theme-border py-4 px-3 sm:px-6 md:px-10 flex items-center justify-between z-30">
        <div className="flex items-center gap-3 sm:gap-6 md:gap-10">
          {/* Logo with Dynamic Theme Gradient */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('swipe'); setSearchQuery(''); }}>
            <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-r from-theme-accent via-theme-secondary to-theme-tertiary bg-clip-text text-transparent select-none font-theme-head">
              MOVIE MATCHMAKER
            </h1>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5">
            <button
              onClick={() => { setActiveTab('swipe'); setSearchQuery(''); }}
              className={`text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'swipe' && !searchQuery
                  ? 'bg-theme-card px-3.5 py-1.5 rounded-theme-radius text-theme-fg border border-theme-border shadow-md'
                  : 'text-theme-fg/60 hover:text-theme-fg px-1 py-1'
              }`}
            >
              Swipe Match
            </button>
            <button
              onClick={() => { setActiveTab('browse'); setSearchQuery(''); }}
              className={`text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'browse' && !searchQuery
                  ? 'bg-theme-card px-3.5 py-1.5 rounded-theme-radius text-theme-fg border border-theme-border shadow-md'
                  : 'text-theme-fg/60 hover:text-theme-fg px-1 py-1'
              }`}
            >
              Browse Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('watchlist'); setSearchQuery(''); }}
              className={`text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'watchlist' && !searchQuery
                  ? 'bg-theme-card px-3.5 py-1.5 rounded-theme-radius text-theme-fg border border-theme-border shadow-md'
                  : 'text-theme-fg/60 hover:text-theme-fg px-1 py-1'
              }`}
            >
              My Watchlist
              {watchlist.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-theme-accent text-theme-btn-text text-4xs font-black">
                  {watchlist.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right Header Panel Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Animated Search Bar */}
          <div className="relative flex items-center">
            <motion.div
              animate={{ width: isSearchExpanded ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 120 : 180) : 0, opacity: isSearchExpanded ? 1 : 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden bg-theme-card border border-theme-border rounded-theme-radius pr-8 flex items-center h-8.5"
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-3 bg-transparent text-xs text-theme-fg placeholder-theme-fg/40 border-none outline-none focus:ring-0 focus:outline-none"
              />
            </motion.div>
            <button
              onClick={toggleSearchExpand}
              className="p-2 text-theme-fg/60 hover:text-theme-fg transition-colors cursor-pointer rounded-full hover:bg-theme-panel/50 absolute right-0"
              title="Search Movies"
            >
              {isSearchExpanded ? <X className="h-4.5 w-4.5" /> : <Search className="h-4.5 w-4.5" />}
            </button>
          </div>

          {/* Theme Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="p-2 text-theme-fg/60 hover:text-theme-fg transition-all cursor-pointer rounded-full hover:bg-theme-panel/50 border border-theme-border flex items-center justify-center gap-1.5 shadow-sm"
              title="Switch UI Theme"
            >
              <Palette className="h-4.5 w-4.5 text-theme-accent" />
              <span className="hidden md:inline text-xs font-semibold">Theme</span>
            </button>

            {isThemeMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsThemeMenuOpen(false)} />
                <div className="absolute right-0 mt-2.5 w-56 rounded-theme-radius border border-theme-border bg-theme-panel p-2 shadow-2xl z-50 animate-scale-in">
                  <div className="px-3 py-2 border-b border-theme-border text-4xs text-theme-fg/50 font-bold uppercase tracking-wider font-theme-head">
                    Select UI Theme
                  </div>
                  <div className="space-y-1 mt-1">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setCurrentTheme(t.id);
                          localStorage.setItem('theme', t.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-theme-radius px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                          currentTheme === t.id
                            ? 'bg-theme-accent/15 text-theme-accent font-bold'
                            : 'text-theme-fg/85 hover:bg-white/5'
                        }`}
                      >
                        <span className="font-medium">{t.name}</span>
                        <div className="flex items-center">
                          <span className="h-3 w-3 rounded-full border border-white/10" style={{ backgroundColor: t.primary, zIndex: 3 }} />
                          <span className="h-3 w-3 rounded-full border border-white/10" style={{ backgroundColor: t.secondary, zIndex: 2, marginLeft: '-5px' }} />
                          <span className="h-3 w-3 rounded-full border border-white/10" style={{ backgroundColor: t.bg, zIndex: 1, marginLeft: '-5px' }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Cloud Sync Status Indicator */}
          {user && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-theme-fg/50 bg-theme-card border border-theme-border py-1 px-2.5 rounded-theme-radius">
              {isSyncing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-theme-accent" />
              ) : (
                <Cloud className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </div>
          )}

          {/* User Profile Avatar with custom gradient */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1 border border-theme-border hover:border-theme-border-hover rounded-theme-radius transition-all cursor-pointer p-0.5"
              >
                {/* Glowing user avatar */}
                <div className="h-7 w-7 rounded-theme-radius bg-gradient-to-tr from-theme-accent to-theme-secondary flex items-center justify-center font-bold text-xs text-theme-btn-text border border-white/15 select-none shadow-md shadow-theme-accent/15">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown className="h-3 w-3 text-theme-fg/50 transition-transform duration-200" style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-52 rounded-theme-radius border border-theme-border bg-theme-panel p-2 shadow-2xl z-50 animate-scale-in">
                    <div className="px-3 py-2 border-b border-theme-border text-4xs text-theme-fg/50 font-bold uppercase tracking-wider font-theme-head">
                      Account Profile
                    </div>
                    <div className="px-3 py-2 text-2xs text-theme-fg truncate font-semibold">
                      {user.email}
                    </div>
                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        if (window.confirm('Clear all watchlist and logout?')) {
                          await logOut();
                        }
                      }}
                      className="w-full flex items-center gap-2 rounded-theme-radius px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer mt-1"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-theme-accent hover:bg-theme-accent-hover text-theme-btn-text font-bold py-1.5 px-4 rounded-theme-radius shadow-md text-xs transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main App Container */}
      <div className="flex-1 flex w-full mx-auto overflow-hidden relative h-[calc(100vh-68px)]">
        
        {/* Render Search Results Grid Overlay if query is active */}
        {searchQuery.trim() !== '' ? (
          <div className="w-full px-4 md:px-10 py-6 overflow-y-auto h-full amethyst-scrollbar bg-theme-bg text-theme-fg pb-24">
            <h3 className="text-lg md:text-xl font-black text-theme-fg/60 mb-6 uppercase tracking-tight font-theme-head">
              Search Results for <span className="text-theme-fg italic font-bold">"{searchQuery}"</span>
            </h3>

            {isSearching ? (
              <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-theme-accent border-t-transparent shadow-lg" />
                <p className="text-xs font-bold text-theme-fg/50 uppercase tracking-widest animate-pulse">Searching Cinema Index...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="w-full py-16 text-center text-theme-fg/50">
                <Film className="h-10 w-10 mx-auto text-theme-fg/20 mb-3" />
                <p className="font-semibold text-sm font-theme-body">No movies match your search query.</p>
                <p className="text-xs text-theme-fg/40 mt-1">Try searching by genre, title, or keywords.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pt-2 font-theme-body">
                {searchResults.map((movie) => {
                  const isSaved = watchlistSet.has(movie.id);
                  const matchPercentage = Math.round(75 + (movie.rating / 10) * 23);
                  return (
                    <div
                      key={`search-${movie.id}`}
                      onClick={() => setSelectedMovie(movie)}
                      className="group relative rounded-theme-radius overflow-hidden border border-theme-border bg-theme-card shadow-md hover:border-theme-border-hover transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      <div className="relative aspect-[2/3] w-full">
                        <Image
                          src={movie.posterUrl}
                          alt={movie.title}
                          fill
                          className="object-cover"
                        />
                        {/* Rating Overlay */}
                        <div className="absolute top-2 left-2 bg-theme-panel/60 backdrop-blur-3xs text-3xs font-extrabold text-theme-fg px-2 py-0.5 rounded border border-theme-border flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          {movie.rating.toFixed(1)}
                        </div>
                      </div>
                      <div className="p-3 space-y-1 bg-theme-panel">
                        <h4 className="text-xs font-bold text-theme-fg leading-tight truncate uppercase font-theme-head">
                          {movie.title}
                        </h4>
                        <div className="flex items-center justify-between text-4xs text-theme-fg/60 font-semibold pt-1">
                          <span className="text-emerald-400">{matchPercentage}% Match</span>
                          <span>{movie.releaseYear}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Normal View Ports (Tabs) */
          <>
            {/* 1. Swipe Mode (Home) */}
            {activeTab === 'swipe' && (
              <div className="flex-grow flex overflow-hidden h-full">
                {/* Desktop Left Sidebar: Filters */}
                <aside className="hidden md:block w-76 p-6 flex-shrink-0 border-r border-theme-border overflow-y-auto h-full bg-theme-bg">
                  <Filters
                    filters={filters}
                    onChange={setFilters}
                    onReset={handleResetFilters}
                  />
                </aside>

                {/* Center Swiping Deck Viewport */}
                <main className="flex-grow flex items-center justify-center p-4 md:p-6 h-full bg-theme-bg/10">
                  <SwipeDeck
                    movies={filteredDeck}
                    onSwipe={handleSwipe}
                    onUndo={handleUndo}
                    canUndo={history.length > 0}
                    onResetDeck={handleStartOver}
                  />
                </main>

                {/* Desktop Right Sidebar: Watchlist */}
                <aside className="hidden lg:block w-80 flex-shrink-0 border-l border-theme-border h-full bg-theme-bg">
                  <Watchlist
                    watchlist={watchlist}
                    onRemove={handleRemoveFromWatchlist}
                    onSelectMovie={setSelectedMovie}
                    recommendations={recommendations}
                    onSaveRecommendation={handleSaveRecommendation}
                    onStartOver={handleStartOver}
                  />
                </aside>
              </div>
            )}

            {/* 2. Browse Dashboard */}
            {activeTab === 'browse' && (
              <div className="w-full h-full overflow-hidden">
                <NetflixBrowse
                  onSelectMovie={setSelectedMovie}
                  onSaveToWatchlist={handleSaveRecommendation}
                  onRemoveFromWatchlist={handleRemoveFromWatchlist}
                  watchlist={watchlist}
                  onPlayTrailer={setPlayTrailerMovie}
                />
              </div>
            )}

            {/* 3. Dedicated Watchlist View */}
            {activeTab === 'watchlist' && (
              <div className="w-full h-full overflow-hidden flex flex-col lg:flex-row bg-theme-bg">
                {/* Main Watchlist Container */}
                <div className="flex-1 p-6 overflow-y-auto h-full amethyst-scrollbar pb-24">
                  <div className="flex items-center justify-between border-b border-theme-border pb-4 mb-6">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-theme-fg uppercase tracking-tight flex items-center gap-2 font-theme-head">
                        <Heart className="h-5.5 w-5.5 text-theme-accent fill-theme-accent" />
                        My Watchlist
                      </h2>
                      <p className="text-xs text-theme-fg/50 font-semibold uppercase tracking-wider mt-1">
                        {watchlist.length} {watchlist.length === 1 ? 'saved film' : 'saved films'}
                      </p>
                    </div>

                    {watchlist.length > 0 && (
                      <button
                        onClick={handleStartOver}
                        className="text-xs bg-theme-panel border border-theme-border hover:border-theme-border-hover text-theme-fg/60 hover:text-theme-accent py-2 px-4 rounded-theme-radius transition-colors cursor-pointer"
                      >
                        Reset Watchlist
                      </button>
                    )}
                  </div>

                  {watchlist.length === 0 ? (
                    <div className="py-24 text-center select-none font-theme-body">
                      <Film className="h-12 w-12 mx-auto text-theme-fg/20 mb-4 animate-pulse" />
                      <h3 className="text-lg font-bold text-theme-fg/80 font-theme-head">Your Watchlist is Empty</h3>
                      <p className="text-xs text-theme-fg/40 mt-1 max-w-xs mx-auto leading-relaxed">
                        Start swiping right in "Swipe Match" or add titles directly from "Browse Dashboard" to save movies here!
                      </p>
                      <button
                        onClick={() => setActiveTab('swipe')}
                        className="mt-6 px-6 py-2.5 rounded-theme-radius bg-theme-accent text-theme-btn-text text-xs font-bold hover:bg-theme-accent-hover transition-colors shadow-lg"
                      >
                        Go Swiping
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 font-theme-body">
                      {watchlist.map((movie) => (
                        <div
                          key={`watchlist-tab-${movie.id}`}
                          onClick={() => setSelectedMovie(movie)}
                          className="group relative rounded-theme-radius overflow-hidden border border-theme-border bg-theme-card shadow-md hover:border-theme-border-hover transition-all duration-300 hover:scale-105 cursor-pointer"
                        >
                          <div className="relative aspect-[2/3] w-full">
                            <Image
                              src={movie.posterUrl}
                              alt={movie.title}
                              fill
                              className="object-cover"
                            />
                            {/* Score Overlay */}
                            <div className="absolute top-2 left-2 bg-theme-panel/60 backdrop-blur-3xs text-3xs font-extrabold text-theme-fg px-2 py-0.5 rounded border border-theme-border flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                              {movie.rating.toFixed(1)}
                            </div>
                          </div>
                          <div className="p-3 bg-theme-panel flex items-center justify-between">
                            <div className="min-w-0 pr-4">
                              <h4 className="text-xs font-bold text-theme-fg leading-tight truncate uppercase font-theme-head">
                                {movie.title}
                              </h4>
                              <p className="text-4xs text-theme-fg/50 font-semibold pt-0.5">{movie.releaseYear} • {movie.runtime}m</p>
                            </div>
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFromWatchlist(movie.id);
                              }}
                              className="p-1.5 rounded-theme-radius hover:bg-theme-accent/10 text-theme-fg/50 hover:text-theme-accent transition-colors"
                              title="Delete from Watchlist"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommendations sidebar in Watchlist view */}
                {recommendations.length > 0 && (
                  <div className="w-full lg:w-80 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-theme-border p-6 h-full overflow-y-auto amethyst-scrollbar">
                    <div className="flex items-center gap-2 mb-6">
                      <Sparkles className="h-5 w-5 text-theme-accent animate-pulse" />
                      <h3 className="text-sm font-extrabold text-theme-fg/80 uppercase tracking-widest font-theme-head">
                        Recommended For You
                      </h3>
                    </div>
                    <div className="space-y-4 pb-20">
                      {recommendations.map((movie) => (
                        <div
                          key={`watchlist-rec-${movie.id}`}
                          onClick={() => setSelectedMovie(movie)}
                          className="group relative flex gap-3 p-2.5 rounded-theme-radius border border-theme-border bg-theme-card/45 hover:bg-theme-card transition-all duration-200 cursor-pointer"
                        >
                          <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded-[calc(var(--border-radius)*0.75)] bg-theme-panel">
                            <Image
                              src={movie.posterUrl}
                              alt={movie.title}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow min-w-0 pr-6 font-theme-body">
                            <h4 className="text-xs font-bold text-theme-fg group-hover:text-theme-accent transition-colors truncate uppercase font-theme-head">
                              {movie.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 text-4xs font-bold text-theme-fg/60">
                              <span className="text-amber-500">{movie.rating.toFixed(1)} IMDb</span>
                              <span>•</span>
                              <span>{movie.releaseYear}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveRecommendation(movie);
                            }}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-theme-accent hover:bg-theme-accent-hover text-theme-btn-text rounded-full shadow transition-all duration-200 hover:scale-105"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
 
        {/* Mobile Slide-in Filters Modal */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-45 md:hidden flex flex-col justify-start pt-20 p-6 bg-theme-bg/95 backdrop-blur-md animate-in fade-in duration-200">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-2 rounded-full border border-theme-border bg-theme-panel text-theme-fg/60 hover:text-theme-fg cursor-pointer"
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
                className="w-full mt-6 py-3 bg-theme-accent hover:bg-theme-accent-hover text-theme-btn-text font-bold rounded-theme-radius shadow-lg cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
 
      {/* Responsive Mobile Bottom Navigation Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-theme-panel/95 border-t border-theme-border flex items-center justify-around z-40 md:hidden backdrop-blur-md font-theme-body">
        <button
          onClick={() => { setActiveTab('swipe'); setSearchQuery(''); }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === 'swipe' && !searchQuery ? 'text-theme-accent font-bold font-theme-head' : 'text-theme-fg/50 hover:text-theme-fg'
          }`}
        >
          <Film className="h-5 w-5" />
          <span className="text-4xs font-bold uppercase tracking-wider">Swipe Match</span>
        </button>
 
        <button
          onClick={() => { setActiveTab('browse'); setSearchQuery(''); }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === 'browse' && !searchQuery ? 'text-theme-accent font-bold font-theme-head' : 'text-theme-fg/50 hover:text-theme-fg'
          }`}
        >
          <Compass className="h-5 w-5" />
          <span className="text-4xs font-bold uppercase tracking-wider">Browse</span>
        </button>
 
        <button
          onClick={() => { setActiveTab('watchlist'); setSearchQuery(''); }}
          className={`flex flex-col items-center gap-1 cursor-pointer relative transition-colors ${
            activeTab === 'watchlist' && !searchQuery ? 'text-theme-accent font-bold font-theme-head' : 'text-theme-fg/50 hover:text-theme-fg'
          }`}
        >
          <Heart className="h-5 w-5" />
          {watchlist.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-theme-accent text-theme-btn-text text-4xs font-black h-4 w-4 rounded-full flex items-center justify-center animate-scale-in">
              {watchlist.length}
            </span>
          )}
          <span className="text-4xs font-bold uppercase tracking-wider">Watchlist</span>
        </button>
 
        <button
          onClick={cycleTheme}
          className="flex flex-col items-center gap-1 cursor-pointer transition-colors text-theme-fg/50 hover:text-theme-fg"
          title={`Switch Theme (Current: ${themes.find(t => t.id === currentTheme)?.name})`}
        >
          <Palette className="h-5 w-5 text-theme-accent" />
          <span className="text-4xs font-bold uppercase tracking-wider">Theme</span>
        </button>
 
        {activeTab === 'swipe' && (
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className={`flex flex-col items-center gap-1 cursor-pointer relative transition-colors ${
              isMobileFiltersOpen ? 'text-theme-accent font-bold font-theme-head' : 'text-theme-fg/50 hover:text-theme-fg'
            }`}
          >
            <Filter className="h-5 w-5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-theme-accent text-theme-btn-text text-4xs font-black h-4 w-4 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <span className="text-4xs font-bold uppercase tracking-wider">Filters</span>
          </button>
        )}
      </footer>

      {/* Watchlist Movie Detailed Info Modal */}
      <MovieDetailsModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />

      {/* Trailer Iframe Modal */}
      {playTrailerMovie && playTrailerMovie.trailerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setPlayTrailerMovie(null)} />
          <div className="relative w-full max-w-3xl aspect-video rounded-theme-radius overflow-hidden border border-theme-border bg-black z-50 shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setPlayTrailerMovie(null)}
              className="absolute top-4 right-4 z-20 rounded-full border border-theme-border bg-theme-panel/60 p-2 text-theme-fg/60 hover:text-theme-fg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src={playTrailerMovie.trailerUrl}
              title={`${playTrailerMovie.title} Trailer`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* 10 Likes Curated Recommendations Popup Modal */}
      <RecommendationsModal
        isOpen={isRecommendationsModalOpen}
        onClose={() => setIsRecommendationsModalOpen(false)}
        recommendations={recommendations}
        watchlist={watchlist}
        onSaveRecommendation={handleSaveRecommendation}
        currentTheme={currentTheme}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
