import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameState } from '@/game/useGameState';
import { ENEMIES, SHOP_ITEMS } from '@/game/constants';
import { GameScreen } from '@/game/types';
import StarryBackground from '@/components/game/StarryBackground';
import NameEntry from '@/components/game/NameEntry';
import StartScreen from '@/components/game/StartScreen';
import BattleArena from '@/components/game/BattleArena';
import Shop from '@/components/game/Shop';
import Leaderboard from '@/components/game/Leaderboard';
import RadixConnectButton from '@/components/game/RadixConnectButton';
import { useGameAudio } from '@/hooks/useGameAudio';
import { useRadixWallet } from '@/hooks/useRadixWallet';
import hydrToken from '@/assets/hydr-token.png';

const HydrToken = ({ size = 14 }: { size?: number }) => (
  <img src={hydrToken} alt="HYDR" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated' }} />
);

// Mute/Unmute floating button
const MuteButton = ({ muted, onToggle }: { muted: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    title={muted ? 'Unmute' : 'Mute'}
    className="fixed bottom-4 right-4 z-50 font-pixel text-[9px] px-3 py-2 rounded-full border-2 border-game-purple/50 bg-black/60 text-white hover:border-game-purple hover:bg-game-purple/20 transition-all shadow-lg"
  >
    {muted ? '🔇 OFF' : '🔊 ON'}
  </button>
);

const Index = () => {
  const { state, setScreen, startGame, winBattle, nextBattle, purchase, resetGame } = useGameState();
  const { connected, accounts, sendTransaction } = useRadixWallet();
  const [shopReturn, setShopReturn] = useState<GameScreen>('start');
  const [playerName, setPlayerName] = useState('');
  const [hasName, setHasName] = useState(false);
  const { muted, toggleMute, playMode, stopAll, playSfx } = useGameAudio();
  
  const cdReduction = state.purchases['cooldown'] || 0;
  const currentEnemy = ENEMIES[Math.min(state.currentBattle, ENEMIES.length - 1)];
  const isLastBattle = state.currentBattle >= ENEMIES.length - 1;

  // ── Switch music based on screen ──
  useEffect(() => {
    if (state.screen === 'battle') {
      playMode('battle');
    } else if (state.screen === 'start') {
      playMode('menu');
    } else if (state.screen === 'leaderboard' || state.screen === 'defeat') {
      stopAll();
    }
  }, [state.screen, playMode, stopAll]);

  // Start menu music once name is entered
  useEffect(() => {
    if (hasName && state.screen === 'start') playMode('menu');
  }, [hasName, state.screen, playMode]);

  const goShop = (from: GameScreen) => {
    setShopReturn(from);
    setScreen('shop');
  };

  const handleNameConfirm = (name: string) => {
    setPlayerName(name);
    setHasName(true);
  };

  const handleWinBattle = (t: number, s: number) => {
    playSfx('win');
    winBattle(t, s);
  };

  const handleLose = () => {
    playSfx('lose');
    stopAll();
    setScreen('defeat');
  };

  const handlePurchase = async (id: string) => {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;

    // If wallet is connected, try real transaction
    if (connected && accounts.length > 0) {
      try {
        const manifest = `
CALL_METHOD
  Address("${accounts[0].address}")
  "withdraw"
  Address("resource_tdx_2_1t5372e5thltf7d8qx7xckn50h2ayu0lwd5qe24f96d22rfp2ckpxqh")
  Decimal("${item.cost}");
CALL_METHOD
  Address("account_tdx_2_12888nvfwvdqc4wxj8cqda5hf6ll0jtxrxlh0wrxp9awacwf0enzwak")
  "deposit_batch"
  Expression("ENTIRE_WORKTOP");
`;
        
        const result = await sendTransaction(manifest, `Buying ${item.name}`);
        if (result.isErr()) {
          console.error('Transaction failed:', result.error);
          return;
        }
        
        playSfx('buy');
        purchase(id);
      } catch (err) {
        console.error('Purchase error:', err);
      }
    } else {
      // Fallback for demo/unconnected state
      playSfx('buy');
      purchase(id);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      <StarryBackground />
      
      {/* Radix Wallet Connect Button */}
      <div className="fixed top-4 right-4 z-50">
        <RadixConnectButton />
      </div>
      <MuteButton muted={muted} onToggle={toggleMute} />
      <AnimatePresence mode="wait">
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
                onWin={handleWinBattle}
                onLose={handleLose}
              />
            </div>
          </motion.div>
        )}
        {hasName && state.screen === 'victory' && (
          <motion.div key="victory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
              <div className="text-6xl">🎉</div>
              <h1 className="font-pixel text-2xl text-game-purple text-center">VICTORY!</h1>
              <div className="font-pixel text-sm text-yellow-400 flex items-center gap-2">
                +{currentEnemy.tokenReward} <HydrToken size={16} /> HYDR
              </div>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  onClick={nextBattle}
                  className="font-pixel text-[8px] py-3 bg-game-purple text-white rounded border-2 border-game-purple hover:bg-game-purple/80 transition-all"
                >
                  {isLastBattle ? '🏆 VIEW RESULTS' : '▶ NEXT BATTLE'}
                </button>
                <button
                  onClick={() => goShop('victory')}
                  className="font-pixel text-[8px] py-3 bg-transparent text-game-teal rounded border-2 border-game-teal/50 hover:bg-game-teal/10 transition-all"
                >
                  🛒 SHOP
                </button>
              </div>
            </div>
          </motion.div>
        )}
        {hasName && state.screen === 'defeat' && (
          <motion.div key="defeat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
              <div className="text-6xl">💀</div>
              <h1 className="font-pixel text-2xl text-red-500 text-center">DEFEATED!</h1>
              <p className="font-pixel text-[9px] text-gray-400 text-center">
                Your Hydra has fallen in battle...
              </p>
              <button
                onClick={resetGame}
                className="font-pixel text-[9px] py-3 px-6 bg-game-purple text-white rounded border-2 border-game-purple hover:bg-game-purple/80 transition-all"
              >
                🔄 TRY AGAIN
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
              onPurchase={handlePurchase}
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
