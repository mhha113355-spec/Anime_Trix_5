import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  TrendingUp,
  Tv,
  Film,
  Search,
  Smartphone,
  Download,
  AlertCircle,
  Loader2,
  Flame,
  Clapperboard,
} from 'lucide-react';
import { Anime, Banner, AppSettings } from '../types';
import { HeroSlider } from '../components/HeroSlider';
import { AnimeCard } from '../components/AnimeCard';
import { openInAnimeTrixApp } from '../lib/deepLink';

interface HomePageProps {
  animeList: Anime[];
  banners: Banner[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenDownloadModal: () => void;
  appSettings: AppSettings;
}

export const HomePage: React.FC<HomePageProps> = ({
  animeList,
  banners,
  loading,
  searchQuery,
  onSearchChange,
  onOpenDownloadModal,
  appSettings,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected filter states
  const [selectedType, setSelectedType] = useState<'all' | 'TV Series' | 'Movie'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedDub, setSelectedDub] = useState<string>('all');

  // Handle query param redirects
  useEffect(() => {
    const epParam = searchParams.get('ep');
    const animeParam = searchParams.get('anime');
    const installParam = searchParams.get('install');

    if (installParam === '1') {
      onOpenDownloadModal();
    }

    if (epParam) {
      const targetQuery = searchParams.toString();
      navigate(`/watch/${epParam}?${targetQuery}`, { replace: true });
      return;
    }

    if (animeParam) {
      const targetQuery = searchParams.toString();
      navigate(`/anime/${animeParam}?${targetQuery}`, { replace: true });
    }
  }, [searchParams, navigate, onOpenDownloadModal]);

  // Aggregate genres from anime list
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    animeList.forEach((a) => {
      a.genres?.forEach((g) => {
        if (g && g.trim()) set.add(g.trim());
      });
    });
    return Array.from(set).slice(0, 12);
  }, [animeList]);

  // Aggregate dubs from anime list
  const allDubs = useMemo(() => {
    const set = new Set<string>();
    animeList.forEach((a) => {
      a.availableDubs?.forEach((d) => {
        if (d && d.trim()) set.add(d.trim());
      });
    });
    return Array.from(set);
  }, [animeList]);

  // Filter anime list based on search and filters
  const filteredAnime = useMemo(() => {
    return animeList.filter((anime) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = anime.title.toLowerCase().includes(q);
        const descMatch = anime.description?.toLowerCase().includes(q);
        const genreMatch = anime.genres?.some((g) => g.toLowerCase().includes(q));
        const dubMatch = anime.availableDubs?.some((d) => d.toLowerCase().includes(q));
        if (!titleMatch && !descMatch && !genreMatch && !dubMatch) {
          return false;
        }
      }

      if (selectedType !== 'all') {
        const isMovie = anime.contentType?.toLowerCase().includes('movie');
        if (selectedType === 'Movie' && !isMovie) return false;
        if (selectedType === 'TV Series' && isMovie) return false;
      }

      if (selectedGenre !== 'all') {
        if (!anime.genres?.includes(selectedGenre)) return false;
      }

      if (selectedDub !== 'all') {
        if (!anime.availableDubs?.includes(selectedDub)) return false;
      }

      return true;
    });
  }, [animeList, searchQuery, selectedType, selectedGenre, selectedDub]);

  // Trending anime
  const trendingAnime = useMemo(() => {
    return animeList
      .filter((a) => a.trending || (typeof a.rating === 'number' && a.rating >= 8) || (typeof a.rating === 'string' && parseFloat(a.rating) >= 4.0))
      .slice(0, 8);
  }, [animeList]);

  // Movies
  const movieAnime = useMemo(() => {
    return animeList.filter((a) => a.contentType?.toLowerCase().includes('movie')).slice(0, 8);
  }, [animeList]);

  // Series
  const tvSeriesAnime = useMemo(() => {
    return animeList.filter((a) => !a.contentType?.toLowerCase().includes('movie')).slice(0, 8);
  }, [animeList]);

  const appMockupImage = '/src/assets/images/app_mockup_preview_1793556528972.jpg';

  return (
    <div className="space-y-8 md:space-y-10">
      {/* System Notice if present in appConfig/settings */}
      {appSettings.systemNotice?.enabled && appSettings.systemNotice.message && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            {appSettings.systemNotice.title && (
              <p className="font-semibold">{appSettings.systemNotice.title}</p>
            )}
            <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
              {appSettings.systemNotice.message}
            </p>
          </div>
        </div>
      )}

      {/* Featured Hero Banner Carousel */}
      {!searchQuery && (
        <HeroSlider
          banners={banners}
          fallbackAnimeList={animeList}
          onOpenDownloadModal={onOpenDownloadModal}
        />
      )}

      {/* Filter and Categorization Bar */}
      <section aria-label="Catalog filters" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
          {/* Content Type Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 self-start">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Catalog
            </button>
            <button
              onClick={() => setSelectedType('TV Series')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                selectedType === 'TV Series'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Series</span>
            </button>
            <button
              onClick={() => setSelectedType('Movie')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                selectedType === 'Movie'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Movies</span>
            </button>
          </div>

          {/* Dub selector chip row */}
          {allDubs.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap mr-0.5">Dub:</span>
              <button
                onClick={() => setSelectedDub('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedDub === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Audio
              </button>
              {allDubs.map((dub) => (
                <button
                  key={dub}
                  onClick={() => setSelectedDub(dub)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    selectedDub === dub
                      ? 'bg-[#E50914] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Genre Chips */}
        {allGenres.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedGenre('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedGenre === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              All Genres
            </button>
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedGenre === genre
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Main Content Grid Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
          <p className="text-sm font-medium text-slate-600">Connecting to Anime Trix...</p>
        </div>
      ) : searchQuery || selectedGenre !== 'all' || selectedDub !== 'all' || selectedType !== 'all' ? (
        /* Filtered / Search Results Section */
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Filtered Anime'}
            </h2>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {filteredAnime.length} titles
            </span>
          </div>

          {filteredAnime.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
              {filteredAnime.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-slate-50 border border-slate-200 rounded-3xl p-6">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-slate-800">No matching anime found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try searching with a different keyword or reset filters to explore our full library.
              </p>
              <button
                onClick={() => {
                  onSearchChange('');
                  setSelectedGenre('all');
                  setSelectedDub('all');
                  setSelectedType('all');
                }}
                className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>
      ) : (
        /* Default Homepage Layout (Anime cards ONLY — No big episodes on homepage) */
        <div className="space-y-10">
          {/* Trending Series Section */}
          {trendingAnime.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-red-100 text-[#E50914] rounded-lg">
                    <Flame className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Trending in Anime Trix
                  </h2>
                </div>
                <span className="text-xs text-slate-400">Popular</span>
              </div>

              {/* Clean 2-column on mobile, 4-column on tablet/desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5">
                {trendingAnime.slice(0, 4).map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            </section>
          )}

          {/* Popular TV Series */}
          {tvSeriesAnime.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-red-100 text-[#E50914] rounded-lg">
                    <Tv className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Popular Anime Series
                  </h2>
                </div>
                <span className="text-xs text-slate-400">TV Shows</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5">
                {tvSeriesAnime.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            </section>
          )}

          {/* Anime Movies (if available) */}
          {movieAnime.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-red-100 text-[#E50914] rounded-lg">
                    <Clapperboard className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Anime Movies
                  </h2>
                </div>
                <span className="text-xs text-slate-400">Feature Films</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5">
                {movieAnime.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            </section>
          )}

          {/* All Catalog Grid (if more titles exist) */}
          {animeList.length > 4 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  All Catalog
                </h2>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {animeList.length} titles
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                {animeList.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            </section>
          )}

          {/* Android App Showcase Card */}
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl border border-slate-700/60 p-5 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-3 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-semibold">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Anime Trix Android App</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
                  Watch Full HD Episodes in the Official App
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Fast 1080p streaming with Bangla Dub, Hindi Dub, and multi-subtitles with zero buffer.
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      openInAnimeTrixApp({
                        onNonAndroid: () => onOpenDownloadModal(),
                      });
                    }}
                    className="min-h-[40px] px-5 py-2 bg-[#E50914] hover:bg-[#C80811] text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Open App</span>
                  </button>

                  <button
                    onClick={onOpenDownloadModal}
                    className="min-h-[40px] px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download APK</span>
                  </button>
                </div>
              </div>

              {/* Showcase App Mockup Visual */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-full max-w-[220px] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                  <img
                    src={appMockupImage}
                    alt="Anime Trix Android App Interface"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
