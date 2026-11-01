import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Film, Tv, Play } from 'lucide-react';
import { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  const [imageError, setImageError] = useState(false);

  // Fallback image generated specifically for Anime Trix fallback
  const fallbackImage = '/src/assets/images/hero_anime_showcase_1793556529783.jpg';
  const displayImage = !imageError && anime.posterUrl ? anime.posterUrl : (anime.backdropUrl || fallbackImage);

  // Format rating
  const ratingDisplay = anime.rating ? String(anime.rating) : null;
  const isMovie = anime.contentType?.toLowerCase().includes('movie');

  return (
    <Link
      to={`/anime/${anime.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden">
        <img
          src={displayImage}
          alt={anime.title}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Content Type Indicator (Movie vs TV) */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[11px] font-semibold rounded-md flex items-center gap-1">
          {isMovie ? <Film className="w-3 h-3 text-red-400" /> : <Tv className="w-3 h-3 text-red-400" />}
          <span>{isMovie ? 'Movie' : 'TV Series'}</span>
        </div>

        {/* Rating if present */}
        {ratingDisplay && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-amber-300 text-[11px] font-semibold rounded-md flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-300" />
            <span className="font-mono tabular-nums">{ratingDisplay}</span>
          </div>
        )}

        {/* Subtle Play Overlay on Hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Unboxed Metadata with · separator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            {anime.releaseYear && <span>{anime.releaseYear}</span>}
            {anime.releaseYear && anime.genres && anime.genres.length > 0 && <span aria-hidden="true">·</span>}
            {anime.genres && anime.genres.length > 0 && (
              <span className="truncate max-w-[120px]">{anime.genres[0]}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-[#E50914] transition-colors">
            {anime.title}
          </h3>
        </div>

        {/* Admin Dub Badges strictly from availableDubs array */}
        {anime.availableDubs && anime.availableDubs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            {anime.availableDubs.slice(0, 2).map((dub, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md"
              >
                {dub}
              </span>
            ))}
            {anime.availableDubs.length > 2 && (
              <span className="text-[10px] text-slate-400">
                +{anime.availableDubs.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
