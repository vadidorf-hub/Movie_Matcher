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
        className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none rounded-theme-radius overflow-hidden glass-card border border-theme-border shadow-2xl flex flex-col ${
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
          <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-theme-bg/35 to-theme-bg/25 pointer-events-none" />

          {/* Custom Brand Tag */}
          <div className="absolute top-5 left-5 z-20 flex items-center gap-1.5 select-none font-theme-body">
            <span className="text-xl font-black bg-gradient-to-r from-theme-accent to-theme-secondary bg-clip-text text-transparent drop-shadow-md font-theme-head">M</span>
            <span className="text-4xs font-bold text-theme-fg/80 uppercase tracking-widest bg-theme-panel/40 px-2.5 py-0.5 rounded-theme-radius border border-theme-border backdrop-blur-3xs">
              Trending
            </span>
          </div>

          {/* Swipe Stamps */}
          {active && (
            <>
              <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute top-20 left-8 border-4 border-emerald-500 text-emerald-500 font-black uppercase text-2xl px-5 py-1.5 rounded-theme-radius rotate-[-12deg] tracking-wider z-20 pointer-events-none bg-emerald-950/40 backdrop-blur-3xs"
              >
                KEEP
              </motion.div>
              <motion.div
                style={{ opacity: nopeOpacity }}
                className="absolute top-20 right-8 border-4 border-fuchsia-500 text-fuchsia-500 font-black uppercase text-2xl px-5 py-1.5 rounded-theme-radius rotate-[12deg] tracking-wider z-20 pointer-events-none bg-fuchsia-950/40 backdrop-blur-3xs"
              >
                SKIP
              </motion.div>
              <motion.div
                style={{ opacity: superLikeOpacity }}
                className="absolute bottom-36 left-1/2 -translate-x-1/2 border-4 border-sky-400 text-sky-400 font-black uppercase text-lg px-6 py-1.5 rounded-theme-radius tracking-wider z-20 pointer-events-none bg-sky-950/40 backdrop-blur-3xs text-center whitespace-nowrap"
              >
                MUST WATCH
              </motion.div>
            </>
          )}

          {/* Action Buttons overlay inside Card */}
          {active && (
            <div className="absolute right-4 bottom-4 z-20 flex gap-2.5 font-theme-body">
              {movie.trailerUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTrailer(true);
                  }}
                  className="bg-theme-accent/90 backdrop-blur-md hover:bg-theme-accent text-theme-btn-text rounded-full p-3 shadow-lg cursor-pointer transition-all duration-200 hover:scale-108 active:scale-95 flex items-center justify-center border border-theme-accent/25"
                  title="Watch YouTube Trailer"
                >
                  <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(true);
                }}
                className="bg-theme-panel/90 backdrop-blur-md hover:bg-theme-card text-theme-fg rounded-full p-3 border border-theme-border shadow-lg cursor-pointer transition-all duration-200 hover:scale-108 active:scale-95 flex items-center justify-center"
                title="View Movie Details"
              >
                <Info className="h-4.5 w-4.5 text-theme-fg/80" />
              </button>
            </div>
          )}

          {/* Bottom Card Text Information Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end pointer-events-none space-y-2.5">
            {/* Genre labels */}
            <div className="flex flex-wrap gap-1.5 font-theme-body">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-theme-panel/30 backdrop-blur-xs text-theme-fg text-4xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-theme-border"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-black text-theme-fg leading-tight tracking-tight drop-shadow-md uppercase font-theme-head">
              {movie.title}
            </h2>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-theme-fg/80 font-semibold font-theme-body">
              <span className="text-emerald-400 font-black">{matchPercentage}% Match</span>
              <span className="px-1 border border-theme-border rounded text-4xs uppercase tracking-wider text-theme-fg/50 font-bold bg-theme-panel/20">PG-13</span>
              <span>{movie.releaseYear}</span>
              <span>{movie.runtime}m</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expanded Details Drawer */}
      {showDetails && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-theme-bg/75 backdrop-blur-md animate-fade-in">
          <div className="absolute inset-0" onClick={() => setShowDetails(false)} />

          <div className="relative w-full max-w-lg rounded-t-theme-radius border-t border-theme-border bg-theme-card p-6 pb-8 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto amethyst-scrollbar">
            <div className="mx-auto w-12 h-1.5 bg-theme-border rounded-full mb-5 cursor-pointer" onClick={() => setShowDetails(false)} />

            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 rounded-full border border-theme-border bg-theme-panel p-2 text-theme-fg/60 hover:bg-theme-card hover:text-theme-fg transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Backdrop visual container */}
            <div className="relative w-full h-44 sm:h-52 rounded-theme-radius overflow-hidden mb-5 border border-theme-border">
              <Image
                src={movie.backdropUrl}
                alt={`${movie.title} backdrop`}
                fill
                sizes="(max-width: 768px) 100vw, 512px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-theme-card via-theme-card/20 to-theme-bg/30" />

              {/* Play Trailer overlay */}
              {movie.trailerUrl && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="absolute inset-0 flex items-center justify-center m-auto bg-theme-accent text-theme-btn-text rounded-full p-4 w-14 h-14 border border-theme-accent hover:scale-105 active:scale-95 transition-all shadow-lg hover:bg-theme-accent-hover cursor-pointer"
                >
                  <Play className="h-6 w-6 fill-current ml-0.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3 font-theme-body">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-theme-panel/30 text-theme-fg/80 text-3xs font-semibold px-2.5 py-0.5 rounded border border-theme-border"
                >
                  {genre}
                </span>
              ))}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-theme-fg tracking-tight leading-none mb-1.5 uppercase font-theme-head">
              {movie.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-theme-fg/60 mb-6 font-semibold pb-4 border-b border-theme-border font-theme-body">
              <span className="text-emerald-400 font-black">{matchPercentage}% Match</span>
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                {movie.rating.toFixed(1)} IMDb
              </span>
              <span>{movie.releaseYear}</span>
              <span>{movie.runtime} min</span>
            </div>

            {/* Overview */}
            <div className="mb-6 font-theme-body">
              <h3 className="text-3xs font-bold text-theme-fg/50 uppercase tracking-wider mb-2 font-theme-head">Synopsis</h3>
              <p className="text-theme-fg/80 text-sm leading-relaxed">
                {movie.overview}
              </p>
            </div>

            {/* Production Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-theme-border pt-5 mb-4 font-theme-body">
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-theme-radius bg-theme-panel border border-theme-border text-theme-accent">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-3xs font-bold text-theme-fg/50 uppercase tracking-wider font-theme-head">Director</span>
                  <span className="text-theme-fg/80 text-xs font-semibold">{movie.director}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-theme-radius bg-theme-panel border border-theme-border text-theme-fg/60">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-3xs font-bold text-theme-fg/50 uppercase tracking-wider font-theme-head">Cast</span>
                  <span className="text-theme-fg/80 text-xs leading-normal">{movie.cast.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Modal Overlay */}
      {showTrailer && movie.trailerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-bg/90 backdrop-blur-lg">
          <div className="absolute inset-0" onClick={() => setShowTrailer(false)} />
          <div className="relative w-full max-w-3xl aspect-video rounded-theme-radius overflow-hidden border border-theme-border bg-theme-bg z-50">
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
    </>
  );
}
