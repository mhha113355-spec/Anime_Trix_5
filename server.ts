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

// =========================================================================
// 1. Firebase Admin Initialization (Safe trimming, unescaping, error-resilient)
// =========================================================================
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

  let rawSa = (
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_CONFIG ||
    ''
  ).trim();

  if (!rawSa) {
    console.warn('[Firebase Admin] Warning: FIREBASE_SERVICE_ACCOUNT is not set in environment.');
    return null;
  }

  // Trim surrounding quotes if any (e.g. '"{"type":...}"' or '\'{"type":...}\'')
  if (
    (rawSa.startsWith("'") && rawSa.endsWith("'")) ||
    (rawSa.startsWith('"') && rawSa.endsWith('"'))
  ) {
    rawSa = rawSa.slice(1, -1).trim();
  }

  try {
    let serviceAccount: any;
    if (rawSa.startsWith('{')) {
      serviceAccount = JSON.parse(rawSa);
    } else {
      // Check if base64 encoded
      try {
        const decoded = Buffer.from(rawSa, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decoded);
      } catch {
        serviceAccount = JSON.parse(rawSa);
      }
    }

    if (serviceAccount && typeof serviceAccount.private_key === 'string') {
      // Replace /\\n/g with "\n" in private_key
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

// Pre-initialize on boot if credentials are present
getFirebaseAdmin();

// =========================================================================
// 2. Android App Links & Package Constants
// =========================================================================
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

// =========================================================================
// 3. Server Setup
// =========================================================================
async function startServer() {
  const app = express();

  // REQUIREMENT 1: Enable express.json() and CORS BEFORE routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, api-key, X-Requested-With, Accept'
    );
    res.setHeader('Access-Control-Expose-Headers', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  // REQUIREMENT 2: Serve /.well-known/assetlinks.json with Content-Type: application/json
  app.get(
    ['/.well-known/assetlinks.json', '/.well-known/assetlinks.json/'],
    async (_req: Request, res: Response) => {
      try {
        const json = await getMergedAssetLinks();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=60');
        return res.status(200).send(json);
      } catch (err) {
        console.error('Error serving assetlinks.json:', err);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json([
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

  // APK download routes
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

  // =========================================================================
  // REQUIREMENT 3: Register POST /api/auth/forgot-password & POST /api/forgot-password
  // =========================================================================
  const forgotPasswordHandler = async (req: Request, res: Response) => {
    try {
      const { email, lang } = req.body || {};

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({
          ok: false,
          error: 'Please provide a valid email address.',
        });
      }

      const cleanEmail = email.trim();
      const userLang = (lang || 'bn').toString().trim();

      const adminApp = getFirebaseAdmin();
      if (!adminApp) {
        console.error('[Forgot Password] FIREBASE_SERVICE_ACCOUNT is missing or invalid.');
        return res.status(500).json({
          ok: false,
          error:
            'Firebase Admin is not configured on this server. Please set FIREBASE_SERVICE_ACCOUNT in your environment.',
        });
      }

      // Generate Password Reset Link without ActionCodeSettings to avoid continueUrl domain errors
      let firebaseLink = '';
      try {
        firebaseLink = await getAuth(adminApp).generatePasswordResetLink(cleanEmail);
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

      // Extract oobCode query parameter from Firebase returned link
      const parsedUrl = new URL(firebaseLink);
      const oobCode = parsedUrl.searchParams.get('oobCode') || '';

      if (!oobCode) {
        return res.status(500).json({
          ok: false,
          error: 'Failed to extract verification code from Firebase URL.',
        });
      }

      // Build resetUrl with app deep-link parameters
      const resetUrl = `https://animetrix-nwaz.onrender.com/reset-password?mode=resetPassword&oobCode=${encodeURIComponent(
        oobCode
      )}&email=${encodeURIComponent(cleanEmail)}&lang=${encodeURIComponent(userLang)}`;

      // Send branded Anime Trix HTML email via Brevo REST API
      const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
      const brevoSenderEmail =
        (process.env.BREVO_SENDER_EMAIL || '').trim() || 'support@animetrix-nwaz.onrender.com';

      if (!brevoApiKey) {
        console.warn('[Brevo] BREVO_API_KEY is not set. Reset URL generated:', resetUrl);
        return res.status(500).json({
          ok: false,
          error: 'Email delivery service is not configured (BREVO_API_KEY is missing).',
          ...(process.env.NODE_ENV !== 'production' ? { devResetUrl: resetUrl } : {}),
        });
      }

      const htmlContent = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:28px;border:1px solid #eee;border-radius:16px;background:#fff;text-align:center;"><h2 style="color:#111;margin-bottom:6px;">Anime <span style="color:#E50914;">Trix</span></h2><p style="color:#555;font-size:14px;">Password reset request for <b>${cleanEmail}</b></p><a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#E50914;color:#fff;text-decoration:none;font-weight:bold;border-radius:10px;font-size:15px;">Reset Password</a><p style="color:#888;font-size:12px;">Tap the button above on your Android phone to set your new password directly inside the Anime Trix app.</p></div>`;

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
        subject: 'Anime Trix - Reset Your Password',
        htmlContent,
      };

      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify(brevoPayload),
      });

      if (!brevoResponse.ok) {
        const brevoResponseText = await brevoResponse.text();
        console.error('[Brevo Error]', brevoResponse.status, brevoResponseText);
        return res.status(500).json({
          ok: false,
          error: brevoResponseText,
        });
      }

      console.log(`[Forgot Password] Successfully sent reset email via Brevo to ${cleanEmail}`);
      return res.status(200).json({ ok: true, success: true });
    } catch (err: any) {
      console.error('[Forgot Password Error]', err);
      return res.status(500).json({
        ok: false,
        error: err?.message || 'An unexpected error occurred.',
      });
    }
  };

  app.post('/api/auth/forgot-password', forgotPasswordHandler);
  app.post('/api/forgot-password', forgotPasswordHandler);

  // =========================================================================
  // REQUIREMENT 4: Register GET /reset-password (and /__/auth/action) Bridge Page
  // =========================================================================
  const resetPasswordBridgeHandler = (req: Request, res: Response) => {
    const oobCode = ((req.query.oobCode as string) || '').trim();
    const email = ((req.query.email as string) || '').trim();
    const lang = ((req.query.lang as string) || 'bn').trim();
    const mode = ((req.query.mode as string) || 'resetPassword').trim();

    const isBengali = lang === 'bn' || lang.startsWith('bn');

    const queryPart = `mode=${encodeURIComponent(mode)}&oobCode=${encodeURIComponent(
      oobCode
    )}&email=${encodeURIComponent(email)}&lang=${encodeURIComponent(lang)}`;

    const animetrixSchemeUrl = `animetrix://reset-password?${queryPart}`;
    const androidIntentUrl = `intent://reset-password?${queryPart}#Intent;scheme=animetrix;package=com.aistudio.animetrix.vxrpl;end`;

    const htmlBridge = `<!DOCTYPE html>
<html lang="${isBengali ? 'bn' : 'en'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  <title>${isBengali ? 'পাসওয়ার্ড রিসেট - Anime Trix' : 'Reset Password - Anime Trix'}</title>
  <link rel="icon" type="image/png" href="/logo.png" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0d1117;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 16px;
    }
    .bridge-card {
      background: #ffffff;
      border-radius: 28px;
      max-width: 440px;
      width: 100%;
      padding: 32px 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.15);
      text-align: center;
    }
    .logo-badge {
      width: 60px;
      height: 60px;
      border-radius: 18px;
      margin: 0 auto 12px;
      padding: 4px;
      background: #fff;
      box-shadow: 0 8px 18px rgba(0,0,0,0.1);
      border: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-badge img {
      width: 100%;
      height: 100%;
      border-radius: 14px;
      object-fit: contain;
    }
    h1 {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .sub-brand {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #E50914;
      margin-bottom: 20px;
    }
    .email-chip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 14px;
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 20px;
      word-break: break-all;
    }
    .btn-app {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      min-height: 48px;
      padding: 14px 24px;
      background: linear-gradient(135deg, #dc2626 0%, #E50914 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 15px;
      border-radius: 50px;
      box-shadow: 0 8px 24px rgba(229, 9, 20, 0.4);
      margin-bottom: 12px;
      transition: transform 0.15s ease, filter 0.15s ease;
      cursor: pointer;
      border: none;
    }
    .btn-app:active { transform: scale(0.97); }
    .btn-app:hover { filter: brightness(1.1); }
    .app-hint {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .web-fallback-box {
      border-top: 1px solid #e2e8f0;
      padding-top: 22px;
      text-align: left;
    }
    .web-fallback-box h3 {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      text-align: center;
      margin-bottom: 16px;
    }
    .form-group {
      margin-bottom: 14px;
    }
    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }
    .form-group input {
      width: 100%;
      height: 44px;
      padding: 0 14px;
      border-radius: 14px;
      border: 1px solid #cbd5e1;
      font-size: 14px;
      outline: none;
      background: #f8fafc;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-group input:focus {
      background: #fff;
      border-color: #E50914;
      box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.15);
    }
    .btn-submit {
      width: 100%;
      min-height: 44px;
      padding: 12px 20px;
      background: #0f172a;
      color: #ffffff;
      border: none;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 6px;
    }
    .btn-submit:hover { background: #1e293b; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .msg-box {
      display: none;
      margin-top: 14px;
      padding: 12px;
      border-radius: 12px;
      font-size: 12px;
      text-align: center;
      line-height: 1.4;
    }
    .msg-box.success {
      display: block;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-weight: 700;
    }
    .msg-box.error {
      display: block;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      font-weight: 600;
    }
    .back-link {
      display: inline-block;
      margin-top: 20px;
      font-size: 12px;
      color: #64748b;
      text-decoration: none;
      font-weight: 600;
    }
    .back-link:hover { color: #E50914; }
  </style>

  <!-- REQUIREMENT 4: Auto-launch intent script on Android -->
  <script>
    (function() {
      var isAndroid = /android/i.test(navigator.userAgent || '');
      var oobCode = "${oobCode}";
      var intentUrl = "${androidIntentUrl}";
      var schemeUrl = "${animetrixSchemeUrl}";

      if (isAndroid && oobCode) {
        window.location.href = intentUrl;
        setTimeout(function() {
          try {
            window.location.href = schemeUrl;
          } catch(e) {}
        }, 500);
      }
    })();
  </script>
</head>
<body>
  <div class="bridge-card">
    <div class="logo-badge">
      <img src="/logo.png" alt="Anime Trix" />
    </div>
    <h1>${isBengali ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'}</h1>
    <div class="sub-brand">Anime Trix Official Security</div>

    ${
      email
        ? `<div class="email-chip">${email}</div>`
        : ''
    }

    <!-- Prominent Red Button with exact animetrix:// deep link -->
    <a href="${animetrixSchemeUrl}" class="btn-app" id="openAppBtn">
      <span>📱</span>
      <span>${isBengali ? 'Open in Anime Trix App / অ্যাপে খুলুন' : 'Open in Anime Trix App'}</span>
    </a>

    <p class="app-hint">
      ${
        isBengali
          ? 'অ্যান্ড্রয়েড ডিভাইসে Anime Trix ইনস্টল করা থাকলে উপরের বাটনে চাপ দিলে সরাসরি অ্যাপে পাসওয়ার্ড রিসেট হবে।'
          : 'Tapping above will open the Anime Trix Android App directly to complete your reset.'
      }
    </p>

    <!-- Web Fallback Form -->
    <div class="web-fallback-box">
      <h3>${isBengali ? 'অথবা ব্রাউজারে পাসওয়ার্ড রিসেট করুন (Web Fallback)' : 'Or Reset in Browser (Web Fallback)'}</h3>

      ${
        oobCode
          ? `
      <form id="resetForm">
        <div class="form-group">
          <label for="newPass">${isBengali ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'New Password (min 6 chars)'}</label>
          <input type="password" id="newPass" required minlength="6" placeholder="••••••••" autocomplete="new-password" />
        </div>
        <div class="form-group">
          <label for="confirmPass">${isBengali ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}</label>
          <input type="password" id="confirmPass" required minlength="6" placeholder="••••••••" autocomplete="new-password" />
        </div>
        <button type="submit" id="submitBtn" class="btn-submit">
          ${isBengali ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Update Password'}
        </button>
      </form>
      <div id="statusMsg" class="msg-box"></div>
      `
          : `
      <p style="font-size:12px;color:#64748b;text-align:center;">
        ${
          isBengali
            ? 'কোনো ভেরিফিকেশন কোড পাওয়া যায়নি। নিচে আপনার ইমেইল দিয়ে নতুন লিংক সংগ্রহ করতে পারেন:'
            : 'No verification code found in this link. Request a new link below:'
        }
      </p>
      <form id="requestLinkForm" style="margin-top:12px;">
        <div class="form-group">
          <input type="email" id="reqEmail" required placeholder="name@example.com" value="${email}" />
        </div>
        <button type="submit" id="reqBtn" class="btn-submit">
          ${isBengali ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}
        </button>
      </form>
      <div id="requestMsg" class="msg-box"></div>
      `
      }
    </div>

    <div>
      <a href="/" class="back-link">← ${isBengali ? 'Anime Trix হোমে যান' : 'Back to Anime Trix Home'}</a>
    </div>
  </div>

  <script>
    // Handle Web Fallback Submit via Firebase REST Auth
    var form = document.getElementById('resetForm');
    var statusMsg = document.getElementById('statusMsg');
    var submitBtn = document.getElementById('submitBtn');

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var p1 = document.getElementById('newPass').value;
        var p2 = document.getElementById('confirmPass').value;

        if (p1 !== p2) {
          statusMsg.className = 'msg-box error';
          statusMsg.textContent = '${isBengali ? 'উভয় পাসওয়ার্ড মিলছে না!' : 'Passwords do not match!'}';
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '${isBengali ? 'আপডেট হচ্ছে...' : 'Updating...'}';
        statusMsg.className = 'msg-box';

        fetch('https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=AIzaSyCzE4Ge6OAxj1IZamnFG71LxvykzD8AvRk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oobCode: "${oobCode}",
            newPassword: p1
          })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          submitBtn.disabled = false;
          submitBtn.textContent = '${isBengali ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Update Password'}';
          if (data && data.email) {
            statusMsg.className = 'msg-box success';
            statusMsg.innerHTML = '${isBengali ? 'পাসওয়ার্ড সফলভাবে আপডেট হয়েছে! 🎉<br><a href="animetrix://login" style="color:#065f46;font-weight:bold;text-decoration:underline;">অ্যাপে লগইন করুন</a>' : 'Password updated successfully! 🎉<br><a href="animetrix://login" style="color:#065f46;font-weight:bold;text-decoration:underline;">Login in App</a>'}';
            form.style.display = 'none';
          } else {
            statusMsg.className = 'msg-box error';
            var err = (data && data.error && data.error.message) || 'Failed to reset password';
            statusMsg.textContent = err;
          }
        })
        .catch(function(err) {
          submitBtn.disabled = false;
          submitBtn.textContent = '${isBengali ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Update Password'}';
          statusMsg.className = 'msg-box error';
          statusMsg.textContent = 'Network error. Please try again.';
        });
      });
    }

    // Handle Request New Link Form
    var reqForm = document.getElementById('requestLinkForm');
    var reqMsg = document.getElementById('requestMsg');
    var reqBtn = document.getElementById('reqBtn');

    if (reqForm) {
      reqForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var emailVal = document.getElementById('reqEmail').value.trim();
        if (!emailVal) return;

        reqBtn.disabled = true;
        reqBtn.textContent = '${isBengali ? 'পাঠানো হচ্ছে...' : 'Sending...'}';

        fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailVal, lang: '${lang}' })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          reqBtn.disabled = false;
          reqBtn.textContent = '${isBengali ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}';
          if (data && data.ok) {
            reqMsg.className = 'msg-box success';
            reqMsg.textContent = '${isBengali ? 'নতুন রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে! ইনবক্স চেক করুন।' : 'Reset link sent to your email! Please check your inbox.'}';
            reqForm.style.display = 'none';
          } else {
            reqMsg.className = 'msg-box error';
            reqMsg.textContent = data.error || 'Failed to send reset link';
          }
        })
        .catch(function(e) {
          reqBtn.disabled = false;
          reqBtn.textContent = '${isBengali ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}';
          reqMsg.className = 'msg-box error';
          reqMsg.textContent = 'Server connection error.';
        });
      });
    }
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlBridge);
  };

  app.get('/reset-password', resetPasswordBridgeHandler);
  app.get('/__/auth/action', resetPasswordBridgeHandler);

  // =========================================================================
  // REQUIREMENT 5: Static files & SPA catch-all fallback
  // =========================================================================
  const distPath = path.resolve(__dirname, 'dist');
  if (isProduction && fs.existsSync(distPath)) {
    console.log('[Server] Serving production static files from dist/');
    app.use(express.static(distPath));

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    console.log('[Server] Mounting Vite middlewares for development');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Anime Trix Production Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Fatal Error]', err);
  process.exit(1);
});
