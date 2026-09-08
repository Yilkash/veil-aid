import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import {
  Contract,
  ledger,
  pureCircuits,
  type Witnesses,
} from '../contracts/managed/veil-aid/contract/index.js';

export type VeilAidPrivateState = {
  readonly eligibilitySecret: Uint8Array;
};

export const createVeilAidPrivateState = (
  eligibilitySecret: Uint8Array,
): VeilAidPrivateState => ({
  eligibilitySecret: Uint8Array.from(eligibilitySecret),
});

export const emptyVeilAidPrivateState = (): VeilAidPrivateState =>
  createVeilAidPrivateState(new Uint8Array(32));

export const witnesses: Witnesses<VeilAidPrivateState> = {
  eligibilitySecret: ({ privateState }) => [
    privateState,
    privateState.eligibilitySecret,
  ],
};

export const createCompiledContract = (compiledAssetsPath: string) =>
  CompiledContract.make('veil-aid', Contract<VeilAidPrivateState>).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(compiledAssetsPath),
  );

export { ledger, pureCircuits };
