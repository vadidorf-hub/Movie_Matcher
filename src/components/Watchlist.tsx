'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Movie } from '../types';
import { Search, Trash2, Film, Star, ExternalLink, Calendar, X, Sparkles, Plus } from 'lucide-react';

interface WatchlistProps {
  watchlist: Movie[];
  onRemove: (movieId: string) => void;
  onSelectMovie: (movie: Movie) => void;
  onCloseMobileDrawer?: () => void;
  recommendations: Movie[];
  onSaveRecommendation: (movie: Movie) => void;
  onStartOver: () => void;
}

export default function Watchlist({
  watchlist,
  onRemove,
  onSelectMovie,
  onCloseMobileDrawer,
  recommendations,
  onSaveRecommendation,
  onStartOver,
}: WatchlistProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWatchlist = watchlist.filter((movie) =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.genres.some((g) => g.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-theme-bg border border-theme-border lg:border-none rounded-theme-radius lg:rounded-none overflow-hidden">
      {/* Drawer header on mobile */}
      <div className="flex items-center justify-between border-b border-theme-border p-4 lg:py-5 lg:px-6">
        <div>
          <h2 className="text-lg font-bold text-theme-fg flex items-center gap-2 font-theme-head">
            <Film className="h-4.5 w-4.5 text-theme-accent" />
            My Watchlist
          </h2>
          <p className="text-xs text-theme-fg/50 font-semibold uppercase tracking-wider font-theme-body">
            {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'} saved
          </p>
        </div>
        <div className="flex items-center gap-2 font-theme-body">
          {(watchlist.length > 0 || recommendations.length > 0) && (
            <button
              onClick={onStartOver}
              className="text-2xs bg-theme-panel border border-theme-border hover:border-theme-border-hover text-theme-fg/60 hover:text-theme-accent px-2.5 py-1.5 rounded-theme-radius transition-all duration-200 cursor-pointer font-bold"
            >
              Start Over
            </button>
          )}
          {onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="lg:hidden p-1.5 rounded-full border border-theme-border text-theme-fg/60 hover:text-theme-fg cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      {watchlist.length > 0 && (
        <div className="p-4 border-b border-theme-border bg-theme-bg/20 font-theme-body">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-theme-fg/40" />
            <input
              type="text"
              placeholder="Search title or genre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-theme-radius bg-theme-panel border border-theme-border text-sm text-theme-fg placeholder-theme-fg/40 focus:outline-none focus:border-theme-accent/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Watchlist & Recommendations Scroll Panel */}
      <div className="flex-grow overflow-y-auto p-4 lg:p-6 space-y-3 amethyst-scrollbar">
        {watchlist.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none font-theme-body">
            <div className="p-4 rounded-full bg-theme-panel/60 border border-theme-border text-theme-fg/20 mb-3">
              <Film className="h-8 w-8" />
            </div>
            <h4 className="text-sm font-semibold text-theme-fg font-theme-head">Your watchlist is empty</h4>
            <p className="text-xs text-theme-fg/50 mt-1 max-w-[200px] leading-relaxed">
              Swipe right on movies you like to save them here!
            </p>
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 text-theme-fg/50 font-theme-body">
            <p className="text-xs">No matching movies found.</p>
          </div>
        ) : (
          filteredWatchlist.map((movie) => (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className="group relative flex gap-3 p-2.5 rounded-theme-radius border border-theme-border bg-theme-card/45 hover:bg-theme-card hover:border-theme-border-hover transition-all duration-200 cursor-pointer"
            >
              {/* Mini Poster */}
              <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded-[calc(var(--border-radius)*0.75)] border border-theme-border bg-theme-panel animate-fade-in">
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>

              {/* Title & Metadata */}
              <div className="flex-grow min-w-0 pr-8 font-theme-body">
                <h4 className="text-sm font-bold text-theme-fg group-hover:text-theme-accent transition-colors truncate uppercase font-theme-head">
                  {movie.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-2xs font-semibold text-theme-fg/60">
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <Star className="h-3 w-3 fill-amber-500" />
                    {movie.rating.toFixed(1)}
                  </span>
                  <span>•</span>
                  <span>{movie.releaseYear}</span>
                </div>
                {/* Genres */}
                <div className="flex gap-1 mt-1.5 truncate">
                  {movie.genres.slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="bg-theme-panel/30 text-theme-fg/60 text-4xs px-1.5 py-0.5 rounded border border-theme-border font-semibold"
                    >
                      {g}
                    </span>
                  ))}
                  {movie.genres.length > 2 && (
                    <span className="text-4xs text-theme-fg/50 self-center">
                      +{movie.genres.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(movie.id);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 lg:opacity-40 hover:!opacity-100 p-2 rounded-theme-radius bg-theme-panel border border-theme-border hover:border-rose-550 text-theme-fg/60 hover:text-rose-450 shadow-md cursor-pointer transition-all duration-200"
                title="Remove from watchlist"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}

        {/* Live Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="pt-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4 border-t border-theme-border pt-5 px-1">
              <div className="relative">
                <Sparkles className="h-4 w-4 text-theme-accent animate-pulse" />
              </div>
              <h3 className="text-xs font-bold text-theme-fg/60 uppercase tracking-wider font-theme-head">
                Recommended For You
              </h3>
            </div>

            <div className="space-y-3 font-theme-body">
              {recommendations.map((movie) => (
                <div
                  key={`rec-${movie.id}`}
                  onClick={() => onSelectMovie(movie)}
                  className="group relative flex gap-3 p-2.5 rounded-theme-radius border border-theme-accent/10 hover:border-theme-accent/25 bg-theme-accent/5 hover:bg-theme-accent/10 transition-all duration-200 cursor-pointer"
                >
                  {/* Mini Poster */}
                  <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded-[calc(var(--border-radius)*0.75)] border border-theme-border bg-theme-panel">
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-grow min-w-0 pr-8">
                    <h4 className="text-sm font-bold text-theme-fg group-hover:text-theme-accent transition-colors truncate uppercase font-theme-head">
                      {movie.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-2xs font-semibold text-theme-fg/60">
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Star className="h-3 w-3 fill-amber-500" />
                        {movie.rating.toFixed(1)}
                      </span>
                      <span>•</span>
                      <span>{movie.releaseYear}</span>
                    </div>
                    {/* Genres */}
                    <div className="flex gap-1 mt-1.5 truncate">
                      {movie.genres.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="bg-theme-panel/30 text-theme-fg/60 text-4xs px-1.5 py-0.5 rounded border border-theme-border font-semibold"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Save/Add Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveRecommendation(movie);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-theme-radius bg-theme-accent hover:bg-theme-accent-hover text-theme-btn-text shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
                    title="Save to watchlist"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
