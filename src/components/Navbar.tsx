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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-slate-900 font-bold tracking-tight text-lg md:text-xl whitespace-nowrap shrink-0 group active:scale-95 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-0.5 shadow-2xs overflow-hidden">
            <img
              src="/logo.png"
              alt="Anime Trix Logo"
              className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
            />
          </div>
          <span className="font-extrabold tracking-tight">
            Anime <span className="text-[#E50914]">Trix</span>
          </span>
        </Link>

        {/* Clean Light Search Capsule */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search anime, movies, genres (Naruto, Jujutsu...)"
              className="w-full h-10 pl-10 pr-9 bg-slate-100/90 hover:bg-slate-100 border border-slate-200 focus:border-[#E50914] focus:bg-white rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-inner"
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

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile search trigger */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
            aria-label="Search anime"
          >
            {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Download App secondary button */}
          <button
            onClick={onOpenDownloadModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-full transition-all whitespace-nowrap min-h-[38px] active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-[#E50914]" />
            <span>Download APK</span>
          </button>

          {/* Primary CTA: Open App */}
          <button
            onClick={handleOpenApp}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#E50914] hover:bg-[#C80811] rounded-full shadow-xs shadow-red-600/30 active:scale-95 transition-all whitespace-nowrap min-h-[38px]"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open App</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Capsule Dropdown */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100 bg-white/95 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search anime & movies..."
              className="w-full h-10 pl-10 pr-9 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E50914] focus:bg-white"
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
