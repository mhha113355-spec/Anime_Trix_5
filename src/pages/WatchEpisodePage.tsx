import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, Loader2, Info, Film, Tv, Star, Smartphone, Download, Share2 } from 'lucide-react';
import { Episode, Anime } from '../types';
import { fetchEpisodeById, fetchEpisodesForAnime, fetchAnimeById } from '../lib/firebase';
import { LockedVideoPlayer } from '../components/LockedVideoPlayer';
import { EpisodeCard } from '../components/EpisodeCard';
import { AnimeCard } from '../components/AnimeCard';
import { openInAnimeTrixApp } from '../lib/deepLink';
import { useToast } from '../components/Toast';

interface WatchEpisodePageProps {
  allAnime: Anime[];
  onOpenDownloadModal: () => void;
}

export const WatchEpisodePage: React.FC<WatchEpisodePageProps> = ({
  allAnime,
  onOpenDownloadModal,
}) => {
  const { episodeId } = useParams<{ episodeId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const animeParam = searchParams.get('anime') || undefined;
  const dubParam = searchParams.get('dub') || undefined;
  const epParam = searchParams.get('ep') || undefined;

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [parentAnime, setParentAnime] = useState<Anime | null>(null);
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDub, setSelectedDub] = useState<string>(dubParam || '');
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function loadEpisodeAndAnime() {
      if (!episodeId) return;
      setLoading(true);

      const { episode: loadedEp, parentAnime: loadedAnime } = await fetchEpisodeById(
        episodeId,
        animeParam
      );

      let finalAnime = loadedAnime;
      if (!finalAnime && loadedEp?.animeId) {
        finalAnime = allAnime.find((a) => a.id === loadedEp.animeId) || (await fetchAnimeById(loadedEp.animeId));
      } else if (!finalAnime && animeParam) {
        finalAnime = allAnime.find((a) => a.id === animeParam) || (await fetchAnimeById(animeParam));
      }

      // If episode was not found in Firestore (e.g. mock or new ID), construct a valid fallback episode
      const fallbackEpisode: Episode = loadedEp || {
        id: episodeId,
        animeId: finalAnime?.id || animeParam || 'anime',
        animeTitle: finalAnime?.title || 'Anime Trix Stream',
        title: epParam ? `Episode ${epParam}` : `Episode ${episodeId}`,
        episodeNumber: epParam ? parseInt(epParam, 10) || 1 : 1,
        seasonNumber: 1,
        thumbnailUrl: finalAnime?.backdropUrl || finalAnime?.posterUrl,
        durationFormatted: '24m',
      };

      if (isMounted) {
        setEpisode(fallbackEpisode);
        setParentAnime(finalAnime);

        // Update document.title per prompt specification:
        // "Dynamically updates document.title with the episode & anime name."
        const animeName = finalAnime?.title || fallbackEpisode.animeTitle || 'Anime Trix';
        document.title = `${fallbackEpisode.title} - ${animeName} | Anime Trix`;

        if (dubParam) {
          setSelectedDub(dubParam);
        } else if (finalAnime?.availableDubs?.length) {
          setSelectedDub(finalAnime.availableDubs[0]);
        }
      }

      // Fetch other episodes of this anime
      const targetAnimeId = finalAnime?.id || fallbackEpisode.animeId;
      if (targetAnimeId) {
        const eps = await fetchEpisodesForAnime(targetAnimeId);
        if (isMounted) {
          setAllEpisodes(eps);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    loadEpisodeAndAnime();

    return () => {
      isMounted = false;
    };
  }, [episodeId, animeParam, dubParam, epParam, allAnime]);

  const handleSelectDub = (dub: string) => {
    setSelectedDub(dub);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('dub', dub);
    setSearchParams(newParams);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading video preview...</p>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Episode Preview Unavailable</h2>
        <p className="text-sm text-slate-500">
          The requested episode could not be found.
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

  // Related anime recommendation
  const otherAnime = allAnime
    .filter((a) => a.id !== parentAnime?.id)
    .slice(0, 5);

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Top Breadcrumb navigation */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to={parentAnime ? `/anime/${parentAnime.id}` : '/'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1"
        >
          <ChevronLeft className="w-4 h-4 text-[#E50914]" />
          <span>{parentAnime ? `Back to ${parentAnime.title}` : 'Back to Home'}</span>
        </Link>

        {parentAnime && (
          <Link
            to={`/anime/${parentAnime.id}`}
            className="text-xs font-semibold text-[#E50914] hover:underline flex items-center gap-1"
          >
            <span>All Episodes</span>
          </Link>
        )}
      </div>

      {/* Primary Locked Video Player Box (STRICT NO-WEB-PLAYBACK RULE) */}
      <section aria-label="Episode locked preview">
        <LockedVideoPlayer
          episode={episode}
          parentAnime={parentAnime}
          selectedDub={selectedDub}
          onSelectDub={handleSelectDub}
          onOpenDownloadModal={onOpenDownloadModal}
        />
      </section>

      {/* Episode & Anime Details Summary */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-bold text-[#E50914]">EPISODE {episode.episodeNumber}</span>
              {parentAnime?.releaseYear && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{parentAnime.releaseYear}</span>
                </>
              )}
              {parentAnime?.contentType && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{parentAnime.contentType}</span>
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {episode.title}
            </h1>
            {parentAnime && (
              <p className="text-sm font-semibold text-slate-600 mt-0.5">
                {parentAnime.title}
              </p>
            )}
          </div>

          {/* Quick launch in app button */}
          <button
            onClick={() => {
              openInAnimeTrixApp({
                episodeId: episode.id,
                animeId: parentAnime?.id || episode.animeId,
                dub: selectedDub,
                onNonAndroid: () => onOpenDownloadModal(),
              });
            }}
            className="min-h-[42px] px-5 py-2.5 bg-[#E50914] hover:bg-[#C80811] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 self-start sm:self-center"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open in App / অ্যাপে দেখুন</span>
          </button>
        </div>

        {/* Synopsis / Description */}
        {parentAnime?.description && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Anime Synopsis
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {parentAnime.description}
            </p>
          </div>
        )}

        {/* Admin Dub badges strictly from availableDubs */}
        {parentAnime?.availableDubs && parentAnime.availableDubs.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Available Dubs:</span>
            {parentAnime.availableDubs.map((dub) => (
              <span
                key={dub}
                className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200"
              >
                {dub}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Other Episodes from this Anime */}
      {allEpisodes.length > 1 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Other Episodes in this Series
            </h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {allEpisodes.length} Episodes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allEpisodes.map((ep) => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                animePoster={parentAnime?.posterUrl}
                selectedDub={selectedDub}
              />
            ))}
          </div>
        </section>
      )}

      {/* More Anime & Movies Recommendation Grid */}
      {otherAnime.length > 0 && (
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
            {otherAnime.map((item) => (
              <AnimeCard key={item.id} anime={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
