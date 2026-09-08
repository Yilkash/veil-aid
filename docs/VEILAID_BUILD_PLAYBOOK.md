# VeilAid Build Playbook

> **Tagline:** Prove you qualify. Claim once. Stay private.

This document is the working plan for taking VeilAid from Rise In Level 1 through Level 6. It combines the deliverables in the supplied Midnight Builder Challenge document with the current Midnight developer toolchain as of September 7, 2026.

## 1. Product vision

VeilAid is a privacy-preserving platform for distributing aid, scholarships, grants, vouchers, and community benefits. An organization publishes a cryptographic commitment to an eligibility list. A recipient proves privately that they are included, receives a claim receipt, and cannot claim twice. Their identity, eligibility secret, and position in the list never become public.

### Primary users

- NGOs and humanitarian organizations distributing benefits.
- Scholarship and grant providers.
- Community funds and public-good programs.
- Recipients who need to prove eligibility without publicly exposing their circumstances.

### Core user story

> As an eligible recipient, I want to prove that I qualify and claim a benefit without publishing my identity or personal circumstances, while the distributor can prove that every accepted claim was valid and unique.

### Why Midnight

A conventional public blockchain makes transactions auditable by exposing the information used in them. A centralized database can hide recipients, but users must trust its operator and outsiders cannot independently verify the distribution. Midnight lets VeilAid combine private eligibility proofs with public verification of campaign rules, unique claims, and aggregate distribution totals.

## 2. Winning strategy

The submission should optimize for four qualities:

1. **Technology:** use Compact circuits, private witnesses, commitments, and nullifiers for a real privacy boundary.
2. **Innovation:** apply these tools to a sensitive real-world workflow, rather than building another generic counter or poll.
3. **Completion:** maintain a working deployment and a short, reliable end-to-end demo at every level.
4. **Documentation:** explain exactly what an observer can and cannot learn, with reproducible setup and test instructions.

Keep the central demo simple:

1. An organizer creates an aid campaign with an eligibility root.
2. An eligible user submits a private proof and receives a claim receipt.
3. The public claim total increases without revealing the recipient.
4. An ineligible claim fails.
5. A second claim with the same nullifier fails.

## 3. Privacy and trust model

| Data | Treatment | Visibility |
|---|---|---|
| Campaign identifier and description | Public ledger state | Everyone |
| Eligibility-list Merkle root | Public ledger state | Everyone |
| Campaign status and deadline | Public ledger state | Everyone |
| Number of accepted claims | Public ledger state | Everyone |
| Used nullifiers | Deliberately disclosed | Everyone, without recipient identity |
| Recipient identifier | Private input/off-chain data | Recipient and issuer only |
| Eligibility secret | Private witness | Recipient only |
| Merkle membership path and list position | Private witness | Recipient only |
| Personal documents | Never sent to the contract | Issuer only |
| Eligibility membership | Proved in zero knowledge | Verifiable without revealing source data |

### Security rules

- Generate recipient secrets with cryptographically secure randomness. Never use names, phone numbers, short PINs, or other guessable values.
- Domain-separate commitments and nullifiers by campaign ID so activity cannot be linked across campaigns.
- Bind every claim proof to the campaign, eligibility root, contract, and network.
- Reject a nullifier that already exists before changing claim state.
- Require organizer authorization for campaign creation, pausing, closing, and root changes.
- Do not put personal data, eligibility documents, wallet seed phrases, or private witnesses in Git, logs, screenshots, analytics, or error messages.
- Document the issuer-trust assumption: VeilAid proves membership in the issuer's list; it does not independently decide whether the issuer evaluated applicants fairly.
- Treat test wallets listed for program evidence as public test identities and obtain consent before publishing them.

## 4. Target architecture

```text
Eligibility issuer
  -> verifies recipients off-chain
  -> creates recipient commitments
  -> publishes a Merkle root in the VeilAid contract

Recipient browser
  -> stores eligibility secret locally
  -> obtains or reconstructs a private Merkle path
  -> generates a proof through the local proof server
  -> discloses only a campaign-scoped nullifier

Midnight contract
  -> verifies membership against the public root
  -> rejects an already-used nullifier
  -> records the nullifier and increments the public claim count

Public dashboard
  -> displays campaign rules, status, and aggregate claims
  -> never displays recipients or private evidence
```

