import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Smartphone, Info } from 'lucide-react';
import { Banner, Anime } from '../types';
import { openInAnimeTrixApp } from '../lib/deepLink';

interface HeroSliderProps {
  banners: Banner[];
  fallbackAnimeList: Anime[];
  onOpenDownloadModal: () => void;
}

interface SlideItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  animeId?: string;
  episodeId?: string;
  rating?: string | number;
  genres?: string[];
  dubs?: string[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  banners,
  fallbackAnimeList,
  onOpenDownloadModal,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides: SlideItem[] = React.useMemo(() => {
    if (banners && banners.length > 0) {
      return banners.map((b) => {
        const matchingAnime = fallbackAnimeList.find((a) => a.id === b.animeId);
        return {
          id: b.id,
          title: b.title || matchingAnime?.title || 'Featured Anime',
          description: b.description || matchingAnime?.description || 'Watch full episodes in 1080p HD with Bangla & Hindi dub in the official Anime Trix app.',
          imageUrl:
            b.imageUrl ||
            b.bannerUrl ||
            b.backdropUrl ||
            matchingAnime?.backdropUrl ||
            matchingAnime?.posterUrl ||
            '/src/assets/images/hero_anime_showcase_1793556529783.jpg',
          animeId: b.animeId || matchingAnime?.id,
          episodeId: b.episodeId,
          rating: matchingAnime?.rating || '4.9',
          genres: matchingAnime?.genres || ['Action', 'Adventure'],
          dubs: matchingAnime?.availableDubs || ['Bengali Dub'],
        };
      });
    }

    if (fallbackAnimeList && fallbackAnimeList.length > 0) {
      return fallbackAnimeList.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description || 'Watch full episodes in 1080p HD with Bangla & Hindi dub in the official Anime Trix app.',
        imageUrl: a.backdropUrl || a.posterUrl || '/src/assets/images/hero_anime_showcase_1793556529783.jpg',
        animeId: a.id,
        rating: a.rating || '4.9',
        genres: a.genres || ['Action', 'Adventure'],
        dubs: a.availableDubs || ['Bengali Dub'],
      }));
    }

    return [
      {
        id: 'default',
        title: 'Anime Trix Official Streaming',
        description: 'Watch your favorite anime in Bangla, Hindi & English Dub on Android.',
        imageUrl: '/src/assets/images/hero_anime_showcase_1793556529783.jpg',
        rating: '4.9',
        genres: ['Action', 'Adventure'],
        dubs: ['Bengali Dub'],
      },
    ];
  }, [banners, fallbackAnimeList]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlide = slides[currentIndex] || slides[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleLaunchApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    openInAnimeTrixApp({
      animeId: currentSlide.animeId,
      episodeId: currentSlide.episodeId,
      onNonAndroid: () => {
        onOpenDownloadModal();
      },
    });
  };

  return (
    <div className="relative w-full rounded-[28px] sm:rounded-[36px] overflow-hidden bg-slate-900 border border-slate-200 shadow-sm group">
      {/* 16:10 on mobile, 21:9 on desktop */}
      <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden">
        {/* Background Banner Image */}
        <img
          src={currentSlide.imageUrl}
          alt={currentSlide.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-all duration-700 ease-out"
        />

        {/* Clean Scrim Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent hidden sm:block" />

        {/* Content Container */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-7 md:p-9 text-white z-10">
          {/* Metadata Badges (Clean White UI Style) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 text-[11px] sm:text-xs">
            {currentSlide.rating && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 font-bold font-mono border border-white/15">
                <Star className="w-3 h-3 fill-amber-300" />
                <span>{currentSlide.rating}</span>
              </span>
            )}

            {currentSlide.dubs && currentSlide.dubs.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#E50914] text-white font-bold shadow-xs">
                {currentSlide.dubs[0]}
              </span>
            )}

            {currentSlide.genres && currentSlide.genres.length > 0 && (
              <span className="hidden xs:inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white font-medium border border-white/15">
                {currentSlide.genres.slice(0, 2).join(', ')}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white line-clamp-1 mb-1 drop-shadow-md">
            {currentSlide.title}
          </h2>

          {/* Subtitle / Description */}
          <p className="text-xs sm:text-sm text-slate-200 line-clamp-1 sm:line-clamp-2 max-w-xl mb-3 sm:mb-5 leading-relaxed">
            {currentSlide.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleLaunchApp}
              className="min-h-[40px] sm:min-h-[46px] px-6 sm:px-8 py-2 bg-[#E50914] hover:bg-[#C80811] text-white font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-red-500/30 active:scale-95 transition-all flex items-center gap-2 shrink-0"
            >
              <Smartphone className="w-4 h-4" />
              <span>Open App</span>
            </button>

            {currentSlide.animeId && (
              <Link
                to={`/anime/${currentSlide.animeId}`}
                className="min-h-[40px] sm:min-h-[46px] px-5 sm:px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 text-white font-semibold text-xs sm:text-sm rounded-full transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <Info className="w-4 h-4 text-white" />
                <span>Details</span>
              </Link>
            )}
          </div>
        </div>

        {/* Slider Controls */}
        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous slide"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white items-center justify-center transition-all z-20 active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next slide"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white items-center justify-center transition-all z-20 active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Pill Indicators */}
            <div className="absolute bottom-3 right-4 sm:right-6 flex items-center gap-1.5 z-20">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx ? 'w-6 bg-[#E50914]' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
