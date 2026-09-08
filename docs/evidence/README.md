# Level 1 evidence

Add the two required screenshots here after the public Preview deployment.

## 1. Compile output

Run:

```bash
npm run compile
```

Capture the successful output showing `Compiling 1 circuits:`. Name the
sanitized image `01-compact-compile.png`.

## 2. Preview deployment

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
