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
  tokenBalance: number;
}

interface GatewayFungibleResource {
  resource_address: string;
  amount: string;
}

interface GatewayAccountItem {
  address: string;
  fungible_resources?: { items: GatewayFungibleResource[] };
}

// NÃO usar singleton — cria nova instância sempre limpa
let rdtInstance: ReturnType<typeof RadixDappToolkit> | null = null;

const HYDR_TOKEN = 'resource_rdx1t4kc2yjdcqprwu70tahua3p8uwvjej9q3rktpxdr8p5pmcp4almd6r';
const DAPP_ACCOUNT = 'account_rdx129sv0vcuj4zvspeu8ql4z6wm6zp3xs86a46388aw64xevvfyhnsx4e';

export const getRdt = (): ReturnType<typeof RadixDappToolkit> | null => rdtInstance;

export const initRdt = (): ReturnType<typeof RadixDappToolkit> | null => {
  if (rdtInstance) return rdtInstance;

  try {
    rdtInstance = RadixDappToolkit({
      dAppDefinitionAddress: DAPP_ACCOUNT,
      networkId: RadixNetwork.Mainnet,
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
    tokenBalance: 0,
  });

  const fetchBalance = useCallback(async (address: string) => {
    try {
      const response = await fetch('https://mainnet.radixdlt.com/state/entity/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: [address],
          aggregation_level: 'Global',
        }),
      });

      if (!response.ok) return 0;

      const data = await response.json();
      const accountData = data.items?.find(
        (item: GatewayAccountItem) => item.address === address
      );

      const fungibleResources = accountData?.fungible_resources?.items || [];
      const hydrResource = fungibleResources.find(
        (r: GatewayFungibleResource) => r.resource_address === HYDR_TOKEN
      );

      return hydrResource ? parseFloat(hydrResource.amount) : 0;
    } catch (e) {
      console.error('Fetch balance error:', e);
      return 0;
    }
  }, []);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const rdt = initRdt();
      if (!rdt) return;

      subscription = rdt.walletApi.walletData$.subscribe(async (walletData) => {
        try {
          const accounts = (walletData?.accounts as RadixAccount[]) ?? [];
          let balance = 0;

          if (accounts.length > 0) {
            balance = await fetchBalance(accounts[0].address);
          }

          setState({
            connected: accounts.length > 0,
            accounts,
            personaLabel: walletData?.persona?.label,
            isLoading: false,
            tokenBalance: balance,
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
  }, [fetchBalance]);

  const connect = useCallback(async () => {
    const rdt = getRdt();
    if (!rdt) return;
    rdt.walletApi?.sendRequest();
  }, []);

  const disconnect = useCallback(async () => {
    const rdt = getRdt();
    if (!rdt) return;
    try { rdt.disconnect(); } catch (e) {
      console.warn('disconnect error:', e);
    }
  }, []);

  const sendTransaction = useCallback(async (
    transactionManifest: string,
    message?: string
  ) => {
    const rdt = getRdt();
    if (!rdt) return { isErr: () => true as const, error: 'RDT not initialized' };

    try {
      const result = await rdt.walletApi.sendTransaction({
        transactionManifest,
        version: 1,
        message,
      });

      if (!result.isErr() && state.accounts.length > 0) {
        setTimeout(async () => {
          const newBalance = await fetchBalance(state.accounts[0].address);
          setState(s => ({ ...s, tokenBalance: newBalance }));
        }, 2000);
      }

      return result;
    } catch (e) {
      return { isErr: () => true as const, error: String(e) };
    }
  }, [state.accounts, fetchBalance]);

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
