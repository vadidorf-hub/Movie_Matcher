'use client';

import React, { useState } from 'react';
import { Film, Users, Key, Sparkles, AlertCircle } from 'lucide-react';

interface RoomLobbyProps {
  onJoin: (roomCode: string, username: string) => Promise<void>;
  onCreate: (roomCode: string, username: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
}

export default function RoomLobby({
  onJoin,
  onCreate,
  loading,
  error,
  setError,
}: RoomLobbyProps) {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const generateRandomCode = () => {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setRoomCode(code);
    setError(null);
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    setRoomCode(val);
    setError(null);
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value.slice(0, 15));
    setError(null);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please enter a nickname.');
      return;
    }
    if (roomCode.length !== 5) {
      setError('Room code must be exactly 5 digits.');
      return;
    }
    onJoin(roomCode, nickname.trim());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please enter a nickname.');
      return;
    }
    if (roomCode.length !== 5) {
      setError('Please enter or generate a 5-digit room code.');
      return;
    }
    onCreate(roomCode, nickname.trim());
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-theme-radius glass-panel border border-theme-border shadow-2xl relative overflow-hidden font-theme-body">
      {/* Background glowing gradients */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-theme-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-theme-secondary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-2.5 mb-8">
        <div className="inline-flex p-3.5 rounded-2xl bg-theme-card border border-theme-border text-theme-accent shadow-lg shadow-theme-accent/5">
          <Users className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-theme-fg uppercase font-theme-head">
          Movie Matcher Room
        </h2>
        <p className="text-xs text-theme-fg/60 max-w-xs mx-auto leading-relaxed">
          Create or join a 5-digit room to sync lists and discover matched movies with your partner!
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-theme-radius bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-300 animate-scale-in">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-6">
        {/* Nickname Input */}
        <div className="space-y-2">
          <label className="block text-3xs font-bold text-theme-fg/50 uppercase tracking-wider font-theme-head">
            Your Nickname
          </label>
          <div className="relative">
            <input
              type="text"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="e.g. Alice"
              disabled={loading}
              className="w-full px-4 py-3 rounded-theme-radius border border-theme-border bg-theme-panel text-sm text-theme-fg placeholder-theme-fg/30 focus:border-theme-accent/50 focus:outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Room Code Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-3xs font-bold text-theme-fg/50 uppercase tracking-wider font-theme-head">
              5-Digit Room Code
            </label>
            <button
              type="button"
              onClick={generateRandomCode}
              disabled={loading}
              className="text-4xs font-bold text-theme-accent hover:text-theme-accent-hover transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Generate Code
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={roomCode}
              onChange={handleRoomCodeChange}
              placeholder="e.g. 54321"
              maxLength={5}
              disabled={loading}
              className="w-full px-4 py-3 rounded-theme-radius border border-theme-border bg-theme-panel text-sm text-theme-fg placeholder-theme-fg/30 tracking-widest text-center font-mono focus:border-theme-accent/50 focus:outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Join button */}
          <button
            type="submit"
            onClick={handleJoin}
            disabled={loading || !nickname.trim() || roomCode.length !== 5}
            className="w-full py-3.5 px-4 rounded-theme-radius bg-theme-card border border-theme-border hover:border-theme-accent hover:text-theme-accent text-theme-fg/70 font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 active:scale-97"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-theme-fg/50 border-t-transparent" />
            ) : (
              'Join Room'
            )}
          </button>

          {/* Create button */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || !nickname.trim() || roomCode.length !== 5}
            className="w-full py-3.5 px-4 rounded-theme-radius bg-theme-accent hover:bg-theme-accent-hover text-theme-btn-text font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg active:scale-97"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-theme-btn-text/50 border-t-transparent" />
            ) : (
              'Create Room'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
