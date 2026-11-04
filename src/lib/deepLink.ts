export const ANDROID_PACKAGE_NAME = 'com.aistudio.animetrix.vxrpl';
export const APP_SCHEME = 'animetrix';

export interface OpenAppParams {
  episodeId?: string;
  animeId?: string;
  dub?: string;
  referralCode?: string;
  onNonAndroid?: () => void;
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined' || !navigator) return false;
  const ua = navigator.userAgent || '';
  return /android/i.test(ua);
}

export function buildDeepLinkRoute(params: OpenAppParams): string {
  const { episodeId, animeId, dub, referralCode } = params;

  if (episodeId) {
    return `watch/${encodeURIComponent(episodeId)}?anime=${encodeURIComponent(animeId || '')}&ep=${encodeURIComponent(episodeId)}&dub=${encodeURIComponent(dub || '')}`;
  }

  if (animeId) {
    return `anime/${encodeURIComponent(animeId)}?anime=${encodeURIComponent(animeId)}`;
  }

  return `home${referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ''}`;
}

/**
 * Exact Android App Deep-Link Launcher
 * Handles intent:// scheme for Android and fallback behavior
 */
export function openInAnimeTrixApp(params: OpenAppParams): void {
  if (typeof window === 'undefined') return;

  const targetRoute = buildDeepLinkRoute(params);
  const isAndroid = isAndroidDevice();

  if (isAndroid) {
    const currentOrigin = window.location.origin;
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const fallbackUrl = encodeURIComponent(
      `${currentOrigin}${currentPath}${currentSearch ? currentSearch + '&install=1' : '?install=1'}`
    );

    const intentUrl = `intent://${targetRoute}#Intent;scheme=${APP_SCHEME};package=${ANDROID_PACKAGE_NAME};S.browser_fallback_url=${fallbackUrl};end`;

    // Attempt launch via Android Intent
    window.location.href = intentUrl;

    // Fallback timer in case the browser blocks intent redirect
    setTimeout(() => {
      // Also try direct scheme if still on page
      try {
        window.location.href = `${APP_SCHEME}://${targetRoute}`;
      } catch (e) {
        console.warn('Scheme launch error', e);
      }
    }, 1500);
  } else {
    // Non-Android (desktop or iOS)
    if (params.onNonAndroid) {
      params.onNonAndroid();
    } else {
      // Direct custom scheme attempt + trigger install param
      try {
        window.location.href = `${APP_SCHEME}://${targetRoute}`;
      } catch (e) {
        console.warn('Custom scheme launch error', e);
      }
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('install', '1');
      window.history.replaceState({}, '', newUrl.toString());
      window.dispatchEvent(new CustomEvent('anime-trix-open-apk-modal'));
    }
  }
}

export interface ResetPasswordDeepLinkParams {
  oobCode: string;
  email?: string;
  lang?: string;
  mode?: string;
}

/**
 * Trigger deep link handoff directly to Anime Trix Android App password reset screen
 */
export function openResetPasswordInApp(params: ResetPasswordDeepLinkParams): void {
  if (typeof window === 'undefined') return;

  const mode = params.mode || 'resetPassword';
  const oobCode = params.oobCode;
  const email = params.email || '';
  const lang = params.lang || 'en';

  const queryPart = `mode=${encodeURIComponent(mode)}&oobCode=${encodeURIComponent(oobCode)}&email=${encodeURIComponent(email)}&lang=${encodeURIComponent(lang)}`;
  const customSchemeUrl = `${APP_SCHEME}://reset-password?${queryPart}`;

  const currentHref = window.location.href;
  const fallbackUrl = encodeURIComponent(currentHref);
  const intentUrl = `intent://reset-password?${queryPart}#Intent;scheme=${APP_SCHEME};package=${ANDROID_PACKAGE_NAME};S.browser_fallback_url=${fallbackUrl};end`;

  const isAndroid = isAndroidDevice();

  if (isAndroid) {
    // Try Android Chrome Intent first for seamless app launching
    window.location.href = intentUrl;

    // Fast fallback to custom scheme in case the intent is handled differently by webview
    setTimeout(() => {
      try {
        window.location.href = customSchemeUrl;
      } catch (err) {
        console.warn('Custom scheme launch fallback:', err);
      }
    }, 1200);
  } else {
    // On desktop / non-android, attempt custom scheme or inform user
    try {
      window.location.href = customSchemeUrl;
    } catch (err) {
      console.warn('Custom scheme launch error on desktop:', err);
    }
  }
}

/**
 * Launch Anime Trix Android App login screen after password reset
 */
export function openLoginInApp(email?: string): void {
  if (typeof window === 'undefined') return;

  const queryPart = email ? `?email=${encodeURIComponent(email)}` : '';
  const customSchemeUrl = `${APP_SCHEME}://login${queryPart}`;
  const intentUrl = `intent://login${queryPart}#Intent;scheme=${APP_SCHEME};package=${ANDROID_PACKAGE_NAME};S.browser_fallback_url=${encodeURIComponent(window.location.origin)};end`;

  if (isAndroidDevice()) {
    window.location.href = intentUrl;
    setTimeout(() => {
      try {
        window.location.href = customSchemeUrl;
      } catch (e) {
        console.warn('Scheme login fallback:', e);
      }
    }, 1200);
  } else {
    try {
      window.location.href = customSchemeUrl;
    } catch (e) {
      console.warn('Desktop scheme login:', e);
    }
  }
}
