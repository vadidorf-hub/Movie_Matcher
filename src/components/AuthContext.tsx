'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Movie, SwipeDirection } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSyncing: boolean;
  watchlist: Movie[];
  history: { movie: Movie; direction: SwipeDirection }[];
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  logIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  logOut: () => Promise<void>;
  addToWatchlist: (movie: Movie) => Promise<void>;
  removeFromWatchlist: (movieId: string) => Promise<void>;
  addSwipeToHistory: (movie: Movie, direction: SwipeDirection) => Promise<void>;
  undoLastSwipe: () => Promise<void>;
  resetUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper mappings between Database schema and frontend model
function toDbMovie(movie: Movie, userId: string) {
  return {
    user_id: userId,
    movie_id: movie.id,
    title: movie.title,
    overview: movie.overview,
    rating: movie.rating,
    genres: movie.genres,
    release_year: movie.releaseYear,
    poster_url: movie.posterUrl,
    backdrop_url: movie.backdropUrl,
    director: movie.director,
    runtime: movie.runtime,
    cast: movie.cast,
    trailer_url: movie.trailerUrl || null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbMovie(row: any): Movie {
  return {
    id: row.movie_id,
    title: row.title,
    overview: row.overview || '',
    rating: Number(row.rating) || 0,
    genres: row.genres || [],
    releaseYear: row.release_year || 0,
    posterUrl: row.poster_url || '',
    backdropUrl: row.backdrop_url || '',
    director: row.director || '',
    runtime: row.runtime || 0,
    cast: row.cast || [],
    trailerUrl: row.trailer_url || undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [history, setHistory] = useState<{ movie: Movie; direction: SwipeDirection }[]>([]);

  // Load from localStorage for guest users
  const loadLocalData = () => {
    const savedWatchlist = localStorage.getItem('movie_watchlist');
    const savedHistory = localStorage.getItem('movie_history');
    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  };

  // Sync and merge local data with Supabase
  const syncLocalToCloud = async (userId: string) => {
    setIsSyncing(true);
    try {
      // Fetch cloud watchlist & history
      const { data: dbWatchlist, error: wError } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId);

      const { data: dbHistory, error: hError } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', userId);

      if (wError) throw wError;
      if (hError) throw hError;

      const cloudWatchlist = dbWatchlist.map(fromDbMovie);
      const cloudHistory = dbHistory.map(row => ({
        movie: fromDbMovie(row),
        direction: row.direction as SwipeDirection,
      }));

      // Get local items
      const savedWatchlist = localStorage.getItem('movie_watchlist');
      const savedHistory = localStorage.getItem('movie_history');
      const localWatchlist: Movie[] = savedWatchlist ? JSON.parse(savedWatchlist) : [];
      const localHistory: { movie: Movie; direction: SwipeDirection }[] = savedHistory ? JSON.parse(savedHistory) : [];

      // Merge Watchlist
      const mergedWatchlist = [...cloudWatchlist];
      const localToUploadWatchlist: Movie[] = [];
      for (const localItem of localWatchlist) {
        if (!mergedWatchlist.some(item => item.id === localItem.id)) {
          mergedWatchlist.push(localItem);
          localToUploadWatchlist.push(localItem);
        }
      }

      // Merge History
      const mergedHistory = [...cloudHistory];
      const localToUploadHistory: { movie: Movie; direction: SwipeDirection }[] = [];
      for (const localItem of localHistory) {
        if (!mergedHistory.some(item => item.movie.id === localItem.movie.id)) {
          mergedHistory.push(localItem);
          localToUploadHistory.push(localItem);
        }
      }

      // Upload local-only data
      if (localToUploadWatchlist.length > 0) {
        const wPayload = localToUploadWatchlist.map(m => toDbMovie(m, userId));
        const { error: insertError } = await supabase.from('watchlist').upsert(wPayload);
        if (insertError) console.error('Error uploading local watchlist:', insertError);
      }

      if (localToUploadHistory.length > 0) {
        const hPayload = localToUploadHistory.map(h => ({
          ...toDbMovie(h.movie, userId),
          direction: h.direction,
        }));
        const { error: insertError } = await supabase.from('history').upsert(hPayload);
        if (insertError) console.error('Error uploading local history:', insertError);
      }

      setWatchlist(mergedWatchlist);
      setHistory(mergedHistory);

      // Save merged to localStorage for offline cache
      localStorage.setItem('movie_watchlist', JSON.stringify(mergedWatchlist));
      localStorage.setItem('movie_history', JSON.stringify(mergedHistory));
    } catch (error) {
      console.error('Failed to sync local data to cloud:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Listen to Auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncLocalToCloud(session.user.id);
      } else {
        loadLocalData();
      }
      setLoading(false);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        syncLocalToCloud(currentUser.id);
      } else {
        // Logged out
        setWatchlist([]);
        setHistory([]);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // SignUp Auth Method
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  // Login Auth Method
  const logIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Logout Auth Method
  const logOut = async () => {
    await supabase.auth.signOut();
    setWatchlist([]);
    setHistory([]);
    localStorage.removeItem('movie_watchlist');
    localStorage.removeItem('movie_history');
  };

  // Add Movie to Watchlist
  const addToWatchlist = async (movie: Movie) => {
    const updated = [movie, ...watchlist.filter(m => m.id !== movie.id)];
    setWatchlist(updated);
    localStorage.setItem('movie_watchlist', JSON.stringify(updated));

    if (user) {
      const payload = toDbMovie(movie, user.id);
      const { error } = await supabase.from('watchlist').upsert(payload);
      if (error) console.error('Error syncing watchlist insert to Supabase:', error);
    }
  };

  // Remove Movie from Watchlist
  const removeFromWatchlist = async (movieId: string) => {
    const updated = watchlist.filter(m => m.id !== movieId);
    setWatchlist(updated);
    localStorage.setItem('movie_watchlist', JSON.stringify(updated));

    if (user) {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);
      if (error) console.error('Error syncing watchlist delete to Supabase:', error);
    }
  };

  // Add swipe to history
  const addSwipeToHistory = async (movie: Movie, direction: SwipeDirection) => {
    const newSwipe = { movie, direction };
    const updatedHistory = [...history, newSwipe];
    setHistory(updatedHistory);
    localStorage.setItem('movie_history', JSON.stringify(updatedHistory));

    // If liked, add to watchlist too
    if (direction === 'right' || direction === 'up') {
      await addToWatchlist(movie);
    }

    if (user) {
      const payload = {
        ...toDbMovie(movie, user.id),
        direction,
      };
      const { error } = await supabase.from('history').upsert(payload);
      if (error) console.error('Error syncing swipe to Supabase:', error);
    }
  };

  // Undo last swipe action
  const undoLastSwipe = async () => {
    if (history.length === 0) return;
    const lastSwipe = history[history.length - 1];
    const updatedHistory = history.slice(0, -1);
    setHistory(updatedHistory);
    localStorage.setItem('movie_history', JSON.stringify(updatedHistory));

    // If last swipe was a like, remove it from watchlist
    if (lastSwipe.direction === 'right' || lastSwipe.direction === 'up') {
      await removeFromWatchlist(lastSwipe.movie.id);
    }

    if (user) {
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', lastSwipe.movie.id);
      if (error) console.error('Error syncing undo swipe to Supabase:', error);
    }
  };

  // Reset watchlist & swipe history
  const resetUserData = async () => {
    setWatchlist([]);
    setHistory([]);
    localStorage.removeItem('movie_watchlist');
    localStorage.removeItem('movie_history');

    if (user) {
      // Delete all user records from watchlist & history
      const { error: wError } = await supabase.from('watchlist').delete().eq('user_id', user.id);
      const { error: hError } = await supabase.from('history').delete().eq('user_id', user.id);
      if (wError) console.error('Error resetting cloud watchlist:', wError);
      if (hError) console.error('Error resetting cloud history:', hError);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSyncing,
        watchlist,
        history,
        signUp,
        logIn,
        logOut,
        addToWatchlist,
        removeFromWatchlist,
        addSwipeToHistory,
        undoLastSwipe,
        resetUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