### Planned repository structure

```text
veilaid/
├── contracts/
│   ├── veilaid.compact
│   └── managed/                 # compiler-generated artifacts
├── src/
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   ├── CampaignCard.tsx
│   │   ├── PrivateClaim.tsx
│   │   └── PrivacyReceipt.tsx
│   ├── hooks/
│   │   └── useMidnight.ts
│   ├── utils/
│   │   ├── contract.ts
│   │   └── commitments.ts
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   └── veilaid.test.ts
├── docs/
│   ├── USAGE.md
│   ├── PRIVACY.md
│   ├── THREAT_MODEL.md
│   ├── FEEDBACK.md
│   └── evidence/
├── .github/workflows/ci.yml
├── PROPOSAL.md
├── USERS.md
├── LAUNCH_USERS.md
├── README.md
└── package.json
```

Generated directories may differ slightly from this diagram. Follow the structure created by the current `create-mn-app` template and update the documentation to match the actual repository.

## 5. Environment setup

### Prerequisites

- Linux or macOS. Use WSL for Windows development.
- Google Chrome and Visual Studio Code.
- Node.js 22 or newer.
- Docker Desktop with Docker Compose v2.
- Git and a GitHub account.
- Lace wallet configured for Midnight when browser integration begins.

### Install and verify Compact

Use the current official installer:

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
```

Restart the terminal or reload the shell configuration, then install the supported compiler and verify it:

```bash
compact update 0.31.1
compact --version
compact compile --version
which compact
```

### Verify Node and Docker

```bash
node --version
docker --version
docker compose version
docker info
```

### Proof server

The current official proof-server image is:

```bash
docker run -p 6300:6300 \
  midnightntwrk/proof-server:8.1.0 \
  midnight-proof-server -v
