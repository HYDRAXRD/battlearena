import React from 'react';
import { motion } from 'framer-motion';
import { SHOP_ITEMS } from '@/game/constants';
import { HydraStats } from '@/game/types';
import hydrToken from '@/assets/hydr-token.png';
import { useRadixWallet } from '@/hooks/useRadixWallet';

interface Props {
  tokens: number;
  purchases: Record<string, number>;
  hydra: HydraStats;
  onPurchase: (id: string) => void;
  onBack: () => void;
}

const HydrToken = ({ size = 14 }: { size?: number }) => (
  <img src={hydrToken} alt="HYDR" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated' }} />
);

const getShortAddressHelper = (address: string) => address.slice(0, 6) + '...' + address.slice(-4);

const Shop: React.FC<Props> = ({ tokens, purchases, onPurchase, onBack }) => {
  const { connected, getShortAddress, accounts, tokenBalance } = useRadixWallet();

  // When wallet is connected, ALWAYS use wallet tokenBalance (even if 0)
  // Only fall back to in-game tokens when wallet is NOT connected
  const effectiveBalance = connected ? tokenBalance : tokens;
  const balanceLabel = connected ? tokenBalance.toFixed(2) : tokens.toString();
  const balanceSource = connected ? 'Wallet' : 'In-Game';

  return (
    <div className="relative z-10 min-h-screen flex flex-col px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="font-pixel text-[10px] text-game-teal hover:text-game-teal/80">&larr; BACK</button>
        <div className="flex flex-col items-end gap-1">
          <div className="font-pixel text-[10px] text-yellow-400 flex items-center gap-1">
            <HydrToken size={16} /> {balanceLabel} HYDR
          </div>
          <div className="font-pixel text-[7px] text-white/40">{balanceSource} Balance</div>
          {connected && accounts[0] && (
            <div className="font-pixel text-[6px] text-game-purple opacity-70">
              Wallet: {getShortAddressHelper(accounts[0].address)}
            </div>
          )}
        </div>
      </div>

      <h1 className="font-pixel text-lg text-center text-game-purple mb-2">🛒 SHOP</h1>

      {!connected && (
        <div className="text-center font-pixel text-[7px] text-yellow-400/80 mb-4 bg-yellow-400/10 border border-yellow-400/30 rounded px-3 py-2">
          Connect your Radix Wallet to buy with HYDR tokens!<br />
          Without wallet, in-game tokens ({tokens} HYDR) will be used.
        </div>
      )}
      {connected && (
        <div className="text-center font-pixel text-[7px] text-game-teal/80 mb-4 bg-game-teal/10 border border-game-teal/30 rounded px-3 py-2">
          ✓ Wallet connected — buying spends real HYDR tokens!
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto w-full">
        {SHOP_ITEMS.map((item, i) => {
          const count = purchases[item.id] || 0;
          const maxed = count >= item.maxPurchases;
          const canAfford = effectiveBalance >= item.cost;
          const disabled = maxed || !canAfford;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-lg border-2 p-3 flex flex-col gap-2 ${
                maxed
                  ? 'border-yellow-400/60 bg-yellow-400/5'
                  : disabled
                  ? 'border-gray-700/60 bg-gray-800/20'
                  : 'border-game-purple/60 bg-game-purple/10 hover:bg-game-purple/20'
              }`}
            >
              <div className="font-pixel text-[8px] text-white">{item.name}</div>
              <div className="font-pixel text-[7px] text-white/60">{item.description}</div>
              <div className="flex items-center justify-between gap-2">
                <div className="font-pixel text-[7px] text-yellow-400 flex items-center gap-1">
                  <HydrToken size={10} /> {item.cost}{'  '}
                  <span className="text-white/40">{count}/{item.maxPurchases}</span>
                </div>
                <button
                  onClick={() => onPurchase(item.id)}
                  disabled={disabled}
                  className={`w-24 mt-0 font-pixel text-[6px] py-2 rounded transition-all ${
                    disabled
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-game-purple hover:bg-game-purple/80 text-white active:scale-95'
                  }`}
                >
                  {maxed ? 'MAXED' : !canAfford ? 'NEED MORE HYDR' : 'BUY'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Shop;
