import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Download, Smartphone, X } from 'lucide-react';
import { openInAnimeTrixApp } from '../lib/deepLink';

interface NavbarProps {
  onOpenDownloadModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDownloadModal,
  searchQuery,
  onSearchChange,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenApp = () => {
    openInAnimeTrixApp({
      onNonAndroid: () => {
        onOpenDownloadModal();
      },
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/65 backdrop-blur-3xl border-b border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-slate-900 font-bold tracking-tight text-lg md:text-xl whitespace-nowrap shrink-0 group active:scale-95 transition-all"
        >
          <div className="w-9 h-9 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 flex items-center justify-center p-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,1)] overflow-hidden">
            <img
              src="/logo.png"
              alt="Anime Trix Logo"
              className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform"
            />
          </div>
          <span className="font-extrabold tracking-tight">
            Anime <span className="text-[#E50914] drop-shadow-xs">Trix</span>
          </span>
        </Link>

        {/* iPhone Frosted Glass Search Capsule */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search anime, movies, genres (Naruto, Jujutsu...)"
              className="w-full h-10 pl-10 pr-9 bg-white/50 hover:bg-white/70 focus:bg-white/90 backdrop-blur-2xl border border-white/80 focus:border-[#E50914] rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Action Controls with iPhone Glass Depth */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile search trigger */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full bg-white/70 backdrop-blur-xl border border-white/80 text-slate-600 hover:bg-white active:scale-95 transition-all shadow-xs"
            aria-label="Search anime"
          >
            {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Download App secondary button */}
          <button
            onClick={onOpenDownloadModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white/70 hover:bg-white/90 backdrop-blur-xl border border-white/80 rounded-full transition-all whitespace-nowrap min-h-[38px] active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.03)]"
          >
            <Download className="w-3.5 h-3.5 text-[#E50914]" />
            <span>Download APK</span>
          </button>

          {/* Primary CTA: Open App with Specular Liquid Red Shine */}
          <button
            onClick={handleOpenApp}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-[#E50914] hover:brightness-105 rounded-full shadow-[0_4px_16px_rgba(229,9,20,0.35),inset_0_1px_1px_rgba(255,255,255,0.35)] active:scale-95 transition-all whitespace-nowrap min-h-[38px]"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open App</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Capsule Dropdown */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-white/60 bg-white/80 backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search anime & movies..."
              className="w-full h-10 pl-10 pr-9 bg-white/80 border border-white rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E50914] shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
};
