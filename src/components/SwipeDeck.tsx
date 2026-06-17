'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Movie, SwipeDirection } from '../types';
import MovieCard from './MovieCard';
import { X, Heart, Star, RotateCcw, Info, Film, Keyboard } from 'lucide-react';

interface SwipeDeckProps {
  movies: Movie[];
  onSwipe: (direction: SwipeDirection, movie: Movie) => void;
  onUndo: () => void;
  canUndo: boolean;
  onResetDeck: () => void;
}

export default function SwipeDeck({
  movies,
  onSwipe,
  onUndo,
  canUndo,
  onResetDeck,
}: SwipeDeckProps) {
  // Triggers for programmatic swipes (clicks on buttons)
  const [swipeTrigger, setSwipeTrigger] = useState<SwipeDirection | null>(null);

  // Active movie is the last movie in the array (top of stack)
  const activeMovie = movies[movies.length - 1];
  const nextMovie = movies.length > 1 ? movies[movies.length - 2] : null;

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts if user is typing in an input or textarea
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (!activeMovie) return;

      switch (e.key) {
        case 'ArrowLeft':
          setSwipeTrigger('left');
          break;
        case 'ArrowRight':
          setSwipeTrigger('right');
          break;
        case 'ArrowUp':
          setSwipeTrigger('up');
          break;
        case 'r':
        case 'R':
          if (canUndo) {
            onUndo();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMovie, canUndo, onUndo]);

  const handleButtonSwipe = (direction: SwipeDirection) => {
    if (!activeMovie || swipeTrigger) return;
    setSwipeTrigger(direction);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[320px] sm:max-w-[380px] mx-auto">
      
      {/* Cards Stack Container */}
      <div className="relative w-[320px] h-[480px] sm:w-[380px] sm:h-[570px] rounded-3xl mb-6 select-none">
        {activeMovie ? (
          <>
            {/* Render the next card underneath (static/scaling animation) */}
            {nextMovie && (
              <MovieCard
                key={nextMovie.id}
                movie={nextMovie}
                active={false}
                onSwipe={() => {}}
                swipeTrigger={null}
                onSwipeTriggerReset={() => {}}
              />
            )}

            {/* Render active swipable card */}
            <MovieCard
              key={activeMovie.id}
              movie={activeMovie}
              active={true}
              onSwipe={onSwipe}
              swipeTrigger={swipeTrigger}
              onSwipeTriggerReset={() => setSwipeTrigger(null)}
            />
          </>
        ) : (
          /* Empty Deck State */
          <div className="absolute inset-0 w-full h-full rounded-theme-radius border border-dashed border-theme-border bg-theme-panel/50 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center font-theme-body">
            <div className="p-4 rounded-full bg-theme-card border border-theme-border text-theme-fg/40 mb-4 animate-pulse">
              <Film className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-theme-fg mb-2 font-theme-head">Out of Matches</h3>
            <p className="text-sm text-theme-fg/60 mb-6 leading-relaxed">
              You&apos;ve swiped through all available movies. Try resetting your filters or restarting the deck!
            </p>
            <button
              onClick={onResetDeck}
              className="px-6 py-2.5 rounded-theme-radius bg-theme-accent hover:bg-theme-accent-hover text-sm font-semibold text-theme-btn-text shadow-lg border border-theme-border active:scale-97 transition-all duration-200 cursor-pointer"
            >
              Start Over
            </button>
          </div>
        )}
      </div>

      {/* Control Buttons Panel */}
      {activeMovie && (
        <div className="flex items-center justify-center gap-4.5 w-full">
          {/* Rewind */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center justify-center rounded-full p-3.5 border transition-all duration-200 active:scale-90 shadow-md ${
              canUndo
                ? 'bg-theme-card border-theme-border text-theme-fg/60 hover:text-amber-500 hover:border-amber-500/40 hover:shadow-amber-500/5 cursor-pointer hover:scale-105'
                : 'bg-theme-card/45 text-theme-fg/20 border-theme-border/30 cursor-not-allowed'
            }`}
            title="Rewind Last Swipe (R)"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          {/* Nope / Dislike */}
          <button
            onClick={() => handleButtonSwipe('left')}
            className="flex items-center justify-center rounded-full bg-theme-card border border-theme-border hover:border-theme-secondary hover:text-theme-secondary text-theme-fg/60 hover:shadow-theme-secondary/5 hover:scale-105 active:scale-90 p-4.5 shadow-lg cursor-pointer transition-all duration-200"
            title="Dismiss Movie (ArrowLeft)"
          >
            <X className="h-7 w-7" />
          </button>

          {/* Super Like */}
          <button
            onClick={() => handleButtonSwipe('up')}
            className="flex items-center justify-center rounded-full bg-theme-card border border-theme-border hover:border-sky-400 hover:text-sky-400 text-theme-fg/60 hover:shadow-sky-500/5 hover:scale-105 active:scale-90 p-3.5 shadow-md cursor-pointer transition-all duration-200"
            title="Super Like (ArrowUp)"
          >
            <Star className="h-5 w-5 fill-transparent hover:fill-sky-400" />
          </button>

          {/* Like */}
          <button
            onClick={() => handleButtonSwipe('right')}
            className="flex items-center justify-center rounded-full bg-theme-card border border-theme-border hover:border-emerald-500 hover:text-emerald-500 text-theme-fg/60 hover:shadow-emerald-500/5 hover:scale-105 active:scale-90 p-4.5 shadow-lg cursor-pointer transition-all duration-200"
            title="Save to Watchlist (ArrowRight)"
          >
            <Heart className="h-7 w-7 fill-transparent hover:fill-emerald-500" />
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      {activeMovie && (
        <div className="hidden sm:flex items-center gap-1.5 justify-center mt-6 text-3xs text-theme-fg/40 font-medium select-none bg-theme-panel/30 px-3 py-1 rounded-theme-radius border border-theme-border">
          <Keyboard className="h-3 w-3 text-theme-fg/40" />
          <span>Use keyboard arrows to swipe • R to undo</span>
        </div>
      )}
    </div>
  );
}
