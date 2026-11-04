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

function securityHeadersPlugin() {
  return {
    name: 'security-headers-plugin',
    configureServer(server: any) {
      server.middlewares.use((_req: any, res: any, next: any) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
      });
    },
    configurePreviewServer(server: any) {
      server.middlewares.use((_req: any, res: any, next: any) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
      });
    },
  };
}

function authActionSpaFallbackPlugin() {
  const handler = (req: any, _res: any, next: any) => {
    const rawUrl = (req.url || '').split('?')[0];
    if (
      rawUrl === '/__/auth/action' ||
      rawUrl === '/__/auth/action/' ||
      rawUrl === '/reset-password' ||
      rawUrl === '/reset-password/'
    ) {
      const queryPart = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      req.url = '/index.html' + queryPart;
    }
    next();
  };

  return {
    name: 'auth-action-spa-fallback-plugin',
    configureServer(server: any) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handler);
    },
  };
}

function apiAuthMiddlewarePlugin() {
  const handler = async (req: any, res: any, next: any) => {
    const rawUrl = (req.url || '').split('?')[0];
    if (
      req.method === 'POST' &&
      (rawUrl === '/api/auth/forgot-password' || rawUrl === '/api/forgot-password')
    ) {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const email = (parsed.email || '').trim();
          const lang = parsed.lang || 'bn';

          if (!email || !email.includes('@')) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: 'Please provide a valid email address.' }));
            return;
          }

          const { getApps, initializeApp, cert } = await import('firebase-admin/app');
          const { getAuth } = await import('firebase-admin/auth');

          let rawSa = (
            process.env.FIREBASE_SERVICE_ACCOUNT ||
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
            ''
          ).trim();

          if (
            (rawSa.startsWith("'") && rawSa.endsWith("'")) ||
            (rawSa.startsWith('"') && rawSa.endsWith('"'))
          ) {
            rawSa = rawSa.slice(1, -1).trim();
          }

          let adminApp = getApps()[0];
          if (!adminApp && rawSa) {
            let sa = rawSa.startsWith('{')
              ? JSON.parse(rawSa)
              : JSON.parse(Buffer.from(rawSa, 'base64').toString('utf-8'));
            if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
            adminApp = initializeApp({ credential: cert(sa) });
          }

          if (!adminApp) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                ok: false,
                error: 'Firebase Admin not configured on server (FIREBASE_SERVICE_ACCOUNT missing).',
              })
            );
            return;
          }

          const link = await getAuth(adminApp).generatePasswordResetLink(email);
          const oobCode = new URL(link).searchParams.get('oobCode') || '';
          const resetUrl = `https://animetrix-nwaz.onrender.com/reset-password?mode=resetPassword&oobCode=${encodeURIComponent(
            oobCode
          )}&email=${encodeURIComponent(email)}&lang=${encodeURIComponent(lang)}`;

          const brevoKey = (process.env.BREVO_API_KEY || '').trim();
          const senderEmail =
            (process.env.BREVO_SENDER_EMAIL || '').trim() ||
            'support@animetrix-nwaz.onrender.com';

          if (!brevoKey) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                ok: false,
                error: 'BREVO_API_KEY is missing on server.',
                ...(process.env.NODE_ENV !== 'production' ? { devResetUrl: resetUrl } : {}),
              })
            );
            return;
          }

          const htmlContent = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:28px;border:1px solid #eee;border-radius:16px;background:#fff;text-align:center;"><h2 style="color:#111;margin-bottom:6px;">Anime <span style="color:#E50914;">Trix</span></h2><p style="color:#555;font-size:14px;">Password reset request for <b>${email}</b></p><a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#E50914;color:#fff;text-decoration:none;font-weight:bold;border-radius:10px;font-size:15px;">Reset Password</a><p style="color:#888;font-size:12px;">Tap the button above on your Android phone to set your new password directly inside the Anime Trix app.</p></div>`;

          const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              'api-key': brevoKey,
            },
            body: JSON.stringify({
              sender: { name: 'Anime Trix', email: senderEmail },
              to: [{ email }],
              subject: 'Anime Trix - Reset Your Password',
              htmlContent,
            }),
          });

          if (!brevoRes.ok) {
            const errTxt = await brevoRes.text();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: errTxt }));
            return;
          }

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, success: true }));
        } catch (e: any) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: e?.message || 'Server error' }));
        }
      });
      return;
    }
    next();
  };

  return {
    name: 'api-auth-middleware-plugin',
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
    plugins: [
      react(),
      tailwindcss(),
      apiAuthMiddlewarePlugin(),
      dynamicAssetLinksPlugin(),
      apkDownloadPlugin(),
      securityHeadersPlugin(),
      authActionSpaFallbackPlugin(),
    ],
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
