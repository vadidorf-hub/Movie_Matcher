'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Movie, SwipeDirection } from '../types';
import { Calendar, Clock, Film, Info, Star, User, Users, Play, X } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  active: boolean;
  onSwipe: (direction: SwipeDirection, movie: Movie) => void;
  swipeTrigger: SwipeDirection | null;
  onSwipeTriggerReset: () => void;
}

export default function MovieCard({
  movie,
  active,
  onSwipe,
  swipeTrigger,
  onSwipeTriggerReset
}: MovieCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const controls = useAnimation();
  const isMounted = React.useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Drag values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transformations for rotation and stamps opacity based on drag distance
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);

  // Stamp opacities
  const likeOpacity = useTransform(x, [0, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, 0], [1, 0]);
  const superLikeOpacity = useTransform(y, [-100, 0], [1, 0]);

  // Listen for programmatic swipe buttons
  useEffect(() => {
    if (active && swipeTrigger) {
      const triggerSwipe = async () => {
        let targetX = 0;
        let targetY = 0;
        let targetRotate = 0;

        if (swipeTrigger === 'left') {
          targetX = -600;
          targetRotate = -25;
        } else if (swipeTrigger === 'right') {
          targetX = 600;
          targetRotate = 25;
        } else if (swipeTrigger === 'up') {
          targetY = -600;
        }

        try {
          if (isMounted.current) {
            await controls.start({
              x: targetX,
              y: targetY,
              rotate: targetRotate,
              opacity: 0,
              transition: { duration: 0.35, ease: 'easeOut' }
            });
          }
        } catch (err) {
          console.warn('Programmatic swipe animation interrupted:', err);
        }

        // Reset the trigger FIRST to prevent the next card from inheriting it
        if (isMounted.current) {
          onSwipeTriggerReset();
          onSwipe(swipeTrigger, movie);
        }
      };

      triggerSwipe();
    }
  }, [swipeTrigger, active, controls, movie, onSwipe, onSwipeTriggerReset]);

  // Handle manual drag end
  const handleDragEnd = async (event: any, info: any) => {
    if (!active || !isMounted.current) return;

    const thresholdX = 130;
    const thresholdY = -100;
    const swipeVelocity = 400;

    if (info.offset.x > thresholdX || info.velocity.x > swipeVelocity) {
      // Swipe Right (Like)
      try {
        await controls.start({
          x: 600,
          rotate: 25,
          opacity: 0,
          transition: { duration: 0.25 }
        });
      } catch (err) {}
      if (isMounted.current) {
        onSwipe('right', movie);
      }
    } else if (info.offset.x < -thresholdX || info.velocity.x < -swipeVelocity) {
      // Swipe Left (Dislike)
      try {
        await controls.start({
          x: -600,
          rotate: -25,
          opacity: 0,
          transition: { duration: 0.25 }
        });
      } catch (err) {}
      if (isMounted.current) {
        onSwipe('left', movie);
      }
    } else if (info.offset.y < thresholdY || info.velocity.y < -swipeVelocity) {
      // Swipe Up (Super Like)
      try {
        await controls.start({
          y: -600,
          opacity: 0,
          transition: { duration: 0.25 }
        });
      } catch (err) {}
      if (isMounted.current) {
        onSwipe('up', movie);
      }
    } else {
      // Reset card position
      try {
        await controls.start({
          x: 0,
          y: 0,
          rotate: 0,
          opacity: 1,
          transition: { type: 'spring', stiffness: 300, damping: 20 }
        });
      } catch (err) {}
    }
  };

  return (
    <>
      <motion.div
        drag={active && !showDetails}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{
          x,
          y,
          rotate,
          opacity,
          zIndex: active ? 10 : 1,
          touchAction: 'none',
        }}
        className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl flex flex-col ${
          active ? '' : 'pointer-events-none scale-96 translate-y-3 opacity-40'
        }`}
      >
        {/* Poster Image */}
        <div className="relative w-full flex-grow overflow-hidden">
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-cover pointer-events-none select-none transition-transform duration-500 hover:scale-102"
            priority={active}
          />
          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-black/30 pointer-events-none" />

          {/* Swipe Stamps */}
          {active && (
            <>
              <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute top-8 left-8 border-4 border-emerald-500 text-emerald-500 font-extrabold uppercase text-2xl px-4 py-1.5 rounded-lg rotate-[-12deg] tracking-wider z-20 pointer-events-none bg-emerald-950/40 backdrop-blur-3xs"
              >
                LIKE
              </motion.div>
              <motion.div
                style={{ opacity: nopeOpacity }}
                className="absolute top-8 right-8 border-4 border-rose-500 text-rose-500 font-extrabold uppercase text-2xl px-4 py-1.5 rounded-lg rotate-[12deg] tracking-wider z-20 pointer-events-none bg-rose-950/40 backdrop-blur-3xs"
              >
                NOPE
              </motion.div>
              <motion.div
                style={{ opacity: superLikeOpacity }}
                className="absolute bottom-36 left-1/2 -translate-x-1/2 border-4 border-indigo-500 text-indigo-400 font-extrabold uppercase text-xl px-5 py-1.5 rounded-lg tracking-wider z-20 pointer-events-none bg-indigo-950/40 backdrop-blur-3xs text-center whitespace-nowrap"
              >
                SUPER LIKE
              </motion.div>
            </>
          )}

          {/* Float Action: Play Trailer & Info Toggle Buttons */}
          {active && (
            <div className="absolute right-4 bottom-4 z-20 flex gap-2.5">
              {movie.trailerUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTrailer(true);
                  }}
                  className="bg-rose-600/90 backdrop-blur-md hover:bg-rose-500 text-white rounded-full p-3 border border-rose-500/20 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
                  title="Watch YouTube Trailer"
                >
                  <Play className="h-5 w-5 fill-white ml-0.5" />
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(true);
                }}
                className="bg-zinc-900/80 backdrop-blur-md hover:bg-zinc-800 text-white rounded-full p-3 border border-white/10 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
                title="View Movie Details"
              >
                <Info className="h-5 w-5 text-indigo-400" />
              </button>
            </div>
          )}

          {/* Basic Card Text Overlay (Always Visible) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end pointer-events-none">
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-white/10 backdrop-blur-xs text-zinc-300 text-3xs font-medium px-2 py-0.5 rounded-full border border-white/5"
                >
                  {genre}
                </span>
              ))}
            </div>

            <h2 className="text-2xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
              {movie.title}
            </h2>

            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-300 font-medium">
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                {movie.rating.toFixed(1)}
              </span>
              <span>{movie.releaseYear}</span>
              <span>{movie.runtime} min</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expanded Details Drawer/Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/75 backdrop-blur-md animate-fade-in">
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setShowDetails(false)} />

          <div className="relative w-full max-w-lg rounded-t-3xl border-t border-white/10 bg-zinc-950 p-6 pb-8 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
            {/* Header pull bar */}
            <div className="mx-auto w-12 h-1.5 bg-zinc-800 rounded-full mb-5" onClick={() => setShowDetails(false)} />

            {/* Close button */}
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 rounded-full border border-white/10 bg-zinc-900 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Mini backdrop image */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-5 border border-white/5">
              <Image
                src={movie.backdropUrl}
                alt={`${movie.title} backdrop`}
                fill
                sizes="(max-width: 768px) 100vw, 512px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/40" />

              {/* Play Trailer Button overlay */}
              {movie.trailerUrl && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="absolute inset-0 flex items-center justify-center m-auto bg-violet-600/90 text-white rounded-full p-4 w-14 h-14 border border-violet-400 hover:scale-105 active:scale-95 transition-all shadow-lg hover:bg-violet-500 cursor-pointer"
                >
                  <Play className="h-6 w-6 fill-white ml-0.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-white/5 text-zinc-300 text-2xs px-2.5 py-0.5 rounded-full border border-white/5"
                >
                  {genre}
                </span>
              ))}
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-1">
              {movie.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mb-6 font-medium">
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
            <div className="mb-6">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Synopsis</h3>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {movie.overview}
              </p>
            </div>

            {/* Production Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-5 mb-4">
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
                  <span className="block text-3xs font-bold text-zinc-500 uppercase tracking-wider">Cast Members</span>
                  <span className="text-zinc-300 text-sm leading-snug">{movie.cast.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Iframe Modal */}
      {showTrailer && movie.trailerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="absolute inset-0" onClick={() => setShowTrailer(false)} />
          <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black z-50">
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
    </>
  );
}
