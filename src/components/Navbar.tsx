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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Single Brand Element */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-slate-900 font-bold tracking-tight text-lg md:text-xl whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-xl bg-[#E50914] text-white flex items-center justify-center shadow-xs group-hover:bg-[#C80811] transition-colors">
            <svg viewBox="0 0 32 32" className="w-4 h-4 fill-current">
              <path d="M10 8l14 8-14 8V8z" />
            </svg>
          </div>
          <span className="font-extrabold tracking-tight">
            Anime <span className="text-[#E50914]">Trix</span>
          </span>
        </Link>

        {/* Zone 2: Navigation & Live Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search anime, movies, genres (e.g. Naruto, Demon Slayer)..."
              className="w-full h-10 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:bg-white transition-all"
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

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile search toggle button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Search anime"
          >
            {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Download App secondary button */}
          <button
            onClick={onOpenDownloadModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors whitespace-nowrap min-h-[40px]"
          >
            <Download className="w-3.5 h-3.5 text-[#E50914]" />
            <span>Download App</span>
          </button>

          {/* Primary CTA: Open App */}
          <button
            onClick={handleOpenApp}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#E50914] hover:bg-[#C80811] rounded-xl shadow-xs active:scale-[0.98] transition-all whitespace-nowrap min-h-[40px]"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open App</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Row if open */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100 bg-white">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search anime & movies..."
              className="w-full h-10 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:bg-white"
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
