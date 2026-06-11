'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'login' | 'signup';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { logIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
 
    try {
      if (activeTab === 'login') {
        const { error: loginError } = await logIn(email, password);
        if (loginError) {
          setError(loginError.message || 'Failed to sign in. Please check your credentials.');
        } else {
          onClose();
        }
      } else {
        const { error: signupError } = await signUp(email, password);
        if (signupError) {
          setError(signupError.message || 'Failed to sign up.');
        } else {
          setSignupSuccess(true);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setError(null);
    setSignupSuccess(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#110e1a] p-8 shadow-2xl z-50"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Brand/Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              MOVIE MATCHMAKER
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {activeTab === 'login' ? 'Sign in to sync your swiped watchlist to the cloud.' : 'Create an account to save your swipes.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="relative mb-6 flex rounded-lg bg-black p-1 border border-white/5">
            <button
              onClick={() => switchTab('login')}
              className={`relative z-10 w-1/2 py-2 text-center text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'login' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab('signup')}
              className={`relative z-10 w-1/2 py-2 text-center text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'signup' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign Up
            </button>
            {/* Animated Tab Background Indicator */}
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute bottom-1 top-1 left-1 rounded-md bg-zinc-800 shadow-md"
              style={{ width: 'calc(50% - 4px)' }}
              animate={{ x: activeTab === 'login' ? 0 : '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Form */}
          {signupSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Check your inbox!</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                We&apos;ve sent a verification link to <span className="font-semibold text-zinc-200">{email}</span>. Click the link to complete registration.
              </p>
              <button
                onClick={() => switchTab('login')}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                Go to Sign In
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400"
                >
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/5 bg-black py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/5 bg-black py-3 pl-10 pr-12 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-purple-650 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-purple-500/20 bg-purple-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{activeTab === 'login' ? 'Sign In' : 'Sign Up'}</span>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
