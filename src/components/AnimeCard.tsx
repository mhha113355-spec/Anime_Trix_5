import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Film, Tv, Play } from 'lucide-react';
import { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  const [imageError, setImageError] = useState(false);

  const fallbackImage = '/assets/images/hero_anime_showcase_1793556529783.jpg';
  const displayImage = !imageError && anime.posterUrl ? anime.posterUrl : (anime.backdropUrl || fallbackImage);

  const ratingDisplay = anime.rating ? String(anime.rating) : null;
  const isMovie = anime.contentType?.toLowerCase().includes('movie');

  return (
    <Link
      to={`/anime/${anime.id}`}
      className="group flex flex-col p-2.5 bg-white/70 hover:bg-white/90 backdrop-blur-2xl rounded-[24px] border border-white/85 shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.95),0_8px_24px_-6px_rgba(15,23,42,0.06)] hover:shadow-[inset_0_1px_2px_0_rgba(255,255,255,1),0_20px_40px_-10px_rgba(229,9,20,0.14),0_8px_16px_-4px_rgba(15,23,42,0.06)] hover:-translate-y-1 active:scale-[0.97] transition-all duration-300"
    >
      {/* Poster Image Container with iPhone Squircle */}
      <div className="relative aspect-[3/4] w-full bg-slate-100 rounded-[19px] overflow-hidden shadow-xs">
        <img
          src={displayImage}
          alt={anime.title}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Content Type Indicator with Frosted Glass */}
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/55 backdrop-blur-md text-white text-[10px] font-semibold rounded-lg border border-white/20 flex items-center gap-1 shadow-xs">
          {isMovie ? <Film className="w-2.5 h-2.5 text-red-400" /> : <Tv className="w-2.5 h-2.5 text-red-400" />}
          <span>{isMovie ? 'Movie' : 'TV Series'}</span>
        </div>

        {/* Rating badge with Frosted Glass */}
        {ratingDisplay && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/55 backdrop-blur-md text-amber-300 text-[10px] font-bold rounded-lg border border-white/20 flex items-center gap-1 font-mono shadow-xs">
            <Star className="w-2.5 h-2.5 fill-amber-300" />
            <span>{ratingDisplay}</span>
          </div>
        )}

        {/* Play Overlay with Glass Glow on Hover */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-[#E50914] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(229,9,20,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] transform scale-80 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-1.5 pt-2.5 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          {/* Metadata row */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-0.5">
            {anime.releaseYear && <span className="font-medium">{anime.releaseYear}</span>}
            {anime.releaseYear && anime.genres && anime.genres.length > 0 && <span aria-hidden="true" className="text-slate-300">·</span>}
            {anime.genres && anime.genres.length > 0 && (
              <span className="truncate max-w-[105px] text-slate-600 font-medium">{anime.genres[0]}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-[#E50914] transition-colors">
            {anime.title}
          </h3>
        </div>

        {/* Audio Dub Badges with Glass Highlight */}
        {anime.availableDubs && anime.availableDubs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-200/50">
            {anime.availableDubs.slice(0, 2).map((dub, idx) => (
              <span
                key={idx}
                className="text-[9px] font-semibold text-slate-700 bg-white/80 backdrop-blur-md border border-white/90 px-1.5 py-0.5 rounded-md shadow-2xs"
              >
                {dub}
              </span>
            ))}
            {anime.availableDubs.length > 2 && (
              <span className="text-[9px] text-slate-400 font-medium">
                +{anime.availableDubs.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
