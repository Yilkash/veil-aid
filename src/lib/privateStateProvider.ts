import type { ContractAddress, SigningKey } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import type {
  ExportPrivateStatesOptions,
  ExportSigningKeysOptions,
  ImportPrivateStatesOptions,
  ImportPrivateStatesResult,
  ImportSigningKeysOptions,
  ImportSigningKeysResult,
  PrivateStateExport,
  PrivateStateId,
  PrivateStateProvider,
  SigningKeyExport,
} from '@midnight-ntwrk/midnight-js-types';

/**
 * Session-only private storage for the eligibility credential. Closing or
 * refreshing the page clears it; the credential file remains under the
 * recipient's control and must be selected again.
 */
export function memoryPrivateStateProvider<PSI extends PrivateStateId, PS>(): PrivateStateProvider<PSI, PS> {
  const states = new Map<ContractAddress, Map<PSI, PS>>();
  const signingKeys = new Map<ContractAddress, SigningKey>();
  let activeAddress: ContractAddress | null = null;

  const address = (): ContractAddress => {
    if (!activeAddress) throw new Error('Contract address has not been selected.');
    return activeAddress;
  };

  const scope = (): Map<PSI, PS> => {
    const current = address();
    const existing = states.get(current);
    if (existing) return existing;
    const created = new Map<PSI, PS>();
    states.set(current, created);
    return created;
  };

  const unsupported = (): never => {
    throw new Error('Private-state export is disabled in the browser.');
  };

  return {
    setContractAddress(value) { activeAddress = value; },
    async set(key, value) { scope().set(key, value); },
    async get(key) { return scope().get(key) ?? null; },
    async remove(key) { scope().delete(key); },
    async clear() { states.delete(address()); },
    async setSigningKey(contractAddress, key) { signingKeys.set(contractAddress, key); },
    async getSigningKey(contractAddress) { return signingKeys.get(contractAddress) ?? null; },
    async removeSigningKey(contractAddress) { signingKeys.delete(contractAddress); },
    async clearSigningKeys() { signingKeys.clear(); },
    async exportPrivateStates(_options?: ExportPrivateStatesOptions): Promise<PrivateStateExport> { return unsupported(); },
    async importPrivateStates(
      _data: PrivateStateExport,
      _options?: ImportPrivateStatesOptions,
    ): Promise<ImportPrivateStatesResult> { return unsupported(); },
    async exportSigningKeys(_options?: ExportSigningKeysOptions): Promise<SigningKeyExport> { return unsupported(); },
    async importSigningKeys(
      _data: SigningKeyExport,
      _options?: ImportSigningKeysOptions,
    ): Promise<ImportSigningKeysResult> { return unsupported(); },
  };
}
