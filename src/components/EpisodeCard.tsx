import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Clock, Smartphone } from 'lucide-react';
import { Episode } from '../types';

interface EpisodeCardProps {
  episode: Episode;
  animePoster?: string;
  selectedDub?: string;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  animePoster,
  selectedDub,
}) => {
  const [imageError, setImageError] = useState(false);

  const fallbackThumbnail = animePoster || '/src/assets/images/hero_anime_showcase_1793556529783.jpg';
  const displayImage = !imageError && episode.thumbnailUrl ? episode.thumbnailUrl : fallbackThumbnail;

  const targetUrl = `/watch/${episode.id}?anime=${encodeURIComponent(
    episode.animeId || ''
  )}&ep=${encodeURIComponent(episode.episodeNumber.toString())}${
    selectedDub ? `&dub=${encodeURIComponent(selectedDub)}` : ''
  }`;

  return (
    <Link
      to={targetUrl}
      className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all"
    >
      {/* 16:9 Thumbnail with Lock Overlay */}
      <div className="relative aspect-video w-full sm:w-44 bg-slate-100 rounded-xl overflow-hidden shrink-0">
        <img
          src={displayImage}
          alt={episode.title}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Locked badge overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-white/90 text-[#E50914] flex items-center justify-center shadow-md">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Duration badge if present */}
        {episode.durationFormatted && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-mono rounded flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            <span>{episode.durationFormatted}</span>
          </div>
        )}
      </div>

      {/* Episode Details */}
      <div className="flex-1 min-w-0 w-full space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-[#E50914]">EP {episode.episodeNumber}</span>
          {episode.seasonNumber && episode.seasonNumber > 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span>Season {episode.seasonNumber}</span>
            </>
          )}
        </div>

        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#E50914] transition-colors truncate">
          {episode.title}
        </h4>

        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <Smartphone className="w-3 h-3 text-[#E50914]" />
            Watch in App
          </span>
          <span aria-hidden="true">·</span>
          <span>Full HD 1080p</span>
        </div>
      </div>
    </Link>
  );
};
