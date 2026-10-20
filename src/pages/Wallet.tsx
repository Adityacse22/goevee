/** Wallet stub in the shell. */
import { formatINR } from '@/lib/format';
import { t } from '@/lib/messages';

export default function Wallet() {
  return (
    <main id="main-content" tabIndex={-1} className="ge-main outline-none">
      <div className="ge-container max-w-xl">
        <header className="ge-page-head">
          <h1 className="ge-page-title">{t.pages.walletTitle}</h1>
          <p className="ge-page-lead">{t.pages.walletIntro}</p>
        </header>
        <section className="ge-panel" aria-labelledby="wallet-balance">
          <h2 id="wallet-balance" className="text-sm font-semibold text-ink-600">{t.pages.walletBalance}</h2>
          <p className="ge-money mt-1">{formatINR(0)}</p>
        </section>
      </div>
    </main>
  );
}
