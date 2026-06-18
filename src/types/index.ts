export interface Movie {
  id: string;
  title: string;
  overview: string;
  rating: number; // e.g. 8.4
  genres: string[];
  releaseYear: number;
  posterUrl: string;
  backdropUrl: string;
  director: string;
  runtime: number; // in minutes
  cast: string[];
  trailerUrl?: string; // YouTube or mock trailer URL
}

export type SwipeDirection = 'left' | 'right' | 'up';

export interface FilterState {
  genres: string[];
  minRating: number;
  decade: string; // 'all' | '1990s' | '2000s' | '2010s' | '2020s'
}

export interface RoomParticipant {
  name: string;
  genres: string[];
  completedFilters: boolean;
}

export interface Room {
  roomCode: string;
  createdAt: string;
  participants: RoomParticipant[];
}

export interface RoomSwipe {
  id: string;
  room_code: string;
  username: string;
  movie_id: string;
  movie_title: string;
  movie_data: Movie;
  direction: 'like' | 'dislike';
  created_at: string;
}

