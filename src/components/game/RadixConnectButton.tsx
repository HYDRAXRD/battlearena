import React, { useEffect, useRef } from 'react';
import { useRadixWallet, initRdt } from '@/hooks/useRadixWallet';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';

interface RadixConnectButtonProps {
  className?: string;
  compact?: boolean;
}

const RadixConnectButton: React.FC<RadixConnectButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const connectButtonRef = useRef<HTMLElement | null>(null);
  const { connected, accounts, personaLabel, disconnect, getShortAddress } =
    useRadixWallet();

  useEffect(() => {
    // Initialize RDT so the radix-connect-button custom element is registered
    initRdt();
  }, []);

  const primaryAccount = accounts[0];

  if (connected && primaryAccount) {
    return (
      <div
        className={`flex items-center gap-2 ${className}`}
        style={{ fontFamily: 'inherit' }}
      >
        <div className="flex items-center gap-2 bg-game-teal/10 border border-game-teal/40 rounded px-3 py-2">
          <Wallet className="w-4 h-4 text-game-teal" />
          <div className="flex flex-col">
            {personaLabel && (
              <span className="font-pixel text-[8px] text-game-teal leading-tight">
                {personaLabel}
              </span>
            )}
            <span className="font-pixel text-[8px] text-white/80 leading-tight">
              {getShortAddress(primaryAccount.address)}
            </span>
          </div>
          <button
            onClick={disconnect}
            title="Disconnect wallet"
            className="ml-1 text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {/* The radix-connect-button is a custom web component provided by @radixdlt/radix-dapp-toolkit */}
      {/* @ts-ignore */}
      <radix-connect-button />
    </div>
  );
};

export default RadixConnectButton;
