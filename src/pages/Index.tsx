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
  <img src={hydrToken} alt="HYDR" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated' }} />
);

const MuteButton = ({ muted, onToggle }: { muted: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className="fixed bottom-4 right-4 z-50 font-pixel text-[8px] px-3 py-2 rounded border border-white/20 bg-black/60 text-white/60 hover:bg-white/10 transition-all"
  >
    {muted ? '\uD83D\uDD07 OFF' : '\uD83D\uDD0A ON'}
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
        const manifest = `CALL_METHOD Address("${accounts[0].address}") "withdraw" Address("${HYDR_TOKEN}") Decimal("${item.cost}");
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
      playSfx('buy');
      purchase(id);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-game-dark">
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
            playerName={playerName}
            tokens={state.tokens}
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
              SHOP
            </button>
            {battleShopOpen && (
              <>
                <button
                  onClick={() => setBattleShopOpen(false)}
                  className="fixed top-4 left-4 z-60 font-pixel text-[10px] text-game-teal hover:text-game-teal/80 bg-black/60 px-3 py-2 rounded border border-game-teal/40"
                >
                  BACK
                </button>
                <Shop
                  hydra={state.hydra}
                  purchases={state.purchases}
                  tokens={state.tokens}
                  onPurchase={handlePurchase}
                  onBack={() => setBattleShopOpen(false)}
                />
              </>
            )}
            {!battleShopOpen && (
              <BattleArena
                hydra={state.hydra}
                battleIndex={state.currentBattle}
                cooldownReduction={cdReduction}
                onWin={handleWinBattle}
                onLose={handleLose}
              />
            )}
          </div>
        )}

        {hasName && state.screen === 'victory' && (
          <motion.div
            key="victory"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="text-center p-8 rounded-2xl border-2 border-game-teal/50 bg-black/90 max-w-sm w-full mx-4 shadow-2xl">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="font-pixel text-2xl text-game-teal mb-2">VICTORY!</h2>
              <p className="font-pixel text-[10px] text-white/70 mb-4">{victoryEnemy.name} Defeated!</p>
              <p className="font-pixel text-sm text-yellow-400 mb-6">+{victoryEnemy.tokenReward} HYDR</p>
              <button
                onClick={isLastBattle ? () => setScreen('leaderboard') : nextBattle}
                className="font-pixel text-[10px] py-4 px-8 bg-game-teal text-black rounded border-b-4 border-black/30 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all w-full mb-3"
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
            key="defeat"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="text-center p-8 rounded-2xl border-2 border-red-500/50 bg-black/90 max-w-sm w-full mx-4 shadow-2xl">
              <div className="text-5xl mb-4">💀</div>
              <h2 className="font-pixel text-2xl text-red-400 mb-2">DEFEATED!</h2>
              <p className="font-pixel text-[10px] text-white/60 mb-6">Your Hydra has fallen in battle...</p>
              <button
                onClick={() => startGame()}
                className="font-pixel text-[10px] py-4 px-8 bg-red-600 text-white rounded border-b-4 border-red-900 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all w-full mb-3"
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
            key="shop"
            hydra={state.hydra}
            purchases={state.purchases}
            tokens={state.tokens}
            onPurchase={handlePurchase}
            onBack={() => setScreen(shopReturn)}
          />
        )}

        {hasName && state.screen === 'leaderboard' && (
          <Leaderboard
            key="leaderboard"
            playerName={playerName}
            score={state.score}
            tokens={state.tokens}
            onBack={() => setScreen('start')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
