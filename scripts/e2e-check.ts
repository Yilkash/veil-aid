/**
 * Read-only end-to-end smoke check for VeilAid.
 *
 * Queries the deployed contract through the public indexer and exits 0 when
 * its ledger state can be decoded. It deliberately does not create or sync a
 * wallet, so verification is fast and cannot expose wallet recovery data.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { ledger } from '../src/contract';
import { getDeployment, resolveNetwork } from '../src/network';

const { network, config: networkConfig } = resolveNetwork();

function fail(message: string): never {
  console.error(`❌ e2e-check failed: ${message}`);
  process.exit(1);
}

function isHexAddress(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-fA-F]+$/.test(value) && value.length >= 32;
}

async function main() {
  const deployment = getDeployment(network);
  if (!deployment) fail(`No deployment found for network ${network}.`);
  if (!isHexAddress(deployment.address)) {
    fail(`Deployment address is missing or invalid.`);
  }

  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const generatedDirectory = path.resolve(scriptDirectory, '..', 'contracts', 'managed', 'veil-aid');
  const generatedContract = path.join(generatedDirectory, 'contract', 'index.js');
  if (!fs.existsSync(generatedContract)) {
    fail('Compiled contract missing — run `npm run compile`.');
  }
  await import(pathToFileURL(generatedContract).href);

  const publicDataProvider = indexerPublicDataProvider(
    networkConfig.indexer,
    networkConfig.indexerWS,
  );
  const onChainState = await publicDataProvider.queryContractState(deployment.address);
  if (!onChainState) {
    fail(`queryContractState returned null for ${deployment.address}`);
  }

  const publicState = ledger(onChainState.data);
  if (publicState.eligibilityCommitment.length !== 32) {
    fail('eligibilityCommitment is not 32 bytes');
  }

  console.log('✅ e2e-check passed');
  console.log(`   contractAddress: ${deployment.address}`);
  console.log(`   network:         ${network}`);
  console.log(`   successfulClaims: ${publicState.successfulClaims}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
