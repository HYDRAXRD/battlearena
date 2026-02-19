import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameState } from '@/game/useGameState';
import { ENEMIES } from '@/game/constants';
import { GameScreen } from '@/game/types';
import StarryBackground from '@/components/game/StarryBackground';
import StartScreen from '@/components/game/StartScreen';
import BattleArena from '@/components/game/BattleArena';
import Shop from '@/components/game/Shop';
import Leaderboard from '@/components/game/Leaderboard';

const Index = () => {
  const { state, setScreen, startGame, winBattle, nextBattle, purchase, resetGame } = useGameState();
  const [shopReturn, setShopReturn] = useState<GameScreen>('start');
  const cdReduction = state.purchases['cooldown'] || 0;
  const currentEnemy = ENEMIES[Math.min(state.currentBattle, ENEMIES.length - 1)];

  const goShop = (from: GameScreen) => { setShopReturn(from); setScreen('shop'); };

  return (
    <div className="min-h-screen overflow-hidden relative">
      <StarryBackground />
      <AnimatePresence mode="wait">
        {state.screen === 'start' && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StartScreen onStart={startGame} onShop={() => goShop('start')} onLeaderboard={() => setScreen('leaderboard')} />
          </motion.div>
        )}

        {state.screen === 'battle' && (
          <motion.div key={`battle-${state.currentBattle}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BattleArena hydra={state.hydra} battleIndex={state.currentBattle} cooldownReduction={cdReduction}
              onWin={(t, s) => winBattle(t, s)} onLose={() => setScreen('defeat')} />
          </motion.div>
        )}

        {state.screen === 'victory' && (
          <motion.div key="victory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="font-pixel text-xl text-game-teal mb-2">VICTORY!</h1>
              <p className="font-pixel text-[10px] text-yellow-400 mb-6">+{currentEnemy.tokenReward} Tokens!</p>
              <div className="flex flex-col gap-3 w-48 mx-auto">
                <button onClick={nextBattle}
                  className="font-pixel text-[8px] py-3 bg-game-purple hover:bg-game-purple/80 text-white rounded border-2 border-game-purple/50 shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all">
                  {state.currentBattle >= 3 ? '🏆 VIEW RESULTS' : '▶ NEXT BATTLE'}
                </button>
                <button onClick={() => goShop('victory')}
                  className="font-pixel text-[8px] py-3 bg-transparent text-game-teal rounded border-2 border-game-teal/50 hover:bg-game-teal/10 transition-all">
                  🛒 SHOP
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {state.screen === 'defeat' && (
          <motion.div key="defeat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
            <div className="text-6xl mb-4">💀</div>
            <h1 className="font-pixel text-xl text-red-400 mb-2 font-pixel">DEFEATED!</h1>
            <p className="font-pixel text-[10px] text-muted-foreground mb-6">Your Hydra has fallen...</p>
            <button onClick={resetGame}
              className="font-pixel text-[8px] py-3 px-6 bg-game-purple hover:bg-game-purple/80 text-white rounded border-2 border-game-purple/50 transition-all">
              🔄 TRY AGAIN
            </button>
          </motion.div>
        )}

        {state.screen === 'shop' && (
          <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Shop tokens={state.tokens} purchases={state.purchases} hydra={state.hydra}
              onPurchase={purchase} onBack={() => setScreen(shopReturn)} />
          </motion.div>
        )}

        {state.screen === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Leaderboard playerScore={state.totalScore} onBack={() => setScreen('start')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
