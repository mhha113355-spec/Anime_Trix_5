import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

// ==========================================
// 1. Firebase Admin SDK Safe Initialization
// ==========================================
let firebaseAdminApp: App | null = null;

function getFirebaseAdmin(): App | null {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseAdminApp = existingApps[0]!;
    return firebaseAdminApp;
  }

  const rawSa =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_CONFIG ||
    '';

  if (!rawSa) {
    console.warn('[Firebase Admin] Notice: FIREBASE_SERVICE_ACCOUNT is not set in environment.');
    return null;
  }

  try {
    let serviceAccount: any;
    const trimmed = rawSa.trim();

    if (trimmed.startsWith('{')) {
      serviceAccount = JSON.parse(trimmed);
    } else {
      // Check if base64 encoded
      try {
        const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decoded);
      } catch {
        serviceAccount = JSON.parse(trimmed);
      }
    }

    if (serviceAccount && typeof serviceAccount.private_key === 'string') {
      // Handle escaped \n in private_key
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    firebaseAdminApp = initializeApp({
      credential: cert(serviceAccount),
    });

    console.log(
      `[Firebase Admin] Initialized successfully for project: ${serviceAccount.project_id || 'custom'}`
    );
    return firebaseAdminApp;
  } catch (err) {
    console.error('[Firebase Admin] Error initializing SDK:', err);
    return null;
  }
}

// Pre-initialize if credentials exist
getFirebaseAdmin();

// ==========================================
// 2. Android App Links & Constants
// ==========================================
const HARDCODED_PACKAGE_NAME = 'com.aistudio.animetrix.vxrpl';
const PRIMARY_SHA256 =
  'FF:29:28:7D:06:E1:02:B5:05:80:D5:D1:85:62:BA:3B:E5:84:D2:9C:1E:F1:AF:60:17:8F:03:D1:BD:F4:E6:59';
const FIRESTORE_ENDPOINT =
  'https://firestore.googleapis.com/v1/projects/anime-trix-734fa/databases/(default)/documents/appConfig/appLinks';

let cachedAssetLinksJson = '';
let lastAssetLinksFetch = 0;
const CACHE_TTL_MS = 60 * 1000;

