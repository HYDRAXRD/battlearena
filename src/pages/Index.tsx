import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameState } from '@/game/useGameState';
import { ENEMIES, SHOP_ITEMS } from '@/game/constants';
import { GameScreen } from '@/game/types';
import StarryBackground from '@/components/game/StarryBackground';
import NameEntry from '@/components/game/NameEntry';
import StartScreen, { incrementTxCount } from '@/components/game/StartScreen';
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

const MuteButton = ({ muted, onToggle }: { muted: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className="fixed bottom-4 left-4 z-50 font-pixel text-[8px] px-3 py-2 rounded bg-black/60 text-white border border-white/20 hover:bg-white/10 transition-all shadow-lg"
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

  const handlePurchase = async (id: string, qty: number = 1) => {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;

    const totalCost = item.cost * qty;

    if (connected && accounts.length > 0) {
      try {
        const manifest = `
CALL_METHOD
    Address("${accounts[0].address}")
    "withdraw"
    Address("${HYDR_TOKEN}")
    Decimal("${totalCost}");
TAKE_ALL_FROM_WORKTOP
    Address("${HYDR_TOKEN}")
    Bucket("bucket1");
CALL_METHOD
    Address("${SHOP_ACCOUNT}")
    "deposit"
    Bucket("bucket1");
        `;
        const result = await sendTransaction(manifest, `Buy: ${qty}x ${item.name} (${totalCost} HYDR)`);
        if (result && result.isErr && result.isErr()) {
          console.error('Transaction failed:', result.error);
          return;
        }
        playSfx('buy');
                incrementTxCount(qty);
        purchase(id, qty, true);
      } catch (err) {
        console.error('Purchase error:', err);
      }
    } else {
      playSfx('buy');
          incrementTxCount(qty);
      purchase(id, qty);
    }
  };

  return (
    <div className="min-h-screen bg-game-dark overflow-hidden selection:bg-game-purple/30">
      <StarryBackground />
      <MuteButton muted={muted} onToggle={toggleMute} />
      
      {/* Radix Connect Button */}
      <div className="fixed top-4 right-4 z-50 scale-75 origin-top-right md:scale-100">
        <RadixConnectButton />
      </div>

      <AnimatePresence mode="wait">
        {!hasName && (
          <NameEntry onConfirm={handleNameConfirm} />
        )}

        {hasName && state.screen === 'start' && (
          <StartScreen 
            onStart={startGame} 
            onShop={() => goShop('start')}
            onLeaderboard={() => setScreen('leaderboard')}
          />
        )}

        {hasName && state.screen === 'battle' && (
          <div className="relative w-full h-screen">
            <button
              onClick={() => setBattleShopOpen(true)}
              className="fixed bottom-16 right-4 z-40 font-pixel text-[9px] px-3 py-2 rounded-full border-2 border-yellow-400/70 bg-black/70 text-yellow-400 hover:bg-yellow-400/20 transition-all shadow-lg"
            >
              SHOP
            </button>
            {battleShopOpen && (
              <div className="fixed inset-0 z-50 bg-game-dark">
                <button
                  onClick={() => setBattleShopOpen(false)}
                  className="fixed top-4 left-4 z-60 font-pixel text-[10px] text-game-teal hover:text-game-teal/80 bg-black/60 px-3 py-2 rounded border border-game-teal/40"
                >
                  ← BACK
                </button>
                <Shop 
                  tokens={state.tokens} 
                  purchases={state.purchases} 
                  hydra={state.hydra}
                  onPurchase={handlePurchase}
                  onBack={() => setBattleShopOpen(false)} 
                />
              </div>
            )}
            {!battleShopOpen && (
              <BattleArena 
                hydra={state.hydra} 
                enemy={currentEnemy} 
                onWin={handleWinBattle}
                onLose={handleLose}
                cdReduction={state.purchases['cooldown'] || 0}
              />
            )}
          </div>
        )}

        {hasName && state.screen === 'victory' && (
          <motion.div 
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="font-pixel text-[24px] text-game-teal mb-2">🏆</div>
            <div className="font-pixel text-[18px] text-game-teal mb-4 uppercase">VICTORY!</div>
            <div className="w-full max-w-[200px] border-b-2 border-white/10 mb-6" />
            
            <div className="font-pixel text-[11px] text-white mb-2">{victoryEnemy.name} Defeated!</div>
            <div className="font-pixel text-[14px] text-yellow-400 mb-8 flex items-center gap-2 justify-center">
              <HydrToken size={16} /> +{victoryEnemy.tokenReward} HYDR
            </div>

            <div className="w-full max-w-[240px] flex flex-col gap-3">
              <button
                onClick={isLastBattle ? () => setScreen('leaderboard') : nextBattle}
                className="font-pixel text-[10px] py-4 px-8 bg-game-teal text-black rounded border-b-4 border-black/30 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all w-full"
              >
                {isLastBattle ? 'VIEW RESULTS' : 'NEXT BATTLE'}
              </button>
              <button
                onClick={() => goShop('victory')}
                className="font-pixel text-[8px] py-3 px-6 bg-transparent text-game-teal rounded border-2 border-game-teal/50 hover:bg-game-teal/10 transition-all w-full"
              >
                SHOP
              </button>
            </div>
          </motion.div>
        )}

        {hasName && state.screen === 'defeat' && (
          <motion.div 
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="font-pixel text-[24px] text-red-500 mb-2">💀</div>
            <div className="font-pixel text-[18px] text-red-500 mb-4 uppercase">DEFEATED!</div>
            <div className="w-full max-w-[200px] border-b-2 border-white/10 mb-6" />
            
            <p className="font-pixel text-[9px] text-white/70 mb-8 leading-relaxed">
              Your Hydra has fallen in battle...<br/>The mempool can be cruel.
            </p>

            <div className="w-full max-w-[240px] flex flex-col gap-3">
              <button
                onClick={startGame}
                className="font-pixel text-[10px] py-4 px-8 bg-red-600 text-white rounded border-b-4 border-red-900 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all w-full"
              >
                TRY AGAIN
              </button>
              <button
                onClick={() => { resetGame(); setScreen('start'); }}
                className="font-pixel text-[8px] py-3 px-6 bg-transparent text-white/60 rounded border-2 border-white/20 hover:bg-white/10 transition-all w-full"
              >
                MAIN MENU
              </button>
            </div>
          </motion.div>
        )}

        {hasName && state.screen === 'shop' && (
          <Shop 
            tokens={state.tokens} 
            purchases={state.purchases} 
            hydra={state.hydra}
            onPurchase={handlePurchase}
            onBack={() => setScreen(shopReturn)} 
          />
        )}

        {hasName && state.screen === 'leaderboard' && (
          <Leaderboard onBack={() => setScreen('start')} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
