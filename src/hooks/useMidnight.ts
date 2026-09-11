import { useCallback, useMemo, useState } from 'react';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import semver from 'semver';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MidnightWalletState {
  status: WalletStatus;
  address: string | null;
  walletName: string | null;
  error: string | null;
  connectedAPI: ConnectedAPI | null;
  networkId: 'preview' | 'preprod';
  available: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const REQUIRED_API_RANGE = '4.x';

function compatibleWallets(): InitialAPI[] {
  return Object.values(window.midnight ?? {}).filter(
    (wallet): wallet is InitialAPI =>
      Boolean(wallet) &&
      typeof wallet === 'object' &&
      typeof wallet.apiVersion === 'string' &&
      semver.satisfies(wallet.apiVersion, REQUIRED_API_RANGE),
  );
}

function friendlyWalletError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('reject') || normalized.includes('denied') || normalized.includes('authoriz')) {
    return 'Connection was not approved in Lace. Try again and approve the request.';
  }
  if (normalized.includes('network')) {
    return 'Lace is connected to the wrong network. Switch it to Preprod and reconnect.';
  }
  if (normalized.includes('timeout') || normalized.includes('respond')) {
    return 'Lace did not respond. Unlock the extension and try again.';
  }
  return 'We could not connect to Lace. Unlock the wallet and try again.';
}

export function useMidnight(): MidnightWalletState {
  const configuredNetwork = import.meta.env.VITE_NETWORK_ID;
  const networkId = configuredNetwork === 'preview' ? 'preview' : 'preprod';
  const [status, setStatus] = useState<WalletStatus>('disconnected');
  const [address, setAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectedAPI, setConnectedAPI] = useState<ConnectedAPI | null>(null);

  const available = useMemo(() => compatibleWallets().length > 0, []);

  const disconnect = useCallback(() => {
    setConnectedAPI(null);
    setAddress(null);
    setWalletName(null);
    setError(null);
    setStatus('disconnected');
  }, []);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setError(null);

    const wallet = compatibleWallets()[0];
    if (!wallet) {
      setStatus('error');
      setError('Midnight Lace was not found. Install the extension, unlock it, then reload this page.');
      return;
    }

    try {
      const api = await wallet.connect(networkId);
      const connection = await api.getConnectionStatus();
      if (connection.status !== 'connected') {
        throw new Error('Wallet connection is disconnected');
      }
      if (connection.networkId.toLowerCase() !== networkId) {
        throw new Error(`Network mismatch: expected ${networkId}, received ${connection.networkId}`);
      }

      await api.hintUsage([
        'getShieldedAddresses',
        'getConfiguration',
        'balanceUnsealedTransaction',
        'submitTransaction',
      ]);
      const { shieldedAddress } = await api.getShieldedAddresses();

      setConnectedAPI(api);
      setAddress(shieldedAddress);
      setWalletName(wallet.name);
      setStatus('connected');
    } catch (cause) {
      setConnectedAPI(null);
      setAddress(null);
      setWalletName(null);
      setStatus('error');
      setError(friendlyWalletError(cause));
    }
  }, [networkId]);

  return {
    status,
    address,
    walletName,
    error,
    connectedAPI,
    networkId,
    available,
    connect,
    disconnect,
  };
}
