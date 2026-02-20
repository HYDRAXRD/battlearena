import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  playerName: string;
  playerScore: number;
  onBack: () => void;
}

const Leaderboard: React.FC<Props> = ({ playerName, playerScore, onBack }) => {
  const trophies = ['🥇', '🥈', '🥉'];

  return (
    <div className="relative z-10 min-h-screen flex flex-col px-4 py-6">
      <button onClick={onBack} className="font-pixel text-[10px] text-game-teal hover:text-game-teal/80 self-start mb-6">← BACK</button>
      <h1 className="font-pixel text-lg text-center text-game-purple mb-6">🏆 LEADERBOARD</h1>
      <div className="max-w-md mx-auto w-full">
        {playerScore > 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between py-4 px-4 mb-4 rounded border-2 border-game-teal bg-game-teal/10 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
          >
            <div className="flex items-center gap-3">
              <span className="font-pixel text-lg">{trophies[0]}</span>
              <div>
                <div className="font-pixel text-[9px] text-game-teal">{playerName}</div>
                <div className="font-pixel text-[6px] text-muted-foreground mt-1">YOUR SCORE</div>
              </div>
            </div>
            <span className="font-pixel text-sm text-yellow-400">{playerScore}</span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-4xl mb-4">🎮</div>
            <p className="font-pixel text-[8px] text-muted-foreground">No scores yet.</p>
            <p className="font-pixel text-[8px] text-muted-foreground mt-2">Complete a battle to see your score here!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
