import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

const HARDCODED_PACKAGE_NAME = 'com.aistudio.animetrix.vxrpl';
const PRIMARY_SHA256 =
  'FF:29:28:7D:06:E1:02:B5:05:80:D5:D1:85:62:BA:3B:E5:84:D2:9C:1E:F1:AF:60:17:8F:03:D1:BD:F4:E6:59';
const FIRESTORE_ENDPOINT =
  'https://firestore.googleapis.com/v1/projects/anime-trix-734fa/databases/(default)/documents/appConfig/appLinks';

// In-memory cache for dynamic Firestore assetlinks
let cachedAssetLinksJson: string = '';
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

async function getMergedAssetLinks(): Promise<string> {
  const now = Date.now();
  if (cachedAssetLinksJson && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedAssetLinksJson;
  }

  const fingerprints = new Set<string>();
  fingerprints.add(PRIMARY_SHA256);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(FIRESTORE_ENDPOINT, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data: any = await response.json();
      const fields = data?.fields || {};

      // 1. Merge primarySha256 if present
      if (fields?.primarySha256?.stringValue) {
        const val = fields.primarySha256.stringValue.trim();
        if (val) fingerprints.add(val);
      }

      // 2. Merge sha256Fingerprints array values
      const arrayValues = fields?.sha256Fingerprints?.arrayValue?.values;
      if (Array.isArray(arrayValues)) {
        for (const item of arrayValues) {
          if (item?.stringValue) {
            const val = item.stringValue.trim();
            if (val) fingerprints.add(val);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch appLinks from Firestore REST, using fallback fingerprints:', err);
  }

  const assetLinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: HARDCODED_PACKAGE_NAME,
        sha256_cert_fingerprints: Array.from(fingerprints),
      },
    },
  ];

  cachedAssetLinksJson = JSON.stringify(assetLinks, null, 2);
  lastFetchTime = now;
  return cachedAssetLinksJson;
}

function dynamicAssetLinksPlugin() {
  const handler = async (req: any, res: any, next: any) => {
    const pathname = (req.url || '').split('?')[0];
    if (
      pathname === '/.well-known/assetlinks.json' ||
      pathname === '/.well-known/assetlinks.json/'
    ) {
      try {
        const jsonOutput = await getMergedAssetLinks();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.statusCode = 200;
        res.end(jsonOutput);
        return;
      } catch (e) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.statusCode = 200;
        res.end(
          JSON.stringify(
            [
              {
                relation: ['delegate_permission/common.handle_all_urls'],
                target: {
                  namespace: 'android_app',
                  package_name: HARDCODED_PACKAGE_NAME,
                  sha256_cert_fingerprints: [PRIMARY_SHA256],
                },
              },
            ],
            null,
            2
          )
        );
        return;
      }
    }
    next();
  };

  return {
    name: 'dynamic-asset-links-plugin',
    configureServer(server: any) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handler);
    },
  };
}

function apkDownloadPlugin() {
  const handler = (req: any, res: any, next: any) => {
    const rawUrl = decodeURIComponent(req.url || '').split('?')[0];
    if (rawUrl.endsWith('.apk') || rawUrl.includes('/AnimeTrix')) {
      const candidates = [
        path.resolve(__dirname, 'public/AnimeTrix (10).apk'),
        path.resolve(__dirname, 'public/AnimeTrix.apk'),
        path.resolve(__dirname, 'public/AnimeTrix (18).apk'),
        path.resolve(__dirname, 'dist/AnimeTrix (10).apk'),
        path.resolve(__dirname, 'dist/AnimeTrix.apk'),
      ];
      const foundPath = candidates.find((p) => fs.existsSync(p) && fs.statSync(p).size > 100000);
      if (foundPath) {
        const stat = fs.statSync(foundPath);
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', 'attachment; filename="AnimeTrix (10).apk"');
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.statusCode = 200;
        fs.createReadStream(foundPath).pipe(res);
        return;
      }
    }
    next();
  };

  return {
    name: 'apk-download-plugin',
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
    plugins: [react(), tailwindcss(), dynamicAssetLinksPlugin(), apkDownloadPlugin()],
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
      allowedHosts: ['animetrix-nwaz.onrender.com', 'anime-trix-5.onrender.com', '.onrender.com'],
    },
  };
});
