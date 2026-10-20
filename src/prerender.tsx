/**
 * Build-time render of the Explore screen's first frame (header, hero, search,
 * chips and loading skeletons). Injected into dist/index.html so the hero paints
 * before the JS bundle arrives; the client then mounts fresh with createRoot.
 * Built with `vite build --ssr`, run by scripts/prerender-home.mjs.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/controllers/useAuth';
import ShellLayout from '@/components/shell/ShellLayout';
import Explore from '@/pages/Explore';

export function render(url: string): string {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } });
  return renderToString(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <StaticRouter location={url}>
          <ShellLayout>
            <Explore />
          </ShellLayout>
        </StaticRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
