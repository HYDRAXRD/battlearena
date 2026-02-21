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
      'account_tdx_2_12888nvfwvdqc4wxj8cqda5hf6ll0jtxrxlh0wrxp9awacwf0enzwak',
    networkId: RadixNetwork.Stokenet,
    applicationName: 'BattleArena',
    applicationVersion: '1.0.0',
  });

  rdtInstance.walletApi.setRequestData(
    DataRequestBuilder.accounts().atLeast(1)
  );

  return rdtInstance;
};

export const useRadixWallet = () => {
  const [state, setState] = useState<RadixWalletState>({
    connected: false,
    accounts: [],
    isLoading: true,
  });

  useEffect(() => {
    const rdt = initRdt();

    const subscription = rdt.walletApi.walletData$.subscribe((walletData) => {
      setState({
        connected: !!walletData.accounts.length,
        accounts: walletData.accounts,
        personaLabel: walletData.persona?.label,
        isLoading: false,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const connect = useCallback(async () => {
    const rdt = getRdt();
    if (!rdt) return;
  }, []);

  const disconnect = useCallback(async () => {
    const rdt = getRdt();
    if (!rdt) return;
    rdt.disconnect();
  }, []);

  const sendTransaction = useCallback(async (
    transactionManifest: string,
    message?: string
  ) => {
    const rdt = getRdt();
    if (!rdt) return { isErr: () => true, error: 'RDT not initialized' };

    return rdt.walletApi.sendTransaction({
      transactionManifest,
      version: 1,
      message,
    });
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
