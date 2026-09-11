import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseEligibilityCredential } from '../src/lib/credential';

const address = 'a'.repeat(64);
const secret = '07'.repeat(32);

describe('VeilAid eligibility credential', () => {
  it('loads a matching credential without changing the secret bytes', () => {
    const state = parseEligibilityCredential(
      JSON.stringify({ version: 1, network: 'preprod', contractAddress: address, eligibilitySecret: secret }),
      'preprod',
      address,
    );
    assert.deepEqual(state.eligibilitySecret, new Uint8Array(32).fill(7));
  });

  it('rejects a credential for another campaign', () => {
    assert.throws(
      () => parseEligibilityCredential(
        JSON.stringify({ version: 1, network: 'preprod', contractAddress: 'b'.repeat(64), eligibilitySecret: secret }),
        'preprod',
        address,
      ),
      /different VeilAid campaign/,
    );
  });

  it('rejects malformed secret material', () => {
    assert.throws(
      () => parseEligibilityCredential(
        JSON.stringify({ version: 1, network: 'preprod', contractAddress: address, eligibilitySecret: 'private' }),
        'preprod',
        address,
      ),
      /unsupported or incomplete format/,
    );
  });
});
