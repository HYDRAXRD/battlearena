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
  const { state, setScreen, startGame, winBattle, nextBattle, purchase, resetGame } = useGameState();
  const { connected, accounts, sendTransaction } = useRadixWallet();
  const [shopReturn, setShopReturn] = useState<GameScreen>('start');
  const [playerName, setPlayerName] = useState('');
  const [hasName, setHasName] = useState(false);
  const [battleShopOpen, setBattleShopOpen] = useState(false);
  const { muted, toggleMute, playMode, stopAll, playSfx } = useGameAudio();

  const cdReduction = state.purchases['cooldown'] || 0;
  const currentEnemy = ENEMIES[Math.min(state.currentBattle, ENEMIES.length - 1)];
  const isLastBattle = state.currentBattle >= ENEMIES.length - 1;

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

  const handleWinBattle = (t: number, s: number) => {
    playSfx('win');
    winBattle(t, s);
  };

  const handleLose = () => {
    playSfx('lose');
    stopAll();
    setScreen('defeat');
  };

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
        if (result.isErr()) {
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
    <div className="relative min-h-screen bg-background overflow-hidden">
      <StarryBackground />
      <MuteButton muted={muted} onToggle={toggleMute} />

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
            onStart={startGame}
            onShop={() => goShop('start')}
            onLeaderboard={() => setScreen('leaderboard')}
          />
        )}
        {hasName && state.screen === 'battle' && (
          <motion.div
            key="battle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <BattleArena
              hydra={state.hydra}
              battleIndex={state.currentBattle}
              cooldownReduction={cdReduction}
              onWin={handleWinBattle}
              onLose={handleLose}
            />

            {/* Botao Shop durante batalha */}
            <button
              onClick={() => setBattleShopOpen(true)}
              className="fixed bottom-16 right-4 z-40 font-pixel text-[9px] px-3 py-2 rounded-full border-2 border-yellow-400/70 bg-black/70 text-yellow-400 hover:bg-yellow-400/20 hover:border-yellow-400 transition-all shadow-lg animate-pulse"
            >
              🛒 SHOP
            </button>

            {/* Shop overlay durante batalha */}
            <AnimatePresence>
              {battleShopOpen && (
                <motion.div
                  key="battle-shop-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto"
                >
                  <div className="relative min-h-screen">
                    <button
                      onClick={() => setBattleShopOpen(false)}
                      className="fixed top-4 left-4 z-60 font-pixel text-[10px] text-game-teal hover:text-game-teal/80 bg-black/60 px-3 py-2 rounded border border-game-teal/40"
                    >
                      &larr; VOLTAR A BATALHA
                    </button>
                    <Shop
                      tokens={state.tokens}
                      purchases={state.purchases}
                      hydra={state.hydra}
                      onPurchase={handlePurchase}
                      onBack={() => setBattleShopOpen(false)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        {hasName && state.screen === 'victory' && (
          <motion.div
            key="victory"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-screen gap-6 px-4"
          >
            <div className="text-6xl">🎉</div>
            <h1 className="font-pixel text-2xl text-game-teal text-center">VICTORY!</h1>
            <p className="font-pixel text-[10px] text-white/60">Enemy Defeated!</p>
            <div className="font-pixel text-sm text-yellow-400 flex items-center gap-1">
              <HydrToken size={16} />
              +{currentEnemy.tokenReward}
            </div>
            <button
              onClick={isLastBattle ? () => setScreen('leaderboard') : nextBattle}
              className="font-pixel text-[10px] md:text-sm py-4 bg-game-teal text-black rounded border-b-4 border-black/30 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
            >
              {isLastBattle ? '🏆 VIEW RESULTS' : '▶ NEXT BATTLE'}
            </button>
            <button
              onClick={() => goShop('victory')}
              className="font-pixel text-[8px] py-3 bg-transparent text-game-teal rounded border-2 border-game-teal/50 hover:bg-game-teal/10 transition-all"
            >
              🛙 SHOP
            </button>
          </motion.div>
        )}
        {hasName && state.screen === 'defeat' && (
          <motion.div
            key="defeat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-screen gap-6 px-4"
          >
            <div className="text-6xl">💀</div>
            <h1 className="font-pixel text-2xl text-red-500">DEFEATED!</h1>
            <p className="font-pixel text-[8px] text-white/60">Your Hydra has fallen in battle...</p>
            <button
              onClick={() => { resetGame(); setScreen('start'); }}
              className="font-pixel text-[10px] py-4 px-8 bg-red-600 text-white rounded border-b-4 border-red-900 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
            >
              🔄 TRY AGAIN
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
            playerName={playerName}
            playerScore={state.totalScore}
            onBack={() => setScreen('start')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
