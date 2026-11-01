import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  Film,
  Tv,
  Share2,
  Smartphone,
  Download,
  Calendar,
  Layers,
  ChevronLeft,
  Loader2,
  Globe,
  Sparkles,
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
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!animeId) return;
      setLoading(true);

      // Check if already in memory
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

      // Fetch episodes
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
    const title = `${anime.title} - Anime Trix`;
    const text = `Check out ${anime.title} on Anime Trix for Android!`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        showToast('Link shared successfully!');
        return;
      } catch (e) {
        // Fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast('Anime link copied to clipboard!');
    } catch (e) {
      showToast('Could not copy link', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading anime details...</p>
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
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E50914] text-white text-sm font-semibold rounded-xl"
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

  // Related anime
  const relatedAnime = allAnime.filter((a) => a.id !== anime.id).slice(0, 5);

  return (
    <div className="space-y-10 md:space-y-12">
      {/* Breadcrumb Back Link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1"
        >
          <ChevronLeft className="w-4 h-4 text-[#E50914]" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Hero Header with Backdrop */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200">
        <div className="relative aspect-[21/9] sm:aspect-[24/9] max-h-[360px] w-full overflow-hidden">
          <img
            src={backdropImage}
            alt={anime.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        {/* Content Container Split */}
        <div className="relative px-6 pb-8 pt-0 sm:px-10 -mt-24 sm:-mt-32">
          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
            {/* Poster Card */}
            <div className="w-32 sm:w-48 aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 shadow-2xl border-2 border-white/20 shrink-0">
              <img
                src={anime.posterUrl || backdropImage}
                alt={anime.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 space-y-3 sm:space-y-4 text-white">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-white font-medium">
                  {isMovie ? <Film className="w-3 h-3 text-red-400" /> : <Tv className="w-3 h-3 text-red-400" />}
                  {anime.contentType || 'TV Series'}
                </span>

                {anime.releaseYear && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {anime.releaseYear}
                    </span>
                  </>
                )}

                {anime.rating && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 text-amber-300 font-semibold font-mono tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      {anime.rating}
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                {anime.title}
              </h1>

              {/* Genre Chips */}
              {anime.genres && anime.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre}
                      className="text-xs px-2.5 py-1 bg-white/10 text-slate-200 rounded-lg border border-white/10"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Admin Dub Badges strictly from availableDubs */}
              {anime.availableDubs && anime.availableDubs.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-red-400" />
                    Available Dubs:
                  </span>
                  {anime.availableDubs.map((dub) => (
                    <span
                      key={dub}
                      className="text-xs font-semibold px-2 py-0.5 bg-red-600/30 text-red-300 border border-red-500/40 rounded-md"
                    >
                      {dub}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  onClick={handleOpenApp}
                  className="min-h-[46px] px-6 py-2.5 bg-[#E50914] hover:bg-[#C80811] text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open App / অ্যাপে দেখুন</span>
                </button>

                <button
                  onClick={handleShare}
                  className="min-h-[46px] px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details / Synopsis Section (clean Details header, no season tabs) */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Details</h2>
        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
          {anime.description || 'No synopsis available for this title.'}
        </p>
      </section>

      {/* Episode Preview Cards Section (Metadata ONLY — Locked Preview) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Episodes ({episodes.length})
            </h2>
            <p className="text-xs text-slate-500">
              Select an episode to view locked preview or launch directly inside Anime Trix
            </p>
          </div>

          <button
            onClick={handleOpenApp}
            className="text-xs font-semibold text-[#E50914] hover:underline flex items-center gap-1"
          >
            <span>Play in App</span>
          </button>
        </div>

        {episodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {episodes.map((ep) => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                animePoster={anime.posterUrl}
                selectedDub={selectedDub}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <p className="text-sm font-medium text-slate-700">
              All episodes are streamed exclusively on the Anime Trix Android App.
            </p>
            <button
              onClick={handleOpenApp}
              className="mt-2 px-4 py-2 bg-[#E50914] text-white text-xs font-semibold rounded-xl"
            >
              Open Anime in App
            </button>
          </div>
        )}
      </section>

      {/* More Anime & Movies Recommendation Grid */}
      {relatedAnime.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              More Anime & Movies
            </h2>
            <Link to="/" className="text-xs font-semibold text-[#E50914] hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {relatedAnime.map((item) => (
              <AnimeCard key={item.id} anime={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
