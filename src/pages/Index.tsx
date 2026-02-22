import React, { useState, useEffect, useCallback } from 'react';
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
  <img 
    src={hydrToken} 
    alt="HYDR" 
    style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated' }} 
  />
);

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
  const { state, setScreen, startGame, winBattle, nextBattle, purchase, loseGame, resetGame } = useGameState();
  const { connected, accounts, sendTransaction, tokenBalance } = useRadixWallet();
  const [shopReturn, setShopReturn] = useState<GameScreen>('start');
  const [playerName, setPlayerName] = useState('');
  const [hasName, setHasName] = useState(false);
  const [battleShopOpen, setBattleShopOpen] = useState(false);
  const { muted, toggleMute, playMode, stopAll, playSfx } = useGameAudio();
  
  const cdReduction = state.purchases['cooldown'] || 0;

  // Track the current enemy for the victory screen (captured at win time)
  const [lastWonBattle, setLastWonBattle] = useState(0);
  const currentEnemy = ENEMIES[Math.min(state.currentBattle, ENEMIES.length - 1)];
  const victoryEnemy = ENEMIES[Math.min(lastWonBattle, ENEMIES.length - 1)];
  const isLastBattle = lastWonBattle >= ENEMIES.length - 1;

  useEffect(() => {
    if (state.screen === 'battle') {
      playMode('battle');
    } else if (state.screen === 'start') {
      playMode('menu');
    } else if (state.screen === 'leaderboard' || state.screen === 'defeat') {
      stopAll();
    }
  }, [state.screen, playMode, stopAll]);

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

  const handleWinBattle = useCallback((t: number, s: number) => {
    setLastWonBattle(state.currentBattle);
    playSfx('win');
    winBattle(t, s);
  }, [state.currentBattle, playSfx, winBattle]);

  const handleLose = useCallback(() => {
    playSfx('lose');
    stopAll();
    loseGame();
  }, [playSfx, stopAll, loseGame]);

  const HYDR_TOKEN = 'resource_tdx_2_1t5372e5thltf7d8qx7xckn50h2ayu0lwd5qe24f96d22rfp2ckpxqh';
  const SHOP_ACCOUNT = 'account_tdx_2_12888nvfwvdqc4wxj8cqda5hf6ll0jtxrxlh0wrxp9awacwf0enzwak';

  const handlePurchase = async (id: string) => {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;

    if (connected && accounts.length > 0) {
      try {
        const manifest = `
          CALL_METHOD Address("${accounts[0].address}") "withdraw" Address("${HYDR_TOKEN}") Decimal("${item.cost}");
          TAKE_ALL_FROM_WORKTOP Address("${HYDR_TOKEN}") Bucket("bucket1");
          CALL_METHOD Address("${SHOP_ACCOUNT}") "deposit" Bucket("bucket1");
        `;
        const result = await sendTransaction(manifest, `Buy: ${item.name} (${item.cost} HYDR)`);
        
        if (result && result.isErr && result.isErr()) {
          console.error('Transaction failed:', result.error);
          return;
        }

        playSfx('buy');
        purchase(id, true);
      } catch (err) {
        console.error('Purchase error:', err);
      }
    } else {
      // For testing or if not connected, we still allow purchase in state if desired, 
      // but user requested to depend on wallet balance.
      // We'll proceed with local purchase for testing if no wallet is connected
      playSfx('buy');
      purchase(id);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background overflow-hidden relative">
      <StarryBackground />
      
      {/* Radix Connect Button - top right */}
      <div className="fixed top-4 right-4 z-50">
        <RadixConnectButton />
      </div>

      <MuteButton muted={muted} onToggle={toggleMute} />

      <AnimatePresence mode="wait">
        {!hasName && (
          <motion.div 
            key="nameentry"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex items-center justify-center"
          >
            <NameEntry onConfirm={handleNameConfirm} />
          </motion.div>
        )}

        {hasName && state.screen === 'start' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20"
          >
            <StartScreen 
              playerName={playerName} 
              onStart={startGame} 
              onShop={() => goShop('start')} 
              onLeaderboard={() => setScreen('leaderboard')} 
            />
          </motion.div>
        )}

        {hasName && state.screen === 'battle' && (
          <motion.div 
            key={`battle-${state.currentBattle}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex items-center justify-center p-4"
          >
            {/* Shop button during battle */}
            <button
              onClick={() => setBattleShopOpen(true)}
              className="fixed bottom-16 right-4 z-40 font-pixel text-[9px] px-3 py-2 rounded-full border-2 border-yellow-400/70 bg-black/70 text-yellow-400 hover:bg-yellow-400/20 hover:border-yellow-400 transition-all shadow-lg animate-pulse"
            >
              🛒 SHOP
            </button>

            {/* Shop overlay during battle */}
            {battleShopOpen && (
              <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto">
                <button
                  onClick={() => setBattleShopOpen(false)}
                  className="fixed top-4 left-4 z-60 font-pixel text-[10px] text-game-teal hover:text-game-teal/80 bg-black/60 px-3 py-2 rounded border border-game-teal/40"
                >
                  ← VOLTAR A BATALHA
                </button>
                <Shop 
                  tokens={tokenBalance > 0 ? tokenBalance : state.tokens} 
                  purchases={state.purchases} 
                  hydra={state.hydra} 
                  onPurchase={handlePurchase} 
                  onBack={() => setBattleShopOpen(false)} 
                />
              </div>
            )}

            <BattleArena 
              hydra={state.hydra} 
              battleIndex={state.currentBattle} 
              cooldownReduction={cdReduction}
              onWin={handleWinBattle} 
              onLose={handleLose} 
            />
          </motion.div>
        )}

        {hasName && state.screen === 'victory' && (
          <motion.div 
            key="victory"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex items-center justify-center"
          >
            <div className="text-center font-pixel space-y-6 p-8 bg-black/80 rounded-2xl border border-game-teal/30 max-w-sm mx-auto">
              <div className="text-4xl animate-bounce">🎉</div>
              <div className="text-xl text-game-teal">VICTORY!</div>
              <div className="text-white/70 text-[9px]">Enemy Defeated!</div>
              <div className="flex items-center justify-center gap-2 text-yellow-400 text-[10px]">
                <HydrToken size={16} />
                <span>+{victoryEnemy.tokenReward}</span>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={isLastBattle ? () => setScreen('leaderboard') : nextBattle}
                  className="font-pixel text-[10px] md:text-sm py-4 px-8 bg-game-teal text-black rounded border-b-4 border-black/30 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
                >
                  {isLastBattle ? '🏆 VIEW RESULTS' : '▶ NEXT BATTLE'}
                </button>
                <button 
                  onClick={() => goShop('victory')}
                  className="font-pixel text-[8px] py-3 px-6 bg-transparent text-game-teal rounded border-2 border-game-teal/50 hover:bg-game-teal/10 transition-all"
                >
                  🛙 SHOP
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {hasName && state.screen === 'defeat' && (
          <motion.div 
            key="defeat"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex items-center justify-center"
          >
            <div className="text-center font-pixel space-y-6 p-8 bg-black/80 rounded-2xl border border-red-500/30 max-w-sm mx-auto">
              <div className="text-4xl">💀</div>
              <div className="text-xl text-red-500">DEFEATED!</div>
              <div className="text-white/60 text-[9px]">Your Hydra has fallen in battle...</div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => startGame()}
                  className="font-pixel text-[10px] py-4 px-8 bg-red-600 text-white rounded border-b-4 border-red-900 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
                >
                  🔄 TRY AGAIN
                </button>
                <button 
                  onClick={() => { resetGame(); setScreen('start'); }}
                  className="font-pixel text-[8px] py-3 px-6 bg-transparent text-white/60 rounded border-2 border-white/20 hover:bg-white/10 transition-all"
                >
                  🏠 MAIN MENU
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {hasName && state.screen === 'shop' && (
          <motion.div 
            key="shop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20"
          >
            <Shop 
              tokens={tokenBalance > 0 ? tokenBalance : state.tokens} 
              purchases={state.purchases} 
              hydra={state.hydra} 
              onPurchase={handlePurchase} 
              onBack={() => setScreen(shopReturn)} 
            />
          </motion.div>
        )}

        {hasName && state.screen === 'leaderboard' && (
          <motion.div 
            key="leaderboard"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20"
          >
            <Leaderboard 
              playerName={playerName} 
              totalScore={state.totalScore} 
              totalTokens={state.tokens} 
              onBack={() => setScreen('start')} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
