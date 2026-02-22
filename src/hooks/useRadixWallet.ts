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

let rdtInstance: ReturnType<typeof RadixDappToolkit> | null = null;
const HYDR_TOKEN = 'resource_tdx_2_1t5372e5thltf7d8qx7xckn50h2ayu0lwd5qe24f96d22rfp2ckpxqh';

export const getRdt = (): ReturnType<typeof RadixDappToolkit> | null => rdtInstance;

export const initRdt = (): ReturnType<typeof RadixDappToolkit> | null => {
  if (rdtInstance) return rdtInstance;
  try {
    rdtInstance = RadixDappToolkit({
      dAppDefinitionAddress: 'account_tdx_2_12888nvfwvdqc4wxj8cqda5hf6ll0jtxrxlh0wrxp9awacwf0enzwak',
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
    tokenBalance: 0,
  });

  const fetchBalance = useCallback(async (address: string) => {
    try {
      // Usando o endpoint correto e tratando a estrutura de resposta do Gateway API
      const response = await fetch(`https://stokenet.radixdlt.com/state/entity/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          addresses: [address],
          aggregation_level: 'Global'
        }),
      });
      
      if (!response.ok) return 0;
      
      const data = await response.json();
      const accountData = data.items?.find((item: any) => item.address === address);
      
      // No Babylon Gateway, os recursos fungíveis ficam em fungible_resources.items
      const fungibleResources = accountData?.fungible_resources?.items || [];
      const hydrResource = fungibleResources.find((r: any) => r.resource_address === HYDR_TOKEN);
      
      // O valor vem como string "amount"
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
            connected: !!(accounts.length),
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
      try {
        subscription?.unsubscribe();
      } catch (_) {}
    };
  }, [fetchBalance]);

  const connect = useCallback(async () => {
    const rdt = getRdt();
    if (!rdt) return;
  }, []);

  const disconnect = useCallback(async () => {
    const rdt = getRdt();
    if (!rdt) return;
    try {
      rdt.disconnect();
    } catch (e) {
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

      // Atualiza o saldo após a transação se tiver sucesso
      if (!result.isErr() && state.accounts.length > 0) {
        setTimeout(async () => {
          const newBalance = await fetchBalance(state.accounts[0].address);
          setState(s => ({ ...s, tokenBalance: newBalance }));
        }, 2000); // Aguarda um pouco o indexador
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
