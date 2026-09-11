import { createVeilAidPrivateState, type VeilAidPrivateState } from '../contract';

export interface EligibilityCredential {
  version: 1;
  network: 'preview' | 'preprod';
  contractAddress: string;
  eligibilitySecret: string;
}

const ADDRESS_PATTERN = /^[0-9a-f]{64}$/i;
const SECRET_PATTERN = /^[0-9a-f]{64}$/i;

export function parseEligibilityCredential(
  source: string,
  expectedNetwork: 'preview' | 'preprod',
  expectedContractAddress: string,
): VeilAidPrivateState {
  let candidate: unknown;
  try {
    candidate = JSON.parse(source);
  } catch {
    throw new Error('This is not a valid VeilAid eligibility credential.');
  }

  if (!candidate || typeof candidate !== 'object') {
    throw new Error('This is not a valid VeilAid eligibility credential.');
  }
  const value = candidate as Partial<EligibilityCredential>;
  if (
    value.version !== 1 ||
    (value.network !== 'preview' && value.network !== 'preprod') ||
    typeof value.contractAddress !== 'string' ||
    !ADDRESS_PATTERN.test(value.contractAddress) ||
    typeof value.eligibilitySecret !== 'string' ||
    !SECRET_PATTERN.test(value.eligibilitySecret)
  ) {
    throw new Error('The credential has an unsupported or incomplete format.');
  }
  if (value.network !== expectedNetwork) {
    throw new Error(`This credential belongs to ${value.network}, not ${expectedNetwork}.`);
  }
  if (value.contractAddress.toLowerCase() !== expectedContractAddress.toLowerCase()) {
    throw new Error('This credential belongs to a different VeilAid campaign.');
  }

  const bytes = Uint8Array.from(value.eligibilitySecret.match(/.{2}/g)!, (pair) => Number.parseInt(pair, 16));
  return createVeilAidPrivateState(bytes);
}

export async function readEligibilityCredential(
  file: File,
  expectedNetwork: 'preview' | 'preprod',
  expectedContractAddress: string,
): Promise<VeilAidPrivateState> {
  if (file.size > 4096) throw new Error('The selected credential file is too large.');
  return parseEligibilityCredential(await file.text(), expectedNetwork, expectedContractAddress);
}
