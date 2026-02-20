import React from 'react';
import { motion } from 'framer-motion';
import hydraHeads from '@/assets/hydra-heads.png';

interface Props {
  onStart: () => void;
  onShop: () => void;
  onLeaderboard: () => void;
}

const StartScreen: React.FC<Props> = ({ onStart, onShop, onLeaderboard }) => (
  <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
    <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', duration: 0.8 }} className="mb-6">
      <img src={hydraHeads} alt="Hydra" className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_30px_rgba(29,111,232,0.7)]" style={{ imageRendering: 'pixelated' }} />
    </motion.div>
    <motion.h1 className="font-pixel text-2xl md:text-4xl text-center mb-1" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <span className="text-game-purple">HYDRA</span>
    </motion.h1>
    <motion.h2 className="font-pixel text-lg md:text-2xl text-center mb-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <span className="text-game-teal">BATTLE ARENA</span>
    </motion.h2>
    <motion.div className="flex flex-col gap-4 w-full max-w-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
      <button onClick={onStart}
        className="font-pixel text-xs px-8 py-4 bg-game-purple hover:bg-game-purple/80 text-white rounded border-2 border-game-purple/50 shadow-[0_0_20px_rgba(29,111,232,0.5)] hover:shadow-[0_0_30px_rgba(29,111,232,0.7)] transition-all">
        ▶ START GAME
      </button>
      <button onClick={onShop}
        className="font-pixel text-[10px] px-8 py-3 bg-transparent hover:bg-game-teal/20 text-game-teal rounded border-2 border-game-teal/50 transition-all">
        🛒 SHOP
      </button>
      <button onClick={onLeaderboard}
        className="font-pixel text-[10px] px-8 py-3 bg-transparent hover:bg-game-teal/20 text-game-teal rounded border-2 border-game-teal/50 transition-all">
        🏆 LEADERBOARD
      </button>
    </motion.div>
  </div>
);

export default StartScreen;
