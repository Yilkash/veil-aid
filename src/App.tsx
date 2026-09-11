import { CircuitCall } from './components/CircuitCall';
import { WalletConnect } from './components/WalletConnect';
import { useMidnight } from './hooks/useMidnight';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS?.trim() ?? '';

function ShieldMark() {
  return (
    <svg viewBox="0 0 40 46" role="img" aria-label="VeilAid shield">
      <path d="M20 1.8 37 8v12.2c0 11-6.9 19.6-17 24C9.9 39.8 3 31.2 3 20.2V8l17-6.2Z" fill="currentColor" />
      <path d="m13.7 22.3 4.2 4.3 8.8-9.4" fill="none" stroke="#f4f0e8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
    </svg>
  );
}

export default function App() {
  const wallet = useMidnight();

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="VeilAid home">
          <ShieldMark />
          <span>VEIL<strong>AID</strong></span>
        </a>
        <div className="network-badge"><span /> Midnight {wallet.networkId}</div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="kicker">Private eligibility · Public accountability</p>
            <h1>Receive support.<br /><em>Keep your story private.</em></h1>
            <p className="lede">
              Prove you qualify for aid without exposing who you are or why you need it.
              One private proof. One auditable claim.
            </p>
            <div className="trust-row">
              <span><b>01</b> Connect Lace</span>
              <i />
              <span><b>02</b> Prove privately</span>
              <i />
              <span><b>03</b> Claim once</span>
            </div>
          </div>
          <aside className="hero-note">
            <span className="note-icon">◒</span>
            <p>Built on Midnight</p>
            <strong>Your eligibility data stays off-chain.</strong>
          </aside>
        </section>

        {!contractAddress && (
          <div className="configuration-alert" role="alert">
            <strong>Preprod deployment pending.</strong>
            Set <code>VITE_CONTRACT_ADDRESS</code> after deploying the contract to enable claims.
          </div>
        )}

        <section className="claim-layout" aria-label="Claim flow">
          <div className="left-column">
            <div className="step-label"><span>01</span> Start here</div>
            <WalletConnect wallet={wallet} />

            <article className="campaign-card">
              <div className="campaign-topline">
                <span className="campaign-status"><i /> Active campaign</span>
                <span>Community relief · 2026</span>
              </div>
              <h2>Essential support fund</h2>
              <p>Private, one-time eligibility verification for approved recipients.</p>
              <dl>
                <div><dt>Network</dt><dd>{wallet.networkId}</dd></div>
                <div><dt>Proof</dt><dd>Zero knowledge</dd></div>
                <div><dt>Claims</dt><dd>One per credential</dd></div>
              </dl>
              <div className="contract-line">
                <span>Contract</span>
                <code>{contractAddress || 'Waiting for Preprod address'}</code>
              </div>
            </article>
          </div>

          <CircuitCall wallet={wallet} contractAddress={contractAddress} />
        </section>

        <section className="privacy-boundary" aria-labelledby="privacy-title">
          <div>
            <p className="eyebrow">The privacy boundary</p>
            <h2 id="privacy-title">Auditable where it matters.<br />Invisible where it doesn’t.</h2>
          </div>
          <div className="boundary-grid">
            <article>
              <span className="boundary-icon private">●</span>
              <p className="eyebrow">Stays on your device</p>
              <h3>Your private evidence</h3>
              <p>Identity and eligibility secret are used by the witness and never written to the ledger.</p>
            </article>
            <div className="boundary-arrow" aria-hidden="true">→</div>
            <article>
              <span className="boundary-icon public">✓</span>
              <p className="eyebrow">Visible on Midnight</p>
              <h3>Only the proof result</h3>
              <p>A claim count, one-time marker, and transaction reference provide public accountability.</p>
            </article>
          </div>
        </section>
      </main>

      <footer>
        <span>VeilAid · Privacy-first aid distribution</span>
        <span>Powered by Midnight Network</span>
      </footer>
    </div>
  );
}
