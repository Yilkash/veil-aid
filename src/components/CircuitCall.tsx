import { useRef, useState, type ChangeEvent } from 'react';
import type { MidnightWalletState } from '../hooks/useMidnight';
import { useVeilAid, type ClaimStage } from '../hooks/useVeilAid';
import { readEligibilityCredential } from '../lib/credential';

interface CircuitCallProps {
  wallet: MidnightWalletState;
  contractAddress: string;
}

const progress: Array<{ stage: ClaimStage; label: string }> = [
  { stage: 'preparing', label: 'Preparing private input' },
  { stage: 'proving', label: 'Generating proof locally' },
  { stage: 'submitting', label: 'Submitting transaction' },
  { stage: 'confirming', label: 'Confirming on Preprod' },
];

export function CircuitCall({ wallet, contractAddress }: CircuitCallProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const veilAid = useVeilAid(wallet, contractAddress);
  const busy = ['preparing', 'proving', 'submitting', 'confirming'].includes(veilAid.stage);

  const loadCredential = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setCredentialError(null);
    try {
      const state = await readEligibilityCredential(file, wallet.networkId, contractAddress);
      veilAid.setCredential(state);
    } catch (cause) {
      setCredentialError(cause instanceof Error ? cause.message : 'The credential could not be read.');
    }
  };

  return (
    <section className="claim-card" aria-labelledby="claim-title">
      <div className="section-heading">
        <span className="step-number">02</span>
        <div>
          <p className="eyebrow">Private claim</p>
          <h2 id="claim-title">Prove eligibility</h2>
        </div>
      </div>

      <div className="privacy-seal">
        <span aria-hidden="true">✦</span>
        <strong>Proved without revealing your input</strong>
        <p>Eligibility proved without revealing your identity or eligibility secret.</p>
      </div>

      <div className="credential-row">
        <div>
          <span className={`credential-state ${veilAid.credential ? 'ready' : ''}`}>
            {veilAid.credential ? 'Private credential ready' : 'Credential required'}
          </span>
          <p>Your credential is read into this session only. Its contents never appear on screen.</p>
        </div>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={(event) => void loadCredential(event)}
          tabIndex={-1}
        />
        {veilAid.credential ? (
          <button className="text-button" type="button" onClick={veilAid.clearCredential}>Remove</button>
        ) : (
          <button className="button secondary compact" type="button" onClick={() => inputRef.current?.click()}>
            Select credential
          </button>
        )}
      </div>

      {(credentialError || veilAid.error) && (
        <p className="error-message" role="alert">{credentialError ?? veilAid.error}</p>
      )}

      {busy && (
        <ol className="proof-progress" aria-label="Claim progress">
          {progress.map((item) => {
            const activeIndex = progress.findIndex((entry) => entry.stage === veilAid.stage);
            const index = progress.findIndex((entry) => entry.stage === item.stage);
            return (
              <li key={item.stage} className={index < activeIndex ? 'complete' : index === activeIndex ? 'active' : ''}>
                <span aria-hidden="true" />{item.label}
              </li>
            );
          })}
        </ol>
      )}

      {veilAid.receipt && (
        <div className="receipt" role="status">
          <p className="eyebrow">Claim confirmed</p>
          <h3>Your private proof is on-chain.</h3>
          <dl>
            <div><dt>Transaction</dt><dd>{veilAid.receipt.transactionId}</dd></div>
            <div><dt>Block</dt><dd>{veilAid.receipt.blockHeight}</dd></div>
          </dl>
        </div>
      )}

      <button
        className="button primary claim-button"
        type="button"
        disabled={!wallet.connectedAPI || !veilAid.credential || !contractAddress || busy || veilAid.stage === 'confirmed'}
        onClick={() => void veilAid.claim()}
      >
        {busy ? 'Creating private proof…' : veilAid.stage === 'confirmed' ? 'Claim confirmed' : 'Prove & claim aid'}
      </button>

      <div className="campaign-stat" aria-live="polite">
        <span>Public campaign total</span>
        <strong>{veilAid.campaign ? veilAid.campaign.successfulClaims.toString() : '—'}</strong>
        <small>{veilAid.campaign?.claimRecorded ? 'Eligibility claimed' : 'Awaiting a verified claim'}</small>
      </div>
    </section>
  );
}
