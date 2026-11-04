import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileStickyBanner } from './components/MobileStickyBanner';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import { HomePage } from './pages/HomePage';
import { AnimeDetailsPage } from './pages/AnimeDetailsPage';
import { WatchEpisodePage } from './pages/WatchEpisodePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import {
  fetchAnimeList,
  fetchBanners,
  fetchLatestEpisodes,
  fetchAppSettings,
} from './lib/firebase';
import { Anime, Episode, Banner, AppSettings } from './types';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

export default function App() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [latestEpisodes, setLatestEpisodes] = useState<Episode[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);

  // Load Firestore collections on mount
  useEffect(() => {
    let isMounted = true;

    async function loadFirebaseData() {
      try {
        setLoading(true);

        const [animes, bannersData, episodesData, settingsData] = await Promise.all([
          fetchAnimeList(),
          fetchBanners(),
          fetchLatestEpisodes(10),
          fetchAppSettings(),
        ]);

        if (isMounted) {
          setAnimeList(animes);
          setBanners(bannersData);
          setLatestEpisodes(episodesData);
          setAppSettings(settingsData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load initial Firebase data:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFirebaseData();

    // Listen for custom APK modal events from deepLink.ts
    const handleOpenModal = () => setDownloadModalOpen(true);
    window.addEventListener('anime-trix-open-apk-modal', handleOpenModal);

    return () => {
      isMounted = false;
      window.removeEventListener('anime-trix-open-apk-modal', handleOpenModal);
    };
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#F6F8FC] text-slate-900 pb-20 md:pb-0 relative overflow-x-hidden selection:bg-[#E50914] selection:text-white">
          {/* iPhone Glass Ambient Chromatic Glow */}
          <div className="pointer-events-none fixed -top-32 -left-20 w-[550px] h-[550px] bg-red-400/9 rounded-full blur-[140px] -z-10" />
          <div className="pointer-events-none fixed top-1/3 -right-28 w-[600px] h-[600px] bg-indigo-300/10 rounded-full blur-[160px] -z-10" />
          <div className="pointer-events-none fixed bottom-10 left-1/4 w-[500px] h-[500px] bg-amber-300/8 rounded-full blur-[150px] -z-10" />
          {/* Top Sticky Navbar */}
          <Navbar
            onOpenDownloadModal={() => setDownloadModalOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Main Layout Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage
                    animeList={animeList}
                    banners={banners}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onOpenDownloadModal={() => setDownloadModalOpen(true)}
                    appSettings={appSettings}
                  />
                }
              />
              <Route
                path="/anime/:animeId"
                element={
                  <AnimeDetailsPage
                    allAnime={animeList}
                    onOpenDownloadModal={() => setDownloadModalOpen(true)}
                  />
                }
              />
              <Route
                path="/watch/:episodeId"
                element={
                  <WatchEpisodePage
                    allAnime={animeList}
                    onOpenDownloadModal={() => setDownloadModalOpen(true)}
                  />
                }
              />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/terms-of-service" element={<TermsPage />} />
              {/* Firebase Password Reset & Email Action Routes */}
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/__/auth/action" element={<ResetPasswordPage />} />
              <Route
                path="*"
                element={
                  <HomePage
                    animeList={animeList}
                    banners={banners}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onOpenDownloadModal={() => setDownloadModalOpen(true)}
                    appSettings={appSettings}
                  />
                }
              />
            </Routes>
          </main>

          {/* Footer */}
          <Footer onOpenDownloadModal={() => setDownloadModalOpen(true)} />

          {/* Mobile Floating App Banner (<= 15% mobile viewport cap) */}
          <MobileStickyBanner
            onOpenDownloadModal={() => setDownloadModalOpen(true)}
          />

          {/* APK & App Installation Modal */}
          <ApkDownloadModal
            isOpen={downloadModalOpen}
            onClose={() => setDownloadModalOpen(false)}
            appSettings={appSettings}
          />
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
