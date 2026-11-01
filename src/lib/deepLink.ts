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
