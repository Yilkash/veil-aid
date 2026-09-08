# Level 1 evidence

This directory contains the two screenshots required for the Level 1
submission.

Verified Preview contract address:
`f19931af3c381275ef72c4e6a28e50613b6f55139387d280744b38753376579d`.

## 1. Compile output

[`01-compact-compile.png`](01-compact-compile.png) shows Compact successfully
compiling the `claimAid` circuit.

Run:

```bash
npm run compile
```

Capture the successful output showing `Compiling 1 circuits:`. Name the
sanitized image `01-compact-compile.png`.

## 2. Preview deployment

[`02-preview-contract-address.png`](02-preview-contract-address.png) shows the
passing Preview end-to-end check, public contract address, network, and initial
claim count.

Run:

```bash
npm run setup -- --network preview
```

After faucet funding and deployment, capture the success message, network, and
public contract address. Name the sanitized image
`02-preview-contract-address.png`.

Before committing either image, inspect every visible line. Crop or redact:

- wallet mnemonic or seed;
- private-state passwords;
- access tokens;
- personal files or unrelated terminals;
- any private eligibility secret.

The wallet address, transaction ID, block height, public contract address,
eligibility commitment, nullifier, and public claim count are safe submission
evidence.
