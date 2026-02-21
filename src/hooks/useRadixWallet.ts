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

export const initRdt = (): ReturnType<typeof RadixDappToolkit> => {
  if (rdtInstance) return rdtInstance;
  rdtInstance = RadixDappToolkit({
    dAppDefinitionAddress:
      'account_tdx_2_12y7ue9sslrkpywpgqyu3nj8cut0uu5arpr7qyalz7y9j7j5q4ayhv6',
    networkId: RadixNetwork.Stokenet,
    applicationName: 'BattleArena',
    applicationVersion: '1.0.0',
  });

  rdtInstance.walletApi.setRequestData(
    DataRequestBuilder.accounts().exactly(1)
  );

  return rdtInstance;
};

export const useRadixWallet = () => {
  const [state, setState] = useState<RadixWalletState>({
    connected: false,
    accounts: [],
    isLoading: false,
  });

  useEffect(() => {
    const rdt = initRdt();
    const subscription = rdt.walletApi.walletData$.subscribe((walletData) => {
      if (walletData) {
        setState({
          connected: true,
          accounts: walletData.accounts.map((acc) => ({
            address: acc.address,
            label: acc.label,
            appearanceId: acc.appearanceId,
          })),
          personaLabel: walletData.persona?.label,
          isLoading: false,
        });
      } else {
        setState({
          connected: false,
          accounts: [],
          isLoading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const disconnect = useCallback(() => {
    const rdt = getRdt();
    if (rdt) {
      rdt.disconnect();
      setState({
        connected: false,
        accounts: [],
        isLoading: false,
      });
    }
  }, []);

  const getShortAddress = useCallback((address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
  }, []);

  const sendTransaction = useCallback(async (manifest: string, message?: string) => {
    const rdt = getRdt();
    if (!rdt) throw new Error('Radix Dapp Toolkit not initialized');

    return rdt.walletApi.sendTransaction({
      transactionManifest: manifest,
      version: 1,
      message,
    });
  }, []);

  return {
    ...state,
    disconnect,
    getShortAddress,
    sendTransaction,
    rdt: getRdt(),
  };
};

export default useRadixWallet;
