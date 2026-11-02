import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Smartphone, Info, Sparkles } from 'lucide-react';
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

  // Construct slides from Firestore banners or top anime
  const slides: SlideItem[] = React.useMemo(() => {
    if (banners && banners.length > 0) {
      return banners.map((b) => {
        const matchingAnime = fallbackAnimeList.find((a) => a.id === b.animeId);
        return {
          id: b.id,
          title: b.title || matchingAnime?.title || 'Featured Anime',
          description: b.description || matchingAnime?.description || 'Watch full episodes in the Anime Trix Android App.',
          imageUrl:
            b.imageUrl ||
            b.bannerUrl ||
            b.backdropUrl ||
            matchingAnime?.backdropUrl ||
            matchingAnime?.posterUrl ||
            '/src/assets/images/hero_anime_showcase_1793556529783.jpg',
          animeId: b.animeId || matchingAnime?.id,
          episodeId: b.episodeId,
          rating: matchingAnime?.rating,
          genres: matchingAnime?.genres,
          dubs: matchingAnime?.availableDubs,
        };
      });
    }

    if (fallbackAnimeList && fallbackAnimeList.length > 0) {
      return fallbackAnimeList.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        imageUrl: a.backdropUrl || a.posterUrl || '/src/assets/images/hero_anime_showcase_1793556529783.jpg',
        animeId: a.id,
        rating: a.rating,
        genres: a.genres,
        dubs: a.availableDubs,
      }));
    }

    return [
      {
        id: 'default',
        title: 'Anime Trix Official Streaming',
        description: 'Watch your favorite anime in Bangla, Hindi & English Dub on Android.',
        imageUrl: '/src/assets/images/hero_anime_showcase_1793556529783.jpg',
      },
    ];
  }, [banners, fallbackAnimeList]);

  // Autoplay slider every 5s
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
    <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-md group">
      {/* 16:9 on mobile, 21:9 on desktop */}
      <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden">
        {/* Background Banner Image */}
        <img
          src={currentSlide.imageUrl}
          alt={currentSlide.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-all duration-700 ease-out"
        />

        {/* Ambient Dark Gradient Scrim (Optimized for mobile readability) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent hidden sm:block" />

        {/* Content Container (Compact, Sleek, Professional) */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-7 md:p-9 text-white z-10">
          {/* Metadata badges row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 text-[11px] sm:text-xs">
            {currentSlide.rating && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/90 text-white font-bold font-mono">
                <Star className="w-3 h-3 fill-white" />
                <span>{currentSlide.rating}</span>
              </span>
            )}

            {currentSlide.dubs && currentSlide.dubs.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-[#E50914] text-white font-bold">
                {currentSlide.dubs[0]}
              </span>
            )}

            {currentSlide.genres && currentSlide.genres.length > 0 && (
              <span className="hidden xs:inline-block px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-slate-100 font-medium">
                {currentSlide.genres.slice(0, 2).join(', ')}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-white line-clamp-1 mb-1">
            {currentSlide.title}
          </h2>

          {/* Subtitle / Description (1 line on mobile) */}
          <p className="text-xs text-slate-300 line-clamp-1 sm:line-clamp-2 max-w-xl mb-3 sm:mb-4">
            {currentSlide.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleLaunchApp}
              className="min-h-[38px] sm:min-h-[44px] px-4 sm:px-6 py-2 bg-[#E50914] hover:bg-[#C80811] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Watch in App / অ্যাপে দেখুন</span>
            </button>

            {currentSlide.animeId && (
              <Link
                to={`/anime/${currentSlide.animeId}`}
                className="min-h-[38px] sm:min-h-[44px] px-3.5 sm:px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-1 shrink-0"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Details</span>
              </Link>
            )}
          </div>
        </div>

        {/* Previous / Next Arrows (visible on hover or desktop) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous slide"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white items-center justify-center transition-colors z-20"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next slide"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white items-center justify-center transition-colors z-20"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-2.5 right-4 sm:right-6 flex items-center gap-1.5 z-20">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    currentIndex === idx ? 'w-5 bg-[#E50914]' : 'w-1.5 bg-white/40'
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
