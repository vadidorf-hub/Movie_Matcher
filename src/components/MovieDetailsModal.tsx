'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Movie } from '../types';
import { Calendar, Clock, Play, User, Users, X, Star } from 'lucide-react';

interface MovieDetailsModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export default function MovieDetailsModal({ movie, onClose }: MovieDetailsModalProps) {
  const [showTrailer, setShowTrailer] = useState(false);

  if (!movie) return null;

  const matchPercentage = Math.round(75 + (movie.rating / 10) * 23);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-theme-body">
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-theme-radius border border-theme-border bg-theme-panel p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto amethyst-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-full border border-theme-border bg-theme-bg/60 p-2 text-theme-fg/60 hover:text-theme-fg transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Backdrop visual image */}
        <div className="relative w-full h-48 sm:h-56 rounded-theme-radius overflow-hidden mb-5 border border-theme-border shadow-inner">
          <Image
            src={movie.backdropUrl}
            alt={`${movie.title} backdrop`}
            fill
            sizes="(max-width: 768px) 100vw, 512px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-theme-panel via-theme-panel/25 to-black/30" />

          {/* Play Trailer Button overlay */}
          {movie.trailerUrl && (
            <button
              onClick={() => setShowTrailer(true)}
              className="absolute inset-0 flex items-center justify-center m-auto bg-theme-accent text-theme-btn-text rounded-full p-4 w-14 h-14 border border-theme-border hover:scale-105 active:scale-95 transition-all shadow-lg hover:bg-theme-accent-hover cursor-pointer"
            >
              <Play className="h-6 w-6 fill-current ml-0.5" />
            </button>
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {movie.genres.map((genre) => (
            <span
              key={genre}
              className="bg-theme-card text-theme-fg/80 text-3xs font-semibold px-2.5 py-0.5 rounded-theme-radius border border-theme-border"
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-theme-fg tracking-tight leading-tight mb-2 uppercase font-theme-head">
          {movie.title}
        </h2>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-theme-fg/60 mb-5 font-semibold border-b border-theme-border pb-4.5">
          <span className="text-emerald-400 font-black">{matchPercentage}% Match</span>
          <span className="flex items-center gap-1 text-amber-500 font-bold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {movie.rating.toFixed(1)} IMDb
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {movie.releaseYear}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {movie.runtime} min
          </span>
        </div>

        {/* Overview */}
        <div className="mb-5">
          <h3 className="text-3xs font-bold text-theme-fg/50 uppercase tracking-wider mb-2 font-theme-head">Synopsis</h3>
          <p className="text-theme-fg/80 text-sm leading-relaxed">
            {movie.overview}
          </p>
        </div>

        {/* People information */}
        <div className="grid grid-cols-1 gap-4 border-t border-theme-border pt-5 mb-2">
          <div className="flex gap-3 items-start">
            <div className="p-2 rounded-theme-radius bg-theme-bg border border-theme-border text-theme-accent">
              <User className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-3xs font-bold text-theme-fg/50 uppercase tracking-wider font-theme-head">Director</span>
              <span className="text-theme-fg/80 text-xs font-semibold">{movie.director}</span>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="p-2 rounded-theme-radius bg-theme-bg border border-theme-border text-theme-fg/60">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-3xs font-bold text-theme-fg/50 uppercase tracking-wider font-theme-head">Cast</span>
              <span className="text-theme-fg/80 text-xs leading-relaxed">{movie.cast.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Trailer Modal Overlay */}
        {showTrailer && movie.trailerUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
            <div className="absolute inset-0" onClick={() => setShowTrailer(false)} />
            <div className="relative w-full max-w-2xl aspect-video rounded-theme-radius overflow-hidden border border-theme-border bg-black z-50 shadow-2xl">
              <button
                onClick={() => setShowTrailer(false)}
                className="absolute top-4 right-4 z-20 rounded-full border border-theme-border bg-theme-panel/60 p-2 text-theme-fg/60 hover:text-theme-fg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <iframe
                src={movie.trailerUrl}
                title={`${movie.title} Trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
