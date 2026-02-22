import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SHOP_ITEMS } from '@/game/constants';
import { HydraStats } from '@/game/types';
import hydrToken from '@/assets/hydr-token.png';
import { useRadixWallet } from '@/hooks/useRadixWallet';

interface Props {
  tokens: number;
  purchases: Record<string, number>;
  hydra: HydraStats;
  onPurchase: (id: string, qty: number) => void;
  onBack: () => void;
}

const HydrToken = ({ size = 14 }: { size?: number }) => (
  <img src={hydrToken} alt="HYDR" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated', marginRight: 2 }} />
);

const QUANTITIES = [1, 2, 3];

const Shop: React.FC<Props> = ({ tokens, purchases, onPurchase, onBack }) => {
  const { connected, getShortAddress, accounts, tokenBalance } = useRadixWallet();
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});

  const getQty = (id: string) => selectedQty[id] ?? 1;

  // Use wallet balance when connected, otherwise use in-game tokens
  const effectiveBalance = connected && tokenBalance > 0 ? tokenBalance : tokens;
  const balanceLabel = connected && tokenBalance > 0 ? tokenBalance.toFixed(2) : tokens;
  const balanceSource = connected ? 'Wallet' : 'In-Game';

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="font-pixel text-[9px] text-game-teal hover:text-game-teal/80 mb-4 flex items-center gap-1"
        >
          ← BACK
        </button>

        <div className="flex items-center justify-between mb-2">
          <div className="font-pixel text-[14px] text-game-purple">🛒 SHOP</div>
          <div className="text-right">
            <div className="font-pixel text-[11px] text-yellow-400 flex items-center gap-1 justify-end">
              <HydrToken size={12} />{balanceLabel} HYDR
            </div>
            <div className="font-pixel text-[7px] text-white/40">{balanceSource} Balance</div>
          </div>
        </div>

        {connected && accounts[0] && (
          <div className="font-pixel text-[7px] text-game-teal/60 mb-2">
            Wallet: {getShortAddress(accounts[0].address)}
          </div>
        )}

        {/* Battle consumption notice */}
        <div className="font-pixel text-[7px] text-yellow-400/80 bg-yellow-400/10 border border-yellow-400/30 rounded px-3 py-2 mb-4">
          ⚔️ Items are consumed per battle. Upgrades reset after each fight!
        </div>

        {!connected && (
          <div className="font-pixel text-[7px] text-white/50 mb-3 bg-white/5 rounded px-3 py-2">
            Connect your Radix Wallet to buy with HYDR tokens!<br />
            Without wallet, in-game tokens ({tokens} HYDR) will be used.
          </div>
        )}
        {connected && (
          <div className="font-pixel text-[7px] text-game-teal mb-3 bg-game-teal/10 rounded px-3 py-2">
            ✓ Wallet connected — buying spends real HYDR tokens!
          </div>
        )}
      </div>

      {/* Items */}
      <div className="w-full max-w-md flex flex-col gap-3">
        {SHOP_ITEMS.map((item, i) => {
          const count = purchases[item.id] || 0;
          const qty = getQty(item.id);
          const remaining = item.maxPurchases - count;
          const effectiveQty = Math.min(qty, remaining);
          const totalCost = item.cost * effectiveQty;
          const maxed = count >= item.maxPurchases;
          const canAfford = effectiveBalance >= totalCost;
          const disabled = maxed || !canAfford || effectiveQty <= 0;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-lg border p-3 flex flex-col gap-2 ${
                maxed
                  ? 'border-white/10 bg-white/5 opacity-60'
                  : 'border-game-purple/40 bg-black/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-pixel text-[9px] text-white">{item.name}</div>
                  <div className="font-pixel text-[7px] text-white/50 mt-0.5">{item.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-pixel text-[8px] text-yellow-400 flex items-center gap-1 justify-end">
                    <HydrToken size={10} />{item.cost} HYDR
                  </div>
                  <div className="font-pixel text-[7px] text-white/40">{count}/{item.maxPurchases}</div>
                </div>
              </div>

              {/* Quantity selector + Buy button */}
              {!maxed && (
                <div className="flex items-center gap-2">
                  <div className="font-pixel text-[7px] text-white/50">QTY:</div>
                  <div className="flex gap-1">
                    {QUANTITIES.map(q => {
                      const cappedQ = Math.min(q, remaining);
                      return (
                        <button
                          key={q}
                          onClick={() => setSelectedQty(prev => ({ ...prev, [item.id]: q }))}
                          disabled={cappedQ <= 0}
                          className={`font-pixel text-[8px] w-7 h-7 rounded border transition-all ${
                            qty === q
                              ? 'bg-game-purple border-game-purple text-white'
                              : cappedQ <= 0
                                ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
                                : 'bg-black/40 border-white/20 text-white/70 hover:border-game-purple/60'
                          }`}
                        >
                          {q}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex-1" />
                  <div className="font-pixel text-[7px] text-yellow-400/80">
                    <HydrToken size={9} />{totalCost} total
                  </div>
                  <button
                    onClick={() => onPurchase(item.id, effectiveQty)}
                    disabled={disabled}
                    className={`font-pixel text-[7px] px-3 py-2 rounded transition-all ${
                      disabled
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-game-purple hover:bg-game-purple/80 text-white active:scale-95'
                    }`}
                  >
                    {!canAfford ? 'NEED HYDR' : 'BUY'}
                  </button>
                </div>
              )}
              {maxed && (
                <div className="font-pixel text-[7px] text-center text-yellow-400/60">✓ MAXED</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Shop;
