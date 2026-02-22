import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import hydraHeads from '@/assets/hydra-heads.png';

// Keys for localStorage persistence
const TX_COUNT_KEY = 'hydra_total_transactions';
const PLAYERS_KEY = 'hydra_active_players';
const SESSION_KEY = 'hydra_session_id';

// Helper to get/set persistent counters
function getTxCount(): number {
  return parseInt(localStorage.getItem(TX_COUNT_KEY) || '0', 10);
}

function incrementTxCount(n: number = 1): number {
  const current = getTxCount();
  const updated = current + n;
  localStorage.setItem(TX_COUNT_KEY, String(updated));
  return updated;
}

// Active players: tracked by session IDs stored in localStorage as JSON array
function registerActivePlayer(): void {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  try {
    const raw = localStorage.getItem(PLAYERS_KEY);
    const sessions: { id: string; ts: number }[] = raw ? JSON.parse(raw) : [];
    // Remove sessions older than 10 minutes
    const cutoff = Date.now() - 10 * 60 * 1000;
    const active = sessions.filter(s => s.ts > cutoff);
    // Upsert current session
    const idx = active.findIndex(s => s.id === sessionId);
    if (idx >= 0) {
      active[idx].ts = Date.now();
    } else {
      active.push({ id: sessionId!, ts: Date.now() });
    }
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(active));
  } catch {}
}

function getActivePlayerCount(): number {
  try {
    const raw = localStorage.getItem(PLAYERS_KEY);
    if (!raw) return 1;
    const sessions: { id: string; ts: number }[] = JSON.parse(raw);
    const cutoff = Date.now() - 10 * 60 * 1000;
    return Math.max(1, sessions.filter(s => s.ts > cutoff).length);
  } catch {
    return 1;
  }
}

interface Props {
  onStart: () => void;
  onShop: () => void;
  onLeaderboard: () => void;
}

const StartScreen: React.FC<Props> = ({ onStart, onShop, onLeaderboard }) => {
  const [txCount, setTxCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(1);

  useEffect(() => {
    registerActivePlayer();
    setTxCount(getTxCount());
    setPlayerCount(getActivePlayerCount());

    // Refresh every 30 seconds to update active players
    const interval = setInterval(() => {
      registerActivePlayer();
      setTxCount(getTxCount());
      setPlayerCount(getActivePlayerCount());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
      {/* Hydra logo */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="mb-6"
      >
        <img
          src={hydraHeads}
          alt="Hydra"
          className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_30px_rgba(29,111,232,0.7)]"
          style={{ imageRendering: 'pixelated' }}
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        className="font-pixel text-2xl md:text-4xl text-center mb-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-game-purple">HYDRA</span>
      </motion.h1>

      <motion.h2
        className="font-pixel text-lg md:text-2xl text-center mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-game-teal">BATTLE ARENA</span>
      </motion.h2>

      {/* BETA badge */}
      <motion.div
        className="mb-4 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="font-pixel text-[8px] text-yellow-400/80 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1">
          ⚠️ BETA VERSION &nbsp; Game is actively being updated & improved
        </div>
      </motion.div>

      {/* Stats counters */}
      <motion.div
        className="mb-6 w-full max-w-[280px] grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
      >
        <div className="flex flex-col items-center bg-black/40 border border-game-purple/30 rounded-lg py-3 px-2">
          <div className="font-pixel text-[16px] text-game-purple leading-none">
            {txCount.toLocaleString()}
          </div>
          <div className="font-pixel text-[6px] text-white/50 mt-1 text-center">TOTAL TRANSACTIONS</div>
        </div>
        <div className="flex flex-col items-center bg-black/40 border border-game-teal/30 rounded-lg py-3 px-2">
          <div className="font-pixel text-[16px] text-game-teal leading-none flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {playerCount}
          </div>
          <div className="font-pixel text-[6px] text-white/50 mt-1 text-center">PLAYERS ONLINE</div>
        </div>
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="flex flex-col gap-3 w-full max-w-[240px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <button
          onClick={onStart}
          className="font-pixel text-[12px] py-4 px-8 bg-game-purple text-white rounded border-b-4 border-game-purple/40 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all w-full"
        >
          ▶ START GAME
        </button>
        <button
          onClick={onShop}
          className="font-pixel text-[10px] py-3 px-8 bg-transparent text-yellow-400 rounded border-2 border-yellow-400/50 hover:bg-yellow-400/10 transition-all w-full"
        >
          🛒 SHOP
        </button>
        <button
          onClick={onLeaderboard}
          className="font-pixel text-[10px] py-3 px-8 bg-transparent text-game-teal rounded border-2 border-game-teal/50 hover:bg-game-teal/10 transition-all w-full"
        >
          🏆 LEADERBOARD
        </button>
      </motion.div>
    </div>
  );
};

// Export helper so Index.tsx can increment tx count when purchase completes
export { incrementTxCount };
export default StartScreen;
