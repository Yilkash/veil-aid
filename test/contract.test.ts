import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createVeilAidPrivateState,
  pureCircuits,
  witnesses,
} from '../src/contract';

describe('VeilAid privacy primitives', () => {
  it('stores and returns the eligibility secret through the private witness', () => {
    const source = Uint8Array.from({ length: 32 }, (_, index) => index + 1);
    const privateState = createVeilAidPrivateState(source);

    source.fill(0);
    const [nextState, witnessedSecret] = witnesses.eligibilitySecret({
      privateState,
      ledger: {} as never,
      contractAddress: new Uint8Array(32) as never,
    });

    assert.equal(nextState, privateState);
    assert.deepEqual(witnessedSecret, privateState.eligibilitySecret);
    assert.notDeepEqual(witnessedSecret, source);
  });

  it('derives deterministic 32-byte commitments', () => {
    const secret = new Uint8Array(32).fill(7);
    const first = pureCircuits.deriveEligibilityCommitment(secret);
    const second = pureCircuits.deriveEligibilityCommitment(secret);

    assert.equal(first.length, 32);
    assert.deepEqual(first, second);
  });

  it('uses separate domains for commitments and claim nullifiers', () => {
    const secret = new Uint8Array(32).fill(19);
    const commitment = pureCircuits.deriveEligibilityCommitment(secret);
    const nullifier = pureCircuits.deriveClaimNullifier(secret);

    assert.equal(nullifier.length, 32);
    assert.notDeepEqual(commitment, nullifier);
  });

  it('changes the public commitment when the private secret changes', () => {
    const aliceSecret = new Uint8Array(32).fill(1);
    const bobSecret = new Uint8Array(32).fill(2);

    assert.notDeepEqual(
      pureCircuits.deriveEligibilityCommitment(aliceSecret),
      pureCircuits.deriveEligibilityCommitment(bobSecret),
    );
  });
});
