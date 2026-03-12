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
import { useGameAudioContext } from '@/hooks/useGameAudio';
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
  const { connected, accounts, tokenBalance } = useRadixWallet();
  const [shopReturn, setShopReturn] = useState<GameScreen>('start');
  const [playerName, setPlayerName] = useState('');
  const [hasName, setHasName] = useState(false);
  const [battleShopOpen, setBattleShopOpen] = useState(false);
  const [isAdvancingBattle, setIsAdvancingBattle] = useState(false);
  const { muted, toggleMute, playMode, stopAll, playSfx } = useGameAudioContext();

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

  useEffect(() => {
    if (state.screen !== 'battle' && battleShopOpen) {
      setBattleShopOpen(false);
    }
  }, [state.screen, battleShopOpen]);

  useEffect(() => {
    if (state.screen !== 'victory' && isAdvancingBattle) {
      setIsAdvancingBattle(false);
    }
  }, [state.screen, isAdvancingBattle]);

  const goShop = (from: GameScreen) => {
    setShopReturn(from);
    setScreen('shop');
  };

  const handleNameConfirm = (name: string) => {
    setPlayerName(name);
    setHasName(true);
  };

  const handleWinBattle = useCallback((t: number, s: number) => {
    setBattleShopOpen(false);
    setLastWonBattle(state.currentBattle);
    winBattle(t, s);
  }, [state.currentBattle, winBattle]);

  const handleLose = useCallback(() => {
    playSfx('lose');
    stopAll();
    loseGame();
  }, [playSfx, stopAll, loseGame]);

  const handleNextBattle = useCallback(() => {
    if (isLastBattle) {
      setScreen('leaderboard');
      return;
    }
    if (isAdvancingBattle) return;
    setIsAdvancingBattle(true);
    setBattleShopOpen(false);
    nextBattle();
  }, [isLastBattle, isAdvancingBattle, nextBattle, setScreen]);

   const handlePurchase = (id: string, qty: number = 1) => {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    // Transaction is handled by Shop.tsx handleBuy (mainnet).
    // Here we only update game state.
    playSfx('buy');
    incrementTxCount(qty);
    purchase(id, qty, connected && accounts.length > 0);
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <StarryBackground />
      <MuteButton muted={muted} onToggle={toggleMute} />

      {/* Radix Connect Button */}
      <div className="fixed top-4 right-4 z-50">
        <RadixConnectButton />
      </div>

      <AnimatePresence mode="wait">
        {!hasName && (
          <NameEntry key="name" onConfirm={handleNameConfirm} />
        )}
        {hasName && state.screen === 'start' && (
          <StartScreen
            key="start"
            state={state}
            playerName={playerName}
            onStart={startGame}
            onShop={() => goShop('start')}
            onLeaderboard={() => setScreen('leaderboard')}
          />
        )}
        {hasName && state.screen === 'battle' && (
          <div key="battle" className="relative">
            <button
              onClick={() => setBattleShopOpen(true)}
              className="fixed bottom-16 right-4 z-40 font-pixel text-[9px] px-3 py-2 rounded-full border-2 border-yellow-400/70 bg-black/70 text-yellow-400 hover:bg-yellow-400/20 transition-all shadow-lg"
            >
              <HydrToken size={10} /> SHOP
            </button>
            {battleShopOpen && (
              <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto">
                <button
                  onClick={() => setBattleShopOpen(false)}
                  className="fixed top-4 left-4 z-[60] font-pixel text-[10px] text-game-teal hover:text-game-teal/80 bg-black/60 px-3 py-2 rounded border border-game-teal/40"
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
                key={state.currentBattle}
                state={state}
                enemy={currentEnemy}
                playerName={playerName}
                onWin={handleWinBattle}
                onLose={handleLose}
              />
            )}
          </div>
        )}
        {hasName && state.screen === 'victory' && (
          <motion.div
            key="victory"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 gap-4"
          >
            <div className="font-pixel text-[40px] text-yellow-400">🏆</div>
            <div className="font-pixel text-[18px] text-yellow-400">VICTORY!</div>
            <div className="font-pixel text-[10px] text-white/80">{victoryEnemy.name} Defeated!</div>
            <div className="font-pixel text-[9px] text-game-teal">+{victoryEnemy.tokenReward} HYDR</div>
            <div className="font-pixel text-[8px] text-white/50">Tokens: {state.tokens}</div>
            <button
              onClick={handleNextBattle}
              className="font-pixel text-[10px] py-4 px-8 bg-game-purple text-white rounded border-b-4 border-black/30 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all w-full max-w-xs"
            >
              {isLastBattle ? 'VIEW RESULTS' : 'NEXT BATTLE'}
            </button>
            <button
              onClick={() => goShop('victory')}
              className="font-pixel text-[8px] py-3 px-6 bg-transparent text-game-teal rounded border-2 border-game-teal/50 hover:bg-game-teal/10 transition-all w-full max-w-xs"
            >
              SHOP
            </button>
          </motion.div>
        )}
        {hasName && state.screen === 'defeat' && (
          <motion.div
            key="defeat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 gap-4"
          >
            <div className="font-pixel text-[40px]">💀</div>
            <div className="font-pixel text-[18px] text-red-400">DEFEATED!</div>
            <div className="font-pixel text-[9px] text-white/60 text-center">
              Your Hydra has fallen in battle...<br />The mempool can be cruel.
            </div>
            <button
              onClick={() => { resetGame(); }}
              className="font-pixel text-[10px] py-4 px-8 bg-red-600 text-white rounded border-b-4 border-black/30 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all w-full max-w-xs"
            >
              TRY AGAIN
            </button>
            <button
              onClick={() => { resetGame(); setScreen('start'); }}
              className="font-pixel text-[8px] py-3 px-6 bg-transparent text-white/60 rounded border-2 border-white/20 hover:bg-white/10 transition-all w-full max-w-xs"
            >
              MAIN MENU
            </button>
          </motion.div>
        )}
        {hasName && state.screen === 'shop' && (
          <Shop
            key="shop"
            tokens={state.tokens}
            purchases={state.purchases}
            hydra={state.hydra}
            onPurchase={handlePurchase}
            onBack={() => setScreen(shopReturn)}
          />
        )}
        {hasName && state.screen === 'leaderboard' && (
          <Leaderboard
            key="leaderboard"
            state={state}
            playerName={playerName}
            onBack={() => setScreen('start')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
