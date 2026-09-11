import type { MidnightWalletState } from '../hooks/useMidnight';

interface WalletConnectProps {
  wallet: MidnightWalletState;
}

export function WalletConnect({ wallet }: WalletConnectProps) {
  const connected = wallet.status === 'connected' && wallet.address;

  return (
    <section className="wallet-card" aria-labelledby="wallet-title">
      <div className="section-heading">
        <span className={`status-dot ${connected ? 'is-live' : ''}`} aria-hidden="true" />
        <div>
          <p className="eyebrow">Wallet</p>
          <h2 id="wallet-title">{connected ? `${wallet.walletName ?? 'Lace'} connected` : 'Connect Midnight Lace'}</h2>
        </div>
      </div>

      {connected ? (
        <>
          <p className="wallet-address" aria-label="Connected wallet address">{wallet.address}</p>
          <div className="wallet-meta">
            <span>{wallet.networkId}</span>
            <span>Connector API 4.x</span>
          </div>
          <button className="button secondary" type="button" onClick={wallet.disconnect}>
            Disconnect
          </button>
        </>
      ) : (
        <>
          <p className="muted">Approve the connection in Lace to sign and submit your private claim.</p>
          <button
            className="button primary"
            type="button"
            onClick={() => void wallet.connect()}
            disabled={wallet.status === 'connecting'}
          >
            {wallet.status === 'connecting' ? 'Waiting for Lace…' : 'Connect Lace'}
          </button>
          {!wallet.available && wallet.status === 'disconnected' && (
            <p className="hint">Lace is not detected yet. Install or unlock the Midnight extension, then reload.</p>
          )}
        </>
      )}

      {wallet.error && <p className="error-message" role="alert">{wallet.error}</p>}
    </section>
  );
}
