import React, { useState } from 'react';
import { Lock, Smartphone, Share2, Download, Check, Sparkles, AlertCircle, Globe } from 'lucide-react';
import { Episode, Anime } from '../types';
import { openInAnimeTrixApp } from '../lib/deepLink';
import { useToast } from './Toast';

interface LockedVideoPlayerProps {
  episode: Episode;
  parentAnime?: Anime | null;
  selectedDub?: string;
  onSelectDub?: (dub: string) => void;
  onOpenDownloadModal: () => void;
}

export const LockedVideoPlayer: React.FC<LockedVideoPlayerProps> = ({
  episode,
  parentAnime,
  selectedDub,
  onSelectDub,
  onOpenDownloadModal,
}) => {
  const [imageError, setImageError] = useState(false);
  const { showToast } = useToast();

  const fallbackImage = '/src/assets/images/hero_anime_showcase_1793556529783.jpg';
  const displayImage =
    !imageError && episode.thumbnailUrl
      ? episode.thumbnailUrl
      : parentAnime?.backdropUrl || parentAnime?.posterUrl || fallbackImage;

  const handleOpenApp = () => {
    openInAnimeTrixApp({
      episodeId: episode.id,
      animeId: episode.animeId || parentAnime?.id,
      dub: selectedDub,
      onNonAndroid: () => {
        onOpenDownloadModal();
      },
    });
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          url: url,
        });
        showToast('Link copied / shared successfully!');
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast('Clean link copied to clipboard!');
    } catch (err) {
      showToast('Could not copy link', 'error');
    }
  };

  const availableDubs =
    episode.availableDubs?.length
      ? episode.availableDubs
      : parentAnime?.availableDubs || [];

  return (
    <div className="w-full space-y-4">
      {/* 16:9 YouTube-style Locked Preview Box (STRICT NO-WEB-PLAYBACK) */}
      <div className="relative aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden bg-slate-950 shadow-xl border border-slate-200">
        {/* Background Backdrop / Thumbnail Image */}
        <img
          src={displayImage}
          alt={episode.title}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-35 filter blur-[1px] transform scale-105"
        />

        {/* Ambient Dark Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/70" />

        {/* Locked Preview Player Center Card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8 text-center z-10">
          {/* Crimson Lock Badge */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-red-900/40 mb-3 sm:mb-4 animate-in zoom-in-95 duration-200">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          {/* Episode identification */}
          <div className="space-y-1 max-w-xl">
            <p className="text-red-400 font-bold text-xs sm:text-sm tracking-wide uppercase">
              Episode {episode.episodeNumber} {episode.durationFormatted ? `· ${episode.durationFormatted}` : ''}
            </p>
            <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight line-clamp-1">
              {episode.title}
            </h2>
          </div>

          {/* Locked Notice in Bengali & English */}
          <div className="mt-2.5 sm:mt-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 max-w-md">
            <p className="text-white text-xs sm:text-sm font-semibold font-bengali leading-relaxed">
              এই ভিডিওটি শুধুমাত্র Anime Trix অ্যাপে দেখা যাবে
            </p>
            <p className="text-slate-300 text-[11px] sm:text-xs mt-0.5">
              Watch full HD episodes exclusively in the Anime Trix Android App
            </p>
          </div>

          {/* Primary CTA: 1-Tap Open App */}
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleOpenApp}
              className="min-h-[46px] px-6 sm:px-8 py-2.5 sm:py-3 bg-[#E50914] hover:bg-[#C80811] text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-red-600/30 active:scale-[0.98] transition-all flex items-center gap-2 group"
            >
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Open App / অ্যাপে দেখুন</span>
            </button>
          </div>
        </div>

        {/* Video Quality Badge & Top Metadata */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2">
          <span className="px-2.5 py-1 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold rounded-lg border border-white/10">
            1080p FHD
          </span>
          {selectedDub && (
            <span className="px-2.5 py-1 bg-red-600/90 text-white text-[11px] font-bold rounded-lg border border-red-400/30">
              {selectedDub}
            </span>
          )}
        </div>
      </div>

      {/* Audio / Dub Selector if available */}
      {availableDubs.length > 0 && (
        <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Globe className="w-4 h-4 text-[#E50914]" />
            <span>Select Audio Language:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {availableDubs.map((dub) => {
              const isSelected = selectedDub === dub || (!selectedDub && availableDubs[0] === dub);
              return (
                <button
                  key={dub}
                  onClick={() => onSelectDub && onSelectDub(dub)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                    isSelected
                      ? 'bg-[#E50914] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {dub}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Bar Below Player */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenApp}
            className="min-h-[42px] px-5 py-2 bg-[#E50914] hover:bg-[#C80811] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open in App</span>
          </button>

          <button
            onClick={handleShare}
            className="min-h-[42px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Link</span>
          </button>
        </div>

        <button
          onClick={onOpenDownloadModal}
          className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-[#E50914]" />
          <span>Need the App? Download APK</span>
        </button>
      </div>
    </div>
  );
};
