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
  <img src={hydrToken} alt=\"HYDR\" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated' }} />
);

const Shop: React.FC<Props> = ({ tokens, purchases, onPurchase, onBack }) => {
  const { connected, getShortAddress, accounts } = useRadixWallet();
  
  return (
    <div className=\"relative z-10 min-h-screen flex flex-col px-4 py-6\">
      <div className=\"flex justify-between items-center mb-6\">
        <button onClick={onBack} className=\"font-pixel text-[10px] text-game-teal hover:text-game-teal/80\">← BACK</button>
        <div className=\"flex flex-col items-end gap-1\">
          <div className=\"font-pixel text-[10px] text-yellow-400 flex items-center gap-1\"><HydrToken size={16} /> {tokens} HYDR</div>
          {connected && accounts[0] && (
            <div className=\"font-pixel text-[6px] text-game-purple opacity-70\">
              Wallet: {getShortAddress(accounts[0].address)}
            </div>
          )}
        </div>
      </div>
      
      <h1 className=\"font-pixel text-lg text-center text-game-purple mb-2\">🛒 SHOP</h1>
      {!connected && (
        <div className=\"font-pixel text-[7px] text-center text-red-400 mb-6 animate-pulse\">
          Connect your Radix Wallet to buy upgrades!
        </div>
      )}
      
      <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto w-full\">
        {SHOP_ITEMS.map((item, i) => {
          const count = purchases[item.id] || 0;
          const maxed = count >= item.maxPurchases;
          const poor = tokens < item.cost;
          const disabled = maxed || poor || !connected;

          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`p-4 rounded border-2 \${maxed ? 'border-gray-700 bg-gray-800/30' : 'border-game-purple/30 bg-background/80'}`}>
              <div className=\"font-pixel text-[7px] text-white mb-1\">{item.name}</div>
              <div className=\"font-pixel text-[5px] text-muted-foreground mb-2\">{item.description}</div>
              <div className=\"flex justify-between items-center\">
                <span className=\"font-pixel text-[6px] text-yellow-400 flex items-center gap-1\"><HydrToken size={12} /> {item.cost}</span>
                <span className=\"font-pixel text-[5px] text-gray-500\">{count}/{item.maxPurchases}</span>
              </div>
              <button onClick={() => onPurchase(item.id)} disabled={disabled}
                className={`w-full mt-2 font-pixel text-[6px] py-2 rounded transition-all \${disabled ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-game-purple hover:bg-game-purple/80 text-white active:scale-95'}`}>
                {maxed ? 'MAXED' : !connected ? 'CONNECT WALLET' : poor ? 'NEED MORE HYDR' : 'BUY'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Shop;
