import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  Film,
  Tv,
  Share2,
  Smartphone,
  Calendar,
  ChevronLeft,
  Loader2,
  Globe,
  Search,
  SlidersHorizontal,
  Layers,
  X,
} from 'lucide-react';
import { Anime, Episode } from '../types';
import { fetchAnimeById, fetchEpisodesForAnime } from '../lib/firebase';
import { EpisodeCard } from '../components/EpisodeCard';
import { AnimeCard } from '../components/AnimeCard';
import { openInAnimeTrixApp } from '../lib/deepLink';
import { useToast } from '../components/Toast';

interface AnimeDetailsPageProps {
  allAnime: Anime[];
  onOpenDownloadModal: () => void;
}

export const AnimeDetailsPage: React.FC<AnimeDetailsPageProps> = ({
  allAnime,
  onOpenDownloadModal,
}) => {
  const { animeId } = useParams<{ animeId: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDub, setSelectedDub] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>('all');
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState<string>('');
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!animeId) return;
      setLoading(true);

      let loadedAnime = allAnime.find((a) => a.id === animeId) || null;
      if (!loadedAnime) {
        loadedAnime = await fetchAnimeById(animeId);
      }

      if (isMounted) {
        setAnime(loadedAnime);
        if (loadedAnime) {
          document.title = `${loadedAnime.title} - Anime Trix`;
          if (loadedAnime.availableDubs?.length) {
            setSelectedDub(loadedAnime.availableDubs[0]);
          }
        }
      }

      const eps = await fetchEpisodesForAnime(animeId);
      if (isMounted) {
        setEpisodes(eps);
        setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [animeId, allAnime]);

  const seasonsList = useMemo(() => {
    const seasons = new Set<number>();
    episodes.forEach((ep) => {
      if (typeof ep.seasonNumber === 'number' && ep.seasonNumber > 0) {
        seasons.add(ep.seasonNumber);
      }
    });
    return Array.from(seasons).sort((a, b) => a - b);
  }, [episodes]);

  const filteredEpisodes = useMemo(() => {
    return episodes.filter((ep) => {
      if (selectedSeason !== 'all') {
        if (ep.seasonNumber !== selectedSeason) return false;
      }

      if (episodeSearchQuery.trim()) {
        const q = episodeSearchQuery.toLowerCase().trim();
        const epNum = ep.episodeNumber.toString();
        const numMatch = epNum === q || `episode ${epNum}`.includes(q) || `ep ${epNum}`.includes(q);
        const titleMatch = ep.title.toLowerCase().includes(q);
        if (!numMatch && !titleMatch) return false;
      }

      return true;
    });
  }, [episodes, selectedSeason, episodeSearchQuery]);

  const handleOpenApp = () => {
    if (!anime) return;
    openInAnimeTrixApp({
      animeId: anime.id,
      dub: selectedDub,
      onNonAndroid: () => {
        onOpenDownloadModal();
      },
    });
  };

  const handleShare = async () => {
    if (!anime) return;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ url });
        showToast('Clean link shared successfully!');
        return;
      } catch (e) {
        // Fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast('Clean link copied to clipboard!');
    } catch (e) {
      showToast('Could not copy link', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading anime details...</p>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Anime Not Found</h2>
        <p className="text-sm text-slate-500">
          We couldn't locate this title. It might have been updated or moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E50914] text-white text-sm font-bold rounded-full"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  const fallbackBackdrop = '/src/assets/images/hero_anime_showcase_1793556529783.jpg';
  const backdropImage = anime.backdropUrl || anime.posterUrl || fallbackBackdrop;
  const isMovie = anime.contentType?.toLowerCase().includes('movie');

  const relatedAnime = allAnime.filter((a) => a.id !== anime.id).slice(0, 5);

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Breadcrumb Back Link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#E50914]" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Hero Header (Optimized for both Mobile & Desktop Screens) */}
      <section className="relative rounded-[24px] sm:rounded-[36px] overflow-hidden bg-slate-950 border border-slate-200 shadow-sm">
        {/* Backdrop Image Banner */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] max-h-[320px] w-full overflow-hidden">
          <img
            src={backdropImage}
            alt={anime.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-50 filter blur-[0.5px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        {/* Content Container (Perfect spacing for mobile & PC) */}
        <div className="relative px-4 pb-6 pt-0 sm:px-8 -mt-20 sm:-mt-28 md:-mt-32 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-8">
            {/* Poster Card */}
            <div className="w-32 sm:w-40 md:w-48 aspect-[3/4] rounded-[20px] overflow-hidden bg-slate-800 shadow-2xl border-4 border-white/90 shrink-0">
              <img
                src={anime.posterUrl || backdropImage}
                alt={anime.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 space-y-2.5 sm:space-y-3 text-white text-center md:text-left w-full">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 text-xs text-slate-300">
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white font-medium">
                  {isMovie ? <Film className="w-3 h-3 text-red-400" /> : <Tv className="w-3 h-3 text-red-400" />}
                  {anime.contentType || 'TV Series'}
                </span>

                {anime.releaseYear && (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="flex items-center gap-1 text-slate-200">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {anime.releaseYear}
                    </span>
                  </>
                )}

                {anime.rating && (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="flex items-center gap-1 text-amber-300 font-bold font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      {anime.rating}
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                {anime.title}
              </h1>

              {/* Genre Chips */}
              {anime.genres && anime.genres.length > 0 && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-0.5">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre}
                      className="text-[11px] px-2.5 py-0.5 bg-white/10 text-slate-200 rounded-full border border-white/10"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Audio Dub Badges */}
              {anime.availableDubs && anime.availableDubs.length > 0 && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                    <Globe className="w-3.5 h-3.5 text-red-400" />
                    Audio:
                  </span>
                  {anime.availableDubs.map((dub) => {
                    const isSelected = selectedDub === dub;
                    return (
                      <button
                        key={dub}
                        onClick={() => setSelectedDub(dub)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-[#E50914] text-white shadow-xs'
                            : 'bg-white/15 text-slate-200 hover:bg-white/25 border border-white/10'
                        }`}
                      >
                        {dub}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
                <button
                  onClick={handleOpenApp}
                  className="min-h-[44px] px-6 sm:px-7 py-2.5 bg-[#E50914] hover:bg-[#C80811] text-white font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open App / অ্যাপে দেখুন</span>
                </button>

                <button
                  onClick={handleShare}
                  className="min-h-[44px] px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold rounded-full transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Share2 className="w-4 h-4 text-slate-300" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details & Synopsis Card (Clean White UI) */}
      <section className="bg-white rounded-[26px] border border-slate-200 p-5 sm:p-7 space-y-2 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Details & Synopsis</h2>
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
          {anime.description || 'No synopsis available for this title.'}
        </p>
      </section>

      {/* Seasons & Episodes Control Hub */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#E50914]" />
              <span>Episodes List</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                {episodes.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select season and tap any episode to open the locked preview player
            </p>
          </div>

          {/* Episode Quick Search */}
          {episodes.length > 5 && (
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={episodeSearchQuery}
                onChange={(e) => setEpisodeSearchQuery(e.target.value)}
                placeholder="Find episode (e.g. 361)..."
                className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:bg-white"
              />
              {episodeSearchQuery && (
                <button
                  onClick={() => setEpisodeSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Season Selector Tabs */}
        {seasonsList.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 border-b border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E50914]" />
              Season:
            </span>

            <button
              onClick={() => setSelectedSeason('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all active:scale-95 ${
                selectedSeason === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Episodes ({episodes.length})
            </button>

            {seasonsList.map((season) => {
              const countInSeason = episodes.filter((e) => e.seasonNumber === season).length;
              return (
                <button
                  key={season}
                  onClick={() => setSelectedSeason(season)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all active:scale-95 ${
                    selectedSeason === season
                      ? 'bg-[#E50914] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Season {season} ({countInSeason})
                </button>
              );
            })}
          </div>
        )}

        {/* Compact Episode List */}
        {filteredEpisodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
            {filteredEpisodes.map((ep) => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                animePoster={anime.posterUrl}
                selectedDub={selectedDub}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              No episodes match your search or filter.
            </p>
            <button
              onClick={() => {
                setSelectedSeason('all');
                setEpisodeSearchQuery('');
              }}
              className="mt-2 px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-full active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* More Anime & Movies Recommendation Grid */}
      {relatedAnime.length > 0 && (
        <section className="space-y-3.5 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              More Anime & Movies
            </h2>
            <Link to="/" className="text-xs font-semibold text-[#E50914] hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {relatedAnime.map((item) => (
              <AnimeCard key={item.id} anime={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
