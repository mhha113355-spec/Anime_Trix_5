import React, { useState } from 'react';
import {
  Lock,
  Smartphone,
  Share2,
  Download,
  Globe,
  CheckCircle2,
  Play,
} from 'lucide-react';
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
          title: 'Anime Trix-Web App',
          text: `${episode.title} - Anime Trix-এ বাংলা ও হিন্দি ডাবিংয়ে ফুল এইচডিতে দেখুন`,
          url,
        });
        showToast('Clean link shared successfully!');
        return;
      } catch (err) {
        // Fallback to copy
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
      {/* 16:9 Cinematic Video Player Box (Clean & Immersive) */}
      <div
        onClick={handleOpenApp}
        className="group relative aspect-video w-full rounded-[24px] sm:rounded-[32px] overflow-hidden bg-slate-950 shadow-lg border border-slate-200 cursor-pointer select-none"
      >
        {/* Background Backdrop Image */}
        <img
          src={displayImage}
          alt={episode.title}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-55 filter blur-[0.3px] group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Ambient Dark Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/50" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2">
          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold rounded-full border border-white/15">
            1080p FHD
          </span>
          {selectedDub && (
            <span className="px-2.5 py-1 bg-[#E50914] text-white text-[10px] sm:text-xs font-bold rounded-full shadow-xs">
              {selectedDub}
            </span>
          )}
        </div>

        {/* Top Right Duration */}
        {episode.durationFormatted && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
            <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-slate-200 text-[10px] sm:text-xs font-mono font-medium rounded-full border border-white/15">
              {episode.durationFormatted}
            </span>
          </div>
        )}

        {/* Center Screen: Elegant Play Button & Clear Notice */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 space-y-2">
          {/* Play Button Circle */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-110 transition-transform duration-300">
            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
          </div>

          <div className="space-y-0.5 max-w-sm px-2">
            <p className="text-white text-xs sm:text-sm font-semibold font-bengali">
              অ্যাপে দেখতে এখানে ট্যাপ করুন
            </p>
            <p className="text-slate-300 text-[11px] sm:text-xs">
              Watch full episode in Anime Trix App
            </p>
          </div>
        </div>
      </div>

      {/* Unified Liquid Frosted Glass Episode Control Hub */}
      <div className="p-5 sm:p-7 glass-panel rounded-[28px] sm:rounded-[36px] space-y-4">
        {/* Title & Metadata Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/60">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 font-mono">
              <span className="font-bold text-[#E50914]">EPISODE {episode.episodeNumber}</span>
              {parentAnime?.releaseYear && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{parentAnime.releaseYear}</span>
                </>
              )}
              {parentAnime?.contentType && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{parentAnime.contentType}</span>
                </>
              )}
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {episode.title}
            </h1>
            {parentAnime && (
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                {parentAnime.title}
              </p>
            )}
          </div>

          {/* Audio Dub Selector */}
          {availableDubs.length > 0 && (
            <div className="flex items-center gap-1.5 self-start sm:self-center">
              <Globe className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
              <div className="flex items-center gap-1">
                {availableDubs.map((dub) => {
                  const isSelected = selectedDub === dub || (!selectedDub && availableDubs[0] === dub);
                  return (
                    <button
                      key={dub}
                      onClick={() => onSelectDub && onSelectDub(dub)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-r from-red-600 to-[#E50914] text-white shadow-[0_2px_10px_rgba(229,9,20,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]'
                          : 'glass-pill text-slate-700 hover:bg-white/90'
                      }`}
                    >
                      {dub}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="space-y-2.5">
          <button
            onClick={handleOpenApp}
            className="w-full min-h-[50px] sm:min-h-[54px] px-6 py-3 bg-gradient-to-r from-red-600 via-[#E50914] to-red-600 hover:brightness-110 text-white font-bold text-sm sm:text-base rounded-full shadow-[0_8px_24px_rgba(229,9,20,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Smartphone className="w-5 h-5 shrink-0" />
            <span>Open in Anime Trix App / অ্যাপে দেখুন</span>
          </button>

          {/* Secondary Action Row: Share & Download APK */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleShare}
              className="min-h-[42px] px-4 py-2 glass-pill hover:bg-white/90 text-slate-700 text-xs sm:text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>Share Link</span>
            </button>

            <button
              onClick={onOpenDownloadModal}
              className="min-h-[42px] px-4 py-2 glass-pill hover:bg-white/90 text-slate-700 text-xs sm:text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Download className="w-4 h-4 text-[#E50914]" />
              <span>Download APK</span>
            </button>
          </div>
        </div>

        {/* Feature bullets */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-white/60">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            1080p Ultra HD Quality
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Zero Buffering Player
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Bangla & Hindi Audio
          </span>
        </div>
      </div>
    </div>
  );
};
