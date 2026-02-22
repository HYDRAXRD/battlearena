import React from 'react';
import { motion } from 'framer-motion';
import hydrToken from '@/assets/hydr-token.png';

const HydrToken = ({ size = 14 }: { size?: number }) => (
  <img src={hydrToken} alt="HYDR" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated' }} />
);

interface Props {
  playerName: string;
  totalScore: number;
  totalTokens: number;
  onBack: () => void;
}

const Leaderboard: React.FC<Props> = ({ playerName, totalScore, totalTokens, onBack }) => {
  const trophies = ['🥇', '🥈', '🥉'];

  return (
    <div className="relative z-10 min-h-screen flex flex-col px-4 py-6">
      <button onClick={onBack} className="font-pixel text-[10px] text-game-teal hover:text-game-teal/80 self-start mb-6">← BACK</button>
      <h1 className="font-pixel text-lg text-center text-game-purple mb-6">🏆 LEADERBOARD</h1>
      <div className="max-w-md mx-auto w-full">
        {playerName ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between py-4 px-4 mb-4 rounded border-2 border-game-teal bg-game-teal/10 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
          >
            <div className="flex items-center gap-3">
              <span className="font-pixel text-lg">{trophies[0]}</span>
              <div>
                <div className="font-pixel text-[9px] text-game-teal">{playerName}</div>
                <div className="font-pixel text-[6px] text-muted-foreground mt-1">
                  {totalScore > 0 ? 'YOUR SCORE' : 'NO BATTLES WON YET'}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-pixel text-sm text-yellow-400">{totalScore}</span>
              {totalTokens > 0 && (
                <span className="font-pixel text-[8px] text-yellow-300 flex items-center gap-1">
                  <HydrToken size={10} /> {totalTokens} HYDR
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-4xl mb-4">🏆</div>
            <p className="font-pixel text-[8px] text-muted-foreground">No scores yet.</p>
            <p className="font-pixel text-[8px] text-muted-foreground mt-2">Register your name and play to see your score!</p>
          </motion.div>
        )}

        {totalScore > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-6 p-4 rounded border border-game-purple/30 bg-game-purple/5"
          >
            <h2 className="font-pixel text-[8px] text-game-purple text-center mb-4">BATTLE SUMMARY</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-pixel text-[7px] text-white/60">TOTAL SCORE</span>
                <span className="font-pixel text-[9px] text-yellow-400">{totalScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-pixel text-[7px] text-white/60">HYDR EARNED</span>
                <span className="font-pixel text-[9px] text-yellow-300 flex items-center gap-1">
                  <HydrToken size={10} /> {totalTokens}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
