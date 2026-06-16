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
    <div className="w-full rounded-theme-radius glass-panel p-5 border border-theme-border shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-theme-border pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-theme-accent" />
          <h3 className="font-bold text-theme-fg text-sm uppercase tracking-wider font-theme-head">Match Filters</h3>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-theme-fg/60 hover:text-theme-fg transition-colors duration-250 cursor-pointer font-semibold font-theme-body"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* Genres Grid */}
      <div className="font-theme-body">
        <span className="block text-xs font-bold text-theme-fg/50 mb-3 uppercase tracking-wider font-theme-head">
          Genres
        </span>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 amethyst-scrollbar">
          {allGenres.map((genre) => {
            const isSelected = filters.genres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`text-xs px-3.5 py-1.5 rounded-theme-radius border transition-all duration-200 cursor-pointer font-semibold ${
                  isSelected
                    ? 'bg-theme-accent/25 border-theme-accent text-theme-fg shadow-sm shadow-theme-accent/10'
                    : 'bg-theme-panel border-theme-border text-theme-fg/60 hover:border-theme-border-hover hover:text-theme-fg'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating Range Slider */}
      <div className="font-theme-body">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-theme-fg/50 uppercase tracking-wider font-theme-head">
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
          className="w-full h-1.5 bg-theme-panel rounded-theme-radius border border-theme-border appearance-none cursor-pointer accent-theme-accent focus:outline-none"
        />
        <div className="flex justify-between text-3xs text-theme-fg/40 mt-1 font-semibold">
          <span>7.0</span>
          <span>8.0</span>
          <span>9.0</span>
        </div>
      </div>

      {/* Decades Selector */}
      <div className="font-theme-body">
        <span className="block text-xs font-bold text-theme-fg/50 mb-3 uppercase tracking-wider font-theme-head">
          Release Era
        </span>
        <div className="grid grid-cols-3 gap-2">
          {decades.map((d) => {
            const isSelected = filters.decade === d.value;
            return (
              <button
                key={d.value}
                onClick={() => setDecade(d.value)}
                className={`text-xs py-2 rounded-theme-radius border text-center transition-all duration-200 cursor-pointer font-semibold ${
                  isSelected
                    ? 'bg-theme-accent/25 border-theme-accent text-theme-fg shadow-sm shadow-theme-accent/10'
                    : 'bg-theme-panel border-theme-border text-theme-fg/60 hover:border-theme-border-hover hover:text-theme-fg'
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
