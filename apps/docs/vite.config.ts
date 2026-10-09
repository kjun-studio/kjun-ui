import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig, type ViteDevServer } from 'vite';

const workerConfig = {
  // Cloudflare Workers deployment: `wrangler deploy --config dist/server/wrangler.json`.
  name: 'kjun-ui-docs',
  routes: [{ pattern: 'ui.kjun.dev', custom_domain: true }],
  // Serve only on the custom domain, not on workers.dev or preview URLs.
  workers_dev: false,
  preview_urls: false,
  // worker.ts wraps vinext's fetch handler to add security headers.
  main: './worker.ts',
  compatibility_flags: ['nodejs_compat'],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    // Preview frames must report ready within this limit. Test builds (scripts/docs-test.mjs) raise it
    // so long serial runs do not mark a slow but healthy frame as failed.
    define: { __KJUN_PREVIEW_READY_MS__: JSON.stringify(Number(process.env.KJUN_PREVIEW_READY_MS) || 15000) },
    // Shared documentation definitions resolve through this app's packed dependencies.
    resolve: {
      dedupe: ['@kjun-ui/react', '@kjun-ui/tokens', '@kjun-ui/icons'],
      // JSON imports here use explicit extensions and Vite's JSON loader. Keep
      // large retained records out of the CommonJS plugin's recursive scanner.
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx'],
    },
    css: { postcss: { plugins: [tailwindcss()] } },
    server: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
      // Tailnet devices reach the dev server by MagicDNS name (*.ts.net), which Vite blocks by default.
      allowedHosts: ['.ts.net'],
      // Avoid continuous file polling across the Docker bind mount. Restart after source changes.
      watch: null,
      hmr: false,
    },
    plugins: [
      {
        name: 'kjun:gallery-route',
        apply: 'serve',
        enforce: 'pre',
        configureServer(server: ViteDevServer) {
          server.middlewares.use((request, _response, next) => {
            const isNavigation = !request.headers['sec-fetch-dest'] &&
              request.headers.accept?.includes('text/html');
            const isRsc = request.headers.rsc === '1';
            if (request.url?.split('?')[0] === '/components' &&
              (request.method === 'GET' || request.method === 'HEAD') &&
              (isNavigation || isRsc)) {
              // Keep gallery navigation in Vinext, including requests without Fetch Metadata.
              // Skip its module transform for HTTP navigation and RSC refreshes;
              // Vinext still uses the RSC header to choose its response format.
              request.headers['sec-fetch-dest'] = 'document';
            }
            next();
          });
        },
      },
      vinext(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: workerConfig,
      }),
    ],
  };
});