async function getMergedAssetLinks(): Promise<string> {
  const now = Date.now();
  if (cachedAssetLinksJson && now - lastAssetLinksFetch < CACHE_TTL_MS) {
    return cachedAssetLinksJson;
  }

  const fingerprints = new Set<string>();
  fingerprints.add(PRIMARY_SHA256);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(FIRESTORE_ENDPOINT, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data: any = await response.json();
      const fields = data?.fields || {};

      if (fields?.primarySha256?.stringValue) {
        const val = fields.primarySha256.stringValue.trim();
        if (val) fingerprints.add(val);
      }

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
    console.warn('Could not fetch appLinks from Firestore REST, using fallback:', err);
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
  lastAssetLinksFetch = now;
  return cachedAssetLinksJson;
}

// ==========================================
// 3. Branded HTML Email Template for Brevo
// ==========================================
function buildBrandedResetEmailHtml(params: {
  email: string;
  resetUrl: string;
  lang: string;
}): string {
  const isBengali = params.lang === 'bn' || params.lang.startsWith('bn');
  const email = params.email;
  const resetUrl = params.resetUrl;

  const title = isBengali
    ? 'অ্যাকাউন্ট পাসওয়ার্ড রিসেট করুন'
    : 'Reset Your Account Password';

  const introText = isBengali
    ? 'আপনার Anime Trix অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তনের একটি অনুরোধ পাওয়া গেছে। নিচে দেওয়া বাটনে চাপ দিয়ে আপনার নতুন পাসওয়ার্ড সেট করুন:'
    : 'We received a request to reset your Anime Trix account password. Click the button below to choose a new secure password:';

  const emailLabel = isBengali ? 'অ্যাকাউন্ট ইমেইল' : 'Account Email';
  const buttonText = isBengali
    ? 'পাসওয়ার্ড রিসেট করুন / Reset Password'
    : 'Reset Password';

  const appNoticeTitle = isBengali
    ? '📱 Android অ্যাপ ইউজারদের জন্য:'
    : '📱 For Android App Users:';

  const appNoticeText = isBengali
    ? 'আপনার ডিভাইসে Anime Trix Android App ইনস্টল করা থাকলে উপরের বাটনে চাপ দিলে সরাসরি Anime Trix অ্যাপে পাসওয়ার্ড রিসেট স্ক্রিন ওপেন হবে।'
    : 'If you have the Anime Trix Android App installed, tapping the button above will launch directly into the app reset screen.';

  const expiryNotice = isBengali
    ? 'এই লিংকটি ১ ঘণ্টার জন্য কার্যকর থাকবে। আপনি যদি এই অনুরোধ না করে থাকেন, তবে নিরাপদেই এটি উপেক্ষা করতে পারেন। কোনো পাসওয়ার্ড পরিবর্তন হবে না।'
    : 'This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.';

  const directLinkHint = isBengali
    ? 'বাটনে কোনো সমস্যা হলে নিচের লিংকটি সরাসরি ব্রাউজারে পেস্ট করুন:'
    : 'If the button does not work, copy and paste this link into your browser:';

  return `<!DOCTYPE html>
<html lang="${isBengali ? 'bn' : 'en'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0d1117; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.1);">
          
          <!-- Red Accent Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #180004 0%, #450a0a 50%, #E50914 100%); padding: 32px 24px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <!-- Brand Icon Badge -->
                    <div style="display: inline-block; background: #ffffff; padding: 10px; border-radius: 18px; box-shadow: 0 8px 20px rgba(0,0,0,0.25);">
                      <img src="https://animetrix-nwaz.onrender.com/logo.png" alt="Anime Trix" width="56" height="56" style="display: block; border-radius: 12px; border: 0;" />
                    </div>
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 14px 0 2px 0; letter-spacing: -0.5px;">
                      Anime Trix
                    </h1>
                    <p style="color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                      Official Security Hub
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; text-align: center;">
                ${title}
              </h2>
              
              <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0; text-align: center; line-height: 1.6;">
                ${introText}
              </p>

              <!-- Account Email Pill -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 16px; text-align: center;">
                    <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 2px;">
                      ${emailLabel}
                    </span>
                    <span style="display: block; font-size: 15px; font-weight: 800; color: #0f172a; font-family: monospace;">
                      ${email}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Big Red CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #E50914 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 15px 36px; border-radius: 50px; box-shadow: 0 8px 24px rgba(229, 9, 20, 0.4); text-align: center; letter-spacing: 0.2px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Android App Deep-Link Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0 24px 0;">
                <tr>
                  <td style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 14px; padding: 14px 18px;">
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #9f1239;">
                      ${appNoticeTitle}
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #be123c; line-height: 1.5;">
                      ${appNoticeText}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Expiry Security Notice -->
              <p style="font-size: 12px; color: #64748b; margin: 0 0 16px 0; text-align: center; line-height: 1.5;">
                ⏱️ ${expiryNotice}
              </p>

              <!-- Direct Link Fallback -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0 0 6px 0;">
                  ${directLinkHint}
                </p>
                <p style="font-size: 11px; word-break: break-all; margin: 0; color: #64748b; font-family: monospace;">
                  <a href="${resetUrl}" style="color: #E50914; text-decoration: underline;">
                    ${resetUrl}
                  </a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Card Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; color: #64748b;">
                © Anime Trix. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                <a href="https://animetrix-nwaz.onrender.com/privacy" style="color: #64748b; text-decoration: underline;">Privacy Policy</a> • 
                <a href="https://animetrix-nwaz.onrender.com/terms" style="color: #64748b; text-decoration: underline;">Terms of Service</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ==========================================
// 4. Express Server & Route Definitions
// ==========================================
async function startServer() {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Global security & CORS headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // ------------------------------------------
  // Route: /.well-known/assetlinks.json
  // ------------------------------------------
  app.get(
    ['/.well-known/assetlinks.json', '/.well-known/assetlinks.json/'],
    async (_req: Request, res: Response) => {
      try {
        const json = await getMergedAssetLinks();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.status(200).send(json);
      } catch (err) {
        console.error('Error serving assetlinks.json:', err);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json([
          {
            relation: ['delegate_permission/common.handle_all_urls'],
            target: {
              namespace: 'android_app',
              package_name: HARDCODED_PACKAGE_NAME,
              sha256_cert_fingerprints: [PRIMARY_SHA256],
            },
          },
        ]);
      }
    }
  );

  // ------------------------------------------
  // Route: APK Downloads handler
  // ------------------------------------------
  app.get(['/*.apk', '/AnimeTrix*.apk'], (req: Request, res: Response, next: NextFunction) => {
    const rawUrl = decodeURIComponent(req.path);
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
        return fs.createReadStream(foundPath).pipe(res);
      }
    }
    next();
  });

  // ------------------------------------------
  // Route: POST /api/auth/forgot-password
  // ------------------------------------------
  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email, lang } = req.body || {};

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({
          ok: false,
          error: 'Please provide a valid email address.',
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      const userLang = (lang || 'bn').toString().trim();

      const adminApp = getFirebaseAdmin();
      if (!adminApp) {
        console.error('[Forgot Password] FIREBASE_SERVICE_ACCOUNT is missing or invalid.');
        return res.status(500).json({
          ok: false,
          error: 'Firebase Admin is not configured on this server. Please set FIREBASE_SERVICE_ACCOUNT in your environment.',
        });
      }

      // Step A: Generate Firebase Password Reset Link
      let firebaseLink = '';
      try {
        firebaseLink = await getAuth(adminApp).generatePasswordResetLink(cleanEmail, {
          url: 'https://animetrix-nwaz.onrender.com/login',
          handleCodeInApp: true,
        });
      } catch (authError: any) {
        console.warn(`[Firebase Auth] Error generating link for ${cleanEmail}:`, authError?.code);

        if (authError?.code === 'auth/user-not-found') {
          return res.status(404).json({
            ok: false,
            error: 'No Anime Trix account found with this email address.',
          });
        }

        if (authError?.code === 'auth/invalid-email') {
          return res.status(400).json({
            ok: false,
            error: 'The email address format is invalid.',
          });
        }

        return res.status(400).json({
          ok: false,
          error: authError?.message || 'Failed to generate password reset link.',
        });
      }

      // Step B: Extract oobCode from the Firebase generated link
      const parsedUrl = new URL(firebaseLink);
      const oobCode = parsedUrl.searchParams.get('oobCode') || '';

      if (!oobCode) {
        return res.status(500).json({
          ok: false,
          error: 'Failed to extract verification code from Firebase link.',
        });
      }

      // Step C: Build branded resetUrl with app deep-link parameters
      const resetUrl = `https://animetrix-nwaz.onrender.com/reset-password?mode=resetPassword&oobCode=${encodeURIComponent(oobCode)}&email=${encodeURIComponent(cleanEmail)}&lang=${encodeURIComponent(userLang)}`;

      // Step D: Send branded HTML email via Brevo REST API
      const brevoApiKey = process.env.BREVO_API_KEY;
      const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || 'support@animetrix-nwaz.onrender.com';

      if (!brevoApiKey) {
        console.warn('[Brevo] BREVO_API_KEY is not set. Reset URL generated:', resetUrl);
        return res.status(500).json({
          ok: false,
          error: 'Email delivery service is not configured (BREVO_API_KEY is missing).',
          ...(process.env.NODE_ENV !== 'production' ? { devResetUrl: resetUrl } : {}),
        });
      }

      const emailHtml = buildBrandedResetEmailHtml({
        email: cleanEmail,
        resetUrl,
        lang: userLang,
      });

      const isBengali = userLang === 'bn' || userLang.startsWith('bn');
      const emailSubject = isBengali
        ? 'Anime Trix - অ্যাকাউন্ট পাসওয়ার্ড রিসেট করুন'
        : 'Reset Your Anime Trix Password';

      const brevoPayload = {
        sender: {
          name: 'Anime Trix',
          email: brevoSenderEmail,
        },
        to: [
          {
            email: cleanEmail,
          },
        ],
        subject: emailSubject,
        htmlContent: emailHtml,
      };

      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(brevoPayload),
      });

      if (!brevoResponse.ok) {
        const errorText = await brevoResponse.text();
        console.error('[Brevo Error]', brevoResponse.status, errorText);
        return res.status(502).json({
          ok: false,
          error: `Brevo email dispatch failed with status ${brevoResponse.status}`,
        });
      }

      console.log(`[Forgot Password] Successfully sent reset email to ${cleanEmail}`);
      return res.status(200).json({ ok: true, success: true });
    } catch (err: any) {
      console.error('[Forgot Password Error]', err);
      return res.status(500).json({
        ok: false,
        error: err?.message || 'An unexpected error occurred.',
      });
    }
  });

  // ------------------------------------------
  // SPA Fallback & Static Serving
  // ------------------------------------------
  if (isProduction && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    console.log('[Server] Running in PRODUCTION mode, serving dist static files');
    app.use(express.static(path.resolve(__dirname, 'dist')));

    // Specifically handle /reset-password and /__/auth/action
    app.get(['/reset-password', '/__/auth/action', '/reset-password/*', '/__/auth/action/*'], (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });

    // Catch-all SPA fallback
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    console.log('[Server] Running in DEVELOPMENT mode with Vite middleware');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Vite middlewares handles SPA, HMR, and static assets
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Anime Trix Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Error]', err);
  process.exit(1);
});
