import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const assetLinksJson = JSON.stringify(
  [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.aistudio.animetrix.vxrpl',
        sha256_cert_fingerprints: [
          'FA:BF:CC:19:AC:AD:E5:05:FA:3F:EB:FB:B9:04:40:10:67:17:E2:47:D9:18:C4:93:0A:42:D1:1E:9A:AC:61:4B',
        ],
      },
    },
  ],
  null,
  2
);

function assetLinksPlugin() {
  const handler = (req: any, res: any, next: any) => {
    if (req.url && (req.url === '/.well-known/assetlinks.json' || req.url.startsWith('/.well-known/assetlinks.json?'))) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.statusCode = 200;
      res.end(assetLinksJson);
      return;
    }
    next();
  };

  return {
    name: 'asset-links-plugin',
    configureServer(server: any) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), assetLinksPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      allowedHosts: ['anime-trix-5.onrender.com', '.onrender.com'],
    },
  };
});
