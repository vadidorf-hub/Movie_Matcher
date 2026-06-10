'use client';

import React from 'react';
import { FilterState } from '../types';
import { movies, allGenres } from '../data/movies';
import { Filter, RotateCcw, Star } from 'lucide-react';

interface FiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const decades = [
  { value: 'all', label: 'All Eras' },
  { value: '1970s', label: '70s' },
  { value: '1990s', label: '90s' },
  { value: '2000s', label: '2000s' },
  { value: '2010s', label: '2010s' },
  { value: '2020s', label: '2020s' },
];

export default function Filters({ filters, onChange, onReset }: FiltersProps) {
  const toggleGenre = (genre: string) => {
    const isSelected = filters.genres.includes(genre);
    const updatedGenres = isSelected
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre];
    
    onChange({
      ...filters,
      genres: updatedGenres,
    });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      minRating: parseFloat(e.target.value),
    });
  };

  const setDecade = (decade: string) => {
    onChange({
      ...filters,
      decade,
    });
  };

  return (
    <div className="w-full rounded-2xl glass-panel p-5 border border-white/5 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-violet-400" />
          <h3 className="font-semibold text-zinc-100 text-sm">Match Filters</h3>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors duration-250 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* Genres Grid */}
      <div>
        <span className="block text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
          Genres
        </span>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
          {allGenres.map((genre) => {
            const isSelected = filters.genres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-violet-600/20 border-violet-500 text-violet-200 shadow-sm shadow-violet-500/10'
                    : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-200'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating Range Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Min IMDb Rating
          </span>
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
            {filters.minRating.toFixed(1)}+
          </span>
        </div>
        <input
          type="range"
          min="7.0"
          max="9.0"
          step="0.1"
          value={filters.minRating}
          onChange={handleRatingChange}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none"
        />
        <div className="flex justify-between text-3xs text-zinc-500 mt-1">
          <span>7.0</span>
          <span>8.0</span>
          <span>9.0</span>
        </div>
      </div>

      {/* Decades Selector */}
      <div>
        <span className="block text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
          Release Era
        </span>
        <div className="grid grid-cols-3 gap-2">
          {decades.map((d) => {
            const isSelected = filters.decade === d.value;
            return (
              <button
                key={d.value}
                onClick={() => setDecade(d.value)}
                className={`text-xs py-2 rounded-lg border text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm shadow-indigo-500/10'
                    : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-200'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
