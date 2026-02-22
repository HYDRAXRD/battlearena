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

  // Use wallet balance when connected, otherwise use in-game tokens
  const effectiveBalance = connected && tokenBalance > 0 ? tokenBalance : tokens;
  const balanceLabel = connected && tokenBalance > 0 ? tokenBalance.toFixed(2) : tokens;
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
              Wallet: {getShortAddress(accounts[0].address)}
            </div>
          )}
        </div>
      </div>

      <h1 className="font-pixel text-lg text-center text-game-purple mb-2">🛒 SHOP</h1>

      {!connected && (
        <div className="font-pixel text-[7px] text-center text-yellow-400 mb-6 animate-pulse bg-yellow-400/10 border border-yellow-400/30 rounded px-4 py-2">
          Connect your Radix Wallet to buy with HYDR tokens!<br />
          <span className="text-white/50">Without wallet, in-game tokens ({tokens} HYDR) will be used.</span>
        </div>
      )}

      {connected && (
        <div className="font-pixel text-[7px] text-center text-green-400 mb-6 bg-green-400/10 border border-green-400/30 rounded px-4 py-2">
          ✓ Wallet connected — buying spends real HYDR tokens!
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto w-full">
        {SHOP_ITEMS.map((item, i) => {
          const count = purchases[item.id] || 0;
          const maxed = count >= item.maxPurchases;
          const canAfford = effectiveBalance >= item.cost;
          const disabled = maxed || !canAfford;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                maxed ? 'border-gray-700 bg-gray-800/50 opacity-60' :
                !canAfford ? 'border-red-900/50 bg-red-900/10' :
                'border-game-purple/50 bg-background/80 hover:border-game-purple hover:bg-game-purple/10'
              }`}
            >
              <div className="font-pixel text-[9px] text-white mb-1">{item.name}</div>
              <div className="font-pixel text-[7px] text-white/50 mb-2">{item.description}</div>
              <div className="flex justify-between items-center">
                <div className="font-pixel text-[8px] text-yellow-400 flex items-center gap-1">
                  <HydrToken size={10} /> {item.cost}
                  <span className="text-white/30 text-[6px] ml-1">{count}/{item.maxPurchases}</span>
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
