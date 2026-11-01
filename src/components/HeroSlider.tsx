import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronLeft, ChevronRight, Star, Smartphone, Info } from 'lucide-react';
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
          description: b.description || matchingAnime?.description || 'Watch now on Anime Trix for Android.',
          imageUrl: b.imageUrl || b.bannerUrl || b.backdropUrl || matchingAnime?.backdropUrl || matchingAnime?.posterUrl || '/src/assets/images/hero_anime_showcase_1793556529783.jpg',
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
        title: 'Anime Trix Official Streaming Hub',
        description: 'Explore the highest quality anime catalog in Bangla, Hindi and English dubs on Android.',
        imageUrl: '/src/assets/images/hero_anime_showcase_1793556529783.jpg',
      },
    ];
  }, [banners, fallbackAnimeList]);

  // Autoplay slider every 6s
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlide = slides[currentIndex] || slides[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleLaunchApp = () => {
    openInAnimeTrixApp({
      animeId: currentSlide.animeId,
      episodeId: currentSlide.episodeId,
      onNonAndroid: () => {
        onOpenDownloadModal();
      },
    });
  };

  return (
    <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 aspect-[16/9] sm:aspect-[21/9] max-h-[480px]">
      {/* Background Image with Scrim */}
      <img
        src={currentSlide.imageUrl}
        alt={currentSlide.title}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-center transition-all duration-700 ease-out"
      />

      {/* Measured Scrim for Media Overlays (frontend-design spec) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

      {/* Content Area */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-10 max-w-2xl text-white">
        {/* Unboxed Metadata */}
        <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
          {currentSlide.rating && (
            <span className="flex items-center gap-1 text-amber-300 font-semibold font-mono tabular-nums">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
              {currentSlide.rating}
            </span>
          )}
          {currentSlide.rating && currentSlide.genres && currentSlide.genres.length > 0 && (
            <span aria-hidden="true">·</span>
          )}
          {currentSlide.genres && currentSlide.genres.length > 0 && (
            <span>{currentSlide.genres.slice(0, 2).join(', ')}</span>
          )}
          {currentSlide.dubs && currentSlide.dubs.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-red-400 font-medium">{currentSlide.dubs[0]}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white line-clamp-1 mb-2">
          {currentSlide.title}
        </h1>

        {/* Synopsis text */}
        <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed mb-4 sm:mb-5 max-w-xl">
          {currentSlide.description}
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLaunchApp}
            className="min-h-[42px] px-5 sm:px-6 py-2.5 bg-[#E50914] hover:bg-[#C80811] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-red-600/30 active:scale-[0.98] transition-all flex items-center gap-2 shrink-0"
          >
            <Smartphone className="w-4 h-4" />
            <span>Watch in App / অ্যাপে দেখুন</span>
          </button>

          {currentSlide.animeId && (
            <Link
              to={`/anime/${currentSlide.animeId}`}
              className="min-h-[42px] px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Info className="w-4 h-4" />
              <span>Details</span>
            </Link>
          )}
        </div>
      </div>

      {/* Slider Controls (if multiple slides) */}
      {slides.length > 1 && (
        <>
          <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 flex items-center gap-2 z-20">
            <button
              onClick={handlePrev}
              aria-label="Previous slide"
              className="min-w-[36px] min-h-[36px] rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next slide"
              className="min-w-[36px] min-h-[36px] rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === idx ? 'w-6 bg-[#E50914]' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
