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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-full border border-white/10 bg-zinc-900/60 p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Backdrop visual image */}
        <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-5 border border-white/5 shadow-inner">
          <Image
            src={movie.backdropUrl}
            alt={`${movie.title} backdrop`}
            fill
            sizes="(max-width: 768px) 100vw, 512px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/30" />

          {/* Play Trailer Button overlay */}
          {movie.trailerUrl && (
            <button
              onClick={() => setShowTrailer(true)}
              className="absolute inset-0 flex items-center justify-center m-auto bg-violet-600/95 text-white rounded-full p-4 w-14 h-14 border border-violet-400 hover:scale-105 active:scale-95 transition-all shadow-lg hover:bg-violet-500 cursor-pointer"
            >
              <Play className="h-6 w-6 fill-white ml-0.5" />
            </button>
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {movie.genres.map((genre) => (
            <span
              key={genre}
              className="bg-white/5 text-zinc-300 text-3xs font-medium px-2 py-0.5 rounded-full border border-white/5"
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight mb-1">
          {movie.title}
        </h2>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mb-5 font-medium border-b border-white/5 pb-4.5">
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
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
          <h3 className="text-3xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Synopsis</h3>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {movie.overview}
          </p>
        </div>

        {/* People information */}
        <div className="grid grid-cols-1 gap-4 border-t border-white/5 pt-5 mb-2">
          <div className="flex gap-3 items-start">
            <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-violet-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-3xs font-bold text-zinc-500 uppercase tracking-wider">Director</span>
              <span className="text-zinc-300 text-sm font-semibold">{movie.director}</span>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-pink-400">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-3xs font-bold text-zinc-500 uppercase tracking-wider">Cast</span>
              <span className="text-zinc-300 text-sm leading-normal">{movie.cast.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Trailer Modal Overlay */}
        {showTrailer && movie.trailerUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
            <div className="absolute inset-0" onClick={() => setShowTrailer(false)} />
            <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black z-50">
              <button
                onClick={() => setShowTrailer(false)}
                className="absolute top-4 right-4 z-20 rounded-full border border-white/10 bg-black/60 p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
