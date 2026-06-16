'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '../types';
import { Play, Plus, Check, Info, ChevronLeft, ChevronRight, Star, Volume2 } from 'lucide-react';

interface NetflixBrowseProps {
  onSelectMovie: (movie: Movie) => void;
  onSaveToWatchlist: (movie: Movie) => void;
  onRemoveFromWatchlist: (movieId: string) => void;
  watchlist: Movie[];
  onPlayTrailer: (movie: Movie) => void;
}

interface CategoryRowProps {
  title: string;
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onSaveToWatchlist: (movie: Movie) => void;
  onRemoveFromWatchlist: (movieId: string) => void;
  watchlistIds: Set<string>;
  onPlayTrailer: (movie: Movie) => void;
}

export default function NetflixBrowse({
  onSelectMovie,
  onSaveToWatchlist,
  onRemoveFromWatchlist,
  watchlist,
  onPlayTrailer,
}: NetflixBrowseProps) {
  const [browseData, setBrowseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const watchlistIds = React.useMemo(() => new Set(watchlist.map(m => m.id)), [watchlist]);

  useEffect(() => {
    const fetchBrowse = async () => {
      try {
        const res = await fetch('/api/movies/browse');
        if (!res.ok) throw new Error('Failed to load categories');
        const data = await res.json();
        setBrowseData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve categories');
      } finally {
        setLoading(false);
      }
    };
    fetchBrowse();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-24 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-theme-accent border-t-transparent" />
        <p className="text-sm font-semibold text-theme-fg/60 tracking-wider animate-pulse uppercase font-theme-body">Assembling Cinema Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-16 text-center text-red-500 font-semibold font-theme-body">
        Error loading browse categories: {error}
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 py-6 px-4 md:px-10 overflow-y-auto h-full amethyst-scrollbar bg-theme-bg text-theme-fg">
      {/* Hero Movie Feature Banner */}
      {browseData?.trending?.[0] && (
        <HeroBanner
          movie={browseData.trending[0]}
          onSelectMovie={onSelectMovie}
          onPlayTrailer={onPlayTrailer}
          onSaveToWatchlist={onSaveToWatchlist}
          onRemoveFromWatchlist={onRemoveFromWatchlist}
          isSaved={watchlistIds.has(browseData.trending[0].id)}
        />
      )}

      {/* Categories Horizontal Rows */}
      <div className="space-y-8 pb-24">
        {browseData?.trending && (
          <CategoryRow
            title="Trending Now"
            movies={browseData.trending}
            onSelectMovie={onSelectMovie}
            onSaveToWatchlist={onSaveToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
            watchlistIds={watchlistIds}
            onPlayTrailer={onPlayTrailer}
          />
        )}
        {browseData?.topRated && (
          <CategoryRow
            title="Critically Acclaimed / Top Swiped"
            movies={browseData.topRated}
            onSelectMovie={onSelectMovie}
            onSaveToWatchlist={onSaveToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
            watchlistIds={watchlistIds}
            onPlayTrailer={onPlayTrailer}
          />
        )}
        {browseData?.action && (
          <CategoryRow
            title="Action & Adventure Thrillers"
            movies={browseData.action}
            onSelectMovie={onSelectMovie}
            onSaveToWatchlist={onSaveToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
            watchlistIds={watchlistIds}
            onPlayTrailer={onPlayTrailer}
          />
        )}
        {browseData?.scifi && (
          <CategoryRow
            title="Sci-Fi & Mind-Bending Fantasy"
            movies={browseData.scifi}
            onSelectMovie={onSelectMovie}
            onSaveToWatchlist={onSaveToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
            watchlistIds={watchlistIds}
            onPlayTrailer={onPlayTrailer}
          />
        )}
        {browseData?.drama && (
          <CategoryRow
            title="Emotional & Powerful Dramas"
            movies={browseData.drama}
            onSelectMovie={onSelectMovie}
            onSaveToWatchlist={onSaveToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
            watchlistIds={watchlistIds}
            onPlayTrailer={onPlayTrailer}
          />
        )}
        {browseData?.comedy && (
          <CategoryRow
            title="Hilarious Comedy Specials"
            movies={browseData.comedy}
            onSelectMovie={onSelectMovie}
            onSaveToWatchlist={onSaveToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
            watchlistIds={watchlistIds}
            onPlayTrailer={onPlayTrailer}
          />
        )}
      </div>
    </div>
  );
}

/* Feature Hero Banner Component */
function HeroBanner({
  movie,
  onSelectMovie,
  onPlayTrailer,
  onSaveToWatchlist,
  onRemoveFromWatchlist,
  isSaved,
}: {
  movie: Movie;
  onSelectMovie: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
  onSaveToWatchlist: (movie: Movie) => void;
  onRemoveFromWatchlist: (movieId: string) => void;
  isSaved: boolean;
}) {
  return (
    <div className="relative w-full h-[55vh] md:h-[65vh] rounded-theme-radius overflow-hidden border border-theme-border shadow-2xl">
      {/* Background Image */}
      <Image
        src={movie.backdropUrl}
        alt={movie.title}
        fill
        className="object-cover"
        priority
      />
      {/* Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-theme-bg/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-theme-bg/85 via-theme-bg/30 to-transparent" />

      {/* Hero Content */}
      <div className="absolute bottom-10 left-6 md:left-12 max-w-xl space-y-4 font-theme-body">
        {/* Brand Tag */}
        <div className="flex items-center gap-1.5 text-xs text-theme-accent font-black tracking-widest uppercase">
          <span className="text-xl font-theme-head">M</span>
          <span className="text-3xs tracking-widest font-extrabold text-theme-fg/60">Matchmaker Exclusive</span>
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-theme-fg leading-tight uppercase font-theme-head">
          {movie.title}
        </h2>

        {/* Info Line */}
        <div className="flex items-center gap-3 text-xs md:text-sm font-semibold">
          <span className="text-emerald-400 font-extrabold">98% Match</span>
          <span className="px-1.5 py-0.5 border border-theme-border rounded text-3xs uppercase tracking-wider text-theme-fg/50 font-black bg-theme-panel/20">PG-13</span>
          <span>{movie.releaseYear}</span>
          <span>{movie.runtime} min</span>
        </div>

        {/* Description */}
        <p className="text-theme-fg/80 text-xs md:text-sm leading-relaxed max-w-lg line-clamp-3 md:line-clamp-4">
          {movie.overview}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          {movie.trailerUrl && (
            <button
              onClick={() => onPlayTrailer(movie)}
              className="flex items-center gap-2 bg-theme-fg hover:bg-theme-fg/90 text-theme-bg py-2.5 px-6 rounded-theme-radius font-bold transition-all hover:scale-105 duration-200 cursor-pointer shadow-lg text-sm"
            >
              <Play className="h-4 w-4 fill-current text-current" />
              Play Trailer
            </button>
          )}

          <button
            onClick={() => isSaved ? onRemoveFromWatchlist(movie.id) : onSaveToWatchlist(movie)}
            className={`flex items-center gap-2 py-2.5 px-6 rounded-theme-radius font-bold transition-all hover:scale-105 duration-200 cursor-pointer text-sm border ${
              isSaved
                ? 'bg-theme-accent hover:bg-theme-accent-hover border-theme-accent text-theme-btn-text'
                : 'bg-theme-panel hover:bg-theme-card border-theme-border text-theme-fg'
            }`}
          >
            {isSaved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isSaved ? 'In Watchlist' : 'My Watchlist'}
          </button>

          <button
            onClick={() => onSelectMovie(movie)}
            className="flex items-center gap-2 bg-theme-panel/60 hover:bg-theme-panel border border-theme-border text-theme-fg py-2.5 px-6 rounded-theme-radius font-bold transition-all hover:scale-105 duration-200 cursor-pointer text-sm"
          >
            <Info className="h-4 w-4 text-theme-fg/60" />
            More Info
          </button>
        </div>
      </div>
    </div>
  );
}

/* Category Row Component */
function CategoryRow({
  title,
  movies,
  onSelectMovie,
  onSaveToWatchlist,
  onRemoveFromWatchlist,
  watchlistIds,
  onPlayTrailer,
}: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const offset = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkArrows);
      checkArrows();
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkArrows);
    };
  }, [movies]);

  if (movies.length === 0) return null;

  return (
    <div className="space-y-2 relative group/row">
      {/* Category Title */}
      <h3 className="text-md md:text-lg font-black tracking-tight text-theme-fg pl-1 uppercase font-theme-head">
        {title}
      </h3>

      {/* Row Wrapper */}
      <div className="relative">
        {/* Left Scroll Trigger */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-40 bg-theme-panel/75 hover:bg-theme-panel text-theme-fg w-10 md:w-12 flex items-center justify-center cursor-pointer transition-all duration-200 border-r border-theme-border opacity-0 group-hover/row:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Right Scroll Trigger */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-45 bg-theme-panel/75 hover:bg-theme-panel text-theme-fg w-10 md:w-12 flex items-center justify-center cursor-pointer transition-all duration-200 border-l border-theme-border opacity-0 group-hover/row:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Scrolling Grid */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pt-16 pb-12 px-1 -mt-12 -mb-8 no-scrollbar scroll-smooth"
        >
          {movies.map((movie, index) => {
            const isSaved = watchlistIds.has(movie.id);
            return (
              <BrowseCard
                key={movie.id}
                movie={movie}
                isSaved={isSaved}
                onSelectMovie={onSelectMovie}
                onSaveToWatchlist={onSaveToWatchlist}
                onRemoveFromWatchlist={onRemoveFromWatchlist}
                onPlayTrailer={onPlayTrailer}
                isFirst={index === 0}
                isLast={index === movies.length - 1}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Hover-Zoom Interactive Browse Card Component */
interface BrowseCardProps {
  movie: Movie;
  isSaved: boolean;
  onSelectMovie: (movie: Movie) => void;
  onSaveToWatchlist: (movie: Movie) => void;
  onRemoveFromWatchlist: (movieId: string) => void;
  onPlayTrailer: (movie: Movie) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function BrowseCard({
  movie,
  isSaved,
  onSelectMovie,
  onSaveToWatchlist,
  onRemoveFromWatchlist,
  onPlayTrailer,
  isFirst = false,
  isLast = false,
}: BrowseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [playHoverVideo, setPlayHoverVideo] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);

  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const cardWidth = rect.width;
      const targetWidth = cardWidth * 3;
      
      // Center horizontally relative to card
      let left = rect.left + window.scrollX + (cardWidth - targetWidth) / 2;
      
      // Constrain left/right screen bounds
      const margin = 12;
      if (left < margin) {
        left = margin;
      } else if (left + targetWidth > window.innerWidth - margin) {
        left = window.innerWidth - margin - targetWidth;
      }
      
      // Top position: slightly shifted up relative to the card's top
      const top = rect.top + window.scrollY - 40;
      
      setCoords({
        top,
        left,
        width: targetWidth,
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    
    // Start silent inline preview after 350ms of hover
    hoverTimer.current = setTimeout(() => {
      setPlayHoverVideo(true);
    }, 350);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPlayHoverVideo(false);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateCoords();
    setIsClicked(true);
  };

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const matchPercentage = Math.round(75 + (movie.rating / 10) * 23);

  return (
    <>
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        className="relative flex-shrink-0 w-28 sm:w-36 md:w-44 aspect-[2/3] rounded-theme-radius cursor-pointer transition-transform duration-300 active:scale-95"
      >
        {/* Standard Static Card Poster / Inline Video Preview */}
        <div className="relative w-full h-full overflow-hidden rounded-theme-radius border border-theme-border bg-theme-card shadow-lg select-none pointer-events-none">
          {playHoverVideo && movie.trailerUrl ? (
            <iframe
              src={`${movie.trailerUrl}?autoplay=1&mute=1&controls=0&start=0&end=15&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&enablejsapi=1`}
              className="absolute inset-0 w-full h-full pointer-events-none scale-[1.6] object-cover"
              allow="autoplay; encrypted-media"
              frameBorder="0"
              title={`${movie.title} Inline Preview`}
            />
          ) : (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              sizes="(max-width: 768px) 112px, 176px"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-theme-bg/85 via-theme-bg/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
            <span className="text-3xs font-extrabold text-theme-fg truncate w-full uppercase font-theme-head">
              {movie.title}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Click Pop-out details card rendered via Portal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isClicked && (
            <>
              {/* Fullscreen dimming backdrop overlay to catch clicks outside the popup */}
              <div 
                className="fixed inset-0 bg-theme-bg/75 z-[9998] backdrop-blur-3xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsClicked(false);
                }}
              />
              
              {/* Floating 3x Card Content */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                style={{
                  position: 'absolute',
                  top: coords.top,
                  left: coords.left,
                  width: coords.width,
                  zIndex: 9999,
                  transformOrigin: isFirst ? 'left top' : isLast ? 'right top' : 'center top',
                }}
                className="rounded-theme-radius border border-theme-border bg-theme-panel shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
              >
                {/* Header backdrop inside clicked card */}
                <div className="relative w-full aspect-video bg-theme-bg overflow-hidden">
                  {movie.trailerUrl ? (
                    <iframe
                      src={`${movie.trailerUrl}?autoplay=1&mute=0&controls=0&start=0&end=20&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&enablejsapi=1`}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-105"
                      allow="autoplay; encrypted-media"
                      frameBorder="0"
                      title={`${movie.title} Trailer Preview`}
                    />
                  ) : (
                    <Image
                      src={movie.backdropUrl}
                      alt={movie.title}
                      fill
                      sizes="512px"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-theme-panel via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-2.5 left-2.5 bg-theme-bg/60 backdrop-blur-3xs text-3xs font-extrabold text-theme-fg px-2 py-0.5 rounded border border-theme-border flex items-center gap-0.5 z-10 pointer-events-none">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    {movie.rating.toFixed(1)}
                  </div>
                  {movie.trailerUrl && (
                    <div className="absolute bottom-2.5 right-2.5 bg-theme-bg/60 backdrop-blur-3xs text-3xs font-extrabold text-theme-fg px-2 py-0.5 rounded border border-theme-border flex items-center gap-1 z-10 pointer-events-none uppercase tracking-wider animate-pulse font-theme-body">
                      <Volume2 className="h-3 w-3 text-theme-accent" />
                      Audio Active
                    </div>
                  )}
                  {/* Close button in top-right corner of the video */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsClicked(false);
                    }}
                    className="absolute top-2.5 right-2.5 z-20 rounded-full border border-theme-border bg-theme-bg/60 hover:bg-theme-bg/90 p-1.5 text-theme-fg/60 hover:text-theme-fg transition-colors cursor-pointer flex items-center justify-center"
                    title="Close Preview"
                  >
                    <span className="text-xs font-black px-1.5">✕</span>
                  </button>
                </div>

                {/* Click details content panel */}
                <div className="p-5 space-y-4 font-theme-body">
                  {/* Title and metadata */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-2xs font-semibold text-theme-fg/60">
                      <span className="text-emerald-400">{matchPercentage}% Match</span>
                      <span>{movie.releaseYear}</span>
                      <span className="px-1 border border-theme-border rounded text-4xs uppercase tracking-wider text-theme-fg/50 font-bold bg-theme-panel/10">PG-13</span>
                      <span>{movie.runtime}m</span>
                    </div>
                    <h4 className="text-md sm:text-lg md:text-xl font-black text-theme-fg leading-tight uppercase font-theme-head">
                      {movie.title}
                    </h4>
                  </div>

                  {/* Synopsis */}
                  <p className="text-theme-fg/80 text-3xs sm:text-2xs md:text-xs leading-relaxed line-clamp-3">
                    {movie.overview}
                  </p>

                  {/* Cast and Director details */}
                  <div className="text-4xs uppercase tracking-widest text-theme-fg/55 font-bold space-y-0.5 sm:space-y-1">
                    <div>Director: <span className="text-theme-fg/85">{movie.director}</span></div>
                    <div className="truncate">Cast: <span className="text-theme-fg/85">{movie.cast.slice(0, 3).join(', ')}</span></div>
                  </div>

                  {/* Buttons and Genres Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      {movie.trailerUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayTrailer(movie);
                            setIsClicked(false);
                          }}
                          className="bg-theme-fg hover:bg-theme-fg/90 text-theme-bg font-bold px-3 py-1.5 rounded-theme-radius text-3xs sm:text-2xs flex items-center gap-1 cursor-pointer transition-all duration-200 hover:scale-105"
                        >
                          <Play className="h-3 w-3 fill-current text-current ml-0.5" />
                          Full Trailer
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSaved) {
                            onRemoveFromWatchlist(movie.id);
                          } else {
                            onSaveToWatchlist(movie);
                          }
                        }}
                        className={`rounded-theme-radius p-2 cursor-pointer shadow border transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                          isSaved
                            ? 'bg-theme-accent hover:bg-theme-accent-hover border-theme-accent text-theme-btn-text'
                            : 'bg-theme-panel hover:bg-theme-card border-theme-border text-theme-fg'
                        }`}
                        title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        {isSaved ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMovie(movie);
                          setIsClicked(false);
                        }}
                        className="rounded-theme-radius p-2 bg-theme-panel hover:bg-theme-card border border-theme-border text-theme-fg/60 hover:text-theme-fg transition-all duration-200 hover:scale-110 flex items-center justify-center"
                        title="View Full Information & Reviews"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Genre tags */}
                    <div className="flex gap-1">
                      {movie.genres.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="text-4xs font-semibold text-theme-fg/50 bg-theme-panel border border-theme-border px-1.5 py-0.5 rounded-theme-radius"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