```

The template may manage the proof server through Docker Compose. Prefer the template's scripts once the project is scaffolded so every contributor runs the same versions.

## 6. Level 1 — New Moon: setup and first contract

**Objective:** prove the core privacy mechanism, deploy it to Preview or Preprod, and create a submission-quality repository. Level 1 has no prize but unlocks the prize track.

### Step 1: scaffold the project

```bash
npx create-mn-app veilaid --template hello-world --use-npm
cd veilaid
```

If the CLI asks questions, select **Contract** and **hello-world**. Preserve the generated deployment and provider code until the baseline works.

### Step 2: run the untouched baseline

```bash
npm run setup
npm run cli
npm run test:e2e
```

Record any generated file paths and script names. Do not customize the template until the baseline compiles, deploys locally, and passes its existing tests.

### Step 3: define the Level 1 contract slice

Implement a small but authentic VeilAid core in `contracts/veilaid.compact`:

- Public campaign identifier.
- Public eligibility commitment or Merkle root.
- Public accepted-claim count.
- Public collection of used campaign-scoped nullifiers.
- Private eligibility secret.
- Private membership evidence.
- A claim circuit that verifies eligibility.
- Deliberate disclosure of only the derived nullifier needed for duplicate prevention.
- Rejection of invalid or reused claims.
- A header comment explaining every public, private, proved, and disclosed value.

If full Merkle membership creates a toolchain blocker at Level 1, use a single high-entropy eligibility commitment for the first submission. Keep the contract interface compatible with replacing that commitment with a Merkle root during Level 3. Do not weaken the privacy claim in the README.

### Step 4: compile

Use the exact compile script generated by the template. The direct compiler form is typically:

```bash
compact compile contracts/veilaid.compact contracts/managed/veilaid
```

Confirm that generated contract code, ZK IR, and proving/verifying keys exist under the managed output directory.

### Step 5: implement tests

Create at least these tests:

1. A valid private eligibility proof succeeds and increments the claim count.
2. Invalid eligibility evidence fails without changing ledger state.
3. Reusing the same nullifier fails without changing ledger state.
4. Private inputs do not appear in contract outputs, public state, logs, thrown messages, or serialized receipts.
5. A nullifier generated for one campaign cannot be replayed in another campaign.

Run the repository's generated test commands and retain the successful output for evidence.

### Step 6: deploy to Preview

The current `create-mn-app` flow uses:

```bash
npm run setup -- --network preview
```

The first run prints a wallet address and faucet URL. Fund the generated test wallet manually, wait for funds to arrive, and resume deployment. Never commit the wallet seed or `.midnight-state.json`.

After deployment:

- Copy the contract address.
- Confirm the active network is Preview.
- Execute one successful claim interaction.
- Execute one rejected duplicate claim.
- Verify that no private input appears in terminal output.

Preprod is preferred once Preview is stable:

```bash
npm run setup -- --network preprod
```

### Step 7: write the Level 1 README

The README must contain:

- Project title and tagline.
- Preview and Preprod contract-address table.
- Plain-English explanation of the product.
- Privacy model listing public, private, proved, and deliberately disclosed data.
- Tech stack.
- Prerequisites.
- Reproducible setup commands.
- Test commands.
- Initial idea statement.
- Screenshots or links to evidence.
- Current limitations and the next-level roadmap.

Use this initial idea statement:

> VeilAid is a privacy-preserving platform for distributing aid, scholarships, grants, and community benefits. An organization publishes a cryptographic commitment representing its approved eligibility list. A recipient proves that they are included without revealing their identity, eligibility secret, or position in the list. The contract records a campaign-scoped nullifier to prevent duplicate claims and maintains a publicly verifiable total of successful claims.

### Step 8: capture evidence

Add sanitized evidence under `docs/evidence/`:

- Successful Compact compilation.
- Passing test output.
- Preview or Preprod contract address.
- Successful eligible claim.
- Rejected invalid claim.
- Rejected duplicate claim.

Inspect every screenshot before committing it. Remove wallet seeds, secrets, private witnesses, access tokens, personal data, and unrelated desktop information.

### Step 9: make meaningful commits

Make at least five commits yourself. Suggested milestones:

1. `chore: scaffold Midnight contract project`
2. `feat: add VeilAid campaign and eligibility state`
3. `feat: verify private claims and prevent nullifier reuse`
4. `test: cover valid invalid and duplicate claims`
5. `docs: document privacy model and Preview deployment`

Do not manufacture empty commits. Each commit should represent a reviewable milestone.

### Level 1 acceptance checklist

- [ ] Node.js 22+ and Docker verified.
- [ ] Compact and compiler versions verified.
- [ ] Baseline template works locally.
- [ ] VeilAid contract compiles.
- [ ] Managed artifacts are present.
- [ ] At least three meaningful tests pass.
- [ ] Invalid and duplicate claims are rejected.
- [ ] Private inputs remain absent from public output and logs.
- [ ] Contract is deployed to Preview or Preprod.
- [ ] Contract address is in `README.md`.
- [ ] README contains every required section.
- [ ] Evidence is sanitized and committed.
- [ ] At least five meaningful commits exist.
- [ ] Public GitHub repository is submitted on Rise In.

## 7. Level 2 — Waxing Crescent: frontend integration

**Objective:** provide a polished browser flow connected to Lace and the deployed contract.

### Work plan

1. Extend the same repository with React and Vite.
2. Add wallet connect and disconnect through the current Midnight DApp Connector API.
3. Detect missing wallet, rejected authorization, wrong network, proof-server failure, insufficient balance, and stale contract address.
4. Build a campaign view showing only public campaign information.
5. Build a private claim form that keeps the eligibility secret and membership path in local state.
6. Generate the proof locally and submit the claim transaction.
7. Display a privacy receipt containing the transaction reference and disclosed nullifier, without private input.
8. Show clear loading stages: preparing input, generating proof, submitting transaction, and confirming.
9. Add the visible statement: **“Eligibility proved without revealing your identity or eligibility secret.”**
10. Deploy the frontend to Vercel or Netlify and point it to the current Preprod contract.

### Demo video, under two minutes

1. Connect Lace and show the shortened test address.
2. Open an active campaign.
3. Submit a valid private claim.
4. Show local proof-generation progress.
5. Show the confirmed transaction and increased public count.
6. Explain which information never left the browser.
7. Attempt a duplicate claim and show rejection.

### Level 2 acceptance checklist

- [ ] Lace connect and disconnect work.
- [ ] Network mismatch and wallet errors are understandable.
- [ ] A contract circuit is called from the frontend.
- [ ] Proof generation happens locally.
- [ ] Private values never appear in the UI, URL, logs, analytics, or transaction output.
- [ ] Preprod contract address is present in README.
- [ ] Live frontend URL is present in README.
- [ ] Privacy Claim section is present.
- [ ] Demo video is recorded.
- [ ] At least eight meaningful commits exist.
- [ ] Repository and live URL are submitted on Rise In.

## 8. Level 3 — First Quarter: production-grade DApp and proposal

**Objective:** make the prototype reliable and submit VeilAid for idea approval at The Turn.

### Contract and test upgrades

1. Replace the single eligibility commitment with an issuer-generated Merkle root if Level 1 used the fallback.
2. Bind nullifiers to campaign IDs.
3. Add organizer authorization.
4. Add campaign pause, close, and deadline behavior.
5. Prevent eligibility-root changes after claims begin, or version roots explicitly.
6. Expand tests for organizer authorization, campaign lifecycle, cross-campaign replay, root changes, malformed proofs, and state invariants.
7. Run a production build with zero errors and no console errors.

### CI/CD

Create `.github/workflows/ci.yml` for pushes to `main` and pull requests:

1. Check out the repository.
2. Install Node.js 22.
3. Install dependencies using the repository lockfile.
4. Install or cache the compatible Compact compiler.
5. Compile the contract.
6. Run unit and integration tests.
7. Build the frontend.
8. Add a working CI badge below the README title.

### Complete `PROPOSAL.md`

Include:

- What VeilAid is and who uses it.
- Why Midnight is essential.
- The complete public/private/disclosed data model.
- Issuer, organizer, recipient, and observer roles.
- Threat model and trust assumptions.
- Mainnet feasibility.
- User-acquisition plan.
- Known limitations and planned mitigations.

### One-minute demo

1. Complete wallet-to-claim flow.
2. Show tests passing.
3. Show the green CI badge.
4. State the privacy claim in one sentence.

### Level 3 acceptance checklist

- [ ] At least three required tests and the expanded security tests pass.
- [ ] CI runs on pushes and pull requests.
- [ ] CI badge is green and visible.
- [ ] Production build has no errors.
- [ ] Preprod address and live demo are current.
- [ ] `PROPOSAL.md` is complete.
- [ ] Privacy model and threat model are documented.
- [ ] One-minute demo is recorded.
- [ ] At least ten meaningful commits exist.
- [ ] Submission is sent and idea approval is received before Level 4 begins.

## 9. Level 4 — Waxing Gibbous: MVP goes live

**Start only after the Level 3 product proposal is approved.**

### MVP features

1. Organizer creates and manages a campaign.
2. Organizer imports a test eligibility list locally and publishes only its root.
3. Recipient imports an eligibility package without sending it to a server.
4. Recipient proves membership and submits one claim.
5. Contract blocks invalid, duplicate, paused, closed, and expired claims.
6. Public dashboard shows rules, status, and aggregate claims.
7. Privacy receipt explains exactly what was disclosed.
8. User-facing errors avoid exposing private values.
9. Mobile flow is usable and accessible.

### Product materials

- Create `docs/USAGE.md` with prerequisites, a numbered user flow, privacy explanation, and troubleshooting.
- Maintain `docs/PRIVACY.md` and `docs/THREAT_MODEL.md`.
- Deploy the contract to Preprod and update every stale address.
- Deploy the frontend and test it from a clean browser profile.
- Create a product X account.
- Publish three posts covering the problem, privacy design, and demo invitation.
- Record the MVP demo.

### Level 4 acceptance checklist

- [ ] Approved idea is implemented.
- [ ] Contract compiles and all tests pass.
- [ ] CI and production build pass.
- [ ] Contract is deployed to Preprod.
- [ ] README contains the exact active contract address.
- [ ] Live frontend uses that address.
- [ ] `docs/USAGE.md` is complete.
- [ ] Product X profile and launch posts exist.
- [ ] MVP demo is recorded.
- [ ] At least fifteen meaningful commits exist.
- [ ] Repository is submitted on Rise In.

## 10. Level 5 — Full Moon: users and feedback

**Objective:** validate the MVP with 50 Preprod users and improve it from real feedback.

### Test campaign

Run a clearly labeled simulation, such as a private community learning-grant campaign. Use test benefits only. Give each consenting tester a unique, high-entropy eligibility package.

### User onboarding

1. Explain that this is a testnet simulation.
2. Help the user install and configure Lace.
3. Help them acquire test tokens and generate DUST where required.
4. Send their private eligibility package through an appropriate private channel.
5. Ask them to complete the claim flow.
6. Confirm the public count increased without exposing their private evidence.
7. Collect structured feedback immediately.

### Evidence and feedback

Create `USERS.md` and `docs/FEEDBACK.md` in the exact format requested by the program. Before publishing full wallet addresses, confirm that the program requires them in a public repository and obtain consent from each tester. Do not associate addresses with real names or sensitive eligibility details.

Capture:

- Whether the claim succeeded.
- Time to complete onboarding.
- Where the user became confused.
- Whether the privacy explanation was understood.
- Error encountered, if any.
- One suggested improvement.

Group feedback into themes, select the top two or three changes by frequency and severity, implement them, and link each change to its commit.

### Level 5 acceptance checklist

- [ ] Fifty consenting Preprod testers completed the flow.
- [ ] Required wallet evidence is documented safely.
- [ ] Raw feedback log is complete.
- [ ] Feedback themes are summarized.
- [ ] Top improvements are implemented and linked to commits.
- [ ] README reports the current validation count.
- [ ] Preprod address and live link remain correct.
- [ ] At least twenty meaningful commits exist.
- [ ] Updated repository is submitted on Rise In.

## 11. Level 6 — Supermoon: launch readiness

**Objective:** incorporate validated improvements, prepare for Mainnet, and demonstrate a credible launch path.

### Final product work

1. Implement the highest-value Level 5 improvements.
2. Add a `Level 6 Improvements` table to `docs/FEEDBACK.md`.
3. Conduct a privacy review and threat-model review.
4. Test every campaign state and negative path.
5. Confirm that contract and frontend package versions match the official compatibility matrix.
6. Redeploy the updated contract to Preprod before any Mainnet action.
7. Update every contract-address reference.
8. Update `docs/USAGE.md` with “Getting Started on Preprod” and “Your First Transaction.”
9. Prepare `LAUNCH_USERS.md` and onboard the required 20 launch users.
10. Create final brand assets, product bio, banner, screenshots, and demo.

### Mainnet gate

Do not deploy merely to satisfy a checkbox. Before Mainnet deployment, confirm:

- Mainnet is supported by the program and current toolchain.
- Organizer keys and deployment keys are backed up securely.
- No test secrets or private evidence are embedded in artifacts.
- Contract packages match Mainnet versions.
- Upgrade and maintenance-authority behavior is understood.
- Threat model and limitations are disclosed.
- No real aid or monetary promise is made without an operating partner and appropriate review.

### Final demo story

1. State the human problem in ten seconds.
2. Show the active contract address and campaign.
3. Show an eligible private claim.
4. Show the public count without a public identity.
5. Show a duplicate claim being rejected.
6. Show evidence from 50 testers and the improvements it produced.
7. Close with the Mainnet path and intended organizational pilot.

### Level 6 acceptance checklist

- [ ] Top feedback improvements are implemented and documented.
- [ ] Full test suite, CI, and production build pass.
- [ ] Updated contract is deployed to the required network.
- [ ] README contains the exact active address and live demo.
- [ ] Usage, privacy, threat-model, and feedback documents are current.
- [ ] Required launch users are documented with consent.
- [ ] Product branding and X profile are complete.
- [ ] Final demo proves privacy end to end.
- [ ] At least thirty meaningful commits exist.
- [ ] Final submission is complete on Rise In.

## 12. Product quality checklist

### UX

- [ ] The home screen explains VeilAid without blockchain jargon.
- [ ] The user knows what remains private before entering anything.
- [ ] Secret fields are masked and never persisted unintentionally.
- [ ] Proof generation shows progress and expected waiting time.
- [ ] Success and failure messages explain what happened.
- [ ] Duplicate claims fail gracefully.
- [ ] Keyboard navigation, focus states, labels, contrast, and mobile layout work.

### Engineering

- [ ] Dependencies are pinned with a committed lockfile.
- [ ] Compact compiler and proof-server versions are documented.
- [ ] Generated artifacts are handled consistently.
- [ ] Environment files and state files are ignored.
- [ ] CI reproduces compile, test, and build steps.
- [ ] Contract addresses are configured once and validated at startup.
- [ ] Production console is free of secrets and noisy errors.

### Privacy

- [ ] Public outputs match the written privacy claim.
- [ ] High-entropy secrets are used.
- [ ] Nullifiers are campaign-scoped.
- [ ] Private data never enters analytics or URLs.
- [ ] Screenshots and videos are sanitized.
- [ ] Issuer trust and metadata leakage are documented.
- [ ] The app does not claim recipient anonymity beyond what its network and wallet model provide.

### Submission

- [ ] Public repository opens without missing submodules or private packages.
- [ ] Setup works from a fresh clone.
- [ ] Live demo works in a clean browser.
- [ ] Contract address is prominent and current.
- [ ] Video is short, narrated, and shows a real transaction.
- [ ] README leads with the problem, solution, and privacy value.
- [ ] Every required level artifact is present.

## 13. Manual actions you must perform

These actions require your account, wallet, physical review, or interaction with real users:

- Fund Preview and Preprod test wallets through the official faucet.
- Protect wallet seeds and organizer keys.
- Create the GitHub repository and review every commit.
- Make meaningful commits after each verified milestone.
- Inspect and add sanitized screenshots.
- Record and publish demo videos.
- Deploy the frontend through your hosting account.
- Create and operate the product X profile.
- Submit each level on Rise In.
- Complete `PROPOSAL.md` in your own voice.
- Recruit testers, obtain consent, and collect authentic feedback.
- Wait for Level 3 idea approval before starting the Level 4 submission.
- Confirm Mainnet eligibility and deployment requirements with program organizers.

## 14. Immediate execution order

1. Confirm Node.js, Docker, and Compact versions.
2. Scaffold the current Hello World contract template.
3. Run the untouched template locally.
4. Create the VeilAid privacy model and threat model.
5. Implement the smallest valid claim contract.
6. Compile and test locally.
7. Deploy to Preview and execute positive and negative claim flows.
8. Complete README and evidence.
9. Review the repository for secrets.
10. Make the five Level 1 milestone commits.
11. Push to a public GitHub repository.
12. Submit Level 1 on Rise In.

## 15. Sources of truth

- Rise In program: <https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight>
- Supplied challenge task document: <https://docs.google.com/document/d/17DWYHc7q_e_qFfe0JeszqIMpSAf2S0cMwbPVOpPs4BU/edit>
- Midnight documentation: <https://docs.midnight.network/>
- Current installation guide: <https://docs.midnight.network/getting-started/installation>
- Current DApp scaffolding guide: <https://docs.midnight.network/getting-started/quickstart>
- Current Hello World guide: <https://docs.midnight.network/getting-started/hello-world>
- Compatibility matrix: <https://docs.midnight.network/relnotes/support-matrix>

When the supplied challenge document and official technical documentation disagree, preserve the challenge deliverable but use the compatible commands and versions from the current official Midnight documentation.
