import { useState, useEffect, useCallback } from 'react';
import {
  RadixDappToolkit,
  DataRequestBuilder,
  RadixNetwork,
} from '@radixdlt/radix-dapp-toolkit';

export interface RadixAccount {
  address: string;
  label?: string;
  appearanceId?: number;
}

export interface RadixWalletState {
  connected: boolean;
  accounts: RadixAccount[];
  personaLabel?: string;
  isLoading: boolean;
  error?: string;
}

let rdtInstance: ReturnType<typeof RadixDappToolkit> | null = null;

export const getRdt = (): ReturnType<typeof RadixDappToolkit> | null => rdtInstance;

export const initRdt = (): ReturnType<typeof RadixDappToolkit> | null => {
  if (rdtInstance) return rdtInstance;
  try {
    rdtInstance = RadixDappToolkit({
      dAppDefinitionAddress:
        'account_tdx_2_12888nvfwvdqc4wxj8cqda5hf6ll0jtxrxlh0wrxp9awacwf0enzwak',
      networkId: RadixNetwork.Stokenet,
      applicationName: 'BattleArena',
      applicationVersion: '1.0.0',
    });
    rdtInstance.walletApi.setRequestData(
      DataRequestBuilder.accounts().atLeast(1)
    );
    return rdtInstance;
  } catch (e) {
    console.warn('RadixDappToolkit init failed:', e);
    return null;
  }
};

export const useRadixWallet = () => {
  const [state, setState] = useState<RadixWalletState>({
    connected: false,
    accounts: [],
    isLoading: false,
  });

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const rdt = initRdt();
      if (!rdt) return;
      subscription = rdt.walletApi.walletData$.subscribe((walletData) => {
        try {
          setState({
            connected: !!(walletData?.accounts?.length),
            accounts: walletData?.accounts ?? [],
            personaLabel: walletData?.persona?.label,
            isLoading: false,
          });
        } catch (e) {
          console.warn('walletData subscribe error:', e);
        }
      });
    } catch (e) {
      console.warn('useRadixWallet effect error:', e);
    }
    return () => {
      try { subscription?.unsubscribe(); } catch (_) {}
    };
  }, []);

  const connect = useCallback(async () => {
    const rdt = getRdt();
    if (!rdt) return;
  }, []);

  const disconnect = useCallback(async () => {
    const rdt = getRdt();
    if (!rdt) return;
    try { rdt.disconnect(); } catch (e) { console.warn('disconnect error:', e); }
  }, []);

  const sendTransaction = useCallback(async (
    transactionManifest: string,
    message?: string
  ) => {
    const rdt = getRdt();
    if (!rdt) return { isErr: () => true as const, error: 'RDT not initialized' };
    try {
      return await rdt.walletApi.sendTransaction({
        transactionManifest,
        version: 1,
        message,
      });
    } catch (e) {
      return { isErr: () => true as const, error: String(e) };
    }
  }, []);

  const getShortAddress = useCallback((address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendTransaction,
    getShortAddress,
  };
};
