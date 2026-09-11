import { useCallback, useEffect, useState } from 'react';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { VeilAidPrivateState } from '../contract';
import { createCompiledContract, ledger } from '../contract';
import type { MidnightWalletState } from './useMidnight';
import { createBrowserProviders, PRIVATE_STATE_ID } from '../lib/browserProviders';

export type ClaimStage = 'idle' | 'preparing' | 'proving' | 'submitting' | 'confirming' | 'confirmed' | 'failed';

export interface CampaignState {
  successfulClaims: bigint;
  claimRecorded: boolean;
}

export interface ClaimReceipt {
  transactionId: string;
  blockHeight: number;
}

const compiledContract = createCompiledContract('./');

function friendlyClaimError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  if (normalized.includes('already claimed') || normalized.includes('already recorded')) {
    return 'This eligibility credential has already been used. VeilAid blocks duplicate claims.';
  }
  if (normalized.includes('does not match')) {
    return 'This credential is not eligible for the configured campaign.';
  }
  if (normalized.includes('dust') || normalized.includes('insufficient')) {
    return 'The wallet does not have enough NIGHT/DUST to pay the transaction fee.';
  }
  if (normalized.includes('proof') || normalized.includes('prover')) {
    return 'Proof generation could not finish. Check Lace’s proving service and try again.';
  }
  if (normalized.includes('contract') && normalized.includes('not found')) {
    return 'The VeilAid contract was not found on the selected network.';
  }
  return 'The private claim could not be completed. Check Lace and try again.';
}

export function useVeilAid(wallet: MidnightWalletState, contractAddress: string) {
  const [credential, setCredential] = useState<VeilAidPrivateState | null>(null);
  const [stage, setStage] = useState<ClaimStage>('idle');
  const [campaign, setCampaign] = useState<CampaignState | null>(null);
  const [receipt, setReceipt] = useState<ClaimReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearCredential = useCallback(() => {
    setCredential(null);
    setReceipt(null);
    setError(null);
    setStage('idle');
  }, []);

  useEffect(() => {
    if (!wallet.connectedAPI || !contractAddress) {
      setCampaign(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const config = await wallet.connectedAPI!.getConfiguration();
        const { indexerPublicDataProvider } = await import('@midnight-ntwrk/midnight-js-indexer-public-data-provider');
        const provider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri);
        const state = await provider.queryContractState(contractAddress);
        if (!state || cancelled) return;
        const publicLedger = ledger(state.data);
        setCampaign({
          successfulClaims: publicLedger.successfulClaims,
          claimRecorded: publicLedger.claimRecorded,
        });
      } catch {
        if (!cancelled) setCampaign(null);
      }
    })();
    return () => { cancelled = true; };
  }, [contractAddress, wallet.connectedAPI]);

  const claim = useCallback(async () => {
    if (!wallet.connectedAPI) {
      setError('Connect Lace before starting a claim.');
      return;
    }
    if (!credential) {
      setError('Load your private eligibility credential before starting a claim.');
      return;
    }
    if (!contractAddress) {
      setError('The Preprod contract address has not been configured.');
      return;
    }

    setError(null);
    setReceipt(null);
    setStage('preparing');
    try {
      const providers = await createBrowserProviders(wallet.connectedAPI, contractAddress, credential);
      setStage('proving');
      const deployed = await findDeployedContract(providers, {
        compiledContract,
        contractAddress,
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: credential,
      });
      setStage('submitting');
      const transaction = await deployed.callTx.claimAid();
      setStage('confirming');
      setReceipt({
        transactionId: transaction.public.txId,
        blockHeight: transaction.public.blockHeight,
      });
      setCampaign((current) => ({
        successfulClaims: (current?.successfulClaims ?? 0n) + 1n,
        claimRecorded: true,
      }));
      setStage('confirmed');
    } catch (cause) {
      setError(friendlyClaimError(cause));
      setStage('failed');
    }
  }, [contractAddress, credential, wallet.connectedAPI]);

  return {
    credential,
    setCredential,
    clearCredential,
    stage,
    campaign,
    receipt,
    error,
    claim,
  };
}
