'use client';

import React, { useState } from 'react';
import { Sparkles, Check, CheckSquare, Square } from 'lucide-react';

interface GenreCategory {
  id: string;
  name: string;
  emoji: string;
}

const genreCategories = [
  {
    title: 'Fiction & Imagination',
    items: [
      { id: 'Sci-Fi', name: 'Science Fiction', emoji: '👽' },
      { id: 'Fantasy', name: 'Fantasy & Magic', emoji: '🦄' },
      { id: 'Horror', name: 'Horror / Scary', emoji: '👻' },
      { id: 'Mystery', name: 'Mystery & Suspense', emoji: '🕵️' },
      { id: 'Thriller', name: 'Thriller', emoji: '⚡' },
    ],
  },
  {
    title: 'Dramas & Realism',
    items: [
      { id: 'Drama', name: 'Drama', emoji: '🎭' },
      { id: 'Crime', name: 'Crime / Noir', emoji: '🕵️‍♂️' },
      { id: 'Romance', name: 'Romance / Love', emoji: '💖' },
      { id: 'History', name: 'History & Biography', emoji: '📜' },
      { id: 'War', name: 'War / Military', emoji: '⚔️' },
      { id: 'Western', name: 'Western / Cowboy', emoji: '🤠' },
    ],
  },
  {
    title: 'Comedy & Entertainment',
    items: [
      { id: 'Comedy', name: 'Comedy', emoji: '😹' },
      { id: 'Animation', name: 'Animation / Anime', emoji: '🎨' },
      { id: 'Family', name: 'Family & Kids', emoji: '👶' },
      { id: 'Music', name: 'Music & Musicals', emoji: '🎵' },
      { id: 'Action', name: 'Action & Adventure', emoji: '💥' },
    ],
  },
  {
    title: 'Non-Fiction & Reality',
    items: [
      { id: 'Documentary', name: 'Documentaries (Non-Fiction)', emoji: '📹' },
    ],
  },
];

interface RoomFiltersProps {
  nickname: string;
  roomCode: string;
  onSubmit: (selectedGenres: string[]) => void;
  loading: boolean;
}

export default function RoomFilters({
  nickname,
  roomCode,
  onSubmit,
  loading,
}: RoomFiltersProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const selectAll = () => {
    const allIds = genreCategories.flatMap((c) => c.items.map((i) => i.id));
    setSelectedGenres(allIds);
  };

  const selectNone = () => {
    setSelectedGenres([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGenres.length === 0) {
      alert('Please select at least one category to choose from!');
      return;
    }
    onSubmit(selectedGenres);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 rounded-theme-radius glass-panel border border-theme-border shadow-2xl relative overflow-hidden font-theme-body">
      {/* Background glowing gradients */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-theme-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-theme-secondary/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-theme-border pb-5 mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-theme-fg uppercase font-theme-head flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-theme-accent animate-pulse" />
            Select Your Film Genres
          </h2>
          <p className="text-xs text-theme-fg/60 mt-1">
            Hey <span className="text-theme-accent font-bold">{nickname}</span>, tell us what you're in the mood for tonight in Room <span className="font-mono font-bold text-theme-secondary">{roomCode}</span>.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-4xs font-bold bg-theme-card border border-theme-border hover:border-theme-border-hover text-theme-fg/70 px-3 py-1.5 rounded uppercase tracking-widest transition-colors cursor-pointer"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="text-4xs font-bold bg-theme-card border border-theme-border hover:border-theme-border-hover text-theme-fg/70 px-3 py-1.5 rounded uppercase tracking-widest transition-colors cursor-pointer"
          >
            Deselect All
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Genre Categories Groups */}
        <div className="space-y-5">
          {genreCategories.map((group) => (
            <div key={group.title} className="space-y-2.5">
              <h3 className="text-xs font-bold text-theme-fg/45 uppercase tracking-wider font-theme-head border-l-2 border-theme-accent/40 pl-2">
                {group.title}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {group.items.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      className={`flex items-center justify-between p-3 rounded-theme-radius border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-theme-accent/20 border-theme-accent text-theme-fg shadow-lg shadow-theme-accent/5'
                          : 'bg-theme-card border-theme-border text-theme-fg/70 hover:border-theme-border-hover hover:text-theme-fg'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 text-xs font-semibold">
                        <span className="text-sm">{genre.emoji}</span>
                        <span>{genre.name}</span>
                      </span>
                      <span className={`h-4.5 w-4.5 rounded flex items-center justify-center border transition-colors ${
                        isSelected 
                          ? 'bg-theme-accent border-theme-accent text-theme-btn-text' 
                          : 'border-theme-fg/20'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-theme-border flex items-center justify-between">
          <p className="text-3xs text-theme-fg/45 font-semibold">
            {selectedGenres.length} {selectedGenres.length === 1 ? 'genre' : 'genres'} selected
          </p>
          <button
            type="submit"
            disabled={loading || selectedGenres.length === 0}
            className="px-8 py-3 rounded-theme-radius bg-theme-accent hover:bg-theme-accent-hover text-theme-btn-text font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg active:scale-97 flex items-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-theme-btn-text/50 border-t-transparent" />
            ) : (
              "Start Swiping"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
