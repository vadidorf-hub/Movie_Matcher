'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Movie, SwipeDirection } from '../types';
import { Calendar, Clock, Film, Info, Star, User, Users, Play, X, Heart, Plus, Check } from 'lucide-react';

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
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.6, 1, 1, 1, 0.6]);

  // Stamp opacities
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const superLikeOpacity = useTransform(y, [-80, 0], [1, 0]);

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

    const thresholdX = 120;
    const thresholdY = -90;
    const swipeVelocity = 350;

    if (info.offset.x > thresholdX || info.velocity.x > swipeVelocity) {
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

  const matchPercentage = Math.round(75 + (movie.rating / 10) * 23);

  return (
    <>
      <motion.div
        drag={active && !showDetails}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.65}
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
          active ? '' : 'pointer-events-none scale-96 translate-y-3.5 opacity-30'
        }`}
      >
        {/* Poster Image */}
        <div className="relative w-full flex-grow overflow-hidden">
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-cover pointer-events-none select-none transition-transform duration-500 hover:scale-101"
            priority={active}
          />
          {/* Shadow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/20 pointer-events-none" />

          {/* Custom Brand Tag */}
          <div className="absolute top-5 left-5 z-20 flex items-center gap-1.5 select-none">
            <span className="text-xl font-black bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-md">M</span>
            <span className="text-4xs font-bold text-zinc-300 uppercase tracking-widest bg-black/40 px-2.5 py-0.5 rounded border border-white/5 backdrop-blur-3xs">
              Trending
            </span>
          </div>

          {/* Swipe Stamps */}
          {active && (
            <>
              <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute top-20 left-8 border-4 border-emerald-500 text-emerald-500 font-black uppercase text-2xl px-5 py-1.5 rounded-lg rotate-[-12deg] tracking-wider z-20 pointer-events-none bg-emerald-950/40 backdrop-blur-3xs"
              >
                KEEP
              </motion.div>
              <motion.div
                style={{ opacity: nopeOpacity }}
                className="absolute top-20 right-8 border-4 border-fuchsia-500 text-fuchsia-500 font-black uppercase text-2xl px-5 py-1.5 rounded-lg rotate-[12deg] tracking-wider z-20 pointer-events-none bg-fuchsia-950/40 backdrop-blur-3xs"
              >
                SKIP
              </motion.div>
              <motion.div
                style={{ opacity: superLikeOpacity }}
                className="absolute bottom-36 left-1/2 -translate-x-1/2 border-4 border-sky-400 text-sky-400 font-black uppercase text-lg px-6 py-1.5 rounded-lg tracking-wider z-20 pointer-events-none bg-sky-950/40 backdrop-blur-3xs text-center whitespace-nowrap"
              >
                MUST WATCH
              </motion.div>
            </>
          )}

          {/* Action Buttons overlay inside Card */}
          {active && (
            <div className="absolute right-4 bottom-4 z-20 flex gap-2.5">
              {movie.trailerUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTrailer(true);
                  }}
                  className="bg-purple-600/90 backdrop-blur-md hover:bg-purple-500 text-white rounded-full p-3 shadow-lg cursor-pointer transition-all duration-200 hover:scale-108 active:scale-95 flex items-center justify-center border border-purple-500/25"
                  title="Watch YouTube Trailer"
                >
                  <Play className="h-4.5 w-4.5 fill-white ml-0.5" />
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(true);
                }}
                className="bg-zinc-900/90 backdrop-blur-md hover:bg-zinc-800 text-white rounded-full p-3 border border-white/10 shadow-lg cursor-pointer transition-all duration-200 hover:scale-108 active:scale-95 flex items-center justify-center"
                title="View Movie Details"
              >
                <Info className="h-4.5 w-4.5 text-zinc-300" />
              </button>
            </div>
          )}

          {/* Bottom Card Text Information Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end pointer-events-none space-y-2.5">
            {/* Genre labels */}
            <div className="flex flex-wrap gap-1.5">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-white/10 backdrop-blur-xs text-zinc-200 text-4xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/5"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-md uppercase">
              {movie.title}
            </h2>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-zinc-300 font-semibold">
              <span className="text-emerald-400 font-black">{matchPercentage}% Match</span>
              <span className="px-1 border border-zinc-600 rounded text-4xs uppercase tracking-wider text-zinc-400 font-bold bg-black/20">PG-13</span>
              <span>{movie.releaseYear}</span>
              <span>{movie.runtime}m</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expanded Details Drawer */}
      {showDetails && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="absolute inset-0" onClick={() => setShowDetails(false)} />

          <div className="relative w-full max-w-lg rounded-t-3xl border-t border-white/10 bg-[#181526] p-6 pb-8 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto amethyst-scrollbar">
            <div className="mx-auto w-12 h-1.5 bg-zinc-800 rounded-full mb-5 cursor-pointer" onClick={() => setShowDetails(false)} />

            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 rounded-full border border-white/10 bg-zinc-900 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Backdrop visual container */}
            <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden mb-5 border border-white/5">
              <Image
                src={movie.backdropUrl}
                alt={`${movie.title} backdrop`}
                fill
                sizes="(max-width: 768px) 100vw, 512px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181526] via-[#181526]/20 to-black/30" />

              {/* Play Trailer overlay */}
              {movie.trailerUrl && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="absolute inset-0 flex items-center justify-center m-auto bg-purple-600 text-white rounded-full p-4 w-14 h-14 border border-purple-500 hover:scale-105 active:scale-95 transition-all shadow-lg hover:bg-purple-700 cursor-pointer"
                >
                  <Play className="h-6 w-6 fill-white ml-0.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-white/5 text-zinc-300 text-3xs font-semibold px-2.5 py-0.5 rounded border border-white/5"
                >
                  {genre}
                </span>
              ))}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-1.5 uppercase">
              {movie.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mb-6 font-semibold pb-4 border-b border-white/5">
              <span className="text-emerald-400 font-black">{matchPercentage}% Match</span>
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                {movie.rating.toFixed(1)} IMDb
              </span>
              <span>{movie.releaseYear}</span>
              <span>{movie.runtime} min</span>
            </div>

            {/* Overview */}
            <div className="mb-6">
              <h3 className="text-3xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Synopsis</h3>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {movie.overview}
              </p>
            </div>

            {/* Production Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-5 mb-4">
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-purple-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-3xs font-bold text-zinc-500 uppercase tracking-wider">Director</span>
                  <span className="text-zinc-300 text-xs font-semibold">{movie.director}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-300">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-3xs font-bold text-zinc-500 uppercase tracking-wider">Cast</span>
                  <span className="text-zinc-300 text-xs leading-normal">{movie.cast.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Modal Overlay */}
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
