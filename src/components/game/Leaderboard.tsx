import React from 'react';
import { motion } from 'framer-motion';
import { LEADERBOARD_DATA } from '@/game/constants';

interface Props {
  playerScore: number;
  onBack: () => void;
}

const Leaderboard: React.FC<Props> = ({ playerScore, onBack }) => {
  const all = [...LEADERBOARD_DATA, { name: '► YOU', score: playerScore }].sort((a, b) => b.score - a.score);
  const trophies = ['🥇', '🥈', '🥉'];

  return (
    <div className="relative z-10 min-h-screen flex flex-col px-4 py-6">
      <button onClick={onBack} className="font-pixel text-[10px] text-game-teal hover:text-game-teal/80 self-start mb-6">← BACK</button>
      <h1 className="font-pixel text-lg text-center text-game-purple mb-6">🏆 LEADERBOARD</h1>
      <div className="max-w-md mx-auto w-full">
        {all.map((e, i) => {
          const isPlayer = e.name === '► YOU';
          return (
            <motion.div key={e.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={`flex items-center justify-between py-2 px-3 mb-1 rounded border ${isPlayer ? 'border-game-teal bg-game-teal/10' : 'border-game-purple/15 bg-background/50'}`}>
              <div className="flex items-center gap-3">
                <span className="font-pixel text-[7px] text-gray-500 w-6">{i < 3 ? trophies[i] : `${i + 1}.`}</span>
                <span className={`font-pixel text-[7px] ${isPlayer ? 'text-game-teal' : 'text-white'}`}>{e.name}</span>
              </div>
              <span className="font-pixel text-[7px] text-yellow-400">{e.score}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
