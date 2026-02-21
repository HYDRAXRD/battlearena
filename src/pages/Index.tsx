import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameState } from '@/game/useGameState';
import { ENEMIES } from '@/game/constants';
import { GameScreen } from '@/game/types';
import StarryBackground from '@/components/game/StarryBackground';
import NameEntry from '@/components/game/NameEntry';
import StartScreen from '@/components/game/StartScreen';
import BattleArena from '@/components/game/BattleArena';
import Shop from '@/components/game/Shop';
import Leaderboard from '@/components/game/Leaderboard';
import RadixConnectButton from '@/components/game/RadixConnectButton';
import hydrToken from '@/assets/hydr-token.png';

const HydrToken = ({ size = 14 }: { size?: number }) => (
  <img src={hydrToken} alt="HYDR" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated' }} />
);

const Index = () => {
  const { state, setScreen, startGame, winBattle, nextBattle, purchase, resetGame } = useGameState();
  const [shopReturn, setShopReturn] = useState<GameScreen>('start');
  const [playerName, setPlayerName] = useState('');
  const [hasName, setHasName] = useState(false);

  const cdReduction = state.purchases['cooldown'] || 0;
  const currentEnemy = ENEMIES[Math.min(state.currentBattle, ENEMIES.length - 1)];
  const isLastBattle = state.currentBattle >= ENEMIES.length - 1;

  const goShop = (from: GameScreen) => { setShopReturn(from); setScreen('shop'); };

  const handleNameConfirm = (name: string) => {
    setPlayerName(name);
    setHasName(true);
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      <StarryBackground />

      {/* Radix Wallet Connect Button - always visible in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <RadixConnectButton />
      </div>

      <AnimatePresence mode="wait">
        {/* Name Entry - shown first before start screen */}
        {!hasName && (
          <motion.div key="name-entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <NameEntry onConfirm={handleNameConfirm} />
          </motion.div>
        )}

        {hasName && state.screen === 'start' && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StartScreen
              onStart={startGame}
              onShop={() => goShop('start')}
              onLeaderboard={() => setScreen('leaderboard')}
            />
          </motion.div>
        )}

        {hasName && state.screen === 'battle' && (
          <motion.div key={`battle-${state.currentBattle}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="min-h-screen flex items-center justify-center px-4 py-8">
              <BattleArena
                hydra={state.hydra}
                battleIndex={state.currentBattle}
                cooldownReduction={cdReduction}
                onWin={(t, s) => winBattle(t, s)}
                onLose={() => setScreen('defeat')}
              />
            </div>
          </motion.div>
        )}

        {hasName && state.screen === 'victory' && (
          <motion.div key="victory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
              <div className="text-6xl">\ud83c\udf89</div>
              <h1 className="font-pixel text-2xl text-game-purple text-center">VICTORY!</h1>
              <div className="font-pixel text-sm text-yellow-400 flex items-center gap-2">
                +{currentEnemy.tokenReward} <HydrToken size={16} /> HYDR
              </div>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  onClick={nextBattle}
                  className="font-pixel text-[8px] py-3 bg-game-purple text-white rounded border-2 border-game-purple hover:bg-game-purple/80 transition-all"
                >
                  {isLastBattle ? '\ud83c\udfc6 VIEW RESULTS' : '\u25b6 NEXT BATTLE'}
                </button>
                <button
                  onClick={() => goShop('victory')}
                  className="font-pixel text-[8px] py-3 bg-transparent text-game-teal rounded border-2 border-game-teal/50 hover:bg-game-teal/10 transition-all"
                >
                  \ud83d\uded2 SHOP
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {hasName && state.screen === 'defeat' && (
          <motion.div key="defeat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
              <div className="text-6xl">\ud83d\udc80</div>
              <h1 className="font-pixel text-2xl text-red-500 text-center">DEFEATED!</h1>
              <p className="font-pixel text-[9px] text-gray-400 text-center">
                Your Hydra has fallen in battle...
              </p>
              <p className="font-pixel text-[8px] text-gray-500 text-center">
                Score: {state.totalScore} pts
              </p>
              <button
                onClick={resetGame}
                className="font-pixel text-[9px] py-3 px-6 bg-game-purple text-white rounded border-2 border-game-purple hover:bg-game-purple/80 transition-all"
              >
                \ud83d\udd04 TRY AGAIN
              </button>
            </div>
          </motion.div>
        )}

        {hasName && state.screen === 'shop' && (
          <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Shop
              tokens={state.tokens}
              purchases={state.purchases}
              hydra={state.hydra}
              onPurchase={purchase}
              onBack={() => setScreen(shopReturn)}
            />
          </motion.div>
        )}

        {hasName && state.screen === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Leaderboard
              playerName={playerName}
              playerScore={state.totalScore}
              onBack={() => setScreen('start')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
