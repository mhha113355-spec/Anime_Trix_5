import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Smartphone, Play } from 'lucide-react';
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
      className="group flex items-center gap-3 p-2.5 sm:p-3 bg-white rounded-[20px] border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-300 active:scale-[0.98]"
    >
      {/* 16:9 Compact Thumbnail */}
      <div className="relative aspect-video w-28 sm:w-36 md:w-40 bg-slate-900 rounded-[14px] overflow-hidden shrink-0 border border-slate-200">
        <img
          src={displayImage}
          alt={episode.title}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />

        {/* Locked badge overlay */}
        <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/45 transition-colors">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-[#E50914] flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        {/* Duration badge */}
        {episode.durationFormatted && (
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-mono rounded-md">
            {episode.durationFormatted}
          </div>
        )}
      </div>

      {/* Episode Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
          <span className="font-bold text-[#E50914] font-mono">EP {episode.episodeNumber}</span>
          {episode.seasonNumber && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">S{episode.seasonNumber}</span>
            </>
          )}
          {selectedDub && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-red-600 font-medium truncate max-w-[80px]">{selectedDub}</span>
            </>
          )}
        </div>

        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#E50914] transition-colors truncate">
          {episode.title}
        </h4>

        <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1">
          <Smartphone className="w-3 h-3 text-[#E50914]" />
          <span>Tap to watch in App</span>
        </p>
      </div>

      {/* Play Trigger Pill */}
      <div className="hidden xs:flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#E50914] text-slate-500 group-hover:text-white shrink-0 transition-all border border-slate-200 group-hover:border-transparent group-hover:shadow-xs">
        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
      </div>
    </Link>
  );
};
