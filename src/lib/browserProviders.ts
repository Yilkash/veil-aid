import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { dappConnectorProofProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  type TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import type { VeilAidPrivateState } from '../contract';
import { memoryPrivateStateProvider } from './privateStateProvider';

export const PRIVATE_STATE_ID = 'veilAidPrivateState' as const;

export async function createBrowserProviders(
  connectedAPI: ConnectedAPI,
  contractAddress: string,
  initialPrivateState: VeilAidPrivateState,
) {
  const configuration = await connectedAPI.getConfiguration();
  const keyMaterialProvider = new FetchZkConfigProvider<'claimAid'>(window.location.origin, fetch.bind(window));
  const publicDataProvider = indexerPublicDataProvider(configuration.indexerUri, configuration.indexerWsUri);
  const chainContext = await publicDataProvider.queryZSwapAndContractState(contractAddress);
  if (!chainContext) throw new Error('The configured VeilAid contract was not found on this network.');

  const runtimeCostModel = chainContext[2].transactionCostModel.runtimeCostModel;
  const proofProvider = await dappConnectorProofProvider(
    connectedAPI,
    keyMaterialProvider,
    runtimeCostModel,
  );
  const privateStateProvider = memoryPrivateStateProvider<typeof PRIVATE_STATE_ID, VeilAidPrivateState>();
  privateStateProvider.setContractAddress(contractAddress);
  await privateStateProvider.set(PRIVATE_STATE_ID, initialPrivateState);
  const shielded = await connectedAPI.getShieldedAddresses();

  return {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider: keyMaterialProvider,
    proofProvider,
    walletProvider: {
      getCoinPublicKey: () => shielded.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => shielded.shieldedEncryptionPublicKey,
      balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
        const balanced = await connectedAPI.balanceUnsealedTransaction(toHex(tx.serialize()));
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature',
          'proof',
          'binding',
          fromHex(balanced.tx),
        );
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        const [transactionId] = tx.identifiers();
        return transactionId;
      },
    },
  };
}
