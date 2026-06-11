'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '../types';
import { X, Plus, Check, Play, Star, Sparkles, Film } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: Movie[];
  watchlist: Movie[];
  onSaveRecommendation: (movie: Movie) => void;
}

export default function RecommendationsModal({
  isOpen,
  onClose,
  recommendations,
  watchlist,
  onSaveRecommendation,
}: RecommendationsModalProps) {
  const [activeTrailer, setActiveTrailer] = useState<string | null>(null);

  // Trigger confetti when modal is opened with recommendations
  useEffect(() => {
    if (isOpen && recommendations.length > 0) {
      // Fire confetti in Amethyst branding colors!
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#9d4edd', '#ff007f', '#00f0ff'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#9d4edd', '#ff007f', '#00f0ff'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen, recommendations.length]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md">
        {/* Animated Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-6xl rounded-3xl border border-white/10 bg-[#110e1a] p-6 md:p-8 shadow-2xl shadow-purple-500/10 flex flex-col gap-6 max-h-[95vh] overflow-y-auto amethyst-scrollbar"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-600/10 border border-purple-500/25 text-purple-400">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-purple-400 tracking-tight uppercase">
                  YOUR MATCHES ARE READY!
                </h2>
                <p className="text-xs md:text-sm text-zinc-400 font-semibold">
                  We found these 5 films curated specially for you based on your swiping profile.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Recommendations Grid */}
          {recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 text-zinc-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-550 border-t-transparent mb-3" />
              <p className="text-sm font-semibold tracking-wider text-zinc-400 animate-pulse">
                Analyzing choices and compiling recommendations...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {recommendations.slice(0, 5).map((movie, idx) => {
                const isSaved = watchlist.some((m) => m.id === movie.id);
                const matchPercentage = Math.round(75 + (movie.rating / 10) * 23);
                return (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group flex flex-col rounded-2xl border border-white/5 bg-zinc-900/30 overflow-hidden hover:border-purple-500/25 hover:bg-zinc-900/70 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300"
                  >
                    {/* Poster Wrapper */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-800">
                      <Image
                        src={movie.posterUrl}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Rating Overlay */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/65 border border-white/5 backdrop-blur-xs text-3xs font-bold text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400" />
                        {movie.rating.toFixed(1)}
                      </div>

                      {/* Trailer Button Overlay */}
                      {movie.trailerUrl && (
                        <button
                          onClick={() => setActiveTrailer(movie.trailerUrl || null)}
                          className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-600/90 hover:bg-purple-505 text-white border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                          title="Watch Trailer"
                        >
                          <Play className="h-5 w-5 fill-white ml-0.5" />
                        </button>
                      )}
                    </div>

                    {/* Metadata & Description */}
                    <div className="p-4 flex-grow flex flex-col justify-between gap-3 bg-zinc-900/20">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-zinc-100 leading-snug group-hover:text-purple-400 transition-colors line-clamp-1 uppercase">
                          {movie.title}
                        </h4>
                        <div className="text-3xs text-zinc-400 font-semibold flex items-center gap-1.5">
                          <span className="text-emerald-400">{matchPercentage}% Match</span>
                          <span>{movie.releaseYear}</span>
                          <span>{movie.runtime}m</span>
                        </div>
                        <p className="text-3xs text-zinc-500 line-clamp-2 leading-relaxed mt-1">
                          {movie.overview}
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => onSaveRecommendation(movie)}
                        disabled={isSaved}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-2xs font-bold transition-all duration-200 cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 cursor-default'
                            : 'bg-zinc-800 hover:bg-purple-650 border border-white/5 hover:border-purple-500 text-zinc-300 hover:text-white active:scale-97'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Saved to List
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Add to Watchlist
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Start Over / Close Actions */}
          <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Continue Swiping
            </button>
          </div>
        </motion.div>

        {/* Nested Trailer Modal */}
        <AnimatePresence>
          {activeTrailer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
              onClick={() => setActiveTrailer(null)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setActiveTrailer(null)}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
                <iframe
                  src={activeTrailer}
                  title="YouTube Movie Trailer"
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
