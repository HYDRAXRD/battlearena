import React, { useState } from 'react';
import { motion } from 'framer-motion';
import hydraHeads from '@/assets/hydra-heads.png';

interface Props {
  onConfirm: (name: string) => void;
}

const NameEntry: React.FC<Props> = ({ onConfirm }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handle = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter your name to continue!'); return; }
    if (trimmed.length > 16) { setError('Max 16 characters!'); return; }
    onConfirm(trimmed);
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="mb-6"
      >
        <img
          src={hydraHeads}
          alt="Hydra"
          className="w-40 h-40 md:w-52 md:h-52 object-contain drop-shadow-[0_0_30px_rgba(29,111,232,0.7)]"
          style={{ imageRendering: 'pixelated' }}
        />
      </motion.div>

      <motion.h1
        className="font-pixel text-xl md:text-3xl text-center mb-1"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        <span className="text-game-purple">HYDRA</span>
      </motion.h1>
      <motion.h2
        className="font-pixel text-sm md:text-lg text-center mb-10"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      >
        <span className="text-game-teal">BATTLE ARENA</span>
      </motion.h2>

      <motion.div
        className="flex flex-col gap-4 w-full max-w-xs"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
      >
        <div className="text-center">
          <label className="font-pixel text-[8px] text-game-teal block mb-2">ENTER YOUR NAME</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handle()}
            maxLength={16}
            placeholder="PLAYER NAME..."
            className="w-full font-pixel text-[9px] px-4 py-3 bg-black/60 border-2 border-game-purple/50 text-white rounded text-center focus:outline-none focus:border-game-purple placeholder-gray-600"
            autoFocus
          />
          {error && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="font-pixel text-[7px] text-red-400 mt-2"
            >
              {error}
            </motion.p>
          )}
        </div>

        <button
          onClick={handle}
          className="font-pixel text-xs px-8 py-4 bg-game-purple hover:bg-game-purple/80 text-white rounded border-2 border-game-purple/50 shadow-[0_0_20px_rgba(29,111,232,0.5)] hover:shadow-[0_0_30px_rgba(29,111,232,0.7)] transition-all"
        >
          ▶ CONTINUE
        </button>
      </motion.div>
    </div>
  );
};

export default NameEntry;
